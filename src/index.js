function getCookie(request, name) {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';');
  for (let cookie of cookies) {
    const [cookieName, cookieValue] =
      cookie.trim().split('=');
    if (cookieName === name) return cookieValue; 
  }
  return null;
  }
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

  if (url.pathname === '/api/config' && request.method === 'GET') {
try {
  const result = await env.DB.prepare(
    "SELECT valor FROM config WHERE chave = 'dia_terco_especial'"
  ).first();
    const diaEspecial = result ?
    parseInt(result.valor) : 6;
return new Response(JSON.stringify({
  dia_terco_especial: diaEspecial }), {
headers: { 'Content-Type': 'application/json'
  }
  });
} catch (err) {
return new Response(JSON.stringify({
dia_terco_especial: 6 }), {
headers: { 'Content-Type': 'application/json'
}
});
}
}
if (url.pathname === '/api/admin/config' && request.method === 'POST') {
const sessionCookie = getCookie(request,
               'session_id');
    if (!sessionCookie) {
      return new Response(JSON.stringify({ erro: 'Não autorizado' }), { status: 401 });
}
const user = await env.DB.prepare(
  "SELECT u.is_admin FROM users u JOIN sessions s ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > datetime('now')"
).bind(sessionCookie).first();

if (!user || user.is_admin !== 1) {
return new Response(JSON.stringify({ erro:
'Acesso negado. Apenas administradores.' }), { status:
    403 });
}

const body = await request.json();
const novoDia = body.dia;

await env.DB.prepare(
  "INSERT OR REPLACE INTO config (chave, valor) VALUES ('dia_terco_especial', ?)"
).bind(String(novoDia)).run();

   return new Response(JSON.stringify({ sucesso:
true, novo_dia: novoDia }), {
headers: { 'Content-Type': 'application/json' }
});
}
if (url.pathname === '/api/eu' && request.method === 'GET') {
const sessionCookie = getCookie(request,
'session_id');
if (!sessionCookie) {
return new Response(JSON.stringify({ erro: 'Não autenticado' }), { status: 401 });
               }

const user = await env.DB.prepare(
  "SELECT u.id, u.usuario, u.is_admin FROM users u JOIN sessions s ON u.id = s.user_id WHERE s.id = ? AND s.expires_at > datetime('now')"
).bind(sessionCookie).first();

if (!user) {
return new Response(JSON.stringify({ erro:
'Sessão inválida ou expirada' }), { status: 401 });
}

return new Response(JSON.stringify(user),
{ headers: { 'Content-Type': 'application/json' } }
);
}

return new Response(JSON.stringify({ erro: 'Rota não encontrada' }), {
status: 404,
headers: { 'Content-Type': 'application/json' }
});
}
};
