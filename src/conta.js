import { conferirSenha, gerarSenha, hashSenha, validarSenha } from "./seguranca.js";
import { json } from "./util.js";

export const MAX_FALHAS = 8, BLOQUEIO_MS = 15 * 60 * 1000;

// -------------------------------------------- bloqueio por tentativas ----
// Se a tabela "tentativas" não existir, tudo isto é ignorado (o login continua funcionando).
export async function limparFalhas(env, usuario) {
  try { await env.DB.prepare("DELETE FROM tentativas WHERE usuario = ?").bind(usuario).run(); } catch (e) {}
}

export async function estaBloqueado(env, usuario) {
  try {
    const r = await env.DB.prepare("SELECT bloqueado_ate FROM tentativas WHERE usuario = ?").bind(usuario).first();
    if (!r || !r.bloqueado_ate) return false;
    if (r.bloqueado_ate > Date.now()) return true;
    await limparFalhas(env, usuario);
  } catch (e) {}
  return false;
}

export async function registrarFalha(env, usuario) {
  try {
    await env.DB.prepare(
      "INSERT INTO tentativas (usuario, falhas, bloqueado_ate) VALUES (?, 1, 0) " +
      "ON CONFLICT(usuario) DO UPDATE SET falhas = falhas + 1, " +
      "bloqueado_ate = CASE WHEN falhas + 1 >= ? THEN ? ELSE bloqueado_ate END"
    ).bind(usuario, MAX_FALHAS, Date.now() + BLOQUEIO_MS).run();
  } catch (e) {}
}

// ------------------------------------------------------------ sessões ----

// ------------------------------------------------------------ sessões ----
export async function criarSessao(env, userId) {
  const id = crypto.randomUUID();
  const expires = Date.now() + 30 * 24 * 60 * 60 * 1000;
  await env.DB.prepare("INSERT INTO sessions (id, user_id, expires) VALUES (?, ?, ?)").bind(id, userId, expires).run();
  return id;
}

export function cookie(sid) {
  return `sid=${sid}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`;
}

export async function getUser(request, env) {
  const cookie2 = request.headers.get("Cookie") || "";
  const m = cookie2.match(/sid=([^;]+)/);
  if (!m) return null;
  const row = await env.DB.prepare(
    "SELECT u.id, u.usuario FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires > ?"
  ).bind(m[1], Date.now()).first();
  return row;
}

// --------------------------------------------------------------- rotas ----

// --------------------------------------------------------------- rotas ----
export async function registrar(request, env) {
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

export async function entrar(request, env) {
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

export async function sair(request, env) {
  const m = (request.headers.get("Cookie") || "").match(/sid=([^;]+)/);
  if (m) await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(m[1]).run();
  return json({ ok: true }, 200, { "Set-Cookie": "sid=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0" });
}

export async function eu(request, env) {
  const user = await getUser(request, env);
  if (!user) return json({ logado: false });
  const prog = await env.DB.prepare("SELECT dados FROM progress WHERE user_id = ?").bind(user.id).first();
  let dados = null;
  try { dados = prog ? JSON.parse(prog.dados) : null; } catch (e) {}
  return json({ logado: true, usuario: user.usuario, dados });
}

export async function novaSenha(request, env) {
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

export async function excluirConta(request, env) {
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

// ---- Dia especial do terço (0 = domingo ... 6 = sábado) ----
