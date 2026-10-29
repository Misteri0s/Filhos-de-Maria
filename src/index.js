export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      const r = await handleApi(request, env, url);
      return comCabecalhos(r, true);
    }
    const r = await env.ASSETS.fetch(request);
    return comCabecalhos(r, false);
  },
};

// ------------------------------------------------------------ cabeçalhos ----
const CABECALHOS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), serial=(), interest-cohort=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=31536000",
};
function comCabecalhos(resp, api) {
  const r = new Response(resp.body, resp);
  for (const [k, v] of Object.entries(CABECALHOS)) r.headers.set(k, v);
  if (api) r.headers.set("Cache-Control", "no-store");
  return r;
}

// ------------------------------------------------------------------ rotas ----
const COOKIE = "__Host-sid";
const ROTAS = {
  "POST registrar": registrar, "POST entrar": entrar, "POST sair": sair, "GET eu": eu,
  "PUT progresso": progresso, "POST nova-senha": novaSenha, "DELETE conta": excluirConta,
  "GET visitas": visitas, "POST visitas": visitas,
};
async function handleApi(request, env, url) {
  const path = url.pathname.slice(5);
  const method = request.method;
  try {
    if (path.startsWith("sala/")) return json({ erro: "Recurso removido" }, 410);
    const fn = ROTAS[method + " " + path];
    if (!fn) {
      const existe = Object.keys(ROTAS).some((k) => k.endsWith(" " + path));
      return existe ? json({ erro: "Método não permitido" }, 405) : json({ erro: "Não encontrado" }, 404);
    }
    if (method !== "GET") {
      const bloqueio = verificarOrigem(request, url);
      if (bloqueio) return bloqueio;
    }
    return await fn(request, env, url);
  } catch (e) {
    console.error(e);
    return json({ erro: "Erro interno" }, 500);
  }
}
function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...headers } });
}

// ---------------------------------------------------------------- CSRF ----
// Só aceita pedidos feitos pelo próprio site. Navegadores informam a origem sozinhos e o site não consegue ser enganado
// por outra página. Além disso, o cookie é SameSite=Strict.
function verificarOrigem(request, url) {
  const sfs = request.headers.get("Sec-Fetch-Site");
  if (sfs && sfs !== "same-origin") return json({ erro: "Origem não permitida" }, 403);
  const origem = request.headers.get("Origin");
  if (origem) {
    let host = null;
    try { host = new URL(origem).host; } catch (e) {}
    if (host !== url.host) return json({ erro: "Origem não permitida" }, 403);
  }
  return null;
}
// Lê o corpo JSON com limite de tamanho. Rotas que mudam dados só aceitam application/json.
async function lerJson(request, max = 20000) {
  const tipo = request.headers.get("Content-Type") || "";
  if (!tipo.toLowerCase().includes("application/json")) throw new ErroHttp(415, "Tipo de conteúdo não aceito");
  const declarado = Number(request.headers.get("Content-Length") || 0);
  if (declarado > max) throw new ErroHttp(413, "Dados grandes demais");
  const texto = await request.text();
  if (texto.length > max) throw new ErroHttp(413, "Dados grandes demais");
  try { const j = JSON.parse(texto); if (j && typeof j === "object") return j; } catch (e) {}
  throw new ErroHttp(400, "Pedido inválido");
}
class ErroHttp extends Error { constructor(status, msg) { super(msg); this.status = status; } }
async function comErros(fn) {
  try { return await fn(); }
  catch (e) { if (e instanceof ErroHttp) return json({ erro: e.message }, e.status); throw e; }
}

// ------------------------------------------------------------- utilitários ----
function b64(bytes) { return btoa(String.fromCharCode(...new Uint8Array(bytes))); }
function deB64(s) { return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)); }
function b64url(bytes) { return b64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function hex(bytes) { return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join(""); }
async function sha256Hex(txt) { return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(txt))); }
function iguais(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
function cookieDe(request, nome) {
  const c = request.headers.get("Cookie") || "";
  for (const p of c.split(";")) {
    const i = p.indexOf("=");
    if (i > 0 && p.slice(0, i).trim() === nome) return p.slice(i + 1).trim();
  }
  return null;
}

// ---------------------------------------------------------------- senhas ----
const SENHA_MIN = 8, SENHA_MAX = 128;
const MAX_FALHAS = 8, BLOQUEIO_MS = 15 * 60 * 1000;
const COMUNS = new Set(("12345678 123456789 1234567890 87654321 11111111 00000000 12341234 123123123 12345678910 " +
  "senha123 senha1234 senha12345 minhasenha senha@123 password password1 password123 passw0rd qwerty123 qwertyuiop " +
  "abc12345 abcd1234 abcdefgh asdfghjk iloveyou admin123 deus123456 jesus1234 jesuscristo maria1234 brasil123 " +
  "mudar123 teste123 teste1234 123mudar").split(" "));
async function derivar(senha, salt) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(senha), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, key, 256));
}
// formato v2: v2$sal$hash (sal aleatório por usuário)
async function hashSenha(senha) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return "v2$" + b64(salt) + "$" + b64(await derivar(senha, salt));
}
// confere o formato novo e o antigo (sal fixo, só para contas criadas antes)
async function conferirSenha(senha, guardado) {
  if (typeof senha !== "string" || !guardado) return { ok: false };
  if (guardado.startsWith("v2$")) {
    const [, s, h] = guardado.split("$");
    return { ok: iguais(b64(await derivar(senha, deB64(s))), h), legado: false };
  }
  const antigo = b64(await derivar(senha, new TextEncoder().encode("filhosdemaria-salt")));
  return { ok: iguais(antigo, guardado), legado: true };
}
// gasta o mesmo tempo quando o usuário não existe (evita descobrir quais usuários existem pelo tempo de resposta)
async function gastarTempo(senha) { await derivar(typeof senha === "string" ? senha : "", new Uint8Array(16)); }
function validarSenha(senha, usuario) {
  if (typeof senha !== "string" || senha.length < SENHA_MIN) return "A senha precisa ter pelo menos " + SENHA_MIN + " caracteres.";
  if (senha.length > SENHA_MAX) return "A senha pode ter no máximo " + SENHA_MAX + " caracteres.";
  const baixa = senha.toLowerCase();
  if (usuario && baixa === usuario.toLowerCase()) return "A senha não pode ser igual ao usuário.";
  if (COMUNS.has(baixa) || /^(.)\1+$/.test(senha)) return "Essa senha é muito comum. Escolha outra.";
  return null;
}
function gerarSenha() {
  const chars = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  let s = "";
  for (let i = 0; i < 12; i++) s += chars[arr[i] % chars.length];
  return s;
}

// -------------------------------------------- bloqueio e limite (fail-open) ----
// Se a tabela não existir, a proteção é ignorada e o site continua funcionando.
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
// Limite por IP. Guardamos só um identificador com hash (não o IP), apagado quando a janela termina.
async function excedeLimite(env, request, rota, max, janelaMs) {
  try {
    const ip = request.headers.get("CF-Connecting-IP") || "sem-ip";
    const chave = await sha256Hex((env.PEPPER || "fm") + "|" + rota + "|" + ip);
    const agora = Date.now();
    if (Math.random() < 0.02) await env.DB.prepare("DELETE FROM limites WHERE ate < ?").bind(agora).run();
    const r = await env.DB.prepare("SELECT n, ate FROM limites WHERE chave = ?").bind(chave).first();
    if (!r || r.ate <= agora) {
      await env.DB.prepare("INSERT OR REPLACE INTO limites (chave, n, ate) VALUES (?, 1, ?)").bind(chave, agora + janelaMs).run();
      return 0;
    }
    if (r.n >= max) return Math.max(1, Math.ceil((r.ate - agora) / 1000));
    await env.DB.prepare("UPDATE limites SET n = n + 1 WHERE chave = ?").bind(chave).run();
  } catch (e) {}
  return 0;
}
function limiteResp(seg) {
  return json({ erro: "Muitas tentativas. Aguarde um pouco e tente de novo." }, 429, { "Retry-After": String(seg) });
}
const MIN = 60 * 1000, HORA = 60 * MIN;

// ------------------------------------------------------------ sessões ----
const SESSAO_MS = 30 * 24 * 60 * 60 * 1000;
async function criarSessao(env, userId) {
  const token = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const id = await sha256Hex(token);          // no banco fica só o hash do token
  const agora = Date.now();
  try { await env.DB.prepare("DELETE FROM sessions WHERE expires < ?").bind(agora).run(); } catch (e) {}
  await env.DB.prepare("INSERT INTO sessions (id, user_id, expires) VALUES (?, ?, ?)").bind(id, userId, agora + SESSAO_MS).run();
  return token;
}
function cookieSessao(token) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSAO_MS / 1000}`;
}
const LIMPA = [
  `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`,
  "sid=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0",   // cookie da versão antiga
];
function limparCookies(extra = {}) {
  const h = new Headers({ "Content-Type": "application/json" });
  for (const c of LIMPA) h.append("Set-Cookie", c);
  return h;
}
async function getUser(request, env) {
  const token = cookieDe(request, COOKIE);
  if (!token || token.length > 100) return null;
  return await env.DB.prepare(
    "SELECT u.id, u.usuario FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires > ?"
  ).bind(await sha256Hex(token), Date.now()).first();
}

// ----------------------------------------------------- pontos e progresso ----
// Tabela da lojinha (copiada do site). Se mudar preços ou itens no site, atualize aqui também.
const CORES_CUSTO = {"padrao": 0, "perola": 30, "madeira": 50, "ebano": 70, "cristal": 90, "rosa": 110, "prata": 130, "turquesa": 150, "ambar": 170, "coral": 190, "esmeralda": 210, "ametista": 230, "ouro": 250, "rubi": 270, "safira": 290};
const TEXTURAS_CUSTO = {"lisa": 0, "perolada": 10, "listrada": 10, "pontilhada": 10, "marmorizada": 10, "brilhante": 10, "trancada": 10};
const FORMAS = new Set(["circulo", "arredondada", "oval", "losango", "coracao", "estrela", "cruz", "hexagono", "flor", "triangulo", "pentagono", "octogono", "gota", "sol"]);
const SETS = ["gozosos", "luminosos", "dolorosos", "gloriosos"];
const MAX_POR_DIA = 820;            // máximo de pontos em um dia (sábado, com a sequência em dobro: 410 x 2)
const MAX_POR_TOQUE = 50;           // maior prêmio possível em um único toque (25 x 2)
const TOQUE_MS = 4000;              // o site só dá ponto a cada 4 segundos
const LIMITE_PRIMEIRA = 40000;      // primeira sincronização (pode vir de muitos dias jogando sem conta)
const ehInt = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
function unicos(lista, tabela) {
  const out = [];
  if (Array.isArray(lista)) for (const x of lista.slice(0, 50)) if (typeof x === "string" && Object.prototype.hasOwnProperty.call(tabela, x) && !out.includes(x)) out.push(x);
  return out;
}
// Sequência de dias: q = dias seguidos, u = último dia (AAAA-M-D), r = recuperação disponível (1/0), k = dias que faltam para ela voltar.
function limparSequencia(s) {
  const o = { q: 0, u: "", r: 1, k: 0 };
  if (s && typeof s === "object" && ehInt(s.q, 1, 100000) && typeof s.u === "string" && /^\d{4}-\d{1,2}-\d{1,2}$/.test(s.u)) {
    o.q = s.q; o.u = s.u; o.r = s.r === 0 ? 0 : 1; o.k = ehInt(s.k, 1, 5) ? s.k : 0;
  }
  return o;
}
// Devolve os dados limpos (só campos conhecidos, com tipos certos) ou null se o formato for inválido.
function limparProgresso(d) {
  if (!d || typeof d !== "object" || d.v !== 1 || !d.p || typeof d.p !== "object") return null;
  const p = d.p;
  if (!ehInt(p.p, 0, 10000000)) return null;
  const own = unicos(p.own, CORES_CUSTO); if (!own.includes("padrao")) own.unshift("padrao");
  const tox = unicos(p.tox, TEXTURAS_CUSTO); if (!tox.includes("lisa")) tox.unshift("lisa");
  const t = {};
  if (p.t && typeof p.t === "object") {
    for (const [k, v] of Object.entries(p.t).slice(0, 30)) {
      const m = /^(gozosos|luminosos|dolorosos|gloriosos):[0-4]$/.exec(k);
      if (m && ehInt(v, 0, 10)) t[k] = v;
    }
  }
  const permitidos = new Set([...SETS.map((s) => "t:" + s), "r"]);
  const b = [];
  if (Array.isArray(p.b)) for (const x of p.b.slice(0, 10)) if (typeof x === "string" && permitidos.has(x) && !b.includes(x)) b.push(x);
  return {
    v: 1,
    p: {
      p: p.p, own,
      sel: own.includes(p.sel) ? p.sel : "padrao",
      fo: FORMAS.has(p.fo) ? p.fo : "circulo",
      tox,
      tx: tox.includes(p.tx) ? p.tx : "lisa",
      d: typeof p.d === "string" && /^\d{4}-\d{1,2}-\d{1,2}$/.test(p.d) ? p.d : "",
      t, b,
      m: p.m === 2 ? 2 : 1,
      s: limparSequencia(p.s),
    },
  };
}
// Total ganho na vida = pontos atuais + o que já foi gasto na lojinha.
function ganhoTotal(limpo) {
  const p = limpo.p;
  let gasto = 0;
  for (const c of p.own) gasto += CORES_CUSTO[c];
  for (const x of p.tox) gasto += TEXTURAS_CUSTO[x];
  return p.p + gasto;
}
function ganhoPermitido(decorridoMs) {
  const dias = Math.ceil(decorridoMs / 86400000) + 1;
  const porTempo = (Math.floor(decorridoMs / TOQUE_MS) + 1) * MAX_POR_TOQUE;
  return Math.min(MAX_POR_DIA * dias, porTempo);
}
function lerDados(texto) { try { return limparProgresso(JSON.parse(texto)); } catch (e) { return null; } }

// --------------------------------------------------------------- rotas ----
async function registrar(request, env) {
  return comErros(async () => {
    const espera = await excedeLimite(env, request, "registrar", 5, HORA); if (espera) return limiteResp(espera);
    const body = await lerJson(request);
    const usuario = String(body.usuario || "").trim().toLowerCase();
    if (usuario.length < 3 || usuario.length > 24 || !/^[a-z0-9_]+$/.test(usuario)) {
      return json({ erro: "Usuário inválido (3-24 caracteres, letras minúsculas, números ou _)" }, 400);
    }
    let senha = body.senha, gerada = false;
    if (senha === undefined || senha === null || senha === "") { senha = gerarSenha(); gerada = true; }   // site antigo
    else { const erro = validarSenha(senha, usuario); if (erro) return json({ erro }, 400); }
    const existing = await env.DB.prepare("SELECT id FROM users WHERE usuario = ?").bind(usuario).first();
    if (existing) return json({ erro: "Usuário já existe" }, 409);
    const hash = await hashSenha(senha);
    const res = await env.DB.prepare("INSERT INTO users (usuario, senha_hash) VALUES (?, ?)").bind(usuario, hash).run();
    const token = await criarSessao(env, res.meta.last_row_id);
    return json(gerada ? { usuario, senha } : { usuario }, 201, { "Set-Cookie": cookieSessao(token) });
  });
}

async function entrar(request, env) {
  return comErros(async () => {
    const espera = await excedeLimite(env, request, "entrar", 10, 10 * MIN); if (espera) return limiteResp(espera);
    const body = await lerJson(request);
    const usuario = String(body.usuario || "").trim().toLowerCase();
    const senha = body.senha;
    const falha = () => json({ erro: "Usuário ou senha incorretos" }, 401);
    if (!usuario || usuario.length > 24 || typeof senha !== "string" || senha.length > SENHA_MAX) return falha();
    if (await estaBloqueado(env, usuario)) return json({ erro: "Muitas tentativas. Tente de novo em 15 minutos." }, 429);
    const user = await env.DB.prepare("SELECT id, senha_hash FROM users WHERE usuario = ?").bind(usuario).first();
    if (!user) { await gastarTempo(senha); await registrarFalha(env, usuario); return falha(); }
    const r = await conferirSenha(senha, user.senha_hash);
    if (!r.ok) { await registrarFalha(env, usuario); return falha(); }
    await limparFalhas(env, usuario);
    if (r.legado) await env.DB.prepare("UPDATE users SET senha_hash = ? WHERE id = ?").bind(await hashSenha(senha), user.id).run();
    const token = await criarSessao(env, user.id);
    const prog = await env.DB.prepare("SELECT dados FROM progress WHERE user_id = ?").bind(user.id).first();
    return json({ usuario, dados: prog ? lerDados(prog.dados) : null }, 200, { "Set-Cookie": cookieSessao(token) });
  });
}

async function sair(request, env) {
  const token = cookieDe(request, COOKIE);
  if (token && token.length <= 100) await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(await sha256Hex(token)).run();
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: limparCookies() });
}

// Resposta: sempre 200. O site deve olhar o campo "logado" (não só o código HTTP).
async function eu(request, env) {
  const user = await getUser(request, env);
  if (!user) {
    const extra = cookieDe(request, "sid") ? { "Set-Cookie": LIMPA[1] } : {};   // apaga o cookie da versão antiga
    return json({ logado: false }, 200, extra);
  }
  const prog = await env.DB.prepare("SELECT dados FROM progress WHERE user_id = ?").bind(user.id).first();
  return json({ logado: true, usuario: user.usuario, dados: prog ? lerDados(prog.dados) : null });
}

async function progresso(request, env) {
  return comErros(async () => {
    const user = await getUser(request, env);
    if (!user) return json({ erro: "Não autenticado" }, 401);
    const espera = await excedeLimite(env, request, "progresso", 120, 10 * MIN); if (espera) return limiteResp(espera);
    const body = await lerJson(request, 30000);
    const limpo = limparProgresso(body.dados);
    if (!limpo) return json({ erro: "Dados inválidos" }, 400);
    const antes = await env.DB.prepare("SELECT dados, updated_at FROM progress WHERE user_id = ?").bind(user.id).first();
    const anterior = antes ? lerDados(antes.dados) : null;
    const agora = Date.now();
    const base = anterior ? ganhoTotal(anterior) : 0;
    const limite = anterior ? base + ganhoPermitido(Math.max(0, agora - (Number(antes.updated_at) || 0))) : LIMITE_PRIMEIRA;
    if (ganhoTotal(limpo) > limite) {
      return json({ erro: "Pontos inconsistentes", dados: anterior }, 422);
    }
    await env.DB.prepare(
      "INSERT INTO progress (user_id, dados, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET dados = excluded.dados, updated_at = excluded.updated_at"
    ).bind(user.id, JSON.stringify(limpo), agora).run();
    return json({ ok: true });
  });
}

async function novaSenha(request, env) {
  return comErros(async () => {
    const user = await getUser(request, env);
    if (!user) return json({ erro: "Não autenticado" }, 401);
    const espera = await excedeLimite(env, request, "nova-senha", 10, HORA); if (espera) return limiteResp(espera);
    let body = {};
    const tipo = request.headers.get("Content-Type") || "";
    if (tipo.includes("application/json")) { try { body = await lerJson(request); } catch (e) { if (e instanceof ErroHttp && e.status !== 400) throw e; } }
    let senha = body.senha, gerada = false;
    if (senha === undefined || senha === null || senha === "") { senha = gerarSenha(); gerada = true; }
    else { const erro = validarSenha(senha, user.usuario); if (erro) return json({ erro }, 400); }
    await env.DB.prepare("UPDATE users SET senha_hash = ? WHERE id = ?").bind(await hashSenha(senha), user.id).run();
    const token = cookieDe(request, COOKIE);
    if (token) await env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND id <> ?").bind(user.id, await sha256Hex(token)).run();
    return json(gerada ? { senha } : { ok: true });
  });
}

async function excluirConta(request, env) {
  return comErros(async () => {
    const user = await getUser(request, env);
    if (!user) return json({ erro: "Não autenticado" }, 401);
    const espera = await excedeLimite(env, request, "conta", 5, HORA); if (espera) return limiteResp(espera);
    if (await estaBloqueado(env, user.usuario)) return json({ erro: "Muitas tentativas. Tente de novo em 15 minutos." }, 429);
    const { senha } = await lerJson(request);
    const row = await env.DB.prepare("SELECT senha_hash FROM users WHERE id = ?").bind(user.id).first();
    const r = await conferirSenha(senha, row && row.senha_hash);
    if (!r.ok) { await registrarFalha(env, user.usuario); return json({ erro: "Senha incorreta" }, 401); }
    // tudo ou nada: apaga em um único lote
    await env.DB.batch([
      env.DB.prepare("DELETE FROM progress WHERE user_id = ?").bind(user.id),
      env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(user.id),
      env.DB.prepare("DELETE FROM users WHERE id = ?").bind(user.id),
    ]);
    await limparFalhas(env, user.usuario);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: limparCookies() });
  });
}

// Contador de acessos: só um número total. Não guarda IP nem identifica ninguém.
async function visitas(request, env) {
  if (request.method === "POST") {
    const espera = await excedeLimite(env, request, "visitas", 30, HORA); if (espera) return limiteResp(espera);
    const ua = request.headers.get("User-Agent") || "";
    if (!/bot|crawl|spider|slurp|preview|facebookexternalhit/i.test(ua)) {
      await env.DB.prepare("UPDATE visitas SET total = total + 1 WHERE id = 1").run();
    }
  }
  const row = await env.DB.prepare("SELECT total FROM visitas WHERE id = 1").first();
  return json({ total: row ? row.total : 0 });
}

// Classe das salas do quiz (quiz removido do site). Mantida vazia para não exigir migração do Durable Object.
export class Room {
  constructor(state, env) { this.state = state; this.env = env; }
  async fetch() { return new Response("Recurso removido", { status: 410 }); }
}
