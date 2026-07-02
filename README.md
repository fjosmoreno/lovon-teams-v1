# Lovon Teams V1.0

Plataforma de orquestração de agentes IA com governança, blockers estruturados, work products, smart routing, e meeting mode.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Prisma + SQLite** (auth)
- **Zustand** (workspace state, persistido em localStorage)
- **Tailwind v4** + Framer Motion
- **Z.AI SDK** (LLM, opcional — app cai pra plano keyword-based se não configurado)
- **Resend** (Email Agent, opcional)

## Features

- ✅ Auth (signup/login com bcrypt + cookie session)
- ✅ Org chart, agentes, departamentos
- ✅ Tasks com **blockers estruturados** (CAPABILITY_NOT_CONFIGURED, MISSING_REQUIRED_ARTIFACT, etc.)
- ✅ **Why Blocked?** modal com explicação + ação necessária
- ✅ **Work products** persistidos (campaign_brief, content_plan, social_post_card, creative_asset)
- ✅ **Mission requirements** + Definition of Done enforcement
- ✅ **Email Agent** via Resend com receipts
- ✅ **Smart routing** de AI (allowlist + cascade)
- ✅ **Heartbeat** + Signals + Initiative generator
- ✅ **Action items → subtasks** automático
- ✅ **Meeting Mode** (CEO + convidados)
- ✅ **Reset Workspace** por generation
- ✅ **Dynamic hiring** (Paperclip-like, com headcount limits)
- ✅ 11 skills: lovon-heartbeat, marketing-campaign-generator, email-resend, web-research, etc.

## Dev local

```bash
bun install
cp .env.example .env  # editar com suas keys
bun run db:push
bun run dev
```

Abre em `http://localhost:3000`.

## Deploy

### Render (free tier)

1. Cria conta em https://render.com (sem cartão)
2. Conecta o repo GitHub
3. Clica em "New Blueprint" → aponta pra `render.yaml`
4. Adiciona `RESEND_API_KEY` no dashboard (opcional, pra emails)
5. Deploy

**Atenção:** SQLite no Render free tier é efêmero (sem persistent disk). Os users cadastrados somem quando o service hiberna (depois de 15min ocioso no free tier). Os dados do workspace (tasks, agents, work products) ficam no browser (Zustand + localStorage) e não somem.

Pra persistência real no Render:
- Plano paid ($7/mês) com persistent disk, OU
- Migrar pra Postgres (Neon free tier, Vercel Postgres, etc.)

### Variáveis de ambiente

| Var | Default | Descrição |
|---|---|---|
| `DATABASE_URL` | `file:./db/custom.db` | Path do SQLite |
| `RESEND_API_KEY` | - | API key do Resend (Email Agent) |
| `RESEND_FROM_EMAIL` | `onboarding@resend.dev` | Remetente padrão |
| `RESEND_FROM_NAME` | `Lovon Teams` | Nome do remetente |

### Z.AI (LLM opcional)

Cria `.z-ai-config` na raiz do projeto (ou `~/.z-ai-config`):
```json
{
  "baseUrl": "https://api.z-ai.example/v1",
  "apiKey": "your-z-ai-key"
}
```

Sem essa config, agentes usam **plano fallback** baseado em keywords — funciona, mas não gera conteúdo novo.

## Estrutura

```
src/
  app/                    # Next.js App Router
    api/                  # API routes (auth + lovon engine)
    layout.tsx            # Root layout
    page.tsx              # Landing + Dashboard
  components/
    auth/                 # AuthScreen
    dashboard/views/     # 32 views (Tasks, OrgChart, EmailAgent, etc.)
    landing/              # Marketing landing
    ui/                   # shadcn/ui primitives
  lib/
    db.ts                 # Prisma client
    lovon/
      store.ts            # Zustand store (5570 lines, todo o workspace state)
      engine.ts           # CEO planning + agent execution
      taskRouter.ts       # Task routing
      blockerClassifier.ts # Blocker code system
      work-products.ts    # Work product schemas
      enforcement.ts      # Definition of Done + company core prompt
      emailSendCapability.ts # Resend wrapper
      llm-infrastructure/ # Retry + circuit breaker + concurrency
      agent-engine/       # Engine types
      promptBuilder.ts    # 4-layer prompt architecture
      AuthContext.tsx     # React auth context
  prisma/
    schema.prisma         # User model
```

## Testes

Cada feature tem um smoke test em `scripts/`:
- `test-blockers.ts`
- `test-heartbeat.ts`
- `test-integrations-and-bindings.ts`
- `test-meeting-mode.ts`
- `test-reset-workspace.ts`
- `test-action-items-and-work-products.ts`
- `test-dynamic-hiring.ts`
- `test-enforcement.ts`
- `test-in-review-and-idempotency.ts`

Roda com `npx tsx scripts/test-NAME.ts`.

## Licença

MIT
