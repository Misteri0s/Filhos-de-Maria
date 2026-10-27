-- schema.sql
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

\-- 1\. Adiciona a coluna para identificar administradores ALTER TABLE users ADD COLUMN is\_admin INTEGER DEFAULT 0; 
-- 2\. Cria a tabela de configurações do site CREATE TABLE IF NOT EXISTS config ( chave TEXT PRIMARY KEY, valor TEXT NOT NULL ); 
-- 3\. Define o sábado (dia 6) como dia padrão inicial INSERT OR REPLACE INTO config (chave, valor) VALUES ('dia\_terco\_especial', '6');
