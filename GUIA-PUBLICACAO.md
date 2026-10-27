# Guia: colocar o site no GitHub e publicar no Cloudflare

Este guia assume que você tem o repositório `Filhos-de-Maria` no GitHub e que o site
já está publicado no Cloudflare. Se alguma etapa não bater com o que você vê na tela,
pare e me avise antes de continuar.

---

## Parte 1: Antes de começar (faça uma cópia de segurança)

1. Guarde o zip atual do projeto (`Filhos-de-Maria-main.zip`) em um lugar seguro.
   Se algo der errado, é com ele que você volta ao estado de hoje.
2. No GitHub, o histórico já guarda as versões antigas. Mesmo assim, a cópia no zip é a
   garantia de que você não perde nada.

---

## Parte 2: Subir os arquivos para o GitHub

Há dois caminhos. O **caminho A** é pelo site do GitHub, sem instalar nada. O **caminho B**
usa o Git no computador, e é mais seguro para mudanças grandes. Escolha um.

### Caminho A: pelo site do GitHub (sem instalar nada)

1. Entre em `github.com` e abra o repositório `Filhos-de-Maria`.
2. Apague os arquivos antigos que não existem mais na versão nova. Para cada um, clique
   no arquivo, depois no ícone de lixeira (Delete file), escreva uma mensagem curta e
   clique em **Commit changes**:
   - `config` (na raiz) e `public/config`
   - `wrangler.jsonc` (na raiz) e `public/wrangler.jsonc`
   - `public/src/index.js`
   - `public/worker-completo-index.js`
3. Agora envie os arquivos novos. Abra a pasta `Filhos-de-Maria` que está dentro do
   zip `Filhos-de-Maria-corrigido.zip` no seu computador. Dentro dela estão `src/`,
   `public/`, `wrangler.toml`, `schema.sql`, `README.md`, `GUIA-PUBLICACAO.md` e `.gitignore`.
   **Envie o conteúdo da pasta, não a pasta em si.**
4. No GitHub, clique em **Add file > Upload files**, arraste **todo o conteúdo** da pasta
   (as pastas `src` e `public` inteiras, e os arquivos soltos) e clique em **Commit changes**.
   O GitHub substitui os arquivos com o mesmo nome e mantém o restante.
5. Confira: a raiz do repositório deve mostrar `src/`, `public/`, `wrangler.toml`,
   `schema.sql`, `README.md`. Dentro de `public/` deve haver `index.html`, `css/`, `js/`
   e `sw.js`. **Não deve haver mais** `public/src/`, `public/config` nem dois `wrangler`.

> Se o GitHub avisar que a pasta `public/css` ou `public/js` não apareceu, é porque o upload
> não terminou. Repita o passo 4 só com essas pastas.

### Caminho B: pelo Git no computador

1. Instale o Git (`git-scm.com`) se não tiver.
2. Abra o terminal na pasta do repositório (já clonado) e rode:

```bash
git status                    # veja o que existe hoje
git rm -r --ignore-unmatch config wrangler.jsonc public/config public/wrangler.jsonc public/src public/worker-completo-index.js
```

3. Copie o conteúdo da pasta `Filhos-de-Maria` (do zip) para dentro do repositório,
   substituindo os arquivos. Depois rode:

```bash
git add -A
git commit -m "Refatora site em arquivos menores; backend em src/; painel admin do dia especial"
git push
```

4. Confira com `git status` que não sobrou nada pendente.

---

## Parte 3: Cloudflare

Primeiro descubra como o seu site é publicado. Entre em `dash.cloudflare.com`,
depois **Workers & Pages**, e clique no projeto `filhosdemaria`.

### Caso 1: o projeto está conectado ao GitHub (mais comum)

Quando você dá `push` no GitHub, o Cloudflare publica sozinho. Não há mais nada a fazer
no painel, a não ser conferir:

1. Em **Settings > Builds** (ou **Build configuration**):
   - **Root directory**: `/` (vazio ou barra)
   - **Build command**: vazio
   - **Deploy command**: `npx wrangler deploy` (ou vazio, se o painel já detecta o `wrangler.toml`)
2. Aba **Deployments**: deve aparecer um deploy novo com o horário do seu commit. Espere
   terminar (fica verde).

### Caso 2: você publica manualmente com o Wrangler

No computador, dentro da pasta do repositório, rode:

```bash
npx wrangler login            # só na primeira vez
npx wrangler deploy
```

### Passos no banco de dados (fazer UMA vez, em qualquer caso)

Essas etapas são feitas no banco D1, não no código:

1. No Cloudflare, vá em **Storage & Databases > D1** e abra o banco `filhosdemaria`.
2. Clique na aba **Console**.
3. Abra o arquivo `schema.sql` do projeto em um editor de texto, copie **tudo** e cole no console.
4. Clique em **Execute**.
   - As tabelas são criadas com `IF NOT EXISTS`, então rodar de novo não estraga nada.
   - A linha `ALTER TABLE users ADD COLUMN is_admin ...` **só pode rodar uma vez**. Se já
     existia, dará erro dizendo que a coluna já existe. Pode ignorar esse erro.
5. Torne a sua conta administradora. Troque `seu_usuario` pelo seu nome de usuário do site:

```sql
UPDATE users SET is_admin = 1 WHERE usuario = 'seu_usuario';
```

### Conferir o vínculo do banco (só se algo der errado)

O `wrangler.toml` diz que o banco se chama `DB` e tem o id
`6946bee7-2532-4d10-8e46-66eb4f1b8450`. No painel, em **Workers & Pages > filhosdemaria >
Settings > Bindings**, deve existir um D1 com nome `DB` apontando para esse banco.
Se não existir, adicione-o por lá.

> Não mude o `migrations` (`tag = "v1"`) do `wrangler.toml`. Ele já foi aplicado e alterá-lo
> pode causar erro no Durable Object.

---

## Parte 4: Conferir se funcionou

1. Abra o site e recarregue a página com **Ctrl+F5** (ou no celular, feche e abra o navegador).
   O service worker novo (`fm-v8`) substitui a versão antiga.
2. Faça login com a sua conta de administradora.
3. Role até o fim da página. Deve aparecer **Painel do administrador**.
4. Escolha um dia e clique em **Salvar**. A mensagem deve dizer "Salvo: ... é o dia dos pontos para todos."
5. Em uma aba anônima (sem login), abra o site. Ele deve mostrar o dia escolhido nos textos
   e o painel não deve aparecer.

Se o painel não aparecer, confira nesta ordem:

- O passo 5 da Parte 3 foi feito? (o `UPDATE`)
- Você está logado com o mesmo usuário?
- O deploy terminou sem erro (aba Deployments)?

---

## Se o site sumir ou quebrar

- **Voltar a uma versão anterior no Cloudflare:** em **Deployments**, escolha um deploy
  antigo que estava funcionando e clique em **Rollback**.
- **Voltar no GitHub:** na lista de commits, abra um commit antigo e use **Revert**, ou
  suba o zip antigo de novo.
- **Último recurso:** o zip `Filhos-de-Maria-main.zip` original continua funcionando, porque
  não mudamos o banco de forma destrutiva (só criamos tabelas e uma coluna).

---

## Resumo rápido (para quem já sabe o que faz)

1. Substitua o conteúdo do repositório pela pasta `Filhos-de-Maria` (sem a pasta de fora).
2. Confirme que o `public/` não tem mais `src/`, `config` nem `worker-completo-index.js`.
3. Commit e push (ou `npx wrangler deploy`).
4. Rode o `schema.sql` no console do D1.
5. `UPDATE users SET is_admin = 1 WHERE usuario = 'seu_usuario';`
6. Teste: login, painel no fim da página, Salvar.
