# Filhos de Maria - Backend

## Como publicar

1. Crie o banco D1:
   ```
   wrangler d1 create filhosdemaria
   ```
   Copie o `database_id` e cole no `wrangler.toml`.

2. Aplique o schema:
   ```
   wrangler d1 execute filhosdemaria --file=schema.sql
   ```

3. Publique:
   ```
   wrangler deploy
   ```

## Endpoints implementados

### Contas
- `POST /api/registrar` `{usuario}` → cria conta e devolve senha gerada
- `POST /api/entrar` `{usuario, senha}`
- `POST /api/sair`
- `GET /api/eu`
- `PUT /api/progresso` `{dados}`
- `POST /api/nova-senha`
- `DELETE /api/conta` `{senha}`

### Salas
- `POST /api/sala/criar`
- `POST /api/sala/entrar`
- WebSocket `/api/sala/ws`

Senhas são geradas no servidor e devolvidas uma única vez (como o frontend espera).
Sessões usam cookie `HttpOnly; Secure; SameSite=Lax`.
Salas usam Durable Object (estado em memória por enquanto; salas expiram com o Worker).

**Importante**: após o deploy, teste criar conta e entrar em sala. Se o domínio for customizado, confira se o cookie está sendo enviado.
