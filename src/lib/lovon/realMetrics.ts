// Real-data derived metrics and insights.
// Everything here is computed from agents/tasks/activity/departments in the store.
// NO hardcoded values, NO random generation, NO fake business data.

import { useLovonStore, Agent, Task, Department, Activity, SystemRecommendation, SystemAlert } from "./store";

export interface RealMetrics {
  agentsTotal: number;
  agentsActive: number; // active | working | thinking
  agentsIdle: number;
  agentsWorking: number;
  agentsThinking: number;
  subagentsCreated: number; // non-CEO agents
  departmentsTotal: number;
  departmentsWithHead: number;
  tasksTotal: number;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksPending: number;
  tasksDelegated: number;
  tasksFailed: number;
  missionsExecuted: number; // top-level tasks (no parent)
  activityEvents: number;
  completionRate: number; // % of tasks completed vs total
  avgTasksPerAgent: number; // completed tasks / active agents
  llmConclusionsGenerated: number; // tasks with non-empty result
  hasData: boolean; // true if any agent/task/activity exists
}

export function useRealMetrics(): RealMetrics {
  const agents = useLovonStore((s) => s.agents);
  const tasks = useLovonStore((s) => s.tasks);
  const departments = useLovonStore((s) => s.departments);
  const activity = useLovonStore((s) => s.activity);

  return computeMetrics(agents, tasks, departments, activity);
}

export function computeMetrics(
  agents: Agent[],
  tasks: Task[],
  departments: Department[],
  activity: Activity[]
): RealMetrics {
  const agentsActive = agents.filter(
    (a) => a.status === "active" || a.status === "working" || a.status === "thinking"
  ).length;
  const agentsWorking = agents.filter((a) => a.status === "working").length;
  const agentsThinking = agents.filter((a) => a.status === "thinking").length;
  const agentsIdle = agents.filter((a) => a.status === "idle").length;
  const subagentsCreated = agents.filter((a) => a.role !== "ceo").length;

  const tasksCompleted = tasks.filter((t) => t.status === "completed").length;
  const tasksInProgress = tasks.filter((t) => t.status === "in_progress").length;
  const tasksPending = tasks.filter((t) => t.status === "pending").length;
  const tasksDelegated = tasks.filter((t) => t.status === "delegated").length;
  const tasksFailed = tasks.filter((t) => t.status === "failed").length;
  const missionsExecuted = tasks.filter((t) => !t.parentTaskId).length;
  const llmConclusionsGenerated = tasks.filter(
    (t) => t.result && t.result.trim().length > 0
  ).length;

  const departmentsWithHead = departments.filter((d) => d.headId).length;

  const completionRate = tasks.length > 0 ? Math.round((tasksCompleted / tasks.length) * 100) : 0;
  const avgTasksPerAgent = agentsActive > 0 ? Math.round((tasksCompleted / agentsActive) * 10) / 10 : 0;

  const hasData = agents.length > 0 || tasks.length > 0 || activity.length > 0;

  return {
    agentsTotal: agents.length,
    agentsActive,
    agentsIdle,
    agentsWorking,
    agentsThinking,
    subagentsCreated,
    departmentsTotal: departments.length,
    departmentsWithHead,
    tasksTotal: tasks.length,
    tasksCompleted,
    tasksInProgress,
    tasksPending,
    tasksDelegated,
    tasksFailed,
    missionsExecuted,
    activityEvents: activity.length,
    completionRate,
    avgTasksPerAgent,
    llmConclusionsGenerated,
    hasData,
  };
}

// === Real insights — generated from actual state gaps ===
// Each insight has a STABLE id derived from its condition so dismissal persists.

export function useRealInsights(): { recommendations: SystemRecommendation[]; alerts: SystemAlert[] } {
  const agents = useLovonStore((s) => s.agents);
  const tasks = useLovonStore((s) => s.tasks);
  const departments = useLovonStore((s) => s.departments);
  const activity = useLovonStore((s) => s.activity);
  const dismissedInsightIds = useLovonStore((s) => s.dismissedInsightIds);

  const recs = generateRecommendations(agents, tasks, departments, activity);
  const alerts = generateAlerts(agents, tasks, departments, activity);

  return {
    recommendations: recs.filter((r) => !dismissedInsightIds.includes(r.id)),
    alerts: alerts.filter((a) => !dismissedInsightIds.includes(a.id)),
  };
}

function generateRecommendations(
  agents: Agent[],
  tasks: Task[],
  departments: Department[],
  _activity: Activity[]
): SystemRecommendation[] {
  const recs: SystemRecommendation[] = [];
  const ceo = agents.find((a) => a.role === "ceo");
  const now = Date.now();

  // 1. No CEO mission executed yet
  const topLevelTasks = tasks.filter((t) => !t.parentTaskId);
  if (ceo && topLevelTasks.length === 0) {
    recs.push({
      id: "rec-no-mission",
      title: "Dê a primeira missão ao CEO",
      description: `O CEO ${ceo.name} está pronto, mas ainda não recebeu nenhuma missão. Acesse o CEO Console para definir um objetivo — ele vai analisar, criar subagentes e delegar tasks automaticamente.`,
      action: "Abrir CEO Console",
      actionView: "ceo",
      severity: "info",
      timestamp: now,
    });
  }

  // 2. Idle agents available
  const idleAgents = agents.filter((a) => a.status === "idle" && a.role !== "ceo");
  if (idleAgents.length > 0) {
    recs.push({
      id: "rec-idle-agents",
      title: `${idleAgents.length} agente(s) ocioso(s)`,
      description: `${idleAgents.length} agente(s) sem task ativa no momento: ${idleAgents.slice(0, 3).map((a) => a.name).join(", ")}${idleAgents.length > 3 ? "..." : ""}. Considere delegar novas tasks via CEO Console ou criar subtasks manualmente.`,
      action: "Ver agentes",
      actionView: "agents",
      severity: "info",
      timestamp: now,
    });
  }

  // 3. Pending tasks without assignment
  const unassignedPending = tasks.filter((t) => t.status === "pending" && !t.assignedTo);
  if (unassignedPending.length > 0) {
    recs.push({
      id: "rec-unassigned-tasks",
      title: `${unassignedPending.length} task(s) sem responsável`,
      description: `Existem ${unassignedPending.length} task(s) pendente(s) sem agente atribuído. Acesse Tasks para delegar manualmente ou execute uma nova missão no CEO Console para que o CEO redistribua o trabalho.`,
      action: "Ver tasks",
      actionView: "tasks",
      severity: "warning",
      timestamp: now,
    });
  }

  // 4. Departments without heads
  const deptsWithoutHead = departments.filter((d) => d.id !== "executive" && !d.headId);
  if (deptsWithoutHead.length > 0 && ceo) {
    recs.push({
      id: "rec-dept-without-head",
      title: `${deptsWithoutHead.length} departamento(s) sem head`,
      description: `${deptsWithoutHead.map((d) => d.name).join(", ")} não tem agente responsável. Execute uma missão no CEO Console para que ele crie os heads automaticamente, ou crie manualmente em Criar Agente.`,
      action: "Criar agente",
      actionView: "create",
      severity: "info",
      timestamp: now,
    });
  }

  // 5. Low completion rate
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const failedTasks = tasks.filter((t) => t.status === "failed").length;
  if (tasks.length >= 3 && failedTasks > 0) {
    recs.push({
      id: "rec-failed-tasks",
      title: `${failedTasks} task(s) falharam`,
      description: `${failedTasks} task(s) não conseguiram gerar conclusão (provável falha na chamada do LLM). Verifique a aba Tasks para detalhes do erro e tente executar uma nova missão.`,
      action: "Ver tasks",
      actionView: "tasks",
      severity: "warning",
      timestamp: now,
    });
  }

  return recs;
}

function generateAlerts(
  agents: Agent[],
  tasks: Task[],
  _departments: Department[],
  _activity: Activity[]
): SystemAlert[] {
  const alerts: SystemAlert[] = [];
  const now = Date.now();

  // 1. Many tasks in progress (potential bottleneck)
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  if (inProgress >= 5) {
    alerts.push({
      id: "alert-many-in-progress",
      severity: "warning",
      title: `${inProgress} tasks em execução simultânea`,
      description: `Há ${inProgress} tasks em andamento agora. Monitore o Activity Feed para identificar gargalos ou agentes travados.`,
      context: "Operação",
      suggestedActions: ["Ver Activity Feed", "Ver Tasks"],
      resolvedView: "activity",
      timestamp: now,
    });
  }

  // 2. No company/CEO set up
  const ceo = agents.find((a) => a.role === "ceo");
  if (!ceo) {
    alerts.push({
      id: "alert-no-ceo",
      severity: "urgent",
      title: "Nenhum CEO configurado",
      description: "A empresa não tem um CEO agent. Crie a empresa para que o CEO possa receber missões e coordenar subagentes.",
      context: "Empresa",
      suggestedActions: ["Criar empresa"],
      resolvedView: "settings",
      timestamp: now,
    });
  }

  // 3. Agent thinking for too long (stuck)
  const stuckAgents = agents.filter((a) => a.status === "thinking");
  if (stuckAgents.length > 0) {
    alerts.push({
      id: "alert-stuck-thinking",
      severity: "info",
      title: `${stuckAgents.length} agente(s) pensando`,
      description: `${stuckAgents.map((a) => a.name).join(", ")} está(ão) em estado "thinking". Se persistir por muito tempo, pode indicar chamada LLM pendente ou travada.`,
      context: "Agentes",
      suggestedActions: ["Ver agentes"],
      resolvedView: "agents",
      timestamp: now,
    });
  }

  return alerts;
}
