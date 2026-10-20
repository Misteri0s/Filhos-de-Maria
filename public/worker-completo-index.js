// ============================================================================
// Worker "filhosdemaria" - ARQUIVO COMPLETO (substitui o src/index.js)
// PRIVADO: não publique este arquivo.
//
// O que esta versão faz a mais que a antiga:
//  1) Senha escolhida pelo usuário (mín. 8 caracteres) no cadastro e em "Alterar senha".
//     Se o site mandar sem senha (site antigo), o servidor ainda gera uma, como antes.
//  2) Senhas guardadas com sal aleatório por usuário (formato v2). Contas antigas continuam
//     entrando e são atualizadas sozinhas no primeiro login.
//  3) Bloqueio de 15 minutos após 8 erros de senha (precisa da tabela "tentativas";
//     se a tabela não existir, o login funciona normalmente, sem bloqueio).
//  4) Contador de acessos em /api/visitas (precisa da tabela "visitas"; sem ela, o site esconde o contador).
//  5) Ao alterar a senha, as outras sessões abertas são encerradas.
//  6) /api/progresso recusa conteúdo gigante (limite de 100 KB).
//  7) As rotas das salas do quiz (removido do site) respondem 410. A classe Room continua
//     exportada (vazia) para não ser preciso mexer na configuração do Durable Object.
// ============================================================================

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return handleApi(request, env, url);
    return env.ASSETS.fetch(request);
  },
};

async function handleApi(request, env, url) {
  const path = url.pathname.replace("/api/", "");
  const method = request.method;
  try {
    if (path === "registrar" && method === "POST") return await registrar(request, env);
    if (path === "entrar" && method === "POST") return await entrar(request, env);
    if (path === "sair" && method === "POST") return await sair(request, env);
    if (path === "eu" && method === "GET") return await eu(request, env);
    if (path === "progresso" && method === "PUT") return await progresso(request, env);
    if (path === "nova-senha" && method === "POST") return await novaSenha(request, env);
    if (path === "conta" && method === "DELETE") return await excluirConta(request, env);
    if (path === "visitas" && (method === "GET" || method === "POST")) return await visitas(request, env);
    if (path.startsWith("sala/")) return json({ erro: "Recurso removido" }, 410);
  } catch (e) {
    console.error(e);
    return json({ erro: "Erro interno" }, 500);
  }
  return json({ erro: "Não encontrado" }, 404);
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

// ---------------------------------------------------------------- senhas ----
const SENHA_MIN = 8, SENHA_MAX = 72;
const MAX_FALHAS = 8, BLOQUEIO_MS = 15 * 60 * 1000;

function b64(bytes) { return btoa(String.fromCharCode(...new Uint8Array(bytes))); }
function deB64(s) { return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)); }
function iguais(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
async function derivar(senha, salt) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(senha), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, key, 256));
}
// formato novo: v2$sal$hash (sal aleatório por usuário)
async function hashSenha(senha) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return "v2$" + b64(salt) + "$" + b64(await derivar(senha, salt));
}
// confere senhas do formato novo e do antigo (sal fixo, só para contas já existentes)
async function conferirSenha(senha, guardado) {
  if (typeof senha !== "string" || !guardado) return { ok: false };
  if (guardado.startsWith("v2$")) {
    const [, s, h] = guardado.split("$");
    return { ok: iguais(b64(await derivar(senha, deB64(s))), h), legado: false };
  }
  const antigo = b64(await derivar(senha, new TextEncoder().encode("filhosdemaria-salt")));
  return { ok: iguais(antigo, guardado), legado: true };
}
function validarSenha(senha, usuario) {
  if (typeof senha !== "string" || senha.length < SENHA_MIN) return "A senha precisa ter pelo menos " + SENHA_MIN + " caracteres.";
  if (senha.length > SENHA_MAX) return "A senha pode ter no máximo " + SENHA_MAX + " caracteres.";
  if (usuario && senha.toLowerCase() === usuario.toLowerCase()) return "A senha não pode ser igual ao usuário.";
  return null;
}
async function gerarSenha() {
  const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 12; i++) s += chars[arr[i] % chars.length];
  return s;
}

// -------------------------------------------- bloqueio por tentativas ----
// Se a tabela "tentativas" não existir, tudo isto é ignorado (o login continua funcionando).
async function limparFalhas(env, usuario) {
  try { await env.DB.prepare("DELETE FROM tentativas WHERE usuario = ?").bind(usuario).run(); } catch (e) {}
}
async function estaBloqueado(env, usuario) {
  try {
    const r = await env.DB.prepare("SELECT bloqueado_ate FROM tentativas WHERE usuario = ?").bind(usuario).first();
    if (!r || !r.bloqueado_ate) return false;
    if (r.bloqueado_ate > Date.now()) return true;
    await limparFalhas(env, usuario);
  } catch (e) {}
  return false;
}
async function registrarFalha(env, usuario) {
  try {
    await env.DB.prepare(
      "INSERT INTO tentativas (usuario, falhas, bloqueado_ate) VALUES (?, 1, 0) " +
      "ON CONFLICT(usuario) DO UPDATE SET falhas = falhas + 1, " +
      "bloqueado_ate = CASE WHEN falhas + 1 >= ? THEN ? ELSE bloqueado_ate END"
    ).bind(usuario, MAX_FALHAS, Date.now() + BLOQUEIO_MS).run();
  } catch (e) {}
}

// ------------------------------------------------------------ sessões ----
async function criarSessao(env, userId) {
  const id = crypto.randomUUID();
  const expires = Date.now() + 30 * 24 * 60 * 60 * 1000;
  await env.DB.prepare("INSERT INTO sessions (id, user_id, expires) VALUES (?, ?, ?)").bind(id, userId, expires).run();
  return id;
}
function cookie(sid) {
  return `sid=${sid}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`;
}
async function getUser(request, env) {
  const cookie2 = request.headers.get("Cookie") || "";
  const m = cookie2.match(/sid=([^;]+)/);
  if (!m) return null;
  const row = await env.DB.prepare(
    "SELECT u.id, u.usuario FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires > ?"
  ).bind(m[1], Date.now()).first();
  return row;
}

// --------------------------------------------------------------- rotas ----
async function registrar(request, env) {
  const body = await request.json();
  const usuario = String(body.usuario || "").trim().toLowerCase();
  if (usuario.length < 3 || usuario.length > 24 || !/^[a-z0-9_]+$/.test(usuario)) {
    return json({ erro: "Usuário inválido (3-24 caracteres, letras minúsculas, números ou _)" }, 400);
  }
  let senha = body.senha, gerada = false;
  if (senha === undefined || senha === null || senha === "") {   // compatível com o site antigo
    senha = await gerarSenha(); gerada = true;
  } else {
    const erro = validarSenha(senha, usuario);
    if (erro) return json({ erro }, 400);
  }
  const existing = await env.DB.prepare("SELECT id FROM users WHERE usuario = ?").bind(usuario).first();
  if (existing) return json({ erro: "Usuário já existe" }, 409);
  const hash = await hashSenha(senha);
  const res = await env.DB.prepare("INSERT INTO users (usuario, senha_hash) VALUES (?, ?)").bind(usuario, hash).run();
  const sid = await criarSessao(env, res.meta.last_row_id);
  return json(gerada ? { usuario, senha } : { usuario }, 201, { "Set-Cookie": cookie(sid) });
}

async function entrar(request, env) {
  const body = await request.json();
  const usuario = String(body.usuario || "").trim().toLowerCase();
  const senha = body.senha;
  const falha = () => json({ erro: "Usuário ou senha incorretos" }, 401);
  if (!usuario || typeof senha !== "string") return falha();
  if (await estaBloqueado(env, usuario)) {
    return json({ erro: "Muitas tentativas. Tente de novo em 15 minutos." }, 429);
  }
  const user = await env.DB.prepare("SELECT id, senha_hash FROM users WHERE usuario = ?").bind(usuario).first();
  if (!user) { await registrarFalha(env, usuario); return falha(); }
  const r = await conferirSenha(senha, user.senha_hash);
  if (!r.ok) { await registrarFalha(env, usuario); return falha(); }
  await limparFalhas(env, usuario);
  if (r.legado) {   // atualiza a conta antiga para o formato novo
    await env.DB.prepare("UPDATE users SET senha_hash = ? WHERE id = ?").bind(await hashSenha(senha), user.id).run();
  }
  const sid = await criarSessao(env, user.id);
  const prog = await env.DB.prepare("SELECT dados FROM progress WHERE user_id = ?").bind(user.id).first();
  let dados = null;
  try { dados = prog ? JSON.parse(prog.dados) : null; } catch (e) {}
  return json({ usuario, dados }, 200, { "Set-Cookie": cookie(sid) });
}

async function sair(request, env) {
  const m = (request.headers.get("Cookie") || "").match(/sid=([^;]+)/);
  if (m) await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(m[1]).run();
  return json({ ok: true }, 200, { "Set-Cookie": "sid=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0" });
}

async function eu(request, env) {
  const user = await getUser(request, env);
  if (!user) return json({ logado: false });
  const prog = await env.DB.prepare("SELECT dados FROM progress WHERE user_id = ?").bind(user.id).first();
  let dados = null;
  try { dados = prog ? JSON.parse(prog.dados) : null; } catch (e) {}
  return json({ logado: true, usuario: user.usuario, dados });
}

async function progresso(request, env) {
  const user = await getUser(request, env);
  if (!user) return json({ erro: "Não autenticado" }, 401);
  const { dados } = await request.json();
  const texto = JSON.stringify(dados);
  if (!texto || texto.length > 100000) return json({ erro: "Dados grandes demais" }, 413);
  await env.DB.prepare(
    "INSERT INTO progress (user_id, dados, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET dados = excluded.dados, updated_at = excluded.updated_at"
  ).bind(user.id, texto, Date.now()).run();
  return json({ ok: true });
}

async function novaSenha(request, env) {
  const user = await getUser(request, env);
  if (!user) return json({ erro: "Não autenticado" }, 401);
  let body = {};
  try { body = await request.json(); } catch (e) {}
  let senha = body.senha, gerada = false;
  if (senha === undefined || senha === null || senha === "") {
    senha = await gerarSenha(); gerada = true;
  } else {
    const erro = validarSenha(senha, user.usuario);
    if (erro) return json({ erro }, 400);
  }
  await env.DB.prepare("UPDATE users SET senha_hash = ? WHERE id = ?").bind(await hashSenha(senha), user.id).run();
  const m = (request.headers.get("Cookie") || "").match(/sid=([^;]+)/);   // encerra as outras sessões
  if (m) await env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND id <> ?").bind(user.id, m[1]).run();
  return json(gerada ? { senha } : { ok: true });
}

async function excluirConta(request, env) {
  const user = await getUser(request, env);
  if (!user) return json({ erro: "Não autenticado" }, 401);
  const { senha } = await request.json();
  const row = await env.DB.prepare("SELECT senha_hash FROM users WHERE id = ?").bind(user.id).first();
  const r = await conferirSenha(senha, row && row.senha_hash);
  if (!r.ok) return json({ erro: "Senha incorreta" }, 401);
  await env.DB.prepare("DELETE FROM progress WHERE user_id = ?").bind(user.id).run();
  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(user.id).run();
  await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(user.id).run();
  return json({ ok: true }, 200, { "Set-Cookie": "sid=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0" });
}

// Contador de acessos: só um número total. Não guarda IP nem identifica ninguém.
async function visitas(request, env) {
  if (request.method === "POST") {
    const ua = request.headers.get("User-Agent") || "";
    if (!/bot|crawl|spider|slurp|preview|facebookexternalhit/i.test(ua)) {
      await env.DB.prepare("UPDATE visitas SET total = total + 1 WHERE id = 1").run();
    }
  }
  const row = await env.DB.prepare("SELECT total FROM visitas WHERE id = 1").first();
  return json({ total: row ? row.total : 0 }, 200, { "Cache-Control": "no-store" });
}

// Classe das salas do quiz (quiz removido do site). Mantida vazia para não exigir migração do Durable Object.
export class Room {
  constructor(state, env) { this.state = state; this.env = env; }
  async fetch() { return new Response("Recurso removido", { status: 410 }); }
}
