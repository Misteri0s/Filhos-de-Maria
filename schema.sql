-- schema.sql  (pode ser executado várias vezes e em banco que já existe: não apaga nada)

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario TEXT UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  created_at INTEGER DEFAULT (unixepoch())
);

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

-- Bloqueio após erros de senha (usado pelo Worker v2)
CREATE TABLE IF NOT EXISTS tentativas (
  usuario TEXT PRIMARY KEY,
  falhas INTEGER NOT NULL DEFAULT 0,
  bloqueado_ate INTEGER NOT NULL DEFAULT 0
);

-- Limite de requisições por IP (guarda só um identificador com hash)
CREATE TABLE IF NOT EXISTS limites (
  chave TEXT PRIMARY KEY,
  n INTEGER NOT NULL,
  ate INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_limites_ate ON limites(ate);

-- Contador de acessos (/api/visitas). Se já existir, o total é preservado.
CREATE TABLE IF NOT EXISTS visitas (
  id INTEGER PRIMARY KEY,
  total INTEGER NOT NULL DEFAULT 0
);
INSERT OR IGNORE INTO visitas (id, total) VALUES (1, 0);
