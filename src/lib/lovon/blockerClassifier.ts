// Lovon Teams — Blocker Classifier
//
// Maps runtime error situations to structured TaskBlocker objects.
// The engine uses these helpers instead of inventing diagnoses —
// agents read from task.blockers[], never guessing.
//
// All messages are in pt-BR.

import { TaskBlocker, TaskBlockerCode } from "./store";

// === Builder ===
export function makeBlocker(
  code: TaskBlockerCode,
  opts: {
    message: string;
    requiredAction: string;
    relatedEntity?: { type: string; id: string };
    createdBy?: TaskBlocker["createdBy"];
    traceId?: string;
  }
): TaskBlocker {
  return {
    code,
    message: opts.message,
    requiredAction: opts.requiredAction,
    relatedEntity: opts.relatedEntity,
    createdAt: new Date().toISOString(),
    createdBy: opts.createdBy ?? "system",
    traceId: opts.traceId,
  };
}

// === Specific blockers ===

export function blockerConfirmationRequired(
  confirmationId: string,
  taskTitle: string,
  traceId?: string
): TaskBlocker {
  return makeBlocker("CONFIRMATION_REQUIRED", {
    message: `A task "${taskTitle}" requer aprovação do Board antes de prosseguir (ação externa detectada).`,
    requiredAction: `Acesse a aba Confirmações (ou o painel de Approvals) e aprove/rejeite a confirmação ${confirmationId}.`,
    relatedEntity: { type: "confirmation", id: confirmationId },
    createdBy: "policy",
    traceId,
  });
}

export function blockerCapabilityNotConfigured(
  capability: string,
  taskId: string,
  traceId?: string
): TaskBlocker {
  return makeBlocker("CAPABILITY_NOT_CONFIGURED", {
    message: `A task exige a capability "${capability}", mas nenhuma integração ativa está vinculada a ela neste workspace.`,
    requiredAction: `Vá em Integrações → adicione uma integração para "${capability}" (ex.: Resend para email_send, Brave para web_search) e ative-a. Depois, re-execute a task.`,
    relatedEntity: { type: "task", id: taskId },
    createdBy: "system",
    traceId,
  });
}

export function blockerPolicyBlocked(
  toolOrSkillId: string,
  reason: string,
  taskId: string,
  traceId?: string
): TaskBlocker {
  return makeBlocker("POLICY_BLOCKED", {
    message: `A policy do workspace bloqueou a tool/skill "${toolOrSkillId}": ${reason}`,
    requiredAction: `Vá em Skills & Tools → reabilite "${toolOrSkillId}" se for apropriado, ou ajuste a WorkspaceSkillPolicy.`,
    relatedEntity: { type: "task", id: taskId },
    createdBy: "policy",
    traceId,
  });
}

export function blockerNoRouteAvailable(
  agentName: string,
  reason: string,
  taskId: string,
  traceId?: string
): TaskBlocker {
  return makeBlocker("NO_ROUTE_AVAILABLE", {
    message: `Nenhuma rota de IA disponível para o agente "${agentName}": ${reason}`,
    requiredAction: `Vá em Smart Routing → verifique a allowlist de providers para este agente. Confirme que há pelo menos um provider ativo com chave válida.`,
    relatedEntity: { type: "task", id: taskId },
    createdBy: "system",
    traceId,
  });
}

export function blockerIntegrationAuthFailed(
  provider: string,
  taskId: string,
  traceId?: string
): TaskBlocker {
  return makeBlocker("INTEGRATION_AUTH_FAILED", {
    message: `A integração com "${provider}" retornou erro de autenticação (401/403). A chave de API provavelmente está inválida ou expirada.`,
    requiredAction: `Vá em Integrações → substitua a chave de "${provider}" por uma válida. Se for Resend, confirme que a chave tem permissão de sending.access.`,
    relatedEntity: { type: "task", id: taskId },
    createdBy: "tool",
    traceId,
  });
}

export function blockerIntegrationRateLimited(
  provider: string,
  taskId: string,
  traceId?: string
): TaskBlocker {
  return makeBlocker("INTEGRATION_RATE_LIMITED", {
    message: `A integração com "${provider}" retornou rate limit (429). Muitas chamadas em pouco tempo.`,
    requiredAction: `Aguarde alguns minutos e re-execute a task. Se for recorrente, considere aumentar o limite do plano do provider ou adicionar uma segunda integração de fallback.`,
    relatedEntity: { type: "task", id: taskId },
    createdBy: "tool",
    traceId,
  });
}

export function blockerBudgetExceeded(
  scope: "agent" | "workspace",
  limit: string,
  taskId: string,
  traceId?: string
): TaskBlocker {
  return makeBlocker("BUDGET_EXCEEDED", {
    message: `Orçamento (${scope}) excedido. Limite: ${limit}.`,
    requiredAction: `Aumente o budget em Company Settings (se ${scope}="workspace") ou ajuste o AgentRoutingPolicy do agente. Re-execute a task depois.`,
    relatedEntity: { type: "task", id: taskId },
    createdBy: "policy",
    traceId,
  });
}

export function blockerWorkProductInvalid(
  schemaName: string,
  validationError: string,
  taskId: string,
  traceId?: string
): TaskBlocker {
  return makeBlocker("WORK_PRODUCT_INVALID", {
    message: `O work product "${schemaName}" falhou na validação Zod: ${validationError}`,
    requiredAction: `O agente produziu um JSON inválido. Re-execute a task — se persistir, ajuste o prompt da skill "${schemaName}" para ser mais restritivo sobre o schema. Erro de validação: ${validationError.slice(0, 200)}`,
    relatedEntity: { type: "task", id: taskId },
    createdBy: "engine",
    traceId,
  });
}

export function blockerMissingRequiredArtifact(
  artifactType: string,
  taskId: string,
  detail?: string,
  traceId?: string
): TaskBlocker {
  return makeBlocker("MISSING_REQUIRED_ARTIFACT", {
    message: `Artefato obrigatório "${artifactType}" não encontrado.${detail ? ` Detalhe: ${detail}` : ""}`,
    requiredAction: `Para email: verifique a aba Email Agent — se o envio falhou, confirme RESEND_API_KEY e domínio verificado. Re-execute a task.`,
    relatedEntity: { type: "task", id: taskId },
    createdBy: "engine",
    traceId,
  });
}

export function blockerOverdueCriticalDebt(
  daysOverdue: number,
  taskId: string,
  traceId?: string
): TaskBlocker {
  return makeBlocker("OVERDUE_CRITICAL_DEBT", {
    message: `Task crítica está em atraso há ${daysOverdue} dia(s), bloqueando trabalho downstream.`,
    requiredAction: `Reatribua a task, cancele-a, ou quebre em subtasks menores. Considere escalar a prioridade ou trocar o agente responsável.`,
    relatedEntity: { type: "task", id: taskId },
    createdBy: "system",
    traceId,
  });
}

export function blockerDependencyFailed(
  parentTaskId: string,
  parentStatus: string,
  taskId: string,
  traceId?: string
): TaskBlocker {
  return makeBlocker("DEPENDENCY_FAILED", {
    message: `A task pai (${parentTaskId}) terminou com status "${parentStatus}". Esta task não pode prosseguir.`,
    requiredAction: `Inspecione a task pai — resolva o blocker dela primeiro. Depois, re-execute esta task.`,
    relatedEntity: { type: "task", id: parentTaskId },
    createdBy: "engine",
    traceId,
  });
}

export function blockerLLMFailed(
  attempts: number,
  errorCode: string,
  taskId: string,
  traceId?: string
): TaskBlocker {
  return makeBlocker("LLM_FAILED", {
    message: `LLM falhou após ${attempts} tentativa(s). Código do erro: ${errorCode}.`,
    requiredAction: `Verifique o Smart Routing — pode ser circuit breaker aberto, chave inválida, ou provider indisponível. Aguarde 60s (circuit breaker reset) e re-execute.`,
    relatedEntity: { type: "task", id: taskId },
    createdBy: "engine",
    traceId,
  });
}

export function blockerUnknown(
  error: string,
  taskId: string,
  traceId?: string
): TaskBlocker {
  return makeBlocker("UNKNOWN", {
    message: `Erro não classificado: ${error.slice(0, 300)}`,
    requiredAction: `Inspecione os logs do servidor para o traceId ${traceId ?? "(sem trace)"}. Se for recorrente, adicione um code específico em blockerClassifier.ts.`,
    relatedEntity: { type: "task", id: taskId },
    createdBy: "system",
    traceId,
  });
}

// === Classifier: maps a raw error to a blocker ===
// Used by the engine when a fetch/LLM call fails and it needs to record a blocker.
export function classifyError(error: {
  status?: number;
  message?: string;
  provider?: string;
  code?: string;
}): TaskBlockerCode {
  const status = error.status;
  const msg = (error.message ?? "").toLowerCase();

  if (status === 401 || status === 403) return "INTEGRATION_AUTH_FAILED";
  if (status === 429) return "INTEGRATION_RATE_LIMITED";
  if (status === 502 || status === 503 || status === 504) return "LLM_FAILED";
  if (msg.includes("circuit breaker")) return "LLM_FAILED";
  if (msg.includes("budget")) return "BUDGET_EXCEEDED";
  if (msg.includes("policy")) return "POLICY_BLOCKED";
  if (msg.includes("no route") || msg.includes("no provider")) return "NO_ROUTE_AVAILABLE";
  if (msg.includes("invalid api key") || msg.includes("unauthorized")) return "INTEGRATION_AUTH_FAILED";
  if (msg.includes("rate limit")) return "INTEGRATION_RATE_LIMITED";
  if (msg.includes("zod") || msg.includes("validation")) return "WORK_PRODUCT_INVALID";
  if (msg.includes("confirmation") || msg.includes("approval")) return "CONFIRMATION_REQUIRED";
  return "UNKNOWN";
}

// === Metadata for UI rendering ===
export const BLOCKER_CODE_META: Record<
  TaskBlockerCode,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  CONFIRMATION_REQUIRED: {
    label: "Aguardando aprovação",
    color: "text-[#ff8a3d]",
    bg: "bg-[#ff8a3d]/10",
    border: "border-[#ff8a3d]/30",
    icon: "⏳",
  },
  CAPABILITY_NOT_CONFIGURED: {
    label: "Capability não configurada",
    color: "text-[#ff8a3d]",
    bg: "bg-[#ff8a3d]/10",
    border: "border-[#ff8a3d]/30",
    icon: "🔧",
  },
  POLICY_BLOCKED: {
    label: "Bloqueado por policy",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/30",
    icon: "🚫",
  },
  NO_ROUTE_AVAILABLE: {
    label: "Sem rota de IA disponível",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/30",
    icon: "🔀",
  },
  INTEGRATION_AUTH_FAILED: {
    label: "Falha de autenticação",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/30",
    icon: "🔑",
  },
  INTEGRATION_RATE_LIMITED: {
    label: "Rate limit excedido",
    color: "text-[#ff8a3d]",
    bg: "bg-[#ff8a3d]/10",
    border: "border-[#ff8a3d]/30",
    icon: "⏱",
  },
  BUDGET_EXCEEDED: {
    label: "Orçamento excedido",
    color: "text-[#ff8a3d]",
    bg: "bg-[#ff8a3d]/10",
    border: "border-[#ff8a3d]/30",
    icon: "💰",
  },
  WORK_PRODUCT_INVALID: {
    label: "Work product inválido",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/30",
    icon: "📋",
  },
  MISSING_REQUIRED_ARTIFACT: {
    label: "Artefato obrigatório ausente",
    color: "text-[#ff8a3d]",
    bg: "bg-[#ff8a3d]/10",
    border: "border-[#ff8a3d]/30",
    icon: "📭",
  },
  MISSING_WORK_PRODUCTS: {
    label: "Work products esperados não criados",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/30",
    icon: "📦",
  },
  MISSING_OWNER_AGENT: {
    label: "Action item sem owner",
    color: "text-[#ff8a3d]",
    bg: "bg-[#ff8a3d]/10",
    border: "border-[#ff8a3d]/30",
    icon: "👤",
  },
  ACTION_ITEMS_INVALID: {
    label: "Action items JSON inválido",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/30",
    icon: "📋",
  },
  HEADCOUNT_LIMIT_EXCEEDED: {
    label: "Limite de headcount atingido",
    color: "text-[#ff8a3d]",
    bg: "bg-[#ff8a3d]/10",
    border: "border-[#ff8a3d]/30",
    icon: "👥",
  },
  AUTO_HIRE_LIMIT_EXCEEDED: {
    label: "Limite de auto-hire diário atingido",
    color: "text-[#ff8a3d]",
    bg: "bg-[#ff8a3d]/10",
    border: "border-[#ff8a3d]/30",
    icon: "📅",
  },
  CROSS_DEPARTMENT_HIRE: {
    label: "Contratação fora do departamento",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/30",
    icon: "🚫",
  },
  OVERDUE_CRITICAL_DEBT: {
    label: "Atraso crítico",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/30",
    icon: "⏰",
  },
  DEPENDENCY_FAILED: {
    label: "Dependência falhou",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/30",
    icon: "🔗",
  },
  LLM_FAILED: {
    label: "LLM falhou",
    color: "text-red-400",
    bg: "bg-red-400/10",
    border: "border-red-400/30",
    icon: "🤖",
  },
  UNKNOWN: {
    label: "Erro desconhecido",
    color: "text-violet-muted",
    bg: "bg-white/5",
    border: "border-white/10",
    icon: "❓",
  },
};
