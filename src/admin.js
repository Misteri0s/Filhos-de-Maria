import { json } from "./util.js";

// ---- Dia especial do terço (0 = domingo ... 6 = sábado) ----
export const DIA_PADRAO = 6;

export function diaValido(d) {
  return Number.isInteger(d) && d >= 0 && d <= 6;
}

export async function configPublica(env) {
  const row = await env.DB.prepare("SELECT valor FROM config WHERE chave = 'dia_terco_especial'").first();
  const dia = row ? parseInt(row.valor, 10) : DIA_PADRAO;
  return json({ dia_terco_especial: diaValido(dia) ? dia : DIA_PADRAO }, 200, { "Cache-Control": "no-store" });
}

// Só administradores (users.is_admin = 1) com sessão válida (expires em milissegundos, como criarSessao grava).

// Só administradores (users.is_admin = 1) com sessão válida (expires em milissegundos, como criarSessao grava).
export async function exigeAdmin(request, env) {
  const m = (request.headers.get("Cookie") || "").match(/sid=([^;]+)/);
  if (!m) return json({ erro: "Não autenticado" }, 401);
  const u = await env.DB.prepare(
    "SELECT u.is_admin FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires > ?"
  ).bind(m[1], Date.now()).first();
  if (!u) return json({ erro: "Não autenticado" }, 401);
  if (Number(u.is_admin) !== 1) return json({ erro: "Acesso negado. Apenas administradores." }, 403);
  return null;
}

export async function adminConfig(request, env, method) {
  const negado = await exigeAdmin(request, env);
  if (negado) return negado;
  if (method === "GET") return configPublica(env);
  let body;
  try { body = await request.json(); } catch (e) { return json({ erro: "Dados inválidos." }, 400); }
  const dia = body && body.dia_terco_especial;
  if (!diaValido(dia)) return json({ erro: "Escolha um dia entre domingo (0) e sábado (6)." }, 400);
  await env.DB.prepare(
    "INSERT INTO config (chave, valor) VALUES ('dia_terco_especial', ?) ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor"
  ).bind(String(dia)).run();
  return json({ ok: true, dia_terco_especial: dia });
}

// Contador de acessos: só um número total. Não guarda IP nem identifica ninguém.
