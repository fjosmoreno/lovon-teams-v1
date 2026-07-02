import { NextRequest, NextResponse } from "next/server";
import { buildPrompt, retrieveKB, CompanyConfig, AgentRoleConfig, KBDocument } from "@/lib/lovon/promptBuilder";
import {
  enforceCompanyCore,
  checkPromptInjection,
  runEnforcementChecks,
  validateDefinitionOfDone,
  TERMS_GLOSSARY,
} from "@/lib/lovon/enforcement";
import { executeLLMWithInfra } from "@/lib/lovon/llm-infrastructure";
import { detectEmailRequirement } from "@/lib/lovon/taskRouter";

export const runtime = "nodejs";
export const maxDuration = 30;

interface AgentRequest {
  agentName: string;
  agentRole: string;
  department?: string;
  specialty: string;
  model?: string;
  mission: string;
  taskTitle: string;
  taskDescription: string;
  companyName?: string;
  mode?: "execute" | "plan";

  // 4-Layer Prompt inputs
  companyConfig?: CompanyConfig | null;
  agentRoleConfig?: AgentRoleConfig | null;
  knowledgeBase?: KBDocument[];

  // Enforcement inputs
  acceptanceCriteria?: string[];
  hasSubtasks?: boolean;
  hasComment?: boolean;
  // P0 — Expected work products (hard gate)
  expectedWorkProducts?: import("@/lib/lovon/store").ExpectedWorkProducts;

  // Per-user LLM provider override (from Zustand store integrations)
  providerConfig?: { baseUrl?: string; apiKey?: string; model?: string; provider?: string };
}

const SYSTEM_PROMPT_CEO_PLAN_BASE = `Você é o CEO de uma empresa operando na plataforma Lovon Teams. Sua função é analisar uma missão estratégica e planejar a execução.

REGRAS:
- Responda SEMPRE em português brasileiro.
- Responda APENAS com JSON válido, sem texto adicional.
- Identifique quais departamentos da empresa devem ser ativados para esta missão.
- Para cada departamento, defina UMA subtask específica e acionável.
- Hoje é {{CURRENT_DATE}}. Não invente datas passadas.
- Não invente versões de produto, releases ou ferramentas como já integradas.
- Sugira ferramentas como opções, não como fatos.

IMPORTANTE: O CEO NUNCA implementa diretamente. Ele sempre:
1. Extrai TODOS os requisitos explícitos da missão (content, actions, reporting)
2. Cria subtasks com acceptance criteria cobrindo cada requisito
3. Delega para outros agentes (heads/workers)
4. Registra comentário explicativo na task

MISSION COMPLETION RULE (HARD):
- Antes de finalizar, liste TODOS os requisitos da missão original.
- Cada requisito DEVE ter uma subtask correspondente.
- Se um requisito depende de uma capability (ex: email_send), inclua no campo requiresCapability.
- Se um requisito não pode ser atendido (capability indisponível), marque como "blocked" com motivo.
- NUNCA marque a missão como "Concluída" se houver requisito pendente.

Departamentos disponíveis (use exatamente estes IDs):
- sales (Vendas) — prospecção, pipeline, receita, clientes
- marketing (Marketing) — marca, conteúdo, campanhas, social
- engineering (Engenharia) — produto, código, tech, infra
- research (Pesquisa) — análise, dados, mercado, concorrentes
- support (Suporte) — atendimento, tickets, satisfação
- ops (Operações) — processos, automação, workflow

FORMATO DE RESPOSTA (JSON estrito):
{
  "analysis": "string — 2-3 frases analisando a missão",
  "missionRequirements": [
    {
      "id": "req-1",
      "description": "string — o que precisa ser feito",
      "type": "content|quality_check|action|action_detail|reporting",
      "requiresCapability": "string|null"
    }
  ],
  "departments": ["sales", "marketing", ...],
  "subtasks": [
    {
      "departmentId": "sales",
      "title": "string — título curto da task (máx 60 chars)",
      "description": "string — descrição detalhada do que deve ser feito (máx 200 chars)",
      "acceptanceCriteria": ["string", "string"],
      "requirementIds": ["req-1"]
    }
  ]
}

Inclua entre 2 e 5 departamentos. Cada departamento deve ter exatamente 1 subtask. Cada subtask deve ter 2-3 acceptance criteria. Cada subtask deve referenciar pelo menos 1 requirementId.

${TERMS_GLOSSARY}`;

function getCurrentDate(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
}

// === P0: Lovon House Keys — anti-rate-limit for the whole platform ===
// The deployer (Fernando) can set multiple free-tier API keys as Render env vars.
// The route rotates through them transparently, so users get N× the rate limit
// (4 keys = 4× the per-minute quota). User-supplied keys (from providerConfig)
// are tried FIRST; house keys are FALLBACK when the user has none or theirs hit 429.
//
// Env var format (JSON-encoded list):
// LOVON_HOUSE_KEYS=[
//   {"name":"groq-1","provider":"groq","baseUrl":"https://api.groq.com/openai/v1","apiKey":"gsk_...","model":"llama-3.3-70b-versatile"},
//   {"name":"openrouter","provider":"openrouter","baseUrl":"https://openrouter.ai/api/v1","apiKey":"sk-or-v1-...","model":"google/gemma-2-9b-it:free"},
//   {"name":"nvidia","provider":"nvidia","baseUrl":"https://integrate.api.nvidia.com/v1","apiKey":"nvapi-...","model":"meta/llama-3.1-70b-instruct"}
// ]
interface HouseKey {
  name: string;
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

let cachedHouseKeys: HouseKey[] | null = null;

function getHouseKeys(): HouseKey[] {
  if (cachedHouseKeys !== null) return cachedHouseKeys;
  try {
    const raw = process.env.LOVON_HOUSE_KEYS;
    if (!raw) {
      cachedHouseKeys = [];
      return cachedHouseKeys;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      cachedHouseKeys = [];
      return cachedHouseKeys;
    }
    // Validate each entry has required fields
    cachedHouseKeys = parsed.filter(
      (k) => k && typeof k.baseUrl === "string" && typeof k.apiKey === "string" && typeof k.model === "string"
    );
    console.log(`[house-keys] loaded ${cachedHouseKeys.length} Lovon house keys`);
    return cachedHouseKeys;
  } catch (err) {
    console.warn("[house-keys] failed to parse LOVON_HOUSE_KEYS env var:", err);
    cachedHouseKeys = [];
    return cachedHouseKeys;
  }
}

// === Try user's provider first, then rotate through house keys ===
// Returns the LLM result from the first successful provider.
// This is the SINGLE entry point for ALL LLM calls in the route.
async function callLLMWithRotation(
  baseParams: { systemPrompt: string; userPrompt: string; correlationId: string },
  userProvider: { baseUrl?: string; apiKey?: string; model?: string; provider?: string } | null
): Promise<Awaited<ReturnType<typeof executeLLMWithInfra>> & { providerUsed: string; keySource: "user" | "house" }> {
  const houseKeys = getHouseKeys();
  // Build candidate list: user first, then house keys
  const candidates: Array<{ config: { baseUrl: string; apiKey: string; model: string; provider: string }; source: "user" | "house"; name: string }> = [];

  if (userProvider?.baseUrl && userProvider?.apiKey) {
    candidates.push({
      config: {
        baseUrl: userProvider.baseUrl,
        apiKey: userProvider.apiKey,
        model: userProvider.model ?? "default",
        provider: userProvider.provider ?? "user",
      },
      source: "user",
      name: userProvider.provider ?? "user-key",
    });
  }

  for (const hk of houseKeys) {
    candidates.push({
      config: {
        baseUrl: hk.baseUrl,
        apiKey: hk.apiKey,
        model: hk.model,
        provider: hk.provider,
      },
      source: "house",
      name: hk.name,
    });
  }

  if (candidates.length === 0) {
    return {
      success: false,
      content: "",
      tokensIn: 0,
      tokensOut: 0,
      latencyMs: 0,
      attempts: 0,
      error: "Nenhum provider LLM configurado. Adicione uma key em Integrações ou peça ao deployer para configurar LOVON_HOUSE_KEYS.",
      errorCode: "NO_PROVIDER",
      providerUsed: "none",
      keySource: "user",
    };
  }

  // Try each candidate; stop on first success
  const allErrors: string[] = [];
  for (const candidate of candidates) {
    try {
      const result = await executeLLMWithInfra(
        {
          systemPrompt: baseParams.systemPrompt,
          userPrompt: baseParams.userPrompt,
          correlationId: `${baseParams.correlationId}:${candidate.name}`,
          provider: candidate.config.provider,
          model: candidate.config.model,
        },
        candidate.config
      );
      if (result.success) {
        return { ...result, providerUsed: candidate.name, keySource: candidate.source };
      }
      // Non-retryable or exhausted retries: log and continue
      allErrors.push(`${candidate.name}: ${result.error ?? "unknown"}`);
      console.warn(`[house-keys] ${candidate.name} failed: ${result.error ?? "unknown"} (continuing to next)`);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "unknown";
      allErrors.push(`${candidate.name}: ${errMsg}`);
      console.warn(`[house-keys] ${candidate.name} threw: ${errMsg} (continuing to next)`);
    }
  }

  // All candidates failed
  return {
    success: false,
    content: "",
    tokensIn: 0,
    tokensOut: 0,
    latencyMs: 0,
    attempts: candidates.length,
    error: `Todos os ${candidates.length} provedores falharam:\n${allErrors.join("\n")}`,
    errorCode: "ALL_FAILED",
    providerUsed: "none",
    keySource: "user",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AgentRequest;
    const {
      agentName,
      agentRole,
      department,
      specialty,
      model,
      mission,
      taskTitle,
      taskDescription,
      companyName,
      mode = "execute",
      companyConfig,
      agentRoleConfig,
      knowledgeBase = [],
      acceptanceCriteria = [],
      hasSubtasks = false,
      hasComment = false,
      expectedWorkProducts,
      providerConfig, // NEW: { baseUrl, apiKey, model? } — per-user LLM provider
    } = body;

    if (!agentName || !taskTitle) {
      return NextResponse.json(
        { error: "agentName e taskTitle são obrigatórios" },
        { status: 400 }
      );
    }

    // === ENFORCEMENT 1: Company Core é OBRIGATÓRIO ===
    // Nenhum agente executa sem o DNA da empresa configurado.
    let enforcedConfig: CompanyConfig;
    try {
      enforcedConfig = enforceCompanyCore(companyConfig);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Company Core ausente";
      console.error("[enforcement] BLOCKED:", errorMsg);
      return NextResponse.json(
        {
          success: false,
          error: errorMsg,
          blocked: true,
          enforcement: "company_core_required",
        },
        { status: 403 }
      );
    }

    const currentDate = getCurrentDate();

    // === ENFORCEMENT 4: Anti-injection check on KB docs ===
    const sanitizedKB: KBDocument[] = knowledgeBase.map((doc) => {
      const injectionCheck = checkPromptInjection(doc.content);
      return {
        ...doc,
        content: injectionCheck.sanitizedContent,
      };
    });

    if (mode === "plan") {
      // CEO planning mode — return JSON
      // CEO sempre recebe Company Core + Terms Glossary
      const companyCoreSection = `\n\nCONTEXTO DA EMPRESA (use para planejar):
- Segmento: ${enforcedConfig.industry || "a definir"}
- Produto: ${enforcedConfig.productSummary || "a definir"}
- Público: ${enforcedConfig.targetAudience || "a definir"}
- Proposta de valor: ${enforcedConfig.valueProposition || "a definir"}
- Tom: ${enforcedConfig.tone || "direto, profissional"}
- Objetivos: ${enforcedConfig.defaultGoals || "a definir"}
- Autonomia: Nível ${enforcedConfig.autonomyLevel}
- Regras: ${enforcedConfig.rules.length} regras não-negociáveis ativas

${TERMS_GLOSSARY}`;

      const systemPrompt = SYSTEM_PROMPT_CEO_PLAN_BASE.replace(/\{\{CURRENT_DATE\}\}/g, currentDate) + companyCoreSection;
      const userPrompt = `MISSÃO DA EMPRESA: ${mission}

DATA DE HOJE: ${currentDate}

Analise esta missão e planeje a execução. Retorne o JSON conforme especificado. Não invente datas passadas.`;

      // === LLM call with retry + backoff + circuit breaker + queue ===
      // P0: Try user's provider first, then rotate through Lovon house keys.
      const correlationId = `ceo-plan-${Date.now()}`;
      const llmResult = await callLLMWithRotation(
        { systemPrompt, userPrompt, correlationId },
        providerConfig
      );

      if (!llmResult.success) {
        return NextResponse.json({
          success: false,
          error: `LLM falhou após ${llmResult.attempts} tentativas: ${llmResult.error}`,
          errorCode: llmResult.errorCode,
          correlationId,
          providerUsed: llmResult.providerUsed,
          infra: { attempts: llmResult.attempts, latencyMs: llmResult.latencyMs },
        }, { status: 502 });
      }

      const raw = llmResult.content;

      // Try to parse JSON (handle code fences)
      let parsed: unknown = null;
      try {
        const cleaned = raw
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim();
        parsed = JSON.parse(cleaned);
      } catch {
        return NextResponse.json({
          success: false,
          raw,
          error: "Falha ao parsear JSON do CEO",
        });
      }

      return NextResponse.json({ success: true, plan: parsed });
    }

    // === Worker execution mode ===

    // Camada D: Retrieve KB docs relevant to the task (using sanitized KB)
    const retrievedDocs = retrieveKB(sanitizedKB, taskTitle, taskDescription, mission, 3);

    // === ENFORCEMENT: Run full enforcement checks ===
    const enforcementResult = runEnforcementChecks({
      companyConfig: enforcedConfig,
      agentRole,
      taskTitle,
      hasSubtasks,
      hasComment,
      autonomyLevel: enforcedConfig.autonomyLevel,
      retrievedDocs,
    });

    if (!enforcementResult.allowed) {
      console.error("[enforcement] BLOCKED:", enforcementResult.errors);
      return NextResponse.json(
        {
          success: false,
          error: "Execução bloqueada pelo enforcement layer.",
          blocked: true,
          enforcementErrors: enforcementResult.errors,
          warnings: enforcementResult.warnings,
        },
        { status: 403 }
      );
    }

    // Build the 4-layer prompt (Company Core is ALWAYS included via enforcedConfig)
    const { systemPrompt, userPrompt } = buildPrompt({
      companyConfig: enforcedConfig, // guaranteed non-null by enforcement
      companyName: companyName || "Lovon Teams",
      agentRoleConfig: agentRoleConfig ?? undefined,
      agentName,
      agentRole,
      department,
      specialty,
      model: model || "—",
      taskTitle,
      taskDescription,
      mission,
      currentDate,
      retrievedDocs,
    });

    // === EMAIL AGENT GUIDANCE ===
    const requiresEmail = detectEmailRequirement(taskTitle, taskDescription);
    let finalUserPrompt = requiresEmail
      ? `${userPrompt}

=== EMAIL AGENT — INSTRUÇÕES OBRIGATÓRIAS ===
Esta task exige envio real de email via Resend. Sua conclusão NÃO encerra a task — o disparo só é confirmado quando o provedor retorna um Message ID.

Antes de redigir o email:
1. Consulte o contexto da Knowledge Base (acima) para citar dados reais (preços, diferenciais, missão). NUNCA invente números.
2. Identifique o destinatário. Se a task não informar um email válido, NÃO emita o bloco abaixo — termine com a linha:
   [EMAIL_BLOCKED: destinatário não identificado]

Ao final da sua resposta, emita EXATAMENTE este bloco (sem cercas de código, sem markdown extra):

>>>EMAIL_TO: destinatario@example.com
>>>EMAIL_SUBJECT: Assunto do email
>>>EMAIL_BODY:
Corpo do email em texto puro.
Múltiplas linhas são permitidas.

— Assinatura
<<<END_EMAIL_BODY

Regras do bloco:
- >>>EMAIL_TO: deve conter UM endereço de email válido (o destinatário).
- >>>EMAIL_SUBJECT: UMA linha, máx 998 caracteres.
- >>>EMAIL_BODY: corpo em texto puro (o motor converte \\n em <br>).
- <<<END_EMAIL_BODY: marca o fim. Nada após esta linha entra no email.
- O bloco DEVE ser a ÚLTIMA coisa da sua resposta. Qualquer análise ou raciocínio vai ANTES do bloco.

Lembre-se: a task só será marcada como concluída se o Resend retornar um Message ID válido. Escrever bem o email é só 30% do trabalho.`
      : userPrompt;

    // === P0: WORK PRODUCTS INSTRUCTIONS ===
    // If the task has expectedWorkProducts, inject instructions telling the agent
    // to PRODUCE real work products (not just describe them in text).
    if (expectedWorkProducts) {
      const wpList = Object.entries(expectedWorkProducts)
        .map(([type, count]) => {
          const c = typeof count === "number" ? `${count}` : `${count.min}-${count.max ?? "+"}`;
          return `- ${type}: ${c}`;
        })
        .join("\n");

      finalUserPrompt = `${finalUserPrompt}

=== WORK PRODUCTS — OBRIGATÓRIO ===
Esta task exige que você CRIE work products reais (artefatos estruturados). A task NÃO será marcada como concluída se você apenas escrever um relatório descrevendo o que faria. Você deve PRODUZIR os artefatos.

Work products esperados:
${wpList}

COMO CRIAR WORK PRODUCTS:
Ao final da sua resposta, emita um bloco JSON para CADA work product que você está criando. Use o formato:

>>>WORK_PRODUCT: campaign_brief
\`\`\`json
{
  "meta": { "id": "wp_brief_1", "type": "campaign_brief", "version": "1.0", "status": "draft", "createdAt": "2026-07-01T12:00:00Z", "createdBy": { "kind": "agent", "agentSlug": "marketing-worker" }, "tags": [] },
  "name": "Nome da Campanha",
  "priority": "high",
  "objective": "Objetivo claro da campanha",
  "kpis": [{ "name": "Leads", "target": "50" }],
  "audience": { "icpName": "SaaS B2B", "painPoints": ["dor1"], "objections": ["obj1"] },
  "valueProposition": { "oneLiner": "Frase de valor", "proofPoints": ["prova1"], "differentiators": ["diferencial1"] },
  "offer": { "primaryCTA": "Começar grátis" },
  "positioning": { "tone": "profissional", "keyMessages": ["mensagem1"] },
  "channels": ["linkedin"]
}
\`\`\`
<<<END_WORK_PRODUCT

Para social_post_card:
>>>WORK_PRODUCT: social_post_card
\`\`\`json
{
  "meta": { "id": "wp_card_1", "type": "social_post_card", "version": "1.0", "status": "draft", "createdAt": "2026-07-01T12:00:00Z", "createdBy": { "kind": "agent", "agentSlug": "marketing-worker" }, "tags": [] },
  "campaignBriefId": "wp_brief_1",
  "channel": "linkedin",
  "format": "text_only",
  "title": "Título do post",
  "hook": "Hook chamativo",
  "body": "Corpo do post com conteúdo real",
  "cta": "Call to action",
  "hashtags": ["#lovon", "#ai"]
}
\`\`\`
<<<END_WORK_PRODUCT

Regras CRÍTICAS:
1. Você DEVE emitir um bloco >>>WORK_PRODUCT para CADA artefato esperado.
2. O JSON deve ser válido e completo — não abrevie.
3. NÃO escreva "criei um briefing" sem emitir o bloco JSON. O sistema valida a EXISTÊNCIA do artefato, não a sua descrição textual.
4. Se você não conseguir criar o artefato, explique por quê NÃO emita o bloco — a task ficará bloqueada com MISSING_WORK_PRODUCTS.
5. O conteúdo dos work products deve ser REAL — preencha todos os campos com dados da empresa (use a Knowledge Base acima).`;
    }

    // === LLM call with retry + backoff + circuit breaker + queue ===
    // P0: Try user's provider first, then rotate through Lovon house keys.
    const correlationId = `worker-${agentName.replace(/\s/g, "-")}-${Date.now()}`;
    const llmResult = await callLLMWithRotation(
      { systemPrompt, userPrompt: finalUserPrompt, correlationId },
      providerConfig
    );

    if (!llmResult.success) {
      return NextResponse.json({
        success: false,
        error: `LLM falhou após ${llmResult.attempts} tentativas: ${llmResult.error}`,
        errorCode: llmResult.errorCode,
        providerUsed: llmResult.providerUsed,
        correlationId,
        infra: {
          attempts: llmResult.attempts,
          latencyMs: llmResult.latencyMs,
          queueStatus: "check logs",
        },
      }, { status: 502 });
    }

    const conclusion = llmResult.content;

    if (!conclusion.trim()) {
      return NextResponse.json(
        { success: false, error: "LLM retornou resposta vazia após retries", correlationId },
        { status: 500 }
      );
    }

    // Post-validation: detect past dates
    const pastDatePattern = /(\d{1,2})\/(\d{1,2})\/202[0-4]/g;
    const pastDates = conclusion.match(pastDatePattern);
    const validatedConclusion = pastDates
      ? conclusion.replace(pastDatePattern, "[data ajustada para o futuro]")
      : conclusion;

    // === ENFORCEMENT 3: Validate Definition of Done ===
    const dodResult = validateDefinitionOfDone(validatedConclusion, acceptanceCriteria);

    return NextResponse.json({
      success: true,
      conclusion: validatedConclusion,
      tokens: conclusion.length,
      generatedAt: new Date().toISOString(),
      correlationId,
      retrievedDocs: retrievedDocs.map((d) => ({ id: d.id, title: d.title, category: d.category })),
      requiresEmail,
      enforcement: {
        companyCoreVersion: enforcedConfig.version,
        autonomyLevel: enforcedConfig.autonomyLevel,
        warnings: enforcementResult.warnings,
        dodValidation: dodResult,
      },
      infra: {
        attempts: llmResult.attempts,
        latencyMs: llmResult.latencyMs,
        tokensIn: llmResult.tokensIn,
        tokensOut: llmResult.tokensOut,
        fallbackUsed: llmResult.fallbackUsed ?? false,
      },
      warnings: pastDates
        ? { pastDatesDetected: pastDates, message: "Datas passadas foram detectadas e substituídas." }
        : undefined,
    });
  } catch (err) {
    console.error("[/api/lovon/agent] error:", err);
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
