// src/index.js
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith('/api/')) {
      return handleApi(request, env, url);
    }

    // Serve static assets
    return env.ASSETS.fetch(request);
  }
};

async function handleApi(request, env, url) {
  const path = url.pathname.replace('/api/', '');
  const method = request.method;

  try {
    if (path === 'registrar' && method === 'POST') return registrar(request, env);
    if (path === 'entrar' && method === 'POST') return entrar(request, env);
    if (path === 'sair' && method === 'POST') return sair(request, env);
    if (path === 'eu' && method === 'GET') return eu(request, env);
    if (path === 'progresso' && method === 'PUT') return progresso(request, env);
    if (path === 'nova-senha' && method === 'POST') return novaSenha(request, env);
    if (path === 'conta' && method === 'DELETE') return excluirConta(request, env);

    if (path.startsWith('sala/')) return handleSala(request, env, path);
  } catch (e) {
    console.error(e);
    return json({ erro: 'Erro interno' }, 500);
  }

  return json({ erro: 'Não encontrado' }, 404);
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers }
  });
}

async function hashSenha(senha) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(senha), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode('filhosdemaria-salt'), iterations: 100000, hash: 'SHA-256' },
    key,
    256
  );
  return btoa(String.fromCharCode(...new Uint8Array(bits)));
}

async function gerarSenha() {
  const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  const arr = new Uint8Array(12);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 12; i++) s += chars[arr[i] % chars.length];
  return s;
}

async function criarSessao(env, userId) {
  const id = crypto.randomUUID();
  const expires = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 dias
  await env.DB.prepare('INSERT INTO sessions (id, user_id, expires) VALUES (?, ?, ?)').bind(id, userId, expires).run();
  return id;
}

function cookie(sid) {
  return `sid=${sid}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}`;
}

async function getUser(request, env) {
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(/sid=([^;]+)/);
  if (!m) return null;
  const sid = m[1];
  const row = await env.DB.prepare(
    'SELECT u.id, u.usuario FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.expires > ?'
  ).bind(sid, Date.now()).first();
  return row;
}

async function registrar(request, env) {
  const { usuario } = await request.json();
  if (!usuario || usuario.length < 3 || usuario.length > 24 || !/^[a-z0-9_]+$/.test(usuario)) {
    return json({ erro: 'Usuário inválido (3-24 caracteres, letras minúsculas, números ou _)' }, 400);
  }
  const existing = await env.DB.prepare('SELECT id FROM users WHERE usuario = ?').bind(usuario).first();
  if (existing) return json({ erro: 'Usuário já existe' }, 409);

  const senha = await gerarSenha();
  const hash = await hashSenha(senha);
  const res = await env.DB.prepare('INSERT INTO users (usuario, senha_hash) VALUES (?, ?)').bind(usuario, hash).run();
  const userId = res.meta.last_row_id;
  const sid = await criarSessao(env, userId);

  return json({ usuario, senha }, 201, { 'Set-Cookie': cookie(sid) });
}

async function entrar(request, env) {
  const { usuario, senha } = await request.json();
  const user = await env.DB.prepare('SELECT id, senha_hash FROM users WHERE usuario = ?').bind(usuario.toLowerCase()).first();
  if (!user) return json({ erro: 'Usuário ou senha incorretos' }, 401);
  const hash = await hashSenha(senha);
  if (hash !== user.senha_hash) return json({ erro: 'Usuário ou senha incorretos' }, 401);

  const sid = await criarSessao(env, user.id);
  const prog = await env.DB.prepare('SELECT dados FROM progress WHERE user_id = ?').bind(user.id).first();
  let dados = null;
  try { dados = prog ? JSON.parse(prog.dados) : null; } catch (e) {}

  return json({ usuario, dados }, 200, { 'Set-Cookie': cookie(sid) });
}

async function sair(request, env) {
  const cookieHeader = request.headers.get('Cookie') || '';
  const m = cookieHeader.match(/sid=([^;]+)/);
  if (m) await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(m[1]).run();
  return json({ ok: true }, 200, { 'Set-Cookie': 'sid=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0' });
}

async function eu(request, env) {
  const user = await getUser(request, env);
  if (!user) return json({ logado: false });
  const prog = await env.DB.prepare('SELECT dados FROM progress WHERE user_id = ?').bind(user.id).first();
  let dados = null;
  try { dados = prog ? JSON.parse(prog.dados) : null; } catch (e) {}
  return json({ logado: true, usuario: user.usuario, dados });
}

async function progresso(request, env) {
  const user = await getUser(request, env);
  if (!user) return json({ erro: 'Não autenticado' }, 401);
  const { dados } = await request.json();
  await env.DB.prepare(
    'INSERT INTO progress (user_id, dados, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET dados = excluded.dados, updated_at = excluded.updated_at'
  ).bind(user.id, JSON.stringify(dados), Date.now()).run();
  return json({ ok: true });
}

async function novaSenha(request, env) {
  const user = await getUser(request, env);
  if (!user) return json({ erro: 'Não autenticado' }, 401);
  const senha = await gerarSenha();
  const hash = await hashSenha(senha);
  await env.DB.prepare('UPDATE users SET senha_hash = ? WHERE id = ?').bind(hash, user.id).run();
  return json({ senha });
}

async function excluirConta(request, env) {
  const user = await getUser(request, env);
  if (!user) return json({ erro: 'Não autenticado' }, 401);
  const { senha } = await request.json();
  const row = await env.DB.prepare('SELECT senha_hash FROM users WHERE id = ?').bind(user.id).first();
  if ((await hashSenha(senha)) !== row.senha_hash) return json({ erro: 'Senha incorreta' }, 401);

  await env.DB.prepare('DELETE FROM progress WHERE user_id = ?').bind(user.id).run();
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id).run();
  await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(user.id).run();
  return json({ ok: true }, 200, { 'Set-Cookie': 'sid=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0' });
}

// Salas
async function handleSala(request, env, path) {
  const id = env.ROOMS.idFromName('global');
  const stub = env.ROOMS.get(id);
  return stub.fetch(request);
}

export class Room {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.rooms = new Map(); // code -> room state
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/ws')) return this.handleWs(request, url);
    if (request.method === 'POST' && url.pathname.includes('/criar')) return this.criar(request);
    if (request.method === 'POST' && url.pathname.includes('/entrar')) return this.entrar(request);
    return new Response('Not found', { status: 404 });
  }

  async criar(request) {
    const { name } = await request.json();
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const playerId = crypto.randomUUID();
    const token = crypto.randomUUID();
    const room = {
      code,
      hostId: playerId,
      players: [{ id: playerId, name: name || 'Anfitrião', token, score: 0, online: true }],
      phase: 'lobby',
      settings: { seconds: 20, format: 'multi' },
      questionIndex: -1,
      question: null,
      endsAt: 0,
      answers: {}
    };
    this.rooms.set(code, room);
    return json({ code, playerId, token });
  }

  async entrar(request) {
    const { name, code } = await request.json();
    const room = this.rooms.get(code.toUpperCase());
    if (!room) return json({ error: 'Sala não encontrada' }, 404);
    const playerId = crypto.randomUUID();
    const token = crypto.randomUUID();
    room.players.push({ id: playerId, name: name || 'Jogador', token, score: 0, online: true });
    this.broadcast(room);
    return json({ code: room.code, playerId, token });
  }

  async handleWs(request, url) {
    const code = url.searchParams.get('code');
    const playerId = url.searchParams.get('player');
    const token = url.searchParams.get('token');
    const room = this.rooms.get(code);
    if (!room) return new Response('Sala não encontrada', { status: 404 });
    const player = room.players.find(p => p.id === playerId && p.token === token);
    if (!player) return new Response('Não autorizado', { status: 401 });

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    player.ws = server;
    player.online = true;
    this.broadcast(room);

    server.addEventListener('message', async (e) => {
      try {
        const msg = JSON.parse(e.data);
        await this.onMessage(room, player, msg);
      } catch (err) {}
    });
    server.addEventListener('close', () => {
      player.online = false;
      player.ws = null;
      this.broadcast(room);
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  async onMessage(room, player, msg) {
    if (msg.type === 'start' && player.id === room.hostId && room.phase === 'lobby' && room.players.filter(p => p.online).length >= 2) {
      room.phase = 'question';
      room.questionIndex = 0;
      room.question = this.sampleQuestion();
      room.endsAt = Date.now() + room.settings.seconds * 1000;
      room.answers = {};
      this.broadcast(room);
      setTimeout(() => this.reveal(room), room.settings.seconds * 1000);
    }
    if (msg.type === 'answer' && room.phase === 'question' && !room.answers[player.id]) {
      room.answers[player.id] = { choice: msg.choice, at: Date.now() };
      const correct = msg.choice === room.question.correct;
      const elapsed = (Date.now() - (room.endsAt - room.settings.seconds * 1000)) / 1000;
      const points = correct ? (elapsed <= 5 ? 3 : elapsed <= 10 ? 2 : 1) : 0;
      player.score += points;
      player.lastResult = points;
    }
    if (msg.type === 'settings' && player.id === room.hostId) {
      room.settings = { ...room.settings, ...msg.settings };
      this.broadcast(room);
    }
    if (msg.type === 'leave') {
      room.players = room.players.filter(p => p.id !== player.id);
      if (room.players.length === 0) this.rooms.delete(room.code);
      else this.broadcast(room);
    }
  }

  reveal(room) {
    if (room.phase !== 'question') return;
    room.phase = 'reveal';
    this.broadcast(room);
    setTimeout(() => {
      if (room.questionIndex < 4) { // 5 questions
        room.phase = 'question';
        room.questionIndex++;
        room.question = this.sampleQuestion();
        room.endsAt = Date.now() + room.settings.seconds * 1000;
        room.answers = {};
        this.broadcast(room);
        setTimeout(() => this.reveal(room), room.settings.seconds * 1000);
      } else {
        room.phase = 'ended';
        this.broadcast(room);
      }
    }, 4000);
  }

  sampleQuestion() {
    const bank = [
      { q: 'Onde o anjo Gabriel anunciou a Maria?', options: ['Jerusalém', 'Nazaré', 'Belém', 'Jericó'], correct: 1, source: 'Lc 1,26-38' },
      { q: 'Quem Maria visitou?', options: ['Marta', 'Isabel', 'Ana', 'Madalena'], correct: 1, source: 'Lc 1,39-45' },
      { q: 'Em que cidade Jesus nasceu?', options: ['Nazaré', 'Cafarnaum', 'Belém', 'Betânia'], correct: 2, source: 'Lc 2,1-7' },
      { q: 'Quem tomou Jesus nos braços no Templo?', options: ['Simeão', 'Zaqueu', 'Nicodemos', 'José'], correct: 0, source: 'Lc 2,22-38' },
      { q: 'Onde Jesus foi encontrado depois de perdido?', options: ['No barco', 'No Templo', 'Em Caná', 'No deserto'], correct: 1, source: 'Lc 2,41-52' }
    ];
    return bank[Math.floor(Math.random() * bank.length)];
  }

  broadcast(room) {
    const state = {
      type: 'state',
      code: room.code,
      hostId: room.hostId,
      players: room.players.map(p => ({ id: p.id, name: p.name, online: p.online, score: p.score })),
      phase: room.phase,
      settings: room.settings,
      questionIndex: room.questionIndex,
      total: 5,
      question: room.question,
      endsAt: room.endsAt
    };
    for (const p of room.players) {
      if (p.ws && p.online) {
        const personal = { ...state, myAnswered: !!room.answers[p.id], myResult: p.lastResult || null };
        try { p.ws.send(JSON.stringify(personal)); } catch (e) {}
      }
    }
  }
}

