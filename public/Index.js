// Contas simples para o site Filhos de Maria.
// Sem e-mail, sem login externo: o usuário escolhe um nome e o site GERA uma senha aleatória.
// Dados guardados no banco D1 (gratuito no Cloudflare): usuário, senha embaralhada (hash) e progresso.

const SCHEMA = [
  "CREATE TABLE IF NOT EXISTS usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT, usuario TEXT NOT NULL UNIQUE, sal TEXT NOT NULL, hash TEXT NOT NULL, dados TEXT NOT NULL DEFAULT '', atualizado INTEGER NOT NULL DEFAULT 0, criado INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS sessoes (token TEXT PRIMARY KEY, usuario_id INTEGER NOT NULL, expira INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS limites (chave TEXT PRIMARY KEY, n INTEGER NOT NULL, ate INTEGER NOT NULL)"
];
const DIAS_SESSAO = 30;
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 símbolos, sem 0/O/1/I
const enc = new TextEncoder();
let pronto = null;

function agora() { return Math.floor(Date.now() / 1000); }
function hex(buf) { return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, "0")).join(""); }
function aleatorioHex(n) { const a = new Uint8Array(n); crypto.getRandomValues(a); return hex(a); }
async function sha256(s) { return hex(await crypto.subtle.digest("SHA-256", enc.encode(s))); }
function igual(a, b) { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }
function senhaNova() { // 20 símbolos x 5 bits = 100 bits de aleatoriedade
  const a = new Uint8Array(20); crypto.getRandomValues(a);
  const s = [...a].map(x => ALFABETO[x & 31]).join("");
  return s.match(/.{4}/g).join("-");
}
function normSenha(s) { return String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); }
function normUsuario(u) { u = String(u || "").trim().toLowerCase(); return /^[a-z0-9._-]{3,20}$/.test(u) ? u : null; }

function resposta(dados, status = 200, extra = {}) {
  return new Response(JSON.stringify(dados), { status, headers: {
    "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff", ...extra } });
}
function cookieSessao(token, seg) { return `fm_s=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${seg}`; }
function lerCookie(req) { const m = (req.headers.get("Cookie") || "").match(/(?:^|;\s*)fm_s=([a-f0-9]{64})/); return m ? m[1] : null; }

async function esquema(env) {
  if (!pronto) pronto = env.DB.batch(SCHEMA.map(s => env.DB.prepare(s))).catch(e => { pronto = null; throw e; });
  return pronto;
}
async function bloqueado(env, chave, max) {
  const r = await env.DB.prepare("SELECT n, ate FROM limites WHERE chave = ?").bind(chave).first();
  return !!(r && r.ate > agora() && r.n >= max);
}
async function conta(env, chave, janela) {
  const r = await env.DB.prepare("SELECT n, ate FROM limites WHERE chave = ?").bind(chave).first();
  if (r && r.ate > agora()) await env.DB.prepare("UPDATE limites SET n = n + 1 WHERE chave = ?").bind(chave).run();
  else await env.DB.prepare("INSERT OR REPLACE INTO limites (chave, n, ate) VALUES (?, 1, ?)").bind(chave, agora() + janela).run();
}
async function criarSessao(env, usuarioId) {
  const token = aleatorioHex(32);
  await env.DB.prepare("DELETE FROM sessoes WHERE expira < ?").bind(agora()).run();
  await env.DB.prepare("INSERT INTO sessoes (token, usuario_id, expira) VALUES (?, ?, ?)").bind(await sha256(token), usuarioId, agora() + DIAS_SESSAO * 86400).run();
  return token;
}
async function usuarioDaSessao(env, req) {
  const t = lerCookie(req); if (!t) return null;
  return await env.DB.prepare("SELECT u.id, u.usuario, u.dados, u.atualizado FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id WHERE s.token = ? AND s.expira > ?").bind(await sha256(t), agora()).first();
}
function mesmaOrigem(req) {
  const o = req.headers.get("Origin"), site = req.headers.get("Sec-Fetch-Site");
  if (o) return o === new URL(req.url).origin;
  return site === "same-origin" || site === "none";
}
async function lerJson(req) {
  const t = await req.text(); if (t.length > 25000) throw new Erro(413, "Dados grandes demais.");
  try { return JSON.parse(t || "{}"); } catch { throw new Erro(400, "Pedido inválido."); }
}
class Erro extends Error { constructor(status, msg) { super(msg); this.status = status; } }

export default {
  async fetch(req, env) {
    try {
      const url = new URL(req.url), rota = url.pathname.replace(/\/+$/, "");
      if (!rota.startsWith("/api/")) return resposta({ erro: "Não encontrado." }, 404);
      if (!env.DB) return resposta({ erro: "Banco de dados não configurado." }, 503);
      if (req.method !== "GET" && !mesmaOrigem(req)) return resposta({ erro: "Origem não permitida." }, 403);
      await esquema(env);
      const ipk = await sha256("ip:" + (req.headers.get("CF-Connecting-IP") || "?"));

      if (rota === "/api/registrar" && req.method === "POST") {
        const { usuario } = await lerJson(req), u = normUsuario(usuario);
        if (!u) return resposta({ erro: "Escolha um usuário com 3 a 20 letras minúsculas, números, ponto, hífen ou sublinhado." }, 400);
        if (await bloqueado(env, "r:" + ipk, 5)) return resposta({ erro: "Muitas contas criadas por aqui hoje. Tente amanhã." }, 429);
        if (await env.DB.prepare("SELECT id FROM usuarios WHERE usuario = ?").bind(u).first()) return resposta({ erro: "Esse usuário já existe. Escolha outro." }, 409);
        const senha = senhaNova(), sal = aleatorioHex(16), hash = await sha256(sal + ":" + normSenha(senha));
        const r = await env.DB.prepare("INSERT INTO usuarios (usuario, sal, hash, criado) VALUES (?, ?, ?, ?)").bind(u, sal, hash, agora()).run();
        await conta(env, "r:" + ipk, 86400);
        const token = await criarSessao(env, r.meta.last_row_id);
        return resposta({ usuario: u, senha }, 201, { "Set-Cookie": cookieSessao(token, DIAS_SESSAO * 86400) });
      }

      if (rota === "/api/entrar" && req.method === "POST") {
        const { usuario, senha } = await lerJson(req), u = normUsuario(usuario), cu = "l:" + u, ci = "i:" + ipk;
        if (await bloqueado(env, cu, 8) || await bloqueado(env, ci, 40)) return resposta({ erro: "Muitas tentativas. Aguarde 15 minutos." }, 429);
        const row = u ? await env.DB.prepare("SELECT id, sal, hash, dados, atualizado FROM usuarios WHERE usuario = ?").bind(u).first() : null;
        const h = await sha256((row ? row.sal : "x") + ":" + normSenha(senha));
        if (!row || !igual(h, row.hash)) { await conta(env, cu, 900); await conta(env, ci, 900); return resposta({ erro: "Usuário ou senha incorretos." }, 401); }
        await env.DB.prepare("DELETE FROM limites WHERE chave = ?").bind(cu).run();
        const token = await criarSessao(env, row.id);
        return resposta({ usuario: u, dados: row.dados ? JSON.parse(row.dados) : null, atualizado: row.atualizado }, 200, { "Set-Cookie": cookieSessao(token, DIAS_SESSAO * 86400) });
      }

      if (rota === "/api/eu" && req.method === "GET") {
        const us = await usuarioDaSessao(env, req);
        if (!us) return resposta({ erro: "Sem sessão." }, 401);
        return resposta({ usuario: us.usuario, dados: us.dados ? JSON.parse(us.dados) : null, atualizado: us.atualizado });
      }

      if (rota === "/api/progresso" && req.method === "PUT") {
        const us = await usuarioDaSessao(env, req); if (!us) return resposta({ erro: "Sem sessão." }, 401);
        const { dados } = await lerJson(req);
        if (!dados || typeof dados !== "object" || Array.isArray(dados) || typeof (dados.p || {}).p !== "number") return resposta({ erro: "Dados inválidos." }, 400);
        const texto = JSON.stringify(dados); if (texto.length > 20000) return resposta({ erro: "Dados grandes demais." }, 413);
        const t = Date.now();
        await env.DB.prepare("UPDATE usuarios SET dados = ?, atualizado = ? WHERE id = ?").bind(texto, t, us.id).run();
        return resposta({ atualizado: t });
      }

      if (rota === "/api/nova-senha" && req.method === "POST") {
        const us = await usuarioDaSessao(env, req); if (!us) return resposta({ erro: "Sem sessão." }, 401);
        const senha = senhaNova(), sal = aleatorioHex(16);
        await env.DB.prepare("UPDATE usuarios SET sal = ?, hash = ? WHERE id = ?").bind(sal, await sha256(sal + ":" + normSenha(senha)), us.id).run();
        return resposta({ senha });
      }

      if (rota === "/api/sair" && req.method === "POST") {
        const t = lerCookie(req);
        if (t) await env.DB.prepare("DELETE FROM sessoes WHERE token = ?").bind(await sha256(t)).run();
        return resposta({ ok: true }, 200, { "Set-Cookie": cookieSessao("", 0) });
      }

      if (rota === "/api/conta" && req.method === "DELETE") {
        const us = await usuarioDaSessao(env, req); if (!us) return resposta({ erro: "Sem sessão." }, 401);
        const { senha } = await lerJson(req);
        const row = await env.DB.prepare("SELECT sal, hash FROM usuarios WHERE id = ?").bind(us.id).first();
        if (!igual(await sha256(row.sal + ":" + normSenha(senha)), row.hash)) return resposta({ erro: "Senha incorreta." }, 401);
        await env.DB.prepare("DELETE FROM sessoes WHERE usuario_id = ?").bind(us.id).run();
        await env.DB.prepare("DELETE FROM usuarios WHERE id = ?").bind(us.id).run();
        return resposta({ ok: true }, 200, { "Set-Cookie": cookieSessao("", 0) });
      }

      return resposta({ erro: "Não encontrado." }, 404);
    } catch (e) {
      if (e instanceof Erro) return resposta({ erro: e.message }, e.status);
      return resposta({ erro: "Erro no servidor." }, 500);
    }
  }
};
                                                   
