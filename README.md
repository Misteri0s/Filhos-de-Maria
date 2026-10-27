# Filhos de Maria: Mistérios do Santo Rosário

Site para rezar o Santo Rosário com os mistérios do dia, contagem das Ave-Marias e
pontos. O backend roda no Cloudflare Workers, com banco D1.

## Onde fica cada coisa

| Quero mexer em... | Arquivo |
|---|---|
| Texto, títulos e a estrutura da página | `public/index.html` |
| Cores, tamanhos e layout principal | `public/css/estilo.css` |
| Ajustes extras (contas, abas, botões) | `public/css/estilo-extra.css` |
| Fontes embutidas (arquivo pesado, não precisa editar) | `public/css/fontes.css` |
| Contador de Ave-Marias, pontuação e calendário | `public/js/04-contador-do-terco.js` |
| Loja de contas, pontos e login da conta | `public/js/05-pontos-contas-conta.js` |
| Abas dos mistérios | `public/js/03-abas-misterios.js` |
| Busca e acesso à conta | `public/js/06-busca-e-acesso.js` |
| Meditações e leitura | `public/js/07-meditacoes.js` |
| Painel de aparência (tema, letra) | `public/js/08-aparencia.js` |
| Modo de reza | `public/js/09-modo-reza.js` |
| Contador de visitas | `public/js/10-contador-visitas.js` |
| Compartilhar e letras maiores | `public/js/11-compartilhar-letras.js` |
| Navegação e modo guiado | `public/js/12-navegacao-modo-guiado.js` |
| Família visual (estilo do site) | `public/js/13-familia-visual.js` |
| Painel do administrador (dia especial) | `public/js/14-admin.js` |
| Tema e família salvos ao abrir a página | `public/js/inicio-tema.js`, `public/js/inicio-familia.js` |
| Cache para funcionar offline | `public/sw.js` (aumente a versão `V` ao mudar arquivos) |

Os nomes dos arquivos `js/` seguem a ordem em que aparecem na página. Quando um
arquivo mexe com mais de um assunto, a tabela acima indica o principal.

### Backend (pasta `src/`)

| Quero mexer em... | Arquivo |
|---|---|
| Lista de rotas `/api/...` | `src/index.js` |
| Cadastro, login, sair, trocar senha, excluir conta, bloqueio de tentativas | `src/conta.js` |
| Senhas (criptografia, regras, senha gerada) | `src/seguranca.js` |
| Progresso salvo e contador de visitas | `src/dados.js` |
| Dia especial e painel de administrador | `src/admin.js` |
| Resposta JSON padrão | `src/util.js` |

### Banco e configuração

- `schema.sql`: tabelas do banco. Rode no console do D1 (veja o GUIA).
- `wrangler.toml`: configuração do Cloudflare (banco, rate limit, assets). É o único arquivo de configuração.

## Dia especial dos pontos

O administrador escolhe, no painel no fim da página, o dia em que todos ganham
pontos em qualquer conjunto de mistérios. O padrão é sábado. Os textos do site
se atualizam sozinhos. A escolha fica salva no banco (tabela `config`).

## Para um administrador

Torne a conta admin com:

```sql
UPDATE users SET is_admin = 1 WHERE usuario = 'seu_usuario';
```

## Importante

- Nunca suba `.dev.vars` ou arquivos com senhas. O `.gitignore` já impede isso.
- Ao mudar qualquer arquivo de `public/`, aumente a versão em `public/sw.js`.
