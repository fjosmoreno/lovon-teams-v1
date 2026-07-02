"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  History,
  Bot,
  ListTodo,
  Building2,
  Crown,
  Filter,
  Search,
  ArrowRight,
  Check,
} from "lucide-react";
import { useLovonStore, EditHistoryEntry, EditAction } from "@/lib/lovon/store";

const ACTION_META: Record<EditAction, { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }> = {
  agent_created: { label: "Agente criado", color: "text-neon-green", bg: "bg-neon-green/10", icon: Bot },
  agent_updated: { label: "Agente editado", color: "text-neon-blue", bg: "bg-neon-blue/10", icon: Bot },
  agent_deleted: { label: "Agente removido", color: "text-red-400", bg: "bg-red-400/10", icon: Bot },
  agent_status_toggled: { label: "Status alterado", color: "text-[#b6ff3d]", bg: "bg-[#b6ff3d]/10", icon: Bot },
  agent_moved_department: { label: "Depto alterado", color: "text-neon-purple", bg: "bg-[#a855f7]/10", icon: Building2 },
  task_reassigned: { label: "Tarefa reatribuída", color: "text-neon-blue", bg: "bg-neon-blue/10", icon: ListTodo },
  task_created: { label: "Tarefa criada", color: "text-neon-green", bg: "bg-neon-green/10", icon: ListTodo },
  task_completed: { label: "Tarefa concluída", color: "text-neon-green", bg: "bg-neon-green/10", icon: Check },
  department_created: { label: "Depto criado", color: "text-neon-green", bg: "bg-neon-green/10", icon: Building2 },
  department_deleted: { label: "Depto removido", color: "text-red-400", bg: "bg-red-400/10", icon: Building2 },
  company_created: { label: "Empresa criada", color: "text-beige", bg: "bg-beige/10", icon: Crown },
};

const TARGET_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  agent: Bot,
  task: ListTodo,
  department: Building2,
  company: Crown,
};

const FIELD_LABELS: Record<string, string> = {
  name: "Nome",
  specialty: "Especialidade",
  model: "Modelo",
  emoji: "Avatar",
  accent: "Cor",
  status: "Status",
  departmentId: "Departamento",
  department: "Departamento",
  departmentId: "Departamento",
  "responsável": "Responsável",
};

export function AuditLog() {
  const editHistory = useLovonStore((s) => s.editHistory);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "agent" | "task" | "department">("all");

  const filtered = editHistory.filter((e) => {
    if (filterType !== "all" && e.targetType !== filterType) return false;
    if (search) {
      const lower = search.toLowerCase();
      return (
        e.summary.toLowerCase().includes(lower) ||
        e.target.toLowerCase().includes(lower) ||
        e.actor.toLowerCase().includes(lower)
      );
    }
    return true;
  });

  const stats = {
    total: editHistory.length,
    agents: editHistory.filter((e) => e.targetType === "agent").length,
    tasks: editHistory.filter((e) => e.targetType === "task").length,
    today: editHistory.filter((e) => {
      const today = new Date();
      const entryDate = new Date(e.timestamp);
      return (
        entryDate.getDate() === today.getDate() &&
        entryDate.getMonth() === today.getMonth() &&
        entryDate.getFullYear() === today.getFullYear()
      );
    }).length,
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <History className="w-5 h-5 text-beige" />
          <h1 className="text-2xl sm:text-3xl font-bold text-cream font-serif-display">Histórico de Edições</h1>
        </div>
        <p className="text-sm text-violet-muted">
          Audit log imutável. Toda edição, criação, exclusão e reatribuição é registrada com responsável, campo alterado e valor anterior.
        </p>
      </div>

      {/* stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total de eventos", value: stats.total, icon: History, accent: "text-cream" },
          { label: "Edições de agentes", value: stats.agents, icon: Bot, accent: "text-neon-blue" },
          { label: "Alterações em tarefas", value: stats.tasks, icon: ListTodo, accent: "text-neon-purple" },
          { label: "Hoje", value: stats.today, icon: Check, accent: "text-neon-green" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-xl glass border border-violet-subtle"
          >
            <s.icon className={`w-4 h-4 ${s.accent} mb-2`} />
            <div className="text-xl font-bold text-cream">{s.value}</div>
            <div className="text-[10px] text-violet-muted uppercase">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-muted" />
          <input
            type="text"
            placeholder="Buscar no histórico..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream placeholder:text-violet-muted focus:outline-none focus:border-beige/30"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-violet-bg/40 border border-violet-subtle">
          {(["all", "agent", "task", "department"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filterType === f
                  ? "bg-beige/15 text-beige"
                  : "text-violet-muted hover:text-cream"
              }`}
            >
              {f === "all" ? "Tudo" : f === "agent" ? "Agentes" : f === "task" ? "Tarefas" : "Departamentos"}
            </button>
          ))}
        </div>
      </div>

      {/* timeline */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <History className="w-12 h-12 mx-auto text-violet-muted/30 mb-3" />
          <p className="text-sm text-violet-muted">
            {editHistory.length === 0
              ? "Nenhuma edição registrada ainda. Edite agentes ou reatribua tarefas para gerar histórico."
              : "Nenhum resultado para o filtro aplicado."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry, i) => {
            const meta = ACTION_META[entry.action] ?? ACTION_META.agent_updated;
            const TargetIcon = TARGET_ICON[entry.targetType] ?? Bot;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className="flex items-start gap-3 p-3 rounded-xl glass border border-violet-subtle hover:bg-violet-dark/30 transition-all"
              >
                <div className={`w-9 h-9 rounded-lg ${meta.bg} border border-violet-subtle flex items-center justify-center shrink-0`}>
                  <meta.icon className={`w-4 h-4 ${meta.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${meta.bg} ${meta.color} border border-current/20`}>
                      {meta.label}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-violet-muted">
                      <TargetIcon className="w-2.5 h-2.5" />
                      {entry.targetType}
                    </span>
                    <span className="text-[10px] font-mono text-violet-muted">
                      por {entry.actor}
                    </span>
                  </div>
                  <div className="text-sm text-cream">{entry.summary}</div>
                  {/* changes detail */}
                  {entry.changes.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {entry.changes.map((c, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[10px] font-mono">
                          <span className="text-violet-muted">{FIELD_LABELS[c.field] ?? c.field}:</span>
                          {c.from && (
                            <span className="px-1.5 py-0.5 rounded bg-red-400/10 text-red-400/80 line-through">
                              {c.from.length > 40 ? c.from.slice(0, 40) + "..." : c.from}
                            </span>
                          )}
                          <ArrowRight className="w-2.5 h-2.5 text-violet-muted" />
                          <span className="px-1.5 py-0.5 rounded bg-neon-green/10 text-neon-green">
                            {c.to.length > 40 ? c.to.slice(0, 40) + "..." : c.to}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="text-[9px] text-violet-muted/60 font-mono mt-1">
                    {new Date(entry.timestamp).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
