"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  Crown,
  Sparkles,
  Check,
  X,
  Play,
  Activity,
  ArrowRight,
  Bell,
  TrendingUp,
  ListTodo,
  Users,
  Zap,
  AlertTriangle,
  AlertCircle,
  Info,
  Building2,
  FileText,
} from "lucide-react";
import { useLovonStore } from "@/lib/lovon/store";
import { useRealMetrics, useRealInsights } from "@/lib/lovon/realMetrics";
import { DEPARTMENT_TEMPLATES } from "@/lib/lovon/data";

type View = "command" | "overview" | "ceo" | "company" | "tasks" | "activity" | "agents" | "create" | "market" | "routing" | "analytics" | "settings";

interface Props {
  onNavigate: (v: View) => void;
}

const ACCENT_TEXT: Record<string, string> = {
  green: "text-neon-green",
  blue: "text-neon-blue",
  purple: "text-neon-purple",
  acid: "text-[#b6ff3d]",
  orange: "text-[#ff8a3d]",
};

const ACCENT_BG: Record<string, string> = {
  green: "bg-neon-green/10 border-neon-green/30",
  blue: "bg-neon-blue/10 border-neon-blue/30",
  purple: "bg-[#a855f7]/10 border-[#a855f7]/30",
  acid: "bg-[#b6ff3d]/10 border-[#b6ff3d]/30",
  orange: "bg-[#ff8a3d]/10 border-[#ff8a3d]/30",
};

const ACCENT_DOT: Record<string, string> = {
  green: "bg-neon-green",
  blue: "bg-neon-blue",
  purple: "bg-[#a855f7]",
  acid: "bg-[#b6ff3d]",
  orange: "bg-[#ff8a3d]",
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const TASK_STATUS_PENDENCIA: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: "Pendente", color: "text-violet-muted", bg: "bg-white/5", border: "border-white/10" },
  failed: { label: "Falhou", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30" },
  blocked: { label: "Bloqueada", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30" },
  partial_success: { label: "Parcial", color: "text-[#ff8a3d]", bg: "bg-[#ff8a3d]/10", border: "border-[#ff8a3d]/30" },
};

export function CommandCenter({ onNavigate }: Props) {
  const company = useLovonStore((s) => s.company);
  const agents = useLovonStore((s) => s.agents);
  const tasks = useLovonStore((s) => s.tasks);
  const activity = useLovonStore((s) => s.activity);
  const departments = useLovonStore((s) => s.departments);
  const dismissInsight = useLovonStore((s) => s.dismissInsight);

  const metrics = useRealMetrics();
  const { recommendations, alerts } = useRealInsights();

  const ceo = agents.find((a) => a.role === "ceo");
  const ownerName = company?.ownerName || "Fernando";
  const greeting = getGreeting();

  const pendingAlerts = alerts;
  const pendingRecs = recommendations;
  const tasksNeedingAttention = tasks.filter(
    (t) => t.status === "pending" && !t.assignedTo
  );

  // P0 — Pendências e Falhas: tasks que precisam de tratamento
  const pendingTasks = tasks.filter(
    (t) => t.status === "pending" || t.status === "failed" || t.status === "blocked" || t.status === "partial_success"
  );
  const startTask = useLovonStore((s) => s.startTask);
  const assignTask = useLovonStore((s) => s.assignTask);
  const ceoAutoResolveBlockers = useLovonStore((s) => s.ceoAutoResolveBlockers);
  const [showPendencias, setShowPendencias] = useState(false);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Greeting header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-6 rounded-2xl glass-strong border border-neon-green/20 overflow-hidden"
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{ background: "radial-gradient(circle at 20% 50%, rgba(0,245,160,0.1), transparent 60%)" }}
        />
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              {greeting}, {ownerName}.
            </h1>
            <p className="text-sm text-tech-gray mt-1">
              {metrics.hasData ? (
                <>
                  Sua empresa está operando com{" "}
                  <span className="text-neon-green font-semibold">{metrics.agentsTotal} agentes</span>
                  {" · "}
                  <span className="text-white">{metrics.tasksTotal} tasks</span>
                  {" · "}
                  <span className="text-neon-blue">{metrics.activityEvents} eventos de atividade</span>
                </>
              ) : (
                <>Sua empresa está configurada. Dê a primeira missão ao CEO para começar.</>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {metrics.hasData && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neon-green/10 border border-neon-green/30 text-[10px] font-mono text-neon-green">
                <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-blink-status" />
                OPERANDO
              </span>
            )}
            <button
              onClick={() => onNavigate("ceo")}
              className="btn-pill btn-secondary-neon text-xs"
            >
              <Crown className="w-3.5 h-3.5" /> CEO Console
            </button>
          </div>
        </div>
      </motion.div>

      {/* Empty state when no data at all */}
      {!metrics.hasData && (
        <div className="p-10 rounded-2xl glass border border-white/8 text-center">
          <Bot className="w-16 h-16 mx-auto text-tech-gray/30 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">
            Nenhum agente executado ainda
          </h2>
          <p className="text-sm text-tech-gray max-w-md mx-auto mb-6">
            A Lovon está pronta. Dê a primeira missão ao CEO — ele vai analisar o objetivo,
            criar subagentes especializados e delegar tasks com conclusões reais geradas por LLM.
          </p>
          <button
            onClick={() => onNavigate("ceo")}
            className="btn-pill btn-primary-neon text-sm"
          >
            <Crown className="w-4 h-4" /> Abrir CEO Console
          </button>
        </div>
      )}

      {/* KPI Cards — all derived from real data */}
      {metrics.hasData && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            icon={Users}
            accent="green"
            label="Agentes ativos"
            value={metrics.agentsActive.toString()}
            sub={`${metrics.agentsTotal} total · ${metrics.subagentsCreated} subagentes`}
            breakdown={[
              { label: "Trabalhando", value: metrics.agentsWorking, color: "text-[#b6ff3d]" },
              { label: "Pensando", value: metrics.agentsThinking, color: "text-neon-blue" },
              { label: "Ociosos", value: metrics.agentsIdle, color: "text-tech-gray" },
            ]}
          />
          <KPICard
            icon={ListTodo}
            accent="blue"
            label="Tasks"
            value={metrics.tasksTotal.toString()}
            sub={`${metrics.missionsExecuted} missões CEO executadas`}
            breakdown={[
              { label: "Concluídas", value: metrics.tasksCompleted, color: "text-neon-green" },
              { label: "Em execução", value: metrics.tasksInProgress + metrics.tasksDelegated, color: "text-[#b6ff3d]" },
              { label: "Pendentes", value: metrics.tasksPending, color: "text-tech-gray" },
            ]}
          />
          <KPICard
            icon={TrendingUp}
            accent="purple"
            label="Taxa de conclusão"
            value={`${metrics.completionRate}%`}
            sub={`${metrics.tasksCompleted} de ${metrics.tasksTotal} tasks`}
            progress={metrics.completionRate}
          />
          <KPICard
            icon={FileText}
            accent="acid"
            label="Conclusões geradas"
            value={metrics.llmConclusionsGenerated.toString()}
            sub="Relatórios reais via LLM"
            breakdown={
              metrics.tasksFailed > 0
                ? [{ label: "Falhas", value: metrics.tasksFailed, color: "text-[#ff8a3d]" }]
                : undefined
            }
          />
        </div>
      )}

      {/* Real alerts */}
      {pendingAlerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#ff8a3d]" />
            <h2 className="text-sm font-semibold text-white">Alertas do sistema</h2>
            <span className="text-[10px] font-mono text-tech-gray">
              {pendingAlerts.length} ativo(s)
            </span>
          </div>
          <div className="space-y-3">
            {pendingAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onResolve={() => {
                  if (alert.resolvedView) onNavigate(alert.resolvedView as View);
                  dismissInsight(alert.id);
                }}
                onDismiss={() => dismissInsight(alert.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Departments real status */}
      {metrics.hasData && (
        <div className="p-5 rounded-2xl glass border border-white/8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-neon-green" />
              <h3 className="text-sm font-semibold text-white">Departamentos</h3>
            </div>
            <button
              onClick={() => onNavigate("company")}
              className="text-xs text-neon-green hover:underline flex items-center gap-1"
            >
              Ver organograma <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {departments.length === 0 && (
              <div className="col-span-full text-center py-6 text-xs text-tech-gray">
                Nenhum departamento criado. Execute uma missão no CEO Console.
              </div>
            )}
            {departments.map((dept) => {
              const template = DEPARTMENT_TEMPLATES.find((d) => d.id === dept.id);
              const deptAgents = agents.filter((a) => a.departmentId === dept.id);
              const head = dept.headId ? agents.find((a) => a.id === dept.headId) : null;
              const workingAgents = deptAgents.filter(
                (a) => a.status === "working" || a.status === "thinking"
              ).length;
              const accent = template?.accent ?? "blue";
              return (
                <div
                  key={dept.id}
                  className={`p-3 rounded-xl border ${ACCENT_BG[accent]} hover:bg-white/[0.04] transition-all`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{dept.emoji}</span>
                      <span className="text-sm font-semibold text-white">{dept.name}</span>
                    </div>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        deptAgents.length > 0 ? ACCENT_DOT[accent] : "bg-tech-gray"
                      } ${workingAgents > 0 ? "animate-blink-status" : ""}`}
                    />
                  </div>
                  <div className="text-[11px] text-tech-gray">
                    {head ? `Head: ${head.name}` : "Sem head"}
                  </div>
                  <div className="text-[9px] font-mono text-tech-gray mt-1">
                    {deptAgents.length} agente(s){workingAgents > 0 ? ` · ${workingAgents} ativo(s)` : ""}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Real recommendations */}
      {pendingRecs.length > 0 && (
        <div className="p-5 rounded-2xl glass border border-neon-green/20">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-4 h-4 text-neon-green" />
            <h3 className="text-sm font-semibold text-white">Recomendações do CEO</h3>
            <span className="text-[10px] font-mono text-tech-gray">
              {pendingRecs.length} pendente(s)
            </span>
          </div>
          <div className="space-y-3">
            {pendingRecs.map((rec, i) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                index={i + 1}
                onApply={() => {
                  if (rec.actionView) onNavigate(rec.actionView as View);
                  dismissInsight(rec.id);
                }}
                onDismiss={() => dismissInsight(rec.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Real activity feed */}
      {metrics.hasData && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* === P0: Painel de Pendências e Falhas === */}
          {pendingTasks.length > 0 && (
            <div className="lg:col-span-2 p-5 rounded-2xl glass border border-[#ff8a3d]/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#ff8a3d]" />
                  <h3 className="text-sm font-semibold text-white">Pendências e Falhas ({pendingTasks.length})</h3>
                  <span className="text-[10px] text-violet-muted">— clique para tratar cada item</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      // Run CEO proactive sweep manually:
                      // 1. Auto-resolve blocked tasks
                      // 2. Reset partial success to pending
                      // 3. Assign stale pending tasks
                      // 4. Retry failed tasks
                      const allTasks = useLovonStore.getState().tasks;
                      const gen = useLovonStore.getState().currentGeneration;
                      const activeTasks = allTasks.filter((t) => (t.generation ?? 1) === gen);

                      // 1. Blocked
                      activeTasks.filter((t) => t.status === "blocked" && t.blockers?.length).forEach((t) => {
                        ceoAutoResolveBlockers(t.id);
                      });

                      // 2. Partial success → reset to pending
                      useLovonStore.setState((s) => ({
                        tasks: s.tasks.map((t) =>
                          (t.generation ?? 1) === gen && t.status === "partial_success"
                            ? { ...t, status: "pending" as const, partialReason: undefined, blockers: [], updatedAt: Date.now() }
                            : t
                        ),
                      }));

                      // 3. Pending without owner → assign to CEO
                      const ceo = useLovonStore.getState().agents.find((a) => a.role === "ceo");
                      if (ceo) {
                        useLovonStore.setState((s) => ({
                          tasks: s.tasks.map((t) =>
                            (t.generation ?? 1) === gen && t.status === "pending" && !t.assignedTo
                              ? { ...t, assignedTo: ceo.id, status: "in_progress" as const, updatedAt: Date.now() }
                              : t
                          ),
                        }));
                      }

                      // 4. Failed → reset to pending
                      useLovonStore.setState((s) => ({
                        tasks: s.tasks.map((t) =>
                          (t.generation ?? 1) === gen && t.status === "failed"
                            ? { ...t, status: "pending" as const, result: null, blockers: [], updatedAt: Date.now() }
                            : t
                        ),
                      }));

                      // Log
                      useLovonStore.getState().logActivity({
                        id: `act_${Date.now()}`,
                        timestamp: Date.now(),
                        agentId: ceo?.id ?? "",
                        agentName: ceo?.name ?? "CEO",
                        action: "completed",
                        message: "🤖 CEO proactive sweep executado manualmente pelo board. Todas as pendências foram processadas.",
                        accent: "green",
                      });
                    }}
                    className="text-[10px] px-2.5 py-1 rounded-md bg-neon-green/10 border border-neon-green/30 text-neon-green hover:bg-neon-green/20 flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3" /> CEO resolve tudo
                  </button>
                  <button
                    onClick={() => setShowPendencias(!showPendencias)}
                    className="text-xs text-[#ff8a3d] hover:underline"
                  >
                    {showPendencias ? "Ocultar" : "Mostrar todas"}
                  </button>
                </div>
              </div>
              <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
                {pendingTasks.slice(0, showPendencias ? 50 : 5).map((task) => {
                  const statusMeta = TASK_STATUS_PENDENCIA[task.status] ?? TASK_STATUS_PENDENCIA.pending;
                  const assignee = task.assignedTo ? agents.find((a) => a.id === task.assignedTo) : null;
                  return (
                    <div key={task.id} className="p-3 rounded-lg border border-white/8 bg-white/[0.02]">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${statusMeta.bg} ${statusMeta.color} ${statusMeta.border}`}>
                              {statusMeta.label}
                            </span>
                            <span className={`text-[9px] font-mono uppercase ${task.priority === "critical" ? "text-red-400" : task.priority === "high" ? "text-[#ff8a3d]" : "text-violet-muted"}`}>
                              {task.priority}
                            </span>
                            {task.blockers && task.blockers.length > 0 && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-400/10 text-red-400 border border-red-400/30">
                                {task.blockers.length} blocker(s)
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-medium text-white truncate">{task.title}</div>
                          {task.partialReason && (
                            <div className="text-[10px] text-[#ff8a3d] mt-1 line-clamp-2">
                              ⚠ {task.partialReason.summary}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {task.status === "pending" && (
                          <>
                            <button
                              onClick={() => {
                                if (task.assignedTo) {
                                  startTask(task.id);
                                } else if (ceo) {
                                  assignTask(task.id, ceo.id);
                                  startTask(task.id);
                                }
                              }}
                              className="text-[10px] px-2 py-1 rounded-md bg-neon-green/10 border border-neon-green/30 text-neon-green hover:bg-neon-green/20 flex items-center gap-1"
                            >
                              <Play className="w-2.5 h-2.5" /> Iniciar
                            </button>
                            {assignee && (
                              <span className="text-[10px] text-violet-muted">→ {assignee.name}</span>
                            )}
                          </>
                        )}
                        {task.status === "failed" && (
                          <button
                            onClick={() => {
                              useLovonStore.setState((s) => ({
                                tasks: s.tasks.map((t) =>
                                  t.id === task.id
                                    ? { ...t, status: "pending" as const, result: null, blockers: [], updatedAt: Date.now() }
                                    : t
                                ),
                              }));
                            }}
                            className="text-[10px] px-2 py-1 rounded-md bg-[#ff8a3d]/10 border border-[#ff8a3d]/30 text-[#ff8a3d] hover:bg-[#ff8a3d]/20 flex items-center gap-1"
                          >
                            <Play className="w-2.5 h-2.5" /> Retentar
                          </button>
                        )}
                        {task.status === "blocked" && task.blockers && task.blockers.length > 0 && (
                          <button
                            onClick={() => onNavigate("tasks")}
                            className="text-[10px] px-2 py-1 rounded-md bg-[#ff8a3d]/10 border border-[#ff8a3d]/30 text-[#ff8a3d] hover:bg-[#ff8a3d]/20 flex items-center gap-1"
                          >
                            <AlertCircle className="w-2.5 h-2.5" /> Ver blocker
                          </button>
                        )}
                        {task.status === "partial_success" && (
                          <button
                            onClick={() => onNavigate("tasks")}
                            className="text-[10px] px-2 py-1 rounded-md bg-[#ff8a3d]/10 border border-[#ff8a3d]/30 text-[#ff8a3d] hover:bg-[#ff8a3d]/20 flex items-center gap-1"
                          >
                            <AlertCircle className="w-2.5 h-2.5" /> Ver motivo
                          </button>
                        )}
                        {/* Cancel/delete */}
                        <button
                          onClick={() => {
                            if (confirm(`Deletar a task "${task.title}"?`)) {
                              useLovonStore.setState((s) => ({
                                tasks: s.tasks.filter((t) => t.id !== task.id),
                              }));
                            }
                          }}
                          className="text-[10px] px-2 py-1 rounded-md bg-white/5 border border-violet-subtle text-violet-muted hover:text-red-400 flex items-center gap-1"
                        >
                          <X className="w-2.5 h-2.5" /> Cancelar
                        </button>
                        {/* Navigate to Tasks tab for full treatment */}
                        <button
                          onClick={() => onNavigate("tasks")}
                          className="text-[10px] px-2 py-1 rounded-md bg-white/5 border border-violet-subtle text-violet-muted hover:text-cream flex items-center gap-1"
                        >
                          <ArrowRight className="w-2.5 h-2.5" /> Abrir em Tasks
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tasks needing attention */}
          <div className="p-5 rounded-2xl glass border border-white/8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-neon-purple" />
                <h3 className="text-sm font-semibold text-white">Tasks precisando de atenção</h3>
              </div>
              <button
                onClick={() => onNavigate("tasks")}
                className="text-xs text-neon-green hover:underline flex items-center gap-1"
              >
                Ver todas <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
              {tasksNeedingAttention.length === 0 && (
                <div className="text-center py-6 text-xs text-tech-gray">
                  {metrics.tasksTotal === 0
                    ? "Nenhuma task criada ainda."
                    : "Todas as tasks têm responsável atribuído."}
                </div>
              )}
              {tasksNeedingAttention.slice(0, 8).map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg border border-white/8 bg-white/[0.02]"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-neon-purple/10 text-neon-purple border border-neon-purple/30">
                      Sem dono
                    </span>
                    <span className="text-[9px] font-mono text-tech-gray uppercase">
                      {task.priority}
                    </span>
                  </div>
                  <div className="text-xs font-medium text-white">{task.title}</div>
                  {task.description && (
                    <div className="text-[10px] text-tech-gray mt-0.5 line-clamp-1">
                      {task.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Real activity feed */}
          <div className="p-5 rounded-2xl glass border border-white/8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-neon-green" />
                <h3 className="text-sm font-semibold text-white">Atividade recente</h3>
              </div>
              <button
                onClick={() => onNavigate("activity")}
                className="text-xs text-neon-green hover:underline flex items-center gap-1"
              >
                Ver tudo <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-1 max-h-80 overflow-y-auto no-scrollbar">
              {activity.length === 0 && (
                <div className="text-center py-6 text-xs text-tech-gray">
                  Nenhuma atividade registrada ainda.
                </div>
              )}
              <AnimatePresence initial={false}>
                {activity.slice(0, 15).map((entry) => (
                  <ActivityRow key={entry.id} entry={entry} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// === Sub-components ===

function KPICard({
  icon: Icon,
  accent,
  label,
  value,
  sub,
  progress,
  breakdown,
}: {
  icon: React.ComponentType<{ className?: string }>;
  accent: keyof typeof ACCENT_TEXT;
  label: string;
  value: string;
  sub?: string;
  progress?: number;
  breakdown?: { label: string; value: number; color: string }[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl glass border border-white/8"
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${ACCENT_BG[accent]}`}>
          <Icon className={`w-4 h-4 ${ACCENT_TEXT[accent]}`} />
        </div>
      </div>
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-[10px] text-tech-gray mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-tech-gray/70 mt-1">{sub}</div>}
      {progress !== undefined && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-[9px] font-mono mb-1">
            <span className="text-tech-gray">Progresso</span>
            <span className={ACCENT_TEXT[accent]}>{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6 }}
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, var(--color-neon-green), var(--color-neon-blue))`,
              }}
            />
          </div>
        </div>
      )}
      {breakdown && breakdown.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] font-mono">
          {breakdown.map((b) => (
            <span key={b.label} className={b.color}>
              {b.value} {b.label}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function AlertCard({
  alert,
  onResolve,
  onDismiss,
}: {
  alert: import("@/lib/lovon/store").SystemAlert;
  onResolve: () => void;
  onDismiss: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const severityConfig = {
    urgent: { color: "text-[#ff8a3d]", bg: "bg-[#ff8a3d]/10", border: "border-[#ff8a3d]/30", icon: AlertTriangle },
    warning: { color: "text-[#b6ff3d]", bg: "bg-[#b6ff3d]/10", border: "border-[#b6ff3d]/30", icon: AlertCircle },
    info: { color: "text-neon-blue", bg: "bg-neon-blue/10", border: "border-neon-blue/30", icon: Info },
  } as const;
  const cfg = severityConfig[alert.severity];

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 rounded-xl border ${cfg.border} ${cfg.bg}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`w-8 h-8 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center shrink-0`}>
            <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-[10px] font-mono uppercase ${cfg.color}`}>
              {alert.severity === "urgent" ? "URGENTE" : alert.severity === "warning" ? "Atenção" : "Info"} · {alert.context}
            </div>
            <div className="text-sm font-semibold text-white mt-0.5">{alert.title}</div>
            <div className="text-[11px] text-tech-gray mt-1">{alert.description}</div>
          </div>
        </div>
        {alert.suggestedActions.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] font-mono text-tech-gray hover:text-white shrink-0"
          >
            {expanded ? "−" : "+"}
          </button>
        )}
      </div>

      {expanded && alert.suggestedActions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 pt-3 border-t border-white/8"
        >
          <div className="text-[10px] font-mono text-tech-gray uppercase mb-1.5">Ações sugeridas</div>
          <ul className="space-y-1 mb-3">
            {alert.suggestedActions.map((a, i) => (
              <li key={i} className="text-[11px] text-white/90 flex items-start gap-2">
                <span className="text-neon-green">→</span> {a}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={onResolve}
          className="btn-pill btn-primary-neon text-xs flex-1"
        >
          <Play className="w-3 h-3" /> Resolver
        </button>
        <button
          onClick={onDismiss}
          className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-tech-gray hover:text-white"
        >
          Ignorar
        </button>
      </div>
    </motion.div>
  );
}

function RecommendationCard({
  rec,
  index,
  onApply,
  onDismiss,
}: {
  rec: import("@/lib/lovon/store").SystemRecommendation;
  index: number;
  onApply: () => void;
  onDismiss: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-4 rounded-xl border ${
        rec.severity === "warning"
          ? "border-[#b6ff3d]/20 bg-[#b6ff3d]/5"
          : "border-white/8 bg-white/[0.02]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-neon-green/15 border border-neon-green/30 flex items-center justify-center text-xs font-bold text-neon-green shrink-0">
          {index}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white">{rec.title}</div>
          <div className="text-[11px] text-tech-gray mt-1 leading-relaxed">{rec.description}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 ml-10">
        <button
          onClick={onApply}
          className="btn-pill btn-primary-neon text-xs"
        >
          <Sparkles className="w-3 h-3" /> {rec.action}
        </button>
        <button
          onClick={onDismiss}
          className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-tech-gray hover:text-white"
        >
          Depois
        </button>
      </div>
    </motion.div>
  );
}

function ActivityRow({ entry }: { entry: import("@/lib/lovon/store").Activity }) {
  const actionMeta: Record<string, { label: string; color: string; bg: string }> = {
    created: { label: "criou", color: "text-neon-green", bg: "bg-neon-green/10" },
    delegated: { label: "delegou", color: "text-neon-blue", bg: "bg-neon-blue/10" },
    started: { label: "iniciou", color: "text-[#b6ff3d]", bg: "bg-[#b6ff3d]/10" },
    completed: { label: "concluiu", color: "text-neon-green", bg: "bg-neon-green/10" },
    failed: { label: "falhou", color: "text-red-400", bg: "bg-red-400/10" },
    spawned: { label: "criou", color: "text-neon-purple", bg: "bg-[#a855f7]/10" },
    thinking: { label: "pensando", color: "text-[#00E0FF]", bg: "bg-[#00E0FF]/10" },
    message: { label: "msg", color: "text-tech-gray", bg: "bg-white/5" },
  };
  const meta = actionMeta[entry.action] ?? actionMeta.message;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/[0.02]"
    >
      <span
        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded shrink-0 w-14 text-center ${meta.bg} ${meta.color} border border-current/20`}
      >
        {meta.label}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-white leading-snug">
          <span className={`font-semibold ${ACCENT_TEXT[entry.accent] ?? "text-white"}`}>
            {entry.agentName}
          </span>{" "}
          <span className="text-tech-gray">—</span> {entry.message}
        </div>
        <div className="text-[9px] text-tech-gray/60 font-mono mt-0.5">
          {new Date(entry.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    </motion.div>
  );
}
