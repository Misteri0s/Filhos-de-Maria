-- schema.sql (Cloudflare D1 / SQLite)
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

-- Migração 1: administradores. Rode UMA vez (se a coluna já existir, o erro pode ser ignorado).
ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;

-- Migração 2: configurações do site
CREATE TABLE IF NOT EXISTS config (
  chave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

-- Dia especial inicial: 6 = sábado. OR IGNORE para não desfazer a escolha do admin.
INSERT OR IGNORE INTO config (chave, valor) VALUES ('dia_terco_especial', '6');

-- Para virar administrador depois de criar a conta no site:
-- UPDATE users SET is_admin = 1 WHERE usuario = 'seu_usuario';
