const SENHA_MIN = 8, SENHA_MAX = 72;
const MAX_FALHAS = 8, BLOQUEIO_MS = 15 * 60 * 1000;   // BLOQUEIO
 
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
// confere senhas do formato novo e do antigo (sal fixo)
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
 
// ---- BLOQUEIO (apague estas 3 funções e as linhas "// BLOQUEIO" se não quiser) ----
async function limparFalhas(env, usuario) {
  await env.DB.prepare("DELETE FROM tentativas WHERE usuario = ?").bind(usuario).run();
}
async function estaBloqueado(env, usuario) {
  const r = await env.DB.prepare("SELECT bloqueado_ate FROM tentativas WHERE usuario = ?").bind(usuario).first();
  if (!r || !r.bloqueado_ate) return false;
  if (r.bloqueado_ate > Date.now()) return true;
  await limparFalhas(env, usuario);
  return false;
}
async function registrarFalha(env, usuario) {
  await env.DB.prepare(
    "INSERT INTO tentativas (usuario, falhas, bloqueado_ate) VALUES (?, 1, 0) " +
    "ON CONFLICT(usuario) DO UPDATE SET falhas = falhas + 1, " +
    "bloqueado_ate = CASE WHEN falhas + 1 >= ? THEN ? ELSE bloqueado_ate END"
  ).bind(usuario, MAX_FALHAS, Date.now() + BLOQUEIO_MS).run();
}
 
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
  if (await estaBloqueado(env, usuario))                                    // BLOQUEIO
    return json({ erro: "Muitas tentativas. Tente de novo em 15 minutos." }, 429);   // BLOQUEIO
  const user = await env.DB.prepare("SELECT id, senha_hash FROM users WHERE usuario = ?").bind(usuario).first();
  if (!user) { await registrarFalha(env, usuario); return falha(); }       // BLOQUEIO
  const r = await conferirSenha(senha, user.senha_hash);
  if (!r.ok) { await registrarFalha(env, usuario); return falha(); }       // BLOQUEIO
  await limparFalhas(env, usuario);                                         // BLOQUEIO
  if (r.legado) {   // atualiza conta antiga para o formato novo
    await env.DB.prepare("UPDATE users SET senha_hash = ? WHERE id = ?").bind(await hashSenha(senha), user.id).run();
  }
  const sid = await criarSessao(env, user.id);
  const prog = await env.DB.prepare("SELECT dados FROM progress WHERE user_id = ?").bind(user.id).first();
  let dados = null;
  try { dados = prog ? JSON.parse(prog.dados) : null; } catch (e) {}
  return json({ usuario, dados }, 200, { "Set-Cookie": cookie(sid) });
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
