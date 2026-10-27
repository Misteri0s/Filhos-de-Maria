import { getUser } from "./conta.js";
import { json } from "./util.js";

export async function progresso(request, env) {
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

// Contador de acessos: só um número total. Não guarda IP nem identifica ninguém.
export async function visitas(request, env) {
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
