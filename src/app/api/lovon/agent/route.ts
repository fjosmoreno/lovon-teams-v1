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
      const correlationId = `ceo-plan-${Date.now()}`;
      const llmResult = await executeLLMWithInfra(
        {
          systemPrompt,
          userPrompt,
          correlationId,
          provider: (providerConfig?.provider as string) ?? "openai-compatible",
          model: providerConfig?.model ?? model ?? "default",
        },
        providerConfig
      );

      if (!llmResult.success) {
        return NextResponse.json({
          success: false,
          error: `LLM falhou após ${llmResult.attempts} tentativas: ${llmResult.error}`,
          errorCode: llmResult.errorCode,
          correlationId,
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
    const correlationId = `worker-${agentName.replace(/\s/g, "-")}-${Date.now()}`;
    const llmResult = await executeLLMWithInfra(
      {
        systemPrompt,
        userPrompt: finalUserPrompt,
        correlationId,
        provider: (providerConfig?.provider as string) ?? "openai-compatible",
        model: providerConfig?.model ?? model ?? "default",
      },
      providerConfig
    );

    if (!llmResult.success) {
      return NextResponse.json({
        success: false,
        error: `LLM falhou após ${llmResult.attempts} tentativas: ${llmResult.error}`,
        errorCode: llmResult.errorCode,
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
