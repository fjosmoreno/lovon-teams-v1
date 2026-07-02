"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ListTodo,
  ArrowRight,
  ChevronDown,
  FileText,
  X,
  XCircle,
  Loader2,
  HelpCircle,
} from "lucide-react";
import { useLovonStore, Task } from "@/lib/lovon/store";
import { WhyBlockedModal } from "./WhyBlockedModal";

const ACCENT_TEXT: Record<string, string> = {
  green: "text-neon-green",
  blue: "text-neon-blue",
  purple: "text-neon-purple",
  acid: "text-[#b6ff3d]",
  orange: "text-[#ff8a3d]",
};

const STATUS_META = {
  pending: { label: "Pendente", color: "text-tech-gray", bg: "bg-white/5", border: "border-white/10" },
  in_progress: { label: "Em execução", color: "text-[#b6ff3d]", bg: "bg-[#b6ff3d]/10", border: "border-[#b6ff3d]/30" },
  delegated: { label: "Delegada", color: "text-neon-blue", bg: "bg-neon-blue/10", border: "border-neon-blue/30" },
  in_review: { label: "Aguardando aprovação", color: "text-[#ff8a3d]", bg: "bg-[#ff8a3d]/10", border: "border-[#ff8a3d]/30" },
  completed: { label: "Concluída", color: "text-neon-green", bg: "bg-neon-green/10", border: "border-neon-green/30" },
  failed: { label: "Falhou", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30" },
  partial_success: { label: "Concluída Parcialmente", color: "text-[#ff8a3d]", bg: "bg-[#ff8a3d]/10", border: "border-[#ff8a3d]/30" },
  blocked: { label: "Bloqueada", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30" },
};

const PRIORITY_META = {
  low: { label: "Baixa", color: "text-tech-gray" },
  medium: { label: "Média", color: "text-neon-blue" },
  high: { label: "Alta", color: "text-[#ff8a3d]" },
  critical: { label: "Crítica", color: "text-red-400" },
};

export function Tasks({ onNavigateToIntegrations }: { onNavigateToIntegrations?: (capability: string) => void }) {
  const tasks = useLovonStore((s) => s.tasks);
  const agents = useLovonStore((s) => s.agents);
  const departments = useLovonStore((s) => s.departments);
  const resolvePartialTask = useLovonStore((s) => s.resolvePartialTask);
  const getResolutionOptions = useLovonStore((s) => s.getResolutionOptions);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modalTaskId, setModalTaskId] = useState<string | null>(null);
  const [whyBlockedTaskId, setWhyBlockedTaskId] = useState<string | null>(null);
  const [partialTaskId, setPartialTaskId] = useState<string | null>(null);

  // Always derive the modal task from current store state so it stays in sync
  const modalTask = modalTaskId ? tasks.find((t) => t.id === modalTaskId) ?? null : null;
  const whyBlockedTask = whyBlockedTaskId ? tasks.find((t) => t.id === whyBlockedTaskId) ?? null : null;
  const partialTask = partialTaskId ? tasks.find((t) => t.id === partialTaskId) ?? null : null;

  const handleSetModal = (taskId: string) => {
    setModalTaskId(taskId);
  };

  const filtered = tasks.filter((t) => {
    if (filter === "active") return t.status !== "completed" && t.status !== "failed";
    if (filter === "completed") return t.status === "completed";
    return true;
  });

  const topTasks = filtered.filter((t) => !t.parentTaskId);
  const subtasksOf = (id: string) => tasks.filter((t) => t.parentTaskId === id);

  const stats = {
    total: tasks.length,
    active: tasks.filter((t) => t.status === "in_progress" || t.status === "delegated").length,
    inReview: tasks.filter((t) => t.status === "in_review").length,
    blocked: tasks.filter((t) => t.status === "blocked").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    pending: tasks.filter((t) => t.status === "pending").length,
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ListTodo className="w-5 h-5 text-neon-green" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Tasks</h1>
        </div>
        <p className="text-sm text-tech-gray">
          Tasks criadas pelo CEO e delegadas aos subagentes. Conclusões são geradas por LLM real — clique em uma task para ver o relatório completo.
        </p>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {[
          { label: "Total", value: stats.total, icon: ListTodo, accent: "text-white" },
          { label: "Em andamento", value: stats.active, icon: Clock, accent: "text-[#b6ff3d]" },
          { label: "Em revisão", value: stats.inReview, icon: AlertCircle, accent: "text-[#ff8a3d]" },
          { label: "Bloqueadas", value: stats.blocked, icon: AlertCircle, accent: "text-red-500" },
          { label: "Concluídas", value: stats.completed, icon: CheckCircle2, accent: "text-neon-green" },
          { label: "Pendentes", value: stats.pending, icon: AlertCircle, accent: "text-neon-blue" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-xl glass border border-white/8"
          >
            <s.icon className={`w-4 h-4 ${s.accent} mb-2`} />
            <div className="text-xl font-bold text-white">{s.value}</div>
            <div className="text-[10px] text-tech-gray uppercase">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* filter tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/8 w-fit">
        {(["all", "active", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              filter === f
                ? "bg-neon-green/15 text-neon-green"
                : "text-tech-gray hover:text-white"
            }`}
          >
            {f === "all" ? "Todas" : f === "active" ? "Em andamento" : "Concluídas"}
          </button>
        ))}
      </div>

      {/* task list */}
      {topTasks.length === 0 ? (
        <div className="text-center py-16">
          <ListTodo className="w-12 h-12 mx-auto text-tech-gray/30 mb-3" />
          <p className="text-sm text-tech-gray mb-4">
            Nenhuma task ainda. Vá ao CEO Console e dê uma missão ao CEO.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {topTasks.map((task) => {
            const creator = agents.find((a) => a.id === task.createdBy);
            const assignee = task.assignedTo ? agents.find((a) => a.id === task.assignedTo) : null;
            const dept = task.departmentId ? departments.find((d) => d.id === task.departmentId) : null;
            const subs = subtasksOf(task.id);
            const isExpanded = expanded === task.id;
            const status = STATUS_META[task.status];
            const priority = PRIORITY_META[task.priority];

            return (
              <div key={task.id}>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl glass border ${status.border} cursor-pointer hover:bg-white/[0.03] transition-all`}
                  onClick={() => setExpanded(isExpanded ? null : task.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${status.bg} ${status.color} border ${status.border}`}>
                          {status.label}
                        </span>
                        <span className={`text-[9px] font-mono uppercase ${priority.color}`}>
                          {priority.label}
                        </span>
                        {dept && (
                          <span className="text-[9px] font-mono text-tech-gray">
                            {dept.emoji} {dept.name}
                          </span>
                        )}
                        {subs.length > 0 && (
                          <span className="text-[9px] font-mono text-tech-gray flex items-center gap-1">
                            <ChevronDown className={`w-2.5 h-2.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            {subs.length} subtasks
                          </span>
                        )}
                        {task.result && task.status === "completed" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalTaskId(task.id);
                            }}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neon-green/10 text-neon-green border border-neon-green/30 hover:bg-neon-green/20 flex items-center gap-1"
                          >
                            <FileText className="w-2.5 h-2.5" /> Ver conclusão
                          </button>
                        )}
                        {task.status === "blocked" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setWhyBlockedTaskId(task.id);
                            }}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#ff8a3d]/10 text-[#ff8a3d] border border-[#ff8a3d]/30 hover:bg-[#ff8a3d]/20 flex items-center gap-1"
                          >
                            <HelpCircle className="w-2.5 h-2.5" /> Por quê?
                            {task.blockers && task.blockers.length > 0 && (
                              <span className="ml-0.5 px-1 rounded-full bg-[#ff8a3d]/20 text-[8px] font-bold">
                                {task.blockers.length}
                              </span>
                            )}
                          </button>
                        )}
                        {task.status === "in_review" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setWhyBlockedTaskId(task.id);
                            }}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#ff8a3d]/10 text-[#ff8a3d] border border-[#ff8a3d]/30 hover:bg-[#ff8a3d]/20 flex items-center gap-1"
                          >
                            <HelpCircle className="w-2.5 h-2.5" /> Por quê?
                          </button>
                        )}
                        {task.status === "partial_success" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPartialTaskId(task.id);
                            }}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#ff8a3d]/10 text-[#ff8a3d] border border-[#ff8a3d]/30 hover:bg-[#ff8a3d]/20 flex items-center gap-1"
                          >
                            <AlertCircle className="w-2.5 h-2.5" /> Ver motivo
                          </button>
                        )}
                      </div>
                      <div className="text-sm font-medium text-white">{task.title}</div>
                      {task.description && (
                        <div className="text-[11px] text-tech-gray mt-1 leading-snug">
                          {task.description}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-tech-gray">
                        <span>
                          by <span className="text-white">{creator?.name ?? "—"}</span>
                        </span>
                        {assignee && (
                          <span className="flex items-center gap-1">
                            <ArrowRight className="w-2.5 h-2.5" />
                            <span className={ACCENT_TEXT[assignee.accent] ?? "text-white"}>
                              {assignee.name}
                            </span>
                          </span>
                        )}
                        <span>{new Date(task.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* expanded subtasks */}
                {isExpanded && subs.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="ml-6 mt-1 space-y-1.5"
                  >
                    {subs.map((sub) => (
                      <SubtaskRow
                        key={sub.id}
                        task={sub}
                        agents={agents}
                        departments={departments}
                        onViewFull={handleSetModal}
                        onWhyBlocked={(id) => setWhyBlockedTaskId(id)}
                        onPartial={(id) => setPartialTaskId(id)}
                      />
                    ))}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Full Conclusion Modal */}
      <AnimatePresence>
        {modalTask && (
          <ConclusionModal task={modalTask} onClose={() => setModalTaskId(null)} />
        )}
      </AnimatePresence>

      {/* Why Blocked? Modal — shows structured blockers (eliminates agent-invented diagnoses) */}
      <WhyBlockedModal
        open={!!whyBlockedTask}
        onClose={() => setWhyBlockedTaskId(null)}
        taskTitle={whyBlockedTask?.title ?? ""}
        blockers={whyBlockedTask?.blockers ?? []}
        task={whyBlockedTask ?? undefined}
        onConfigureNow={onNavigateToIntegrations}
      />

      {/* Partial Success Modal — shows WHY the task wasn't completed + resolution options */}
      <PartialSuccessModal
        open={!!partialTask}
        onClose={() => setPartialTaskId(null)}
        task={partialTask}
        agents={agents}
        resolutionOptions={partialTask ? getResolutionOptions(partialTask.id) : []}
        onResolve={(action, opts) => {
          if (!partialTask) return;
          const result = resolvePartialTask(partialTask.id, action, opts);
          if (result.ok) {
            setPartialTaskId(null);
          } else {
            alert(result.message);
          }
        }}
        onNavigateToIntegrations={onNavigateToIntegrations}
      />
    </div>
  );
}

function SubtaskRow({
  task,
  agents,
  departments,
  onViewFull,
  onWhyBlocked,
  onPartial,
}: {
  task: Task;
  agents: ReturnType<typeof useLovonStore.getState>["agents"];
  departments: ReturnType<typeof useLovonStore.getState>["departments"];
  onViewFull: (taskId: string) => void;
  onWhyBlocked: (taskId: string) => void;
  onPartial: (taskId: string) => void;
}) {
  const creator = agents.find((a) => a.id === task.createdBy);
  const assignee = task.assignedTo ? agents.find((a) => a.id === task.assignedTo) : null;
  const dept = task.departmentId ? departments.find((d) => d.id === task.departmentId) : null;
  const status = STATUS_META[task.status];
  const isWorking = task.status === "in_progress";

  return (
    <div className={`p-3 rounded-lg border ${status.border} bg-white/[0.02]`}>
      <div className="flex items-center gap-2 mb-1 flex-wrap">
        <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${status.bg} ${status.color} border ${status.border} flex items-center gap-1`}>
          {isWorking && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
          {status.label}
        </span>
        {dept && (
          <span className="text-[9px] font-mono text-tech-gray">
            {dept.emoji} {dept.name}
          </span>
        )}
        {task.result && task.status === "completed" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewFull(task.id);
            }}
            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neon-green/10 text-neon-green border border-neon-green/30 hover:bg-neon-green/20 flex items-center gap-1"
          >
            <FileText className="w-2.5 h-2.5" /> Ver conclusão completa
          </button>
        )}
        {task.result && task.status === "failed" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewFull(task.id);
            }}
            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-400/10 text-red-400 border border-red-400/30 hover:bg-red-400/20 flex items-center gap-1"
          >
            <FileText className="w-2.5 h-2.5" /> Ver erro
          </button>
        )}
        {task.status === "blocked" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWhyBlocked(task.id);
            }}
            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#ff8a3d]/10 text-[#ff8a3d] border border-[#ff8a3d]/30 hover:bg-[#ff8a3d]/20 flex items-center gap-1"
          >
            <HelpCircle className="w-2.5 h-2.5" /> Por quê?
            {task.blockers && task.blockers.length > 0 && (
              <span className="ml-0.5 px-1 rounded-full bg-[#ff8a3d]/20 text-[8px] font-bold">
                {task.blockers.length}
              </span>
            )}
          </button>
        )}
        {task.status === "in_review" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onWhyBlocked(task.id);
            }}
            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#ff8a3d]/10 text-[#ff8a3d] border border-[#ff8a3d]/30 hover:bg-[#ff8a3d]/20 flex items-center gap-1"
          >
            <HelpCircle className="w-2.5 h-2.5" /> Por quê?
          </button>
        )}
        {task.status === "partial_success" && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPartial(task.id);
            }}
            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#ff8a3d]/10 text-[#ff8a3d] border border-[#ff8a3d]/30 hover:bg-[#ff8a3d]/20 flex items-center gap-1"
          >
            <AlertCircle className="w-2.5 h-2.5" /> Ver motivo
          </button>
        )}
      </div>
      <div className="text-xs font-medium text-white">{task.title}</div>
      {task.description && (
        <div className="text-[10px] text-tech-gray mt-0.5 leading-snug">{task.description}</div>
      )}
      <div className="flex items-center gap-2 mt-1 text-[9px] font-mono text-tech-gray">
        <span>by {creator?.name ?? "—"}</span>
        {assignee && (
          <span className="flex items-center gap-0.5">
            <ArrowRight className="w-2 h-2" />
            <span className={ACCENT_TEXT[assignee.accent] ?? "text-white"}>
              {assignee.name}
            </span>
          </span>
        )}
      </div>
      {/* Inline preview of conclusion (first 200 chars) */}
      {task.result && task.status === "completed" && (
        <div className="mt-2 p-2 rounded bg-neon-green/5 border border-neon-green/15 text-[10px] text-tech-gray leading-relaxed line-clamp-3">
          {task.result.replace(/[#*`]/g, "").slice(0, 200)}...
        </div>
      )}
    </div>
  );
}

function ConclusionModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const agents = useLovonStore((s) => s.agents);
  const departments = useLovonStore((s) => s.departments);
  const creator = agents.find((a) => a.id === task.createdBy);
  const assignee = task.assignedTo ? agents.find((a) => a.id === task.assignedTo) : null;
  const dept = task.departmentId ? departments.find((d) => d.id === task.departmentId) : null;
  const status = STATUS_META[task.status];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 12 }}
        className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl glass-strong border border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-start justify-between p-5 border-b border-white/8">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${status.bg} ${status.color} border ${status.border}`}>
                {status.label}
              </span>
              {dept && (
                <span className="text-[10px] font-mono text-tech-gray">
                  {dept.emoji} {dept.name}
                </span>
              )}
              <span className="text-[10px] font-mono text-tech-gray">
                {task.result?.length ?? 0} caracteres
              </span>
            </div>
            <h3 className="text-base font-semibold text-white">{task.title}</h3>
            {task.description && (
              <p className="text-xs text-tech-gray mt-1">{task.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-tech-gray">
              <span>by {creator?.name ?? "—"}</span>
              {assignee && (
                <span className="flex items-center gap-1">
                  <ArrowRight className="w-2.5 h-2.5" />
                  <span className={ACCENT_TEXT[assignee.accent] ?? "text-white"}>
                    {assignee.name}
                  </span>
                </span>
              )}
              <span>{new Date(task.updatedAt).toLocaleString("pt-BR")}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-tech-gray hover:text-white shrink-0 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* body — rendered markdown */}
        <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
          {/* Mission Requirements Checklist */}
          {task.missionRequirements && task.missionRequirements.length > 0 && (
            <div className="mb-5 p-4 rounded-xl bg-violet-bg/30 border border-violet-subtle">
              <div className="text-xs font-mono uppercase text-violet-muted mb-3">Requisitos da Missão ({task.missionRequirements.length})</div>
              <div className="space-y-2">
                {task.missionRequirements.map((req) => (
                  <div key={req.id} className="flex items-start gap-2">
                    <span className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                      req.status === "done" ? "bg-neon-green/20 text-neon-green" :
                      req.status === "blocked" ? "bg-red-500/20 text-red-400" :
                      req.status === "in_progress" ? "bg-[#b6ff3d]/20 text-[#b6ff3d]" :
                      "bg-white/10 text-violet-muted"
                    }`}>
                      {req.status === "done" ? "✓" : req.status === "blocked" ? "✕" : req.status === "in_progress" ? "◐" : "○"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-white">{req.description}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-mono text-violet-muted uppercase">{req.type}</span>
                        {req.requiresCapability && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#ff8a3d]/10 text-[#ff8a3d] border border-[#ff8a3d]/20">
                            needs: {req.requiresCapability}
                          </span>
                        )}
                        {req.status === "blocked" && req.blockedReason && (
                          <span className="text-[9px] text-red-400">{req.blockedReason}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Task Comments */}
          {task.comments && task.comments.length > 0 && (
            <div className="mb-5 p-4 rounded-xl bg-violet-bg/20 border border-violet-subtle">
              <div className="text-xs font-mono uppercase text-violet-muted mb-3">Comentários ({task.comments.length})</div>
              <div className="space-y-2">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="p-2 rounded-lg bg-violet-bg/30 border border-violet-subtle">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-medium text-white">{comment.authorName}</span>
                      {comment.type === "system" && <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-white/5 text-violet-muted">SYSTEM</span>}
                      <span className="text-[9px] text-violet-muted">{new Date(comment.timestamp).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <p className="text-xs text-cream/90 leading-relaxed">{comment.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {task.result ? (
            <MarkdownRenderer content={task.result} />
          ) : (
            <div className="flex items-center justify-center py-12 text-tech-gray text-sm">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Gerando conclusão...
            </div>
          )}
        </div>

        {/* footer */}
        <div className="p-4 border-t border-white/8 flex items-center justify-between">
          <span className="text-[10px] font-mono text-tech-gray">
            Conclusão gerada por LLM real via Lovon
          </span>
          <button
            onClick={onClose}
            className="btn-pill btn-secondary-neon text-xs"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Lightweight markdown renderer (no external dep)
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: string[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="space-y-1 my-3 ml-4">
          {listItems.map((item, i) => (
            <li key={i} className="text-sm text-white/90 leading-relaxed flex gap-2">
              <span className="text-neon-green shrink-0">•</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
    inList = false;
  };

  const flushCode = () => {
    if (codeLines.length > 0) {
      elements.push(
        <pre
          key={`code-${elements.length}`}
          className="my-3 p-3 rounded-lg bg-black/40 border border-white/8 overflow-x-auto"
        >
          <code className="text-xs font-mono text-neon-green whitespace-pre-wrap">
            {codeLines.join("\n")}
          </code>
        </pre>
      );
      codeLines = [];
    }
    inCodeBlock = false;
  };

  for (const line of lines) {
    // Code block fences
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        flushCode();
      } else {
        flushList();
        inCodeBlock = true;
      }
      continue;
    }
    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h4 key={elements.length} className="text-sm font-semibold text-neon-green mt-4 mb-2">
          {renderInline(line.slice(4))}
        </h4>
      );
    } else if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h3 key={elements.length} className="text-base font-bold text-white mt-5 mb-2 border-b border-white/8 pb-1">
          {renderInline(line.slice(3))}
        </h3>
      );
    } else if (line.startsWith("# ")) {
      flushList();
      elements.push(
        <h2 key={elements.length} className="text-lg font-bold text-white mt-5 mb-3">
          {renderInline(line.slice(2))}
        </h2>
      );
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      inList = true;
      listItems.push(line.slice(2));
    } else if (line.trim() === "") {
      flushList();
      elements.push(<div key={elements.length} className="h-2" />);
    } else {
      flushList();
      elements.push(
        <p key={elements.length} className="text-sm text-white/90 leading-relaxed my-2">
          {renderInline(line)}
        </p>
      );
    }
  }
  flushList();
  flushCode();

  return <div className="space-y-0">{elements}</div>;
}

function renderInline(text: string): React.ReactNode {
  // Handle **bold**, *italic*, `code`
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // bold
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    const codeMatch = remaining.match(/`([^`]+)`/);
    const italicMatch = remaining.match(/\*([^*]+)\*/);

    const matches = [
      boldMatch ? { type: "bold" as const, match: boldMatch, text: boldMatch[1] } : null,
      codeMatch ? { type: "code" as const, match: codeMatch, text: codeMatch[1] } : null,
      italicMatch ? { type: "italic" as const, match: italicMatch, text: italicMatch[1] } : null,
    ].filter(Boolean) as { type: "bold" | "code" | "italic"; match: RegExpMatchArray; text: string }[];

    if (matches.length === 0) {
      parts.push(<span key={key++}>{remaining}</span>);
      break;
    }

    // Pick earliest match
    matches.sort((a, b) => (a.match.index ?? 0) - (b.match.index ?? 0));
    const earliest = matches[0];
    const idx = earliest.match.index ?? 0;

    if (idx > 0) {
      parts.push(<span key={key++}>{remaining.slice(0, idx)}</span>);
    }

    if (earliest.type === "bold") {
      parts.push(<strong key={key++} className="text-white font-semibold">{earliest.text}</strong>);
    } else if (earliest.type === "code") {
      parts.push(<code key={key++} className="px-1 py-0.5 rounded bg-black/40 text-neon-green text-xs font-mono">{earliest.text}</code>);
    } else if (earliest.type === "italic") {
      parts.push(<em key={key++} className="text-tech-gray italic">{earliest.text}</em>);
    }

    remaining = remaining.slice(idx + earliest.match[0].length);
  }

  return <>{parts}</>;
}

// === Partial Success Modal — shows WHY the task wasn't completed + resolution options ===
function PartialSuccessModal({
  open,
  onClose,
  task,
  agents,
  resolutionOptions,
  onResolve,
  onNavigateToIntegrations,
}: {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  agents: ReturnType<typeof useLovonStore.getState>["agents"];
  resolutionOptions: import("@/lib/lovon/store").ResolutionOption[];
  onResolve: (action: import("@/lib/lovon/store").ResolutionAction, options?: { newAgentId?: string; missingData?: Record<string, string> }) => void;
  onNavigateToIntegrations?: (capability: string) => void;
}) {
  const [reassignAgentId, setReassignAgentId] = useState("");
  const [missingDataValue, setMissingDataValue] = useState("");
  const [resolveResult, setResolveResult] = useState<string | null>(null);

  if (!task) return null;
  const reason = task.partialReason;

  const handleResolve = (option: import("@/lib/lovon/store").ResolutionOption) => {
    if (option.action === "reassign_agent") {
      if (!reassignAgentId) {
        alert("Selecione um agente para reatribuir.");
        return;
      }
      onResolve(option.action, { newAgentId: reassignAgentId });
    } else if (option.action === "provide_missing_data") {
      if (!missingDataValue.trim()) {
        alert("Preencha o dado faltante.");
        return;
      }
      onResolve(option.action, { missingData: { [option.missingDataField ?? "data"]: missingDataValue } });
    } else if (option.action === "configure_capability") {
      if (onNavigateToIntegrations && option.capability) {
        onNavigateToIntegrations(option.capability);
        onClose();
      }
    } else {
      onResolve(option.action);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 12 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 12 }}
            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl glass-strong border border-[#ff8a3d]/30 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-violet-subtle">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-[#ff8a3d]" />
                <div>
                  <h3 className="text-base font-semibold text-cream font-serif-display">Concluída Parcialmente — Por quê?</h3>
                  <p className="text-xs text-violet-muted mt-0.5">Task: <span className="text-beige">{task.title}</span></p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-violet-muted hover:text-cream">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
              {/* Reason */}
              {reason && (
                <div className="p-4 rounded-xl bg-[#ff8a3d]/5 border border-[#ff8a3d]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono uppercase text-[#ff8a3d]">Motivo reportado</span>
                    <span className="text-[9px] text-violet-muted">
                      por {reason.reportedBy} · {new Date(reason.reportedAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div className="text-sm text-cream font-semibold mb-2">{reason.summary}</div>
                  <div className="text-xs text-violet-muted whitespace-pre-wrap leading-relaxed">{reason.detail}</div>
                  {reason.unmetRequirements.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#ff8a3d]/20">
                      <div className="text-[10px] font-mono uppercase text-[#ff8a3d] mb-1">Requisitos não cumpridos</div>
                      <ul className="space-y-1">
                        {reason.unmetRequirements.map((req, i) => (
                          <li key={i} className="text-xs text-cream flex items-start gap-1.5">
                            <XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" /> {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Resolution attempts history */}
              {task.resolutionAttempts && task.resolutionAttempts.length > 0 && (
                <div>
                  <div className="text-[10px] font-mono uppercase text-violet-muted mb-2">Tentativas de resolução</div>
                  <div className="space-y-1">
                    {task.resolutionAttempts.map((att) => (
                      <div key={att.id} className="text-[11px] flex items-center gap-2 p-2 rounded-lg bg-violet-bg/30 border border-violet-subtle">
                        <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] uppercase ${
                          att.result === "success" ? "bg-neon-green/10 text-neon-green" :
                          att.result === "failed" ? "bg-red-400/10 text-red-400" :
                          "bg-[#ff8a3d]/10 text-[#ff8a3d]"
                        }`}>{att.action}</span>
                        <span className="text-violet-muted">{new Date(att.attemptedAt).toLocaleString("pt-BR")}</span>
                        {att.resultMessage && <span className="text-cream">{att.resultMessage}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution options */}
              <div>
                <div className="text-[10px] font-mono uppercase text-beige mb-2">Como resolver?</div>
                <div className="space-y-2">
                  {resolutionOptions.map((opt, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl border ${
                        opt.recommended
                          ? "bg-beige/5 border-beige/30"
                          : "bg-violet-bg/30 border-violet-subtle"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-cream">{opt.label}</span>
                          {opt.recommended && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neon-green/10 text-neon-green border border-neon-green/20">
                              ★ Recomendado
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-[11px] text-violet-muted mb-2">{opt.description}</div>

                      {/* Action-specific inputs */}
                      {opt.action === "reassign_agent" && (
                        <select
                          value={reassignAgentId}
                          onChange={(e) => setReassignAgentId(e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg bg-violet-bg/40 border border-violet-subtle text-xs text-cream focus:outline-none focus:border-beige/30 mb-2"
                        >
                          <option value="">Selecione um agente...</option>
                          {agents.filter((a) => a.role !== "ceo").map((a) => (
                            <option key={a.id} value={a.id}>{a.name} ({a.specialty})</option>
                          ))}
                        </select>
                      )}
                      {opt.action === "provide_missing_data" && (
                        <input
                          type="text"
                          value={missingDataValue}
                          onChange={(e) => setMissingDataValue(e.target.value)}
                          placeholder={opt.missingDataPlaceholder ?? "Digite o valor..."}
                          className="w-full px-2 py-1.5 rounded-lg bg-violet-bg/40 border border-violet-subtle text-xs text-cream focus:outline-none focus:border-beige/30 mb-2"
                        />
                      )}

                      <button
                        onClick={() => handleResolve(opt)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                          opt.recommended
                            ? "bg-beige/20 text-beige border border-beige/30 hover:bg-beige/30"
                            : "bg-white/5 text-violet-muted border border-violet-subtle hover:text-cream"
                        }`}
                      >
                        Executar
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Result feedback */}
              {resolveResult && (
                <div className="p-3 rounded-lg bg-neon-green/10 border border-neon-green/30 text-xs text-neon-green">
                  {resolveResult}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-violet-subtle flex items-center justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-beige/10 border border-beige/30 text-beige hover:bg-beige/20"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
