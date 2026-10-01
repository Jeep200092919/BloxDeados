# BloxDeados

Site estático (`index.html`) publicado pelo GitHub Pages em `bloxdeados.com` (arquivo `CNAME`).

## Publicar no GitHub Pages

1. No repositório: **Settings → Pages**.
2. Em **Build and deployment**, escolha **Deploy from a branch**, a branch com o site e a pasta `/ (root)`.
3. Em **Custom domain**, informe `bloxdeados.com` e marque **Enforce HTTPS** quando liberar.

Sem o domínio, o site fica em `https://jeep200092919.github.io/bloxdeados/`.

## Domínio

O domínio precisa ser registrado por você num registrador. No painel de DNS, crie:

| Tipo  | Nome | Valor |
|-------|------|-------|
| A     | @    | 185.199.108.153 |
| A     | @    | 185.199.109.153 |
| A     | @    | 185.199.110.153 |
| A     | @    | 185.199.111.153 |
| CNAME | www  | jeep200092919.github.io |

Confira os IPs atuais em https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site

## Chat de IA (opcional)

Sem configuração, o chat responde com informações fixas da loja (função `localReply` em `index.html`).
Para usar IA de verdade, a chave da API precisa ficar num servidor, nunca no HTML:

```bash
cd worker
npx wrangler login
npx wrangler secret put GEMINI_API_KEY   # cole a chave do Google AI Studio
npx wrangler deploy
```

Copie a URL que o deploy mostrar (`https://bloxdeados-chat.<conta>.workers.dev`) e cole na constante
`AI_ENDPOINT` no topo do script em `index.html`. Se o proxy falhar, o chat volta às respostas fixas.

Pontos de atenção:
- `GEMINI_MODEL` em `worker/wrangler.toml` é editável. Confirme que o modelo existe na sua conta.
- O worker só aceita requisições das origens em `ALLOWED_ORIGINS`.
- Não há limite de requisições por visitante. Defina um limite de gasto na conta do Google e, se houver abuso, ative rate limiting no Cloudflare.
