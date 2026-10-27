-- schema.sql (Cloudflare D1 / SQLite) - Filhos de Maria
-- Rode no console do D1 (uma vez). Os comandos são seguros de repetir, exceto o ALTER.

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

-- expires é em MILISSEGUNDOS (Date.now()), como o worker grava.
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS progress (
  user_id INTEGER PRIMARY KEY,
  dados TEXT,
  updated_at INTEGER DEFAULT (unixepoch()),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires);

-- Bloqueio de login após erros de senha (usado por src/index.js)
CREATE TABLE IF NOT EXISTS tentativas (
  usuario TEXT PRIMARY KEY,
  falhas INTEGER NOT NULL DEFAULT 0,
  bloqueado_ate INTEGER NOT NULL DEFAULT 0
);

-- Contador de acessos (usado por /api/visitas)
CREATE TABLE IF NOT EXISTS visitas (
  id INTEGER PRIMARY KEY,
  total INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO visitas (id, total) VALUES (1, 0);

-- Configurações do site
CREATE TABLE IF NOT EXISTS config (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);
-- 6 = sábado. OR IGNORE para não desfazer a escolha do admin.
INSERT OR IGNORE INTO config (chave, valor) VALUES ('dia_terco_especial', '6');

-- Administradores: rode UMA vez. Se a coluna já existir, o erro pode ser ignorado.
ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;

-- Para virar administrador depois de criar a conta no site:
-- UPDATE users SET is_admin = 1 WHERE usuario = 'seu_usuario';
