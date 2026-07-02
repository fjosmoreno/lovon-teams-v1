# Deploy Lovon Teams V1.0 — Passo a Passo

## 1. Criar repo no GitHub

Vai em https://github.com/new e cria um repo novo:
- **Nome:** `lovon-teams-v1` (ou o que você preferir)
- **Visibilidade:** Public ou Private (sua escolha)
- **Não** inicializa com README, .gitignore, ou license (o código já tem tudo)

## 2. Subir o código

No terminal, dentro da pasta `extracted/`:

```bash
cd "/Users/fernandomoreno/Desktop/LOVON TEANS V1.0/extracted"

# Confirma que tá tudo commitado
git add -A
git commit -m "lovon teams v1.0 - deploy ready"

# Adiciona o remote (substitui SEU_USUARIO pelo teu user do GitHub)
git remote add origin https://github.com/SEU_USUARIO/lovon-teams-v1.git

# Push
git push -u origin main
```

Se o push pedir autenticação, usa um **Personal Access Token** (não senha):
- Cria em https://github.com/settings/tokens/new
- Escopo: `repo` (full control)
- Usa o token como senha

## 3. Deploy no Render

1. Cria conta em https://render.com (pode entrar com GitHub — sem cartão)
2. No dashboard, clica em **"New +"** → **"Blueprint"**
3. Conecta o repo `lovon-teams-v1`
4. Render detecta o `render.yaml` automaticamente
5. Configura as env vars (em "Environment"):
   - `RESEND_API_KEY` = `re_xxx_your_key` (opcional, sem isso emails não funcionam)
6. Clica **"Apply"** → Render faz build + deploy
7. Em ~5 min, Render te dá uma URL tipo `https://lovon-teams-v1.onrender.com`

## 4. Testar

Abre a URL no browser. Espera a primeira request (~30s no free tier, é cold start).

Fluxo de teste:
1. ✅ Landing carrega
2. ✅ Clica "Começar" → tela de auth
3. ✅ Faz signup (email/senha) → vai pro dashboard
4. ✅ Tela principal mostra o Lovon CEO + departamentos
5. ✅ Cria uma task manual (sem LLM)
6. ✅ Bloqueia a task com blocker "CAPABILITY_NOT_CONFIGURED"
7. ✅ Vê o modal "Why Blocked?"
8. ✅ Testa reset workspace (settings → danger zone)
9. ✅ Testa meeting mode

## 5. Limitações conhecidas (free tier)

- **Cold start de ~30s** na primeira request depois de 15min ocioso
- **SQLite efêmero**: users cadastrados somem quando o service hiberna
  - **Workaround**: cada teste, faça signup de novo
  - **Dados do workspace** (tasks, agents, work products) ficam no browser (Zustand + localStorage) e não somem
- **Sem LLM por padrão**: agentes usam plano keyword-based fallback
  - **Pra ativar LLM**: configura `.z-ai-config` com baseUrl + apiKey
- **Sem email real**: Email Agent só funciona com RESEND_API_KEY configurada

## 6. Quando quiser migrar pra produção

- Plano paid do Render ($7/mês) → persistent disk → SQLite persistente
- OU migrar pra Postgres (Neon free tier) → alterar schema.prisma provider + gerar migration
- Adicionar `.z-ai-config` real → agentes ficam autônomos
- Adicionar `RESEND_API_KEY` real → emails funcionam

## 7. Estrutura do ZIP

O ZIP vai ter:
```
lovon-teams-v1-deploy.zip
├── README.md                    # documentação
├── DEPLOY.md                    # este arquivo
├── render.yaml                  # Render Blueprint
├── .env.example                 # template de env vars
├── package.json                 # deps + scripts
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── components.json
├── eslint.config.mjs
├── Caddyfile                    # (ignorado no Render, fica pra self-host)
├── prisma/
│   ├── schema.prisma
│   └── db/                      # custom.db (vazio, criado em runtime)
├── public/                      # assets
├── scripts/                     # smoke tests
├── src/                         # código
├── packages/                    # (vazio ou ignorado)
├── .zscripts/                   # (ignorado)
└── ...
```

**NÃO commitado:**
- `.env` (vai pra .gitignore)
- `node_modules/`
- `.next/`
- `bun.lock` (tá commitado, mas é opcional)
- `db/custom.db` real (vazio no repo)
