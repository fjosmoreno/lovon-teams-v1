// Lovon orchestration engine
// Real LLM-powered: CEO plans via /api/lovon/agent (mode=plan),
// workers execute via /api/lovon/agent (mode=execute).

import {
  useLovonStore,
  Agent,
  Accent,
} from "./store";
import { DEPARTMENT_TEMPLATES, DepartmentTemplate } from "./data";
import { detectEmailRequirement, ensureEmailAgent, routeTask } from "./taskRouter";

const uid = (prefix = "id") =>
  `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;

interface PlannedSubtask {
  departmentId: string;
  title: string;
  description: string;
  acceptanceCriteria?: string[];
  requirementIds?: string[];
}

interface PlannedRequirement {
  id: string;
  description: string;
  type: "content" | "quality_check" | "action" | "action_detail" | "reporting";
  requiresCapability?: string | null;
}

interface CEOPlan {
  analysis: string;
  missionRequirements?: PlannedRequirement[];
  departments: string[];
  subtasks: PlannedSubtask[];
}

async function callAgentAPI(payload: {
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
  companyConfig?: import("./store").CompanyConfig | null;
  agentRoleConfig?: import("./store").AgentRoleConfig | null;
  knowledgeBase?: import("./store").KBDocument[];
  expectedWorkProducts?: import("./store").ExpectedWorkProducts;
}): Promise<{ success: boolean; conclusion?: string; plan?: CEOPlan; error?: string; raw?: string; retrievedDocs?: { id: string; title: string; category: string }[]; providerUsed?: string }> {
  // Resolve per-user provider config from store.
  // Tries each enabled AI integration in order until one succeeds (fallback chain).
  const providers = resolveProviderConfigForEngine();
  if (providers.length === 0) {
    return { success: false, error: "Nenhum provider LLM configurado. Vá em Configurações → Provedores de IA e adicione pelo menos um." };
  }

  const errors: string[] = [];
  for (const providerConfig of providers) {
    // Surface the attempt in activity feed so user can see the chain in action
    const agentForLog = useLovonStore.getState().agents.find(
      (a) => a.name === payload.agentName
    );
    if (agentForLog) {
      useLovonStore.getState().logActivity({
        agentId: agentForLog.id,
        agentName: agentForLog.name,
        action: "thinking",
        message: `Tentando provider ${providerConfig.provider} (${providerConfig.model ?? "default"})...`,
        accent: "blue",
      });
    }
    try {
      const res = await fetch("/api/lovon/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, providerConfig }),
      });
      const data = await res.json();
      if (data.success) {
        // P0: clear last LLM error on success
        useLovonStore.getState().setLastLLMError(null);
        if (agentForLog) {
          useLovonStore.getState().logActivity({
            agentId: agentForLog.id,
            agentName: agentForLog.name,
            action: "completed",
            message: `✓ Provider ${providerConfig.provider} respondeu com sucesso.`,
            accent: "green",
          });
        }
        return {
          success: true,
          conclusion: data.conclusion,
          plan: data.plan,
          retrievedDocs: data.retrievedDocs,
          providerUsed: providerConfig.provider,
        };
      }
      const errMsg = `${providerConfig.provider}: ${data.error ?? `HTTP ${res.status}`}`;
      errors.push(errMsg);
      if (agentForLog) {
        // Show URL + model so user can see exactly what was sent
        const detail = data.error ?? `HTTP ${res.status}`;
        useLovonStore.getState().logActivity({
          agentId: agentForLog.id,
          agentName: agentForLog.name,
          action: "failed",
          message: `✗ ${providerConfig.provider} → ${providerConfig.model} → ${detail.slice(0, 200)}`,
          accent: "orange",
        });
      }
      console.warn(`[engine] LLM call failed on ${providerConfig.provider}:`, data.error);
      // Continue to next provider in fallback chain
    } catch (err) {
      const message = err instanceof Error ? err.message : "fetch failed";
      errors.push(`${providerConfig.provider}: ${message}`);
      console.warn(`[engine] LLM call threw on ${providerConfig.provider}:`, err);
    }
  }

  // P0: Save last LLM error to store so dashboard banner can show the real error
  useLovonStore.getState().setLastLLMError({
    message: `Todos os ${providers.length} provedores falharam:\n${errors.join("\n")}`,
  });

  return {
    success: false,
    error: `Todos os ${providers.length} provedores falharam:\n${errors.join("\n")}`,
  };
}

// Read per-user LLM providers from the Zustand store.
// Returns ALL enabled AI integrations (in order), each with credentials read from localStorage vault.
// Also appends Render env vars (LOVON_LLM_BASE_URL + LOVON_LLM_API_KEY + LOVON_LLM_MODEL)
// as last-resort fallback if client-side integrations are missing.
// Returns empty array if nothing is configured anywhere.
function resolveProviderConfigForEngine(): Array<{
  baseUrl: string;
  apiKey: string;
  model?: string;
  provider: string;
}> {
  if (typeof window === "undefined") return [];
  try {
    const state = useLovonStore.getState();
    const aiProviders = ["openai", "anthropic", "groq", "openrouter", "deepseek", "gemini"];
    const defaults: Record<string, string> = {
      openai: "https://api.openai.com/v1",
      anthropic: "https://api.anthropic.com/v1",
      groq: "https://api.groq.com/openai/v1",
      openrouter: "https://openrouter.ai/api/v1",
      deepseek: "https://api.deepseek.com/v1",
      gemini: "https://generativelanguage.googleapis.com/v1beta/openai",
    };
    const out: Array<{ baseUrl: string; apiKey: string; model?: string; provider: string }> = [];
    // 1) Client-side integrations (per-user, configurable in Lovon UI)
    for (const integration of state.integrations) {
      if (integration.status !== "active") continue;
      if (!aiProviders.includes(integration.providerKey)) continue;
      const apiKey = window.localStorage.getItem(`vault:integration:${integration.id}`) ?? "";
      if (!apiKey) continue;
      const cfg = integration.config ?? {};
      const baseUrl = (cfg.baseUrl as string | undefined) ?? defaults[integration.providerKey];
      if (!baseUrl) continue;
      const model = (cfg.models as string[] | undefined)?.[0];
      out.push({ baseUrl, apiKey, model, provider: integration.providerKey });
    }
    // 2) Server-side env vars (Render → Environment) as last-resort fallback
    // User can paste a key in Render dashboard → no client-side vault complexity
    if (process.env.LOVON_LLM_BASE_URL && process.env.LOVON_LLM_API_KEY) {
      out.push({
        baseUrl: process.env.LOVON_LLM_BASE_URL.replace(/\/+$/, ""),
        apiKey: process.env.LOVON_LLM_API_KEY,
        model: process.env.LOVON_LLM_MODEL,
        provider: "env-var",
      });
    }
    return out;
  } catch (err) {
    console.warn("[engine] resolveProviderConfigForEngine failed:", err);
    return [];
  }
}

// Map department ID -> DepartmentTemplate (or null for unknown)
function getDeptTemplate(id: string): DepartmentTemplate | undefined {
  return DEPARTMENT_TEMPLATES.find((d) => d.id === id);
}

// Fallback plan if LLM fails — keyword-based
function fallbackPlan(mission: string): CEOPlan {
  const lower = mission.toLowerCase();
  const all = DEPARTMENT_TEMPLATES.filter((d) => d.id !== "executive");
  const matched = all.filter((d) => d.keywords.some((k) => lower.includes(k)));
  const depts = matched.length > 0 ? matched : all.filter((d) => ["sales", "marketing", "engineering"].includes(d.id));

  return {
    analysis: `Análise local (fallback) da missão: "${mission.slice(0, 80)}". Ativando ${depts.length} departamentos.`,
    departments: depts.map((d) => d.id),
    subtasks: depts.map((d) => ({
      departmentId: d.id,
      title: `Executar tarefa de ${d.name}`,
      description: `Trabalhar em: ${mission}`,
    })),
  };
}

// Main entry: run a CEO mission. This orchestrates the entire flow over time
// with REAL LLM calls for both planning and execution.
export async function runCEOMission(mission: string): Promise<void> {
  const store = useLovonStore.getState();
  const ceo = useLovonStore.getState().agents.find((a) => a.role === "ceo");
  if (!ceo) {
    throw new Error("CEO agent não encontrado. Crie a empresa primeiro.");
  }

  const company = useLovonStore.getState().company;

  // 1. CEO thinks
  store.setAgentStatus(ceo.id, "thinking");
  store.logActivity({
    agentId: ceo.id,
    agentName: ceo.name,
    action: "thinking",
    message: `Analisando missão: "${mission}". Solicitando plano de execução ao modelo...`,
    accent: ceo.accent,
  });
  await wait(1200);

  // 2. CEO calls LLM to plan
  const companyConfig = useLovonStore.getState().companyConfig;
  const planResult = await callAgentAPI({
    agentName: ceo.name,
    agentRole: "ceo",
    specialty: ceo.specialty,
    mission,
    taskTitle: "Planejar execução da missão",
    taskDescription: `Analise a missão e identifique quais departamentos ativar e quais subtasks delegar.`,
    companyName: company?.name,
    mode: "plan",
    companyConfig,
  });

  let plan: CEOPlan;
  if (planResult.success && planResult.plan) {
    plan = planResult.plan;
    store.logActivity({
      agentId: ceo.id,
      agentName: ceo.name,
      action: "message",
      message: `Plano gerado via ${planResult.providerUsed ?? "LLM"}. ${plan.subtasks.length} subtasks em ${plan.departments.length} departamentos. Análise: ${plan.analysis.slice(0, 140)}${plan.analysis.length > 140 ? "..." : ""}`,
      accent: ceo.accent,
    });
  } else {
    plan = fallbackPlan(mission);
    store.logActivity({
      agentId: ceo.id,
      agentName: ceo.name,
      action: "message",
      message: `Plano local (fallback) ativado. ${plan.subtasks.length} subtasks. Motivo: ${planResult.error ?? "erro desconhecido"}.`,
      accent: ceo.accent,
    });
  }
  await wait(600);

  // 3. CEO creates top-level task
  const topTaskId = store.createTask({
    title: `Missão: ${mission.slice(0, 60)}${mission.length > 60 ? "..." : ""}`,
    description: mission,
    priority: "critical",
    createdBy: ceo.id,
    status: "in_progress",
  });
  await wait(400);

  // 4. For each planned department, ensure department exists and spawn head
  for (const deptId of plan.departments) {
    await ensureDepartmentAndHead(deptId, ceo);
    await wait(400);
  }

  // 5. CEO sets mission requirements on the top-level task (P0 — Trava de conclusão)
  if (plan.missionRequirements && plan.missionRequirements.length > 0) {
    const state = useLovonStore.getState();
    const integrations = state.integrations;

    // Check each requirement: if requiresCapability, check if integration exists
    const requirementsWithStatus = plan.missionRequirements.map((req) => {
      let status: "pending" | "blocked" = "pending";
      let blockedReason: string | undefined;

      if (req.requiresCapability) {
        const hasIntegration = integrations.some(
          (i) => i.capabilities.includes(req.requiresCapability as never) && i.status === "active"
        );
        if (!hasIntegration) {
          status = "blocked";
          blockedReason = `Capability "${req.requiresCapability}" não configurada no workspace. Configure em Integrações.`;
        }
      }

      return {
        id: req.id,
        description: req.description,
        type: req.type,
        requiresCapability: req.requiresCapability ?? undefined,
        status,
        blockedReason,
        subtaskIds: [],
      };
    });

    store.setMissionRequirements(topTaskId, requirementsWithStatus);

    // Log blocked requirements
    const blockedReqs = requirementsWithStatus.filter((r) => r.status === "blocked");
    if (blockedReqs.length > 0) {
      store.logActivity({
        agentId: ceo.id,
        agentName: ceo.name,
        action: "message",
        message: `⚠ ${blockedReqs.length} requisito(s) bloqueado(s) por capability indisponível: ${blockedReqs.map((r) => r.description).join("; ")}`,
        taskId: topTaskId,
        accent: "orange",
      });
    }
  }

  // 6. CEO registers mandatory comment on the top-level task (enforcement: CEO always comments)
  const reqCount = plan.missionRequirements?.length ?? 0;
  store.addTaskComment(topTaskId, {
    authorId: ceo.id,
    authorName: ceo.name,
    content: `Plano de execução definido. ${plan.subtasks.length} subtasks delegadas a ${plan.departments.length} departamentos${reqCount > 0 ? `. ${reqCount} requisitos extraídos da missão.` : ""}. Análise: ${plan.analysis}`,
    type: "comment",
  });

  // 7. CEO delegates each subtask (with acceptance criteria)
  for (const subtask of plan.subtasks) {
    await delegateAndExecute(subtask, ceo, topTaskId, mission, company?.name);
    await wait(400);
  }

  // 7. CEO finalizes
  const finalState = useLovonStore.getState();
  const completedTasks = finalState.tasks.filter(
    (t) => t.parentTaskId === topTaskId && t.status === "completed"
  ).length;
  const failedTasks = finalState.tasks.filter(
    (t) => t.parentTaskId === topTaskId && t.status === "failed"
  ).length;

  store.setAgentStatus(ceo.id, "active");
  store.logActivity({
    agentId: ceo.id,
    agentName: ceo.name,
    action: "completed",
    message: `Missão coordenada. ${completedTasks} subtasks concluídas${failedTasks > 0 ? `, ${failedTasks} falharam` : ""} em ${plan.departments.length} departamentos. Empresa operando.`,
    taskId: topTaskId,
    accent: ceo.accent,
  });

  // CEO registers final comment (enforcement: CEO always comments)
  store.addTaskComment(topTaskId, {
    authorId: ceo.id,
    authorName: ceo.name,
    content: `Missão concluída. ${completedTasks}/${plan.subtasks.length} subtasks completadas. ${failedTasks > 0 ? `${failedTasks} falharam.` : "Todas completadas com sucesso."}`,
    type: "comment",
  });

  // Mark top task completed with summary
  const summary = `# Missão Concluída\n\n**${mission}**\n\n## Sumário Executivo\n${plan.analysis}\n\n## Resultados por Departamento\n\n${plan.subtasks
    .map((s) => {
      const task = finalState.tasks.find(
        (t) => t.parentTaskId === topTaskId && t.departmentId === s.departmentId
      );
      const status = task?.status === "completed" ? "✅ Concluído" : task?.status === "failed" ? "❌ Falhou" : "⏳ Pendente";
      return `- **${s.departmentId}**: ${s.title} — ${status}`;
    })
    .join("\n")}\n\n## Próximos Passos\nA empresa está operando com ${plan.departments.length} departamentos ativos. Cada head pode receber novas tasks via CEO Console.`;

  useLovonStore.getState().completeTask(topTaskId, summary);

  // === P0: CEO Proactive Sweep — Platform Autonomy ===
  // After every mission, the CEO scans ALL tasks for blocked/partial/pending-stale
  // and tries to resolve them automatically. This ensures the CEO "takes initiative"
  // even for tasks from previous missions that were left behind.
  await ceoProactiveSweep(ceo);
}

// === CEO Proactive Sweep ===
// Scans all tasks in the workspace for problems and tries to fix them:
// 1. Blocked tasks → ceoAutoResolveBlockers (bind capabilities, hire workers, etc.)
// 2. Partial success tasks → retry or escalate
// 3. Pending tasks without owner → assign to available agent or CEO
// 4. Failed tasks → retry
async function ceoProactiveSweep(ceo: Agent): Promise<void> {
  const state = useLovonStore.getState();
  const gen = state.currentGeneration;
  const allTasks = state.tasks.filter((t) => (t.generation ?? 1) === gen);

  // 1. Blocked tasks with blockers
  const blockedTasks = allTasks.filter(
    (t) => t.status === "blocked" && t.blockers && t.blockers.length > 0
  );

  // 2. Partial success tasks
  const partialTasks = allTasks.filter(
    (t) => t.status === "partial_success"
  );

  // 3. Pending tasks without owner (stale — created but never started)
  const stalePending = allTasks.filter(
    (t) => t.status === "pending" && !t.assignedTo
  );

  // 4. Failed tasks (not yet retried)
  const failedTasks = allTasks.filter(
    (t) => t.status === "failed"
  );

  const totalIssues = blockedTasks.length + partialTasks.length + stalePending.length + failedTasks.length;

  if (totalIssues === 0) return; // nothing to do

  useLovonStore.getState().logActivity({
    agentId: ceo.id,
    agentName: ceo.name,
    action: "thinking",
    message: `🤖 CEO proactive sweep: ${totalIssues} issue(s) detectado(s) — ${blockedTasks.length} blocked, ${partialTasks.length} partial, ${stalePending.length} pending sem dono, ${failedTasks.length} failed. Iniciando resolução automática...`,
    accent: "green",
  });

  // 1. Auto-resolve blocked tasks
  for (const task of blockedTasks) {
    await wait(300);
    const result = useLovonStore.getState().ceoAutoResolveBlockers(task.id);
    if (result.taskResetToPending) {
      useLovonStore.getState().logActivity({
        agentId: ceo.id,
        agentName: ceo.name,
        action: "completed",
        message: `🤖 CEO resolveu blockers da task "${task.title.slice(0, 50)}" — ${result.resolved.length} resolvido(s), ${result.unresolved.length} não resolvido(s). Task reativada.`,
        taskId: task.id,
        accent: "green",
      });
    }
  }

  // 2. Auto-resolve partial success tasks — reset to pending for retry
  for (const task of partialTasks) {
    await wait(300);
    useLovonStore.getState().logActivity({
      agentId: ceo.id,
      agentName: ceo.name,
      action: "message",
      message: `🤖 CEO detectou task parcialmente concluída "${task.title.slice(0, 50)}". Resetando para re-execução. Motivo: ${task.partialReason?.summary ?? "parcial"}`,
      taskId: task.id,
      accent: "orange",
    });
    useLovonStore.setState((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === task.id
          ? { ...t, status: "pending" as const, partialReason: undefined, blockers: [], updatedAt: Date.now() }
          : t
      ),
    }));
  }

  // 3. Assign pending tasks without owner
  for (const task of stalePending) {
    await wait(200);
    // Find an available agent (preferably in the same department)
    const availableAgents = state.agents.filter(
      (a) => (a.generation ?? 1) === gen &&
             !a.isArchived &&
             a.role !== "ceo" &&
             a.status !== "working" &&
             (!task.departmentId || a.departmentId === task.departmentId)
    );

    if (availableAgents.length > 0) {
      const agent = availableAgents[0];
      useLovonStore.getState().assignTask(task.id, agent.id);
      useLovonStore.getState().startTask(task.id);
      useLovonStore.getState().logActivity({
        agentId: ceo.id,
        agentName: ceo.name,
        action: "delegated",
        message: `🤖 CEO reatribuiu task parada "${task.title.slice(0, 50)}" para ${agent.name}. Task iniciada.`,
        taskId: task.id,
        accent: "blue",
      });
    } else {
      // No agent available — CEO takes it
      useLovonStore.getState().assignTask(task.id, ceo.id);
      useLovonStore.getState().startTask(task.id);
      useLovonStore.getState().logActivity({
        agentId: ceo.id,
        agentName: ceo.name,
        action: "delegated",
        message: `🤖 CEO assumiu task parada "${task.title.slice(0, 50)}" (nenhum agente disponível).`,
        taskId: task.id,
        accent: "green",
      });
    }
  }

  // 4. Retry failed tasks
  for (const task of failedTasks) {
    await wait(200);
    useLovonStore.getState().logActivity({
      agentId: ceo.id,
      agentName: ceo.name,
      action: "message",
      message: `🤖 CEO resetou task falha "${task.title.slice(0, 50)}" para re-execução.`,
      taskId: task.id,
      accent: "orange",
    });
    useLovonStore.setState((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === task.id
          ? { ...t, status: "pending" as const, result: null, blockers: [], updatedAt: Date.now() }
          : t
      ),
    }));
  }

  useLovonStore.getState().logActivity({
    agentId: ceo.id,
    agentName: ceo.name,
    action: "completed",
    message: `🤖 CEO proactive sweep concluído: ${totalIssues} issue(s) processado(s).`,
    accent: "green",
  });
}

async function ensureDepartmentAndHead(
  deptId: string,
  ceo: Agent
): Promise<string | null> {
  const template = getDeptTemplate(deptId);
  const state = useLovonStore.getState();
  let deptEntity = state.departments.find((d) => d.id === deptId);

  // Create department if missing (use template if known, else generic)
  if (!deptEntity) {
    const fallbackName = deptId.charAt(0).toUpperCase() + deptId.slice(1);
    useLovonStore.setState((s) => ({
      departments: [
        ...s.departments,
        {
          id: deptId,
          name: template?.name ?? fallbackName,
          emoji: template?.emoji ?? "○",
          accent: template?.accent ?? "blue",
          headId: null,
          agentIds: [],
          kpis: [
            { label: "Tasks ativas", value: "0" },
            { label: "Tasks concluídas", value: "0" },
            { label: "Agentes", value: "0" },
          ],
        },
      ],
    }));
    deptEntity = useLovonStore.getState().departments.find((d) => d.id === deptId)!;
  }

  if (deptEntity.headId) {
    return deptEntity.headId;
  }

  // Spawn the department head
  const model = template?.model ?? "Gemini Flash";
  const tier: "free" | "premium" | "local" = model.includes("Ollama")
    ? "local"
    : model.includes("Gemini") || model.includes("Groq") || model.includes("Qwen") || model.includes("DeepSeek")
    ? "free"
    : "premium";

  const headId = useLovonStore.getState().spawnSubagent(ceo.id, {
    name: `${deptEntity.name} Lead`,
    role: "department-head",
    departmentId: deptId,
    emoji: template?.headEmoji ?? deptEntity.emoji,
    specialty: template?.headSpecialty ?? "General",
    model,
    tier,
    accent: deptEntity.accent,
    status: "active",
  });

  useLovonStore.setState((s) => ({
    departments: s.departments.map((d) =>
      d.id === deptId ? { ...d, headId } : d
    ),
  }));

  return headId;
}

async function delegateAndExecute(
  subtask: PlannedSubtask,
  ceo: Agent,
  topTaskId: string,
  mission: string,
  companyName?: string
): Promise<void> {
  try {
  const state = useLovonStore.getState();
  const dept = state.departments.find((d) => d.id === subtask.departmentId);
  if (!dept || !dept.headId) {
    // Department wasn't created — skip. Log so user can see why worker didn't start.
    useLovonStore.getState().logActivity({
      agentId: ceo.id,
      agentName: ceo.name,
      action: "failed",
      message: `⚠ Não foi possível executar subtask "${subtask.title}": departamento "${subtask.departmentId}" sem head.`,
      taskId: topTaskId,
      accent: "orange",
    });
    return;
  }

  const head = state.agents.find((a) => a.id === dept.headId);
  if (!head) {
    useLovonStore.getState().logActivity({
      agentId: ceo.id,
      agentName: ceo.name,
      action: "failed",
      message: `⚠ Departamento "${dept.name}" tem headId ${dept.headId} mas o agente não foi encontrado.`,
      taskId: topTaskId,
      accent: "orange",
    });
    return;
  }
  if (!head) return;

  // === Detect email requirement and route to Email Agent ===
  const requiresEmail = detectEmailRequirement(subtask.title, subtask.description);
  const requiredCapabilities = requiresEmail ? ["email_send"] : undefined;

  // === P0: Detect work product requirements based on task type ===
  // When the task is about creating campaign/content/marketing materials,
  // set expectedWorkProducts so completeTask() REFUSES to mark "done" without artifacts.
  const expectedWorkProducts = detectExpectedWorkProducts(subtask.title, subtask.description, dept.id);

  // If email is required, ensure Email Agent exists
  let emailAgentId: string | null = null;
  if (requiresEmail) {
    emailAgentId = ensureEmailAgent(state.agents, ceo.id, state.spawnSubagent);
    if (emailAgentId) {
      const emailAgent = useLovonStore.getState().agents.find((a) => a.id === emailAgentId);
      state.logActivity({
        agentId: ceo.id,
        agentName: ceo.name,
        action: "message",
        message: `Task "${subtask.title}" exige email_send — roteada para ${emailAgent?.name ?? "Email Agent"}.`,
        taskId: topTaskId,
        accent: "blue",
      });
    }
  }

  // Log if work products are expected
  if (expectedWorkProducts) {
    const wpDesc = Object.entries(expectedWorkProducts)
      .map(([k, v]) => `${k}: ${typeof v === "number" ? v : `${v.min}-${v.max ?? "+"}`}`)
      .join(", ");
    state.logActivity({
      agentId: ceo.id,
      agentName: ceo.name,
      action: "message",
      message: `Task "${subtask.title}" exige work products: ${wpDesc}. A task NÃO pode ser concluída sem esses artefatos.`,
      taskId: topTaskId,
      accent: "orange",
    });
  }

  // 1. CEO creates subtask (with acceptance criteria + requiredCapabilities + expectedWorkProducts)
  const taskId = state.createTask({
    title: subtask.title,
    description: subtask.description,
    priority: "high",
    createdBy: ceo.id,
    parentTaskId: topTaskId,
    departmentId: dept.id,
    acceptanceCriteria: subtask.acceptanceCriteria ?? [],
    requiredCapabilities,
    expectedWorkProducts,
    status: "pending",
  });
  await wait(300);

  // 2. CEO delegates — to Email Agent if email required, else to department head
  const delegateToId = emailAgentId ?? head.id;
  state.delegateTask(taskId, ceo.id, delegateToId);
  await wait(400);

  // 3. Agent acknowledges and starts
  state.startTask(taskId);
  const delegateAgent = useLovonStore.getState().agents.find((a) => a.id === delegateToId)!;
  state.logActivity({
    agentId: delegateToId,
    agentName: delegateAgent.name,
    action: "message",
    message: `Recebi "${subtask.title}". Iniciando execução com modelo ${delegateAgent.model}...`,
    taskId,
    accent: delegateAgent.accent,
  });
  await wait(800);

  // 4. Agent spawns a worker for the actual execution (or uses itself if Email Agent)
  let workerId: string;
  if (emailAgentId) {
    // Email Agent executes directly (it's already a worker with email skills)
    workerId = emailAgentId;
  } else {
    // Department head spawns a worker
    workerId = useLovonStore.getState().spawnSubagent(delegateToId, {
      name: `${dept.name} Worker`,
      role: "worker",
      departmentId: dept.id,
      emoji: "·",
      specialty: delegateAgent.specialty,
      model: delegateAgent.model,
      tier: delegateAgent.tier,
      accent: delegateAgent.accent,
      status: "working",
    });
  }
  await wait(300);

  // Reassign task to worker
  useLovonStore.getState().assignTask(taskId, workerId);
  useLovonStore.getState().setAgentStatus(workerId, "working", taskId);
  await wait(500);

  // 5. Worker calls LLM to execute — REAL conclusion
  state.logActivity({
    agentId: workerId,
    agentName: `${dept.name} Worker`,
    action: "thinking",
    message: `Gerando conclusão real para "${subtask.title}" via LLM...`,
    taskId,
    accent: head.accent,
  });

  const worker = useLovonStore.getState().agents.find((a) => a.id === workerId)!;
  const currentState = useLovonStore.getState();
  const workerRoleConfig = currentState.agentConfigs[workerId];
  const execResult = await callAgentAPI({
    agentName: worker.name,
    agentRole: "worker",
    department: dept.name,
    specialty: worker.specialty,
    model: worker.model,
    mission,
    taskTitle: subtask.title,
    taskDescription: subtask.description,
    companyName,
    mode: "execute",
    companyConfig: currentState.companyConfig,
    agentRoleConfig: workerRoleConfig,
    knowledgeBase: currentState.knowledgeBase,
    expectedWorkProducts, // P0 — tells the agent to produce real artifacts
  });

  if (execResult.success && execResult.conclusion) {
    // === P0: Parse and persist WORK PRODUCTS from the conclusion ===
    // The agent emits >>>WORK_PRODUCT: type ... <<<END_WORK_PRODUCT blocks.
    // We parse them, validate with Zod, and persist via addWorkProduct().
    // This happens BEFORE completeTask() so the hard gate can see them.
    if (expectedWorkProducts) {
      const workProducts = parseWorkProductsFromConclusion(execResult.conclusion, taskId, worker.name);
      if (workProducts.length > 0) {
        state.logActivity({
          agentId: workerId,
          agentName: worker.name,
          action: "thinking",
          message: `Persistindo ${workProducts.length} work product(s) extraído(s) da conclusão...`,
          taskId,
          accent: "blue",
        });
        for (const wp of workProducts) {
          try {
            useLovonStore.getState().addWorkProduct(wp);
            state.logActivity({
              agentId: workerId,
              agentName: worker.name,
              action: "completed",
              message: `✅ Work product criado: ${wp.meta.type} (id: ${wp.meta.id})`,
              taskId,
              accent: "green",
            });
          } catch (err) {
            console.error("[engine] failed to persist work product:", err);
            state.logActivity({
              agentId: workerId,
              agentName: worker.name,
              action: "failed",
              message: `❌ Erro ao persistir work product: ${err instanceof Error ? err.message : "desconhecido"}`,
              taskId,
              accent: "orange",
            });
          }
        }
      } else {
        state.logActivity({
          agentId: workerId,
          agentName: worker.name,
          action: "message",
          message: `⚠ Nenhum bloco >>>WORK_PRODUCT encontrado na conclusão. A task será bloqueada com MISSING_WORK_PRODUCTS.`,
          taskId,
          accent: "orange",
        });
      }
    }

    // 6. Worker completes with REAL conclusion (hard gate will check WPs)
    useLovonStore.getState().completeTask(taskId, execResult.conclusion);
    const kbNote = execResult.retrievedDocs && execResult.retrievedDocs.length > 0
      ? ` · ${execResult.retrievedDocs.length} doc(s) KB recuperado(s)`
      : "";
    state.logActivity({
      agentId: workerId,
      agentName: worker.name,
      action: "completed",
      message: `Conclusão real gerada (${execResult.conclusion.length} caracteres${kbNote}). Clique na task para ver o relatório completo.`,
      taskId,
      accent: delegateAgent.accent,
    });

    // === EMAIL EXECUTION: If this was an email task, actually send it ===
    if (requiresEmail) {
      state.logActivity({
        agentId: workerId,
        agentName: worker.name,
        action: "thinking",
        message: `Enviando email real via Resend...`,
        taskId,
        accent: "blue",
      });

      // Parse structured email details from the LLM conclusion.
      // The Email Agent is prompted to emit a final block in this format:
      //   >>>EMAIL_TO: user@example.com
      //   >>>EMAIL_SUBJECT: ...
      //   >>>EMAIL_BODY:
      //   ...
      //   <<<END_EMAIL_BODY
      const parsed = parseEmailFromConclusion(execResult.conclusion ?? "");
      const recipient =
        parsed.to ||
        extractEmail(subtask.description) ||
        extractEmail(mission);
      const emailSubject = parsed.subject || subtask.title;
      const emailBody = parsed.body ?? execResult.conclusion ?? subtask.description;

      if (!recipient) {
        state.logActivity({
          agentId: workerId,
          agentName: worker.name,
          action: "failed",
          message: `❌ Email não enviado: nenhum destinatário válido encontrado na conclusão nem na descrição da task. Peça ao CEO para incluir o email do destinatário.`,
          taskId,
          accent: "orange",
        });
        // === STRUCTURED BLOCKER — system records WHY, agent doesn't have to guess ===
        useLovonStore.getState().setTaskBlockers(taskId, [
          {
            code: "MISSING_REQUIRED_ARTIFACT",
            message: `Task exige envio de email, mas nenhum destinatário válido foi encontrado. O agente pode ter redigido o email, mas sem um destinatário o disparo é impossível.`,
            requiredAction: `Edite a descrição da task para incluir o email do destinatário (ex.: "enviar para cliente@exemplo.com"). Depois, re-execute a task. Como alternativa, o CEO pode re-delegar com o destinatário explícito.`,
            relatedEntity: { type: "task", id: taskId },
            createdAt: new Date().toISOString(),
            createdBy: "engine",
            traceId: `task:${taskId}`,
          },
        ]);
      } else {
        // Create an EmailDraft linked to this task (for audit + receipt tracking)
        const draftId = useLovonStore.getState().addEmailDraft({
          to: recipient,
          subject: emailSubject,
          body: emailBody,
          tone: "profissional",
          contextSources: (execResult.retrievedDocs ?? []).map((d) => d.id),
          status: "approved", // engine sends immediately; approval handled at autonomy level
          createdBy: workerId,
          isExternal: true,
          sourceTaskId: taskId,
        });

        try {
          const emailRes = await fetch("/api/lovon/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: recipient,
              subject: emailSubject,
              html: emailBody.replace(/\n/g, "<br>"),
              traceId: `task:${taskId}`,
              requestedByAgentSlug: worker.name,
              taskId,
              workspaceId: "default",
            }),
          });
          const emailData = await emailRes.json();
          const receipt = emailData.receipt as
            | import("./store").EmailSendReceipt
            | undefined;

          if (emailData.success && receipt?.providerMessageId) {
            // === RECEIPT GATE: only mark sent + req done if Resend returned a real message ID ===
            useLovonStore.getState().markEmailSent(draftId, receipt);
            state.logActivity({
              agentId: workerId,
              agentName: worker.name,
              action: "completed",
              message: `✅ Email enviado via Resend. Message ID: ${receipt.providerMessageId}`,
              taskId,
              accent: "green",
            });

            // Update mission requirement status to done (since receipt confirms send)
            const currentTask = useLovonStore.getState().tasks.find((t) => t.id === topTaskId);
            if (currentTask?.missionRequirements) {
              currentTask.missionRequirements.forEach((req) => {
                if (req.requiresCapability === "email_send") {
                  useLovonStore.getState().updateMissionRequirement(topTaskId, req.id, {
                    status: "done",
                  });
                }
              });
            }
          } else {
            // Resend accepted but no message id, OR Resend returned an error
            useLovonStore.getState().markEmailFailed(
              draftId,
              emailData.error ?? "Resend não retornou message id",
              receipt
            );
            state.logActivity({
              agentId: workerId,
              agentName: worker.name,
              action: "failed",
              message: `❌ Email NÃO confirmado pelo Resend: ${emailData.error ?? "sem message id"}. Task permanece BLOQUEADA — sem receipt válido.`,
              taskId,
              accent: "orange",
            });

            // === STRUCTURED BLOCKER — classify the Resend error ===
            // The system records WHY (auth fail / rate limit / unknown) so the agent
            // doesn't have to invent a diagnosis.
            const { classifyError, makeBlocker } = await import("./blockerClassifier");
            const rawErr = emailData.error ?? "Resend não retornou message id";
            // Heuristic: if the error message mentions "API key" or "401" or "unauthorized",
            // it's an auth failure. If it mentions "sandbox"/"onboarding"/"domain", it's
            // a configuration issue. Otherwise UNKNOWN.
            const lowerErr = rawErr.toLowerCase();
            let blocker;
            if (lowerErr.includes("api key") || lowerErr.includes("401") || lowerErr.includes("unauthorized") || lowerErr.includes("forbidden")) {
              blocker = makeBlocker("INTEGRATION_AUTH_FAILED", {
                message: `Resend rejeitou a chave de API. Erro: ${rawErr}`,
                requiredAction: `Verifique o arquivo .env — a RESEND_API_KEY pode estar inválida ou expirada. Gere uma nova em https://resend.com/api-keys e reinicie o servidor.`,
                relatedEntity: { type: "task", id: taskId },
                createdBy: "tool",
                traceId: `task:${taskId}`,
              });
            } else if (lowerErr.includes("sandbox") || lowerErr.includes("onboarding") || lowerErr.includes("domain") || lowerErr.includes("verified")) {
              blocker = makeBlocker("CAPABILITY_NOT_CONFIGURED", {
                message: `Resend rejeitou o envio porque o domínio do remetente não está verificado. Você provavelmente está usando onboarding@resend.dev (sandbox) para enviar a um destinatário que não é o dono da conta. Erro: ${rawErr}`,
                requiredAction: `Configure um domínio próprio em https://resend.com/domains, adicione os records DNS (SPF/DKIM/DMARC), e atualize RESEND_FROM_EMAIL no .env para ceo@seudominio.com. Reinicie o servidor.`,
                relatedEntity: { type: "task", id: taskId },
                createdBy: "tool",
                traceId: `task:${taskId}`,
              });
            } else if (lowerErr.includes("rate") || lowerErr.includes("429") || lowerErr.includes("limit")) {
              blocker = makeBlocker("INTEGRATION_RATE_LIMITED", {
                message: `Resend retornou rate limit. Erro: ${rawErr}`,
                requiredAction: `Aguarde alguns minutos e re-execute a task. Se for recorrente, faça upgrade do plano Resend.`,
                relatedEntity: { type: "task", id: taskId },
                createdBy: "tool",
                traceId: `task:${taskId}`,
              });
            } else {
              blocker = makeBlocker("MISSING_REQUIRED_ARTIFACT", {
                message: `Resend não confirmou o disparo (sem message ID). Erro: ${rawErr}`,
                requiredAction: `Inspecione o erro completo em Email Agent → receipts. Pode ser: destinatário inválido, conteúdo vazio, ou problema temporário do Resend. Re-execute a task.`,
                relatedEntity: { type: "task", id: taskId },
                createdBy: "tool",
                traceId: `task:${taskId}`,
              });
            }
            useLovonStore.getState().setTaskBlockers(taskId, [blocker]);
            // Do NOT mark mission requirement as done — the receipt gate will keep the
            // parent task blocked.
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : "erro de rede";
          useLovonStore.getState().markEmailFailed(draftId, errMsg);
          state.logActivity({
            agentId: workerId,
            agentName: worker.name,
            action: "failed",
            message: `❌ Erro ao enviar email: ${errMsg}`,
            taskId,
            accent: "orange",
          });
          // === STRUCTURED BLOCKER — network/unknown error ===
          const { makeBlocker } = await import("./blockerClassifier");
          const blocker = makeBlocker("UNKNOWN", {
            message: `Erro inesperado ao chamar a rota /api/lovon/send-email: ${errMsg}`,
            requiredAction: `Verifique a conexão de rede e os logs do servidor. Re-execute a task. Se persistir, reporte o erro com o trace.`,
            relatedEntity: { type: "task", id: taskId },
            createdBy: "system",
            traceId: `task:${taskId}`,
          });
          useLovonStore.getState().setTaskBlockers(taskId, [blocker]);
        }
      }
    }

    // === ACTION ITEMS EXTRACTION (P0 — Auto-subtask generation) ===
    // After a worker completes a task, try to extract ActionItemsOutput JSON from
    // the conclusion text. If valid, auto-create subtasks with dedupe + owner routing.
    // This eliminates "recomendo..." text-only conclusions — recommendations become
    // executable subtasks automatically.
    try {
      const extractResult = useLovonStore.getState().extractActionItems(
        taskId,
        execResult.conclusion,
        `task:${taskId}`
      );

      if (extractResult.success && extractResult.data && extractResult.data.actionItems.length > 0) {
        state.logActivity({
          agentId: workerId,
          agentName: worker.name,
          action: "thinking",
          message: `Extraindo action items da conclusão... ${extractResult.data.actionItems.length} item(s) encontrado(s), ${extractResult.data.decisions.length} decisão(ões).`,
          taskId,
          accent: "blue",
        });

        const applyResult = useLovonStore.getState().applyActionItems({
          taskId,
          output: extractResult.data,
          traceId: `task:${taskId}`,
          controls: {
            maxSubtasksToCreate: 5,
            requireBoardApprovalForExternal: true,
            dedupeWindowHours: 24,
          },
        });

        if (applyResult.createdSubtaskIds.length > 0) {
          state.logActivity({
            agentId: workerId,
            agentName: worker.name,
            action: "completed",
            message: `✅ ${applyResult.createdSubtaskIds.length} subtask(s) criada(s) automaticamente a partir de action items${applyResult.skippedDuplicates > 0 ? `, ${applyResult.skippedDuplicates} duplicada(s) ignorada(s)` : ""}${applyResult.createdConfirmationRequestIds.length > 0 ? `, ${applyResult.createdConfirmationRequestIds.length} approval(s) pendente(s)` : ""}.`,
            taskId,
            accent: "green",
          });
        }
        if (applyResult.blockersAdded.length > 0) {
          state.logActivity({
            agentId: workerId,
            agentName: worker.name,
            action: "message",
            message: `⚠ ${applyResult.blockersAdded.length} action item(s) sem owner — subtasks criadas mas precisam de atribuição manual.`,
            taskId,
            accent: "orange",
          });
        }
      } else if (extractResult.success && extractResult.data && extractResult.data.actionItems.length === 0) {
        // Valid JSON but no action items — that's fine, the task was informational
      } else if (!extractResult.success) {
        // Extraction failed — the task may have produced text without JSON.
        // This is NOT a hard blocker (the task still completed), but we log it
        // so the CEO/user knows the agent didn't follow the action-items-output contract.
        // Only log if the conclusion looks like it SHOULD have had action items
        // (heuristic: contains "recomend" or "próximos passos" or "action items")
        const lowerConclusion = execResult.conclusion.toLowerCase();
        const shouldHaveActionItems =
          lowerConclusion.includes("recomend") ||
          lowerConclusion.includes("próximos passos") ||
          lowerConclusion.includes("action item") ||
          lowerConclusion.includes("sugiro");

        if (shouldHaveActionItems) {
          state.logActivity({
            agentId: workerId,
            agentName: worker.name,
            action: "message",
            message: `⚠ Conclusão menciona recomendações mas não inclui JSON de action items válido. O agente deveria usar a skill action-items-output. Erro: ${extractResult.error?.slice(0, 100)}`,
            taskId,
            accent: "orange",
          });
        }
      }
    } catch (err) {
      // Don't fail the whole task completion if action items extraction breaks
      console.error("[engine] action items extraction failed:", err);
    }
  } else {
    // LLM failed to produce a conclusion. Record a structured blocker so the agent
    // doesn't have to invent a diagnosis.
    const { makeBlocker } = await import("./blockerClassifier");
    const llmBlocker = makeBlocker("LLM_FAILED", {
      message: `LLM falhou ao gerar conclusão para a task. Erro: ${execResult.error ?? "desconhecido"}`,
      requiredAction: `Verifique o Smart Routing — pode ser circuit breaker aberto (aguarde 60s), chave de API inválida, ou provider indisponível. Re-execute a task depois.`,
      relatedEntity: { type: "task", id: taskId },
      createdBy: "engine",
      traceId: `task:${taskId}`,
    });

    // Mark as blocked (not failed) so the blocker is visible in the "Why blocked?" UI
    useLovonStore.getState().setTaskBlockers(taskId, [llmBlocker]);
    useLovonStore.setState((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              // setTaskBlockers already set status="blocked", but we also want to
              // preserve the raw error in the result field for debugging
              result: `**Erro ao gerar conclusão:** ${execResult.error ?? "desconhecido"}\n\n${execResult.raw ? `\n\nResposta bruta:\n\`\`\`\n${execResult.raw.slice(0, 500)}\n\`\`\`` : ""}`,
              updatedAt: Date.now(),
            }
          : t
      ),
      agents: s.agents.map((a) =>
        a.id === workerId ? { ...a, status: "active" as const, currentTaskId: null } : a
      ),
    }));
    state.logActivity({
      agentId: workerId,
      agentName: worker.name,
      action: "failed",
      message: `Falha ao gerar conclusão: ${execResult.error ?? "erro desconhecido"}. Task bloqueada com blocker LLM_FAILED.`,
      taskId,
      accent: head.accent,
    });
  }
  await wait(400);

  // 7. Head reports back to CEO
  const headUpdated = useLovonStore.getState().agents.find((a) => a.id === head.id);
  if (headUpdated) {
    useLovonStore.getState().logActivity({
      agentId: head.id,
      agentName: headUpdated.name,
      action: "message",
      message: `Reportando ao CEO: ${dept.name} ${execResult.success ? "concluiu" : "falhou em"} "${subtask.title.slice(0, 50)}".`,
      taskId,
      accent: head.accent,
    });
  }

  // === P0: CEO Auto-Resolve — Platform Autonomy ===
  // If the task ended up blocked, the CEO automatically enters the circuit and
  // tries to resolve the blockers WITHOUT human intervention. This makes the
  // platform truly autonomous: the agent reports the problem → CEO fixes it →
  // task is retried. Only blockers that genuinely require human intervention
  // (API keys, budget, approvals) are left unresolved.
  const finalTask = useLovonStore.getState().tasks.find((t) => t.id === taskId);
  if (finalTask && finalTask.status === "blocked" && finalTask.blockers && finalTask.blockers.length > 0) {
    await wait(600); // small delay for UI to show the blocked state first
    const resolveResult = useLovonStore.getState().ceoAutoResolveBlockers(taskId);
    if (resolveResult.taskResetToPending) {
      state.logActivity({
        agentId: ceo.id,
        agentName: ceo.name,
        action: "completed",
        message: `🤖 CEO auto-resolveu ${resolveResult.resolved.length} blocker(s) e resetou a task para pending. A task será re-executada automaticamente.${resolveResult.unresolved.length > 0 ? ` ${resolveResult.unresolved.length} blocker(s) não resolvidos (exigem intervenção humana).` : ""}`,
        taskId,
        accent: "green",
      });
    }
  }
  } catch (err) {
    // CRITICAL: catch any uncaught error so we never silently leave a task pending
    const msg = err instanceof Error ? err.message : "Erro desconhecido em delegateAndExecute";
    console.error("[engine] delegateAndExecute crashed:", err);
    try {
      useLovonStore.getState().logActivity({
        agentId: ceo.id,
        agentName: ceo.name,
        action: "failed",
        message: `❌ delegateAndExecute crashou para "${subtask.title}": ${msg}`,
        taskId: topTaskId,
        accent: "orange",
      });
    } catch {
      // ignore — store might be in a bad state too
    }
  }
}

// === P0: Manual re-execution of a pending/blocked task ===
// Lets the user trigger re-execution from the UI when a worker got stuck.
// Reconstructs the PlannedSubtask from store state and re-runs delegateAndExecute.
// Resets status to pending, clears blockers, keeps expectedWorkProducts.
export async function reExecuteTask(taskId: string): Promise<{ ok: boolean; error?: string }> {
  const state = useLovonStore.getState();
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) {
    return { ok: false, error: "Task não encontrada." };
  }
  if (task.status !== "pending" && task.status !== "blocked" && task.status !== "failed") {
    return { ok: false, error: `Task está em status "${task.status}" — só é possível re-executar tasks pending/blocked/failed.` };
  }
  const ceo = state.agents.find((a) => a.role === "ceo");
  if (!ceo) {
    return { ok: false, error: "CEO agent não encontrado." };
  }
  // Resolve top task (mission root): walk parentTaskId chain up
  let topTaskId = task.id;
  let topTask = task;
  let cursor: typeof task | undefined = task;
  while (cursor?.parentTaskId) {
    const parent: typeof task | undefined = state.tasks.find((t) => t.id === cursor!.parentTaskId);
    if (!parent) break;
    topTask = parent;
    topTaskId = parent.id;
    cursor = parent;
  }
  const mission = topTask.description ?? topTask.title ?? "Re-execução manual";
  const companyName = state.company?.name;

  // Determine department — if missing, try to infer from worker
  const departmentId = task.departmentId ?? state.agents.find((a) => a.id === task.assignedTo)?.departmentId;
  if (!departmentId) {
    return { ok: false, error: "Não foi possível identificar o departamento da task." };
  }
  const dept = state.departments.find((d) => d.id === departmentId);
  if (!dept) {
    return { ok: false, error: `Departamento "${departmentId}" não existe.` };
  }

  // Reset task state for fresh execution
  state.setTaskBlockers(taskId, []); // clear blockers
  // Mark as pending + log
  state.logActivity({
    agentId: ceo.id,
    agentName: ceo.name,
    action: "message",
    message: `Re-executando manualmente "${task.title}" (departamento: ${dept.name})...`,
    taskId,
    accent: "blue",
  });

  const subtask: PlannedSubtask = {
    departmentId: dept.id,
    title: task.title,
    description: task.description ?? task.title,
    acceptanceCriteria: task.acceptanceCriteria ?? [],
  };

  try {
    await delegateAndExecute(subtask, ceo, topTaskId, mission, companyName);
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido na re-execução.";
    state.logActivity({
      agentId: ceo.id,
      agentName: ceo.name,
      action: "failed",
      message: `❌ Re-execução falhou: ${msg}`,
      taskId,
      accent: "orange",
    });
    return { ok: false, error: msg };
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Extract email address from text (for auto-routing email tasks)
function extractEmail(text: string): string | null {
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/);
  return emailMatch ? emailMatch[0] : null;
}

// === P0: Detect expected work products based on task title/description/department ===
// When the task is about creating campaign/content/marketing materials,
// set expectedWorkProducts so the hard gate in completeTask() blocks "done" without artifacts.
function detectExpectedWorkProducts(
  title: string,
  description: string,
  departmentId: string | null
): import("./store").ExpectedWorkProducts | undefined {
  const text = `${title} ${description}`.toLowerCase();

  // Marketing tasks: campaign brief + content plan + social post cards
  if (
    departmentId === "marketing" ||
    text.includes("campanha") ||
    text.includes("campaign") ||
    text.includes("marketing") ||
    text.includes("conteúdo") ||
    text.includes("content") ||
    text.includes("social") ||
    text.includes("post") ||
    text.includes("linkedin") ||
    text.includes("instagram") ||
    text.includes("criativo") ||
    text.includes("creative")
  ) {
    return {
      campaign_brief: 1,           // must produce 1 campaign brief
      social_post_card: { min: 2, max: 12 },  // must produce 2-12 social post cards
    };
  }

  // Tasks that explicitly mention "brief" or "plano de conteúdo"
  if (text.includes("brief") || text.includes("briefing")) {
    return { campaign_brief: 1 };
  }
  if (text.includes("plano de conteúdo") || text.includes("content plan") || text.includes("calendário")) {
    return { content_plan: 1 };
  }

  // Tasks that mention images/creative/assets
  if (text.includes("imagem") || text.includes("image") || text.includes("asset") || text.includes("criativo visual")) {
    return { creative_asset: { min: 1, max: 6 } };
  }

  return undefined;
}

// === P0: Parse work product blocks from the LLM conclusion ===
// The agent emits >>>WORK_PRODUCT: type ... <<<END_WORK_PRODUCT blocks.
// We parse the JSON inside, validate with Zod, and return ready-to-persist work products.
// FALLBACK: if the agent didn't emit blocks, scan the conclusion for ```json code blocks
// and infer the type from the JSON shape (heuristic). This makes marketing tasks succeed
// even when the LLM returns plain text reports with embedded JSON.
function parseWorkProductsFromConclusion(
  conclusion: string,
  sourceTaskId: string,
  agentName: string
): import("./work-products").WorkProduct[] {
  const { validateWorkProduct } = require("./work-products") as typeof import("./work-products");
  const results: import("./work-products").WorkProduct[] = [];

  // 1. PRIMARY: match >>>WORK_PRODUCT: <type> ... <<<END_WORK_PRODUCT blocks
  const blockRegex = />>>WORK_PRODUCT:\s*(\w+)\s*\n([\s\S]*?)<<<END_WORK_PRODUCT/g;
  let match;
  while ((match = blockRegex.exec(conclusion)) !== null) {
    const type = match[1].trim();
    const jsonText = match[2].trim();
    const wp = coerceToWorkProduct(jsonText, type, sourceTaskId, agentName);
    if (wp) {
      const validation = validateWorkProduct(wp);
      if (validation.success && validation.data) {
        results.push(validation.data);
      } else {
        console.error(`[parseWorkProducts] validation failed for ${type}:`, validation.error);
      }
    }
  }

  // 2. FALLBACK: scan ```json ... ``` blocks when primary regex found nothing.
  // The LLM often returns structured JSON in fenced code blocks instead of the marker format.
  if (results.length === 0) {
    const jsonBlockRegex = /```(?:json)?\s*\n([\s\S]*?)```/g;
    let jsonMatch;
    while ((jsonMatch = jsonBlockRegex.exec(conclusion)) !== null) {
      const jsonText = jsonMatch[1].trim();
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonText);
      } catch {
        continue; // not valid JSON, skip
      }
      if (!parsed || typeof parsed !== "object") continue;

      // Heuristic: infer the work product type from the JSON shape.
      // The LLM often returns an array of items or a single object with sub-arrays.
      const parsedObj = parsed as Record<string, unknown>;
      const items = Array.isArray(parsed) ? parsed : extractItemsFromObject(parsedObj);
      const inferredType = inferWorkProductType(parsedObj);

      for (const item of items) {
        const wp = coerceToWorkProduct(JSON.stringify(item), inferredType, sourceTaskId, agentName);
        if (wp) {
          const validation = validateWorkProduct(wp);
          if (validation.success && validation.data) {
            results.push(validation.data);
          }
        }
      }
      // If we got at least one inferred work product, stop scanning more blocks.
      if (results.length > 0) break;
    }
  }

  return results;
}

// Helper: strip code fences + parse JSON + fill meta + return parsed object (or null).
function coerceToWorkProduct(
  jsonText: string,
  declaredType: string,
  sourceTaskId: string,
  agentName: string
): Record<string, unknown> | null {
  // Strip markdown code fences if present
  const cleaned = jsonText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;

  // Normalize type: lowercase, common aliases
  const type = normalizeType(declaredType);

  // Ensure meta
  if (!parsed.meta) parsed.meta = {};
  parsed.meta.type = type; // override with normalized type
  if (!parsed.meta.id) parsed.meta.id = `wp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  parsed.meta.sourceTaskId = sourceTaskId;
  if (!parsed.meta.createdAt) parsed.meta.createdAt = new Date().toISOString();
  if (!parsed.meta.createdBy) {
    parsed.meta.createdBy = { kind: "agent", agentSlug: agentName.toLowerCase().replace(/\s+/g, "-") };
  }

  // Fill required fields per type with sensible defaults if missing
  ensureRequiredFields(parsed, type);

  return parsed;
}

function normalizeType(t: string): string {
  const lower = t.toLowerCase().trim();
  const aliases: Record<string, string> = {
    "campaign_brief": "campaign_brief",
    "campaignbrief": "campaign_brief",
    "brief": "campaign_brief",
    "briefing": "campaign_brief",
    "social_post_card": "social_post_card",
    "socialpostcard": "social_post_card",
    "post": "social_post_card",
    "postcard": "social_post_card",
    "social": "social_post_card",
    "content_plan": "content_plan",
    "contentplan": "content_plan",
    "plan": "content_plan",
    "calendar": "content_plan",
    "creative_asset": "creative_asset",
    "creativeasset": "creative_asset",
    "asset": "creative_asset",
    "image": "creative_asset",
    "creative": "creative_asset",
  };
  return aliases[lower] ?? "campaign_brief"; // default
}

function inferWorkProductType(obj: unknown): string {
  if (!obj || typeof obj !== "object") return "campaign_brief";
  const o = obj as Record<string, unknown>;
  const keys = Object.keys(o).map((k) => k.toLowerCase());

  // campaign_brief signals: name + objective + kpis
  if (
    (keys.includes("kpis") || keys.includes("kpi")) &&
    (keys.includes("objective") || keys.includes("objetivo"))
  ) {
    return "campaign_brief";
  }

  // social_post_card signals: hook + body + cta
  if (
    keys.includes("hook") &&
    (keys.includes("body") || keys.includes("copy") || keys.includes("text")) &&
    (keys.includes("cta") || keys.includes("calltoaction"))
  ) {
    return "social_post_card";
  }

  // content_plan signals: posts or calendar array
  if (
    keys.includes("posts") ||
    keys.includes("calendar") ||
    keys.includes("schedule") ||
    keys.includes("cronograma")
  ) {
    return "content_plan";
  }

  // creative_asset signals: assets or images array
  if (
    keys.includes("assets") ||
    keys.includes("images") ||
    keys.includes("image_url") ||
    keys.includes("url") ||
    keys.includes("creative")
  ) {
    return "creative_asset";
  }

  // Default to campaign_brief if we see name + objective
  if (keys.includes("name") && keys.includes("objective")) return "campaign_brief";

  return "campaign_brief";
}

function extractItemsFromObject(obj: Record<string, unknown>): unknown[] {
  // If the object has an array field with multiple items, return those.
  const arrayKeys = ["posts", "calendar", "schedule", "assets", "images", "items", "social_posts", "cards", "list"];
  for (const key of arrayKeys) {
    const val = obj[key];
    if (Array.isArray(val) && val.length > 0) return val;
  }
  // Otherwise treat the object as a single item
  return [obj];
}

function ensureRequiredFields(parsed: Record<string, unknown>, type: string): void {
  if (type === "campaign_brief") {
    if (!parsed.name) parsed.name = parsed.title ?? "Campanha sem título";
    if (!parsed.objective) parsed.objective = parsed.goal ?? parsed.summary ?? "Objetivo não especificado.";
    if (!parsed.audience) parsed.audience = parsed.target ?? "Público geral";
    if (!parsed.channels) parsed.channels = ["LinkedIn", "Instagram"];
    if (!parsed.kpis) parsed.kpis = ["Alcance", "Engajamento"];
    if (!parsed.timeline) parsed.timeline = "30 dias";
    if (!parsed.budget) parsed.budget = "A definir";
    if (!parsed.tone) parsed.tone = "Profissional";
  } else if (type === "social_post_card") {
    if (!parsed.platform) parsed.platform = "LinkedIn";
    if (!parsed.hook) parsed.hook = parsed.headline ?? "Hook";
    if (!parsed.body) parsed.body = parsed.copy ?? parsed.text ?? "Body";
    if (!parsed.cta) parsed.cta = parsed.callToAction ?? "Saiba mais";
    if (!parsed.hashtags) parsed.hashtags = [];
  } else if (type === "content_plan") {
    if (!parsed.name) parsed.name = parsed.title ?? "Plano de conteúdo";
    if (!parsed.objective) parsed.objective = "Engajamento da audiência";
    if (!parsed.duration) parsed.duration = "30 dias";
    if (!parsed.audience) parsed.audience = "Público geral";
    if (!parsed.posts) parsed.posts = [];
    if (!parsed.platforms) parsed.platforms = ["LinkedIn", "Instagram"];
  } else if (type === "creative_asset") {
    if (!parsed.name) parsed.name = "Asset criativo";
    if (!parsed.format) parsed.format = parsed.type ?? "image/png";
    if (!parsed.url) parsed.url = parsed.image_url ?? "https://placeholder.local/asset.png";
    if (!parsed.usage_rights) parsed.usage_rights = "Uso interno";
    if (!parsed.dimensions) parsed.dimensions = "1080x1080";
  }
}

// Parse a structured email block from the LLM conclusion.
// The Email Agent prompt instructs it to emit at the end:
//   >>>EMAIL_TO: user@example.com
//   >>>EMAIL_SUBJECT: Subject line
//   >>>EMAIL_BODY:
//   ...body lines...
//   <<<END_EMAIL_BODY
//
// If the markers aren't found, returns empty fields and the caller falls back
// to using the whole conclusion as the body.
function parseEmailFromConclusion(conclusion: string): {
  to: string | null;
  subject: string | null;
  body: string | null;
} {
  const toMatch = conclusion.match(/>>>EMAIL_TO:\s*([^\n]+)/);
  const subjectMatch = conclusion.match(/>>>EMAIL_SUBJECT:\s*([^\n]+)/);
  const bodyMatch = conclusion.match(
    />>>EMAIL_BODY:\s*\n([\s\S]*?)<<<END_EMAIL_BODY/
  );

  return {
    to: toMatch ? toMatch[1].trim() : null,
    subject: subjectMatch ? subjectMatch[1].trim() : null,
    body: bodyMatch ? bodyMatch[1].trim() : null,
  };
}

// === Manual subagent creation (used by CreateAgent wizard) ===
export function manualSpawnSubagent(
  parentId: string,
  config: {
    name: string;
    role: "department-head" | "worker";
    departmentId: string | null;
    emoji: string;
    specialty: string;
    model: string;
    tier: "free" | "premium" | "local";
    accent: Accent;
  }
): string {
  return useLovonStore.getState().spawnSubagent(parentId, {
    ...config,
    status: "active",
  });
}

// === Seed a default company on first dashboard load ===
export function ensureCompanyExists(ownerName?: string) {
  const state = useLovonStore.getState();
  if (!state.company) {
    // Try to get the current user's name from the auth context. Since AuthContext
    // lives in a different module and we want to keep this pure (server-safe),
    // we use a safe lookup: read from localStorage if present.
    let ownerName: string | undefined;
    if (typeof window !== "undefined") {
      try {
        // AuthContext stores the user in React state, not localStorage directly.
        // But the session cookie's user id is in /api/auth/session. We don't fetch
        // it here — instead, pass it via the parameter from the React component.
        // If the React component doesn't pass it, fall back to "você" via CommandCenter.
        ownerName = undefined;
      } catch {}
    }
    state.createCompany(
      "Lovon Teams",
      "Democratizar acesso a agentes de IA autônomos para qualquer empresa.",
      "free",
      0,
      ownerName
    );
  }
  // P0: Also seed default Company Core (DNA) so enforcement passes on first LLM call.
  // User can edit these later in Empresa → Configurações.
  if (!state.companyConfig || !state.companyConfig.rules || state.companyConfig.rules.length === 0) {
    state.updateCompanyConfig({
      industry: "Tecnologia / SaaS",
      productSummary: "Plataforma de agentes de IA autônomos para empresas",
      targetAudience: "PMEs e startups brasileiras",
      valueProposition: "Permite rodar times de agentes IA com LLMs gratuitos, sem custos de API",
      differentiators: "Open-source, multi-provider, modelo free-first, fallback automático",
      regionsAndLanguage: "Brasil, PT-BR",
      positioning: "Acessível, técnico, inovador",
      tone: "direto, profissional, amigável, sem jargão",
      defaultGoals: "automatizar tarefas operacionais, aumentar produtividade, reduzir custos",
      rules: [
        "Responda sempre em português brasileiro (PT-BR) a menos que solicitado outro idioma",
        "Seja direto e objetivo — prefira bullet points a parágrafos longos",
        "Nunca invente dados, métricas ou citações — se não souber, diga 'não tenho essa informação'",
        "Priorize segurança: nunca exponha API keys, senhas ou dados sensíveis em conclusões",
        "Quando bloquear, explique o motivo de forma clara e sugira a próxima ação",
      ],
      autonomyLevel: 1,
      version: 1,
      updatedAt: Date.now(),
    });
  }
}
