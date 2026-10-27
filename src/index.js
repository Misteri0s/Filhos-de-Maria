import { adminConfig, configPublica } from "./admin.js";
import { entrar, eu, excluirConta, novaSenha, registrar, sair } from "./conta.js";
import { progresso, visitas } from "./dados.js";
import { json } from "./util.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) return handleApi(request, env, url);
    if (!env.ASSETS) return new Response("Configuração do site incompleta (ASSETS).", { status: 500 });
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
    if (path === "config" && method === "GET") return await configPublica(env);
    if (path === "admin/config" && (method === "GET" || method === "PUT")) return await adminConfig(request, env, method);
    if (path.startsWith("sala/")) return json({ erro: "Recurso removido" }, 410);
  } catch (e) {
    console.error(e);
    return json({ erro: "Erro interno" }, 500);
  }
  return json({ erro: "Não encontrado" }, 404);
}

// Classe das salas do quiz (quiz removido do site). Mantida vazia para não exigir migração do Durable Object.
export class Room {
  constructor(state, env) { this.state = state; this.env = env; }
  async fetch() { return new Response("Recurso removido", { status: 410 }); }
}
