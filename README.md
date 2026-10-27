# Filhos de Maria - Backend

Worker (Cloudflare) + banco D1. O código do Worker é `src/index.js` (versão v2, endurecida).
O site estático fica em `public/`.

## Como publicar

1. Banco D1 (só na primeira vez):
   ```
   wrangler d1 create filhosdemaria
   ```
   Copie o `database_id` e cole no `wrangler.toml`.

2. Aplique o schema (pode repetir quando houver tabelas novas; não apaga dados):
   ```
   wrangler d1 execute filhosdemaria --remote --file=schema.sql
   ```

3. Publique:
   ```
   wrangler deploy
   ```

## Endpoints

- `POST /api/registrar`, `POST /api/entrar`, `POST /api/sair`, `GET /api/eu`
- `PUT /api/progresso`, `POST /api/nova-senha`, `DELETE /api/conta`
- `GET|POST /api/visitas` (contador de acessos, tabela `visitas`)
- `/api/sala/*` responde 410 (quiz removido; a classe `Room` continua exportada só para não mexer no Durable Object)

## Tabelas

`users`, `sessions`, `progress`, `tentativas` (bloqueio de senha), `limites` (limite por IP), `visitas`.

## Observações

- Sessão: cookie `__Host-sid` (HttpOnly, Secure, SameSite=Strict), token guardado só como hash.
- Não coloque arquivos do Worker dentro de `public/`: tudo que está lá fica acessível na internet.
