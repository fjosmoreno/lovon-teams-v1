"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Plus,
  Trash2,
  Crown,
  Users,
  Target,
  Settings as SettingsIcon,
} from "lucide-react";
import { useLovonStore } from "@/lib/lovon/store";

const ACCENT_TEXT: Record<string, string> = {
  green: "text-neon-green",
  blue: "text-neon-blue",
  purple: "text-neon-purple",
  acid: "text-[#b6ff3d]",
  orange: "text-[#ff8a3d]",
};

const ACCENT_BORDER: Record<string, string> = {
  green: "border-neon-green/30",
  blue: "border-neon-blue/30",
  purple: "border-[#a855f7]/30",
  acid: "border-[#b6ff3d]/30",
  orange: "border-[#ff8a3d]/30",
};

export function Company() {
  const company = useLovonStore((s) => s.company);
  const agents = useLovonStore((s) => s.agents);
  const departments = useLovonStore((s) => s.departments);
  const tasks = useLovonStore((s) => s.tasks);
  const logActivity = useLovonStore((s) => s.logActivity);

  const [showAddDept, setShowAddDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState("");

  const ceo = agents.find((a) => a.role === "ceo");
  const regularDepts = departments.filter((d) => d.id !== "executive");
  const totalAgents = agents.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;

  const handleAddDept = () => {
    if (!newDeptName.trim() || !ceo) return;
    const id = `dept_${Date.now().toString(36)}`;
    useLovonStore.setState((s) => ({
      departments: [
        ...s.departments,
        {
          id,
          name: newDeptName.trim(),
          emoji: "○",
          accent: "blue",
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
    logActivity({
      agentId: ceo.id,
      agentName: ceo.name,
      action: "created",
      message: `Criou novo departamento: ${newDeptName.trim()}.`,
      accent: "blue",
    });
    setNewDeptName("");
    setShowAddDept(false);
  };

  const handleDeleteDept = (deptId: string) => {
    useLovonStore.setState((s) => ({
      departments: s.departments.filter((d) => d.id !== deptId),
      agents: s.agents.map((a) =>
        a.departmentId === deptId ? { ...a, departmentId: null } : a
      ),
    }));
  };

  if (!company) {
    return (
      <div className="text-center py-16 text-tech-gray">
        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
        Crie sua empresa primeiro.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-5 h-5 text-neon-green" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{company.name}</h1>
        </div>
        <p className="text-sm text-tech-gray">
          <Target className="w-3.5 h-3.5 inline mr-1.5 text-neon-green" />
          {company.mission}
        </p>
      </div>

      {/* company stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Departamentos", value: departments.length, icon: Building2, accent: "text-neon-green" },
          { label: "Agentes totais", value: totalAgents, icon: Users, accent: "text-neon-blue" },
          { label: "Tasks concluídas", value: completedTasks, icon: Target, accent: "text-neon-purple" },
          { label: "Orçamento", value: company.budget === "free" ? "R$ 0" : company.budget === "unlimited" ? "∞" : `R$ ${company.monthlyCap}`, icon: SettingsIcon, accent: "text-[#b6ff3d]" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-5 rounded-2xl glass border border-white/8"
          >
            <div className={`w-9 h-9 rounded-lg glass flex items-center justify-center ${s.accent} mb-3`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-tech-gray mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Org Chart */}
      <div className="p-6 rounded-2xl glass border border-white/8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold text-white">Organograma</h3>
          <button
            onClick={() => setShowAddDept(!showAddDept)}
            className="btn-pill btn-secondary-neon text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Departamento
          </button>
        </div>

        {/* add dept form */}
        {showAddDept && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-5 p-4 rounded-xl bg-black/30 border border-white/8 flex gap-2 flex-wrap"
          >
            <input
              type="text"
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              placeholder="Nome do departamento (ex: Finanças)"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAddDept()}
              className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-black/40 border border-white/8 text-sm text-white placeholder:text-tech-gray focus:outline-none focus:border-neon-green/40"
            />
            <button onClick={handleAddDept} className="btn-pill btn-primary-neon text-xs">
              Criar
            </button>
          </motion.div>
        )}

        {/* CEO node */}
        {ceo && (
          <div className="flex flex-col items-center mb-6">
            <div className="relative p-4 rounded-2xl glass-strong border border-neon-green/30 w-64">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00F5A0] to-[#00E0FF] flex items-center justify-center">
                  <Crown className="w-6 h-6 text-deep-black" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-neon-green uppercase">CEO</div>
                  <div className="text-sm font-semibold text-white">{ceo.name}</div>
                  <div className="text-[10px] text-tech-gray">{ceo.model}</div>
                </div>
              </div>
            </div>
            {/* connector */}
            <div className="w-px h-8 bg-white/10" />
          </div>
        )}

        {/* departments grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {regularDepts.map((dept) => {
            const head = dept.headId ? agents.find((a) => a.id === dept.headId) : null;
            const members = agents.filter(
              (a) => a.departmentId === dept.id && a.role === "worker"
            );
            const deptTasks = tasks.filter((t) => t.departmentId === dept.id);
            const completed = deptTasks.filter((t) => t.status === "completed").length;

            return (
              <div
                key={dept.id}
                className={`p-4 rounded-xl glass border ${ACCENT_BORDER[dept.accent] ?? "border-white/8"}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{dept.emoji}</span>
                    <div>
                      <div className="text-sm font-semibold text-white">{dept.name}</div>
                      <div className="text-[10px] text-tech-gray font-mono">
                        {dept.agentIds.length} agente(s) · {completed} tarefas
                      </div>
                    </div>
                  </div>
                  {dept.id !== "executive" && (
                    <button
                      onClick={() => handleDeleteDept(dept.id)}
                      className="w-7 h-7 rounded-md hover:bg-red-500/10 flex items-center justify-center text-tech-gray hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* head */}
                {head ? (
                  <div className="p-2 rounded-lg bg-black/30 border border-white/5 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-base ${ACCENT_TEXT[head.accent] ?? "text-white"}`}>
                        {head.emoji}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">{head.name}</div>
                        <div className="text-[9px] text-tech-gray font-mono">LÍDER · {head.model}</div>
                      </div>
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          head.status === "working"
                            ? "bg-[#b6ff3d] animate-blink-status"
                            : head.status === "thinking"
                            ? "bg-[#00E0FF] animate-blink-status"
                            : "bg-neon-green"
                        }`}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-2 rounded-lg bg-black/20 border border-dashed border-white/10 mb-2 text-center text-[10px] text-tech-gray">
                    Sem líder — execute uma missão no Console do CEO
                  </div>
                )}

                {/* members */}
                {members.length > 0 && (
                  <div className="space-y-1">
                    {members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-2 p-1.5 rounded-md bg-white/[0.02]"
                      >
                        <span className={`text-xs ${ACCENT_TEXT[m.accent] ?? "text-white"}`}>
                          {m.emoji}
                        </span>
                        <span className="text-[11px] text-white truncate flex-1">{m.name}</span>
                        <span
                          className={`w-1 h-1 rounded-full ${
                            m.status === "working"
                              ? "bg-[#b6ff3d] animate-blink-status"
                              : "bg-neon-green"
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* kpis */}
                <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-3 gap-1 text-center">
                  <div>
                    <div className="text-[10px] font-mono text-white">{deptTasks.length}</div>
                    <div className="text-[8px] text-tech-gray uppercase">Tarefas</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-neon-green">{completed}</div>
                    <div className="text-[8px] text-tech-gray uppercase">Feitas</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-tech-gray">{dept.agentIds.length}</div>
                    <div className="text-[8px] text-tech-gray uppercase">Agentes</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
