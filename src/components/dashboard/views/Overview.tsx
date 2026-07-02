"use client";

import { motion } from "framer-motion";
import {
  Bot,
  Zap,
  DollarSign,
  Activity,
  TrendingUp,
  ArrowRight,
  Cpu,
  Crown,
  ListTodo,
  Radio,
} from "lucide-react";
import { useLovonStore } from "@/lib/lovon/store";

type View = "overview" | "ceo" | "company" | "tasks" | "activity" | "agents" | "create" | "market" | "routing" | "analytics" | "settings";

interface Props {
  onNavigate: (v: View) => void;
}

export function DashboardOverview({ onNavigate }: Props) {
  const company = useLovonStore((s) => s.company);
  const agents = useLovonStore((s) => s.agents);
  const departments = useLovonStore((s) => s.departments);
  const tasks = useLovonStore((s) => s.tasks);
  const activity = useLovonStore((s) => s.activity);

  const ceo = agents.find((a) => a.role === "ceo");
  const subagents = agents.filter((a) => a.role !== "ceo");
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const activeTasks = tasks.filter((t) => t.status === "in_progress" || t.status === "delegated").length;

  const STATS = [
    { label: "Agentes totais", value: agents.length, delta: `${subagents.length} subagentes`, icon: Bot, accent: "text-neon-green" },
    { label: "Departamentos", value: departments.length, delta: `${departments.filter(d => d.headId).length} com head`, icon: Cpu, accent: "text-neon-blue" },
    { label: "Tasks ativas", value: activeTasks, delta: `${completedTasks} concluídas`, icon: Activity, accent: "text-[#b6ff3d]" },
    { label: "Custo (mês)", value: "R$ 0", delta: "100% free tier", icon: DollarSign, accent: "text-neon-purple" },
  ];

  const QUICK_ACTIONS = [
    { label: "CEO Console", desc: "Dê missão ao CEO", icon: Crown, view: "ceo" as View, accent: "text-neon-green" },
    { label: "Ver empresa", desc: "Organograma e depts", icon: Bot, view: "company" as View, accent: "text-neon-blue" },
    { label: "Ver tasks", desc: `${tasks.length} tasks`, icon: ListTodo, view: "tasks" as View, accent: "text-neon-purple" },
    { label: "Activity feed", desc: `${activity.length} eventos`, icon: Radio, view: "activity" as View, accent: "text-[#b6ff3d]" },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* welcome */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Bem-vindo à {company?.name ?? "Lovon"} 👋
          </h1>
          <p className="text-sm text-tech-gray mt-1 max-w-2xl">
            {company?.mission ?? "Sua empresa de agentes de IA."}
            {" — "}
            <button onClick={() => onNavigate("ceo")} className="text-neon-green hover:underline">
              dê uma missão ao CEO →
            </button>
          </p>
        </div>
        <button
          onClick={() => onNavigate("ceo")}
          className="btn-pill btn-primary-neon text-sm"
        >
          <Crown className="w-4 h-4" />
          Abrir CEO Console
        </button>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-5 rounded-2xl glass border border-white/8"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg glass flex items-center justify-center ${s.accent}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <TrendingUp className="w-3.5 h-3.5 text-tech-gray" />
            </div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-tech-gray mt-1">{s.label}</div>
            <div className={`text-[10px] mt-1 font-mono ${s.accent}`}>{s.delta}</div>
          </motion.div>
        ))}
      </div>

      {/* quick actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl glass border border-white/8">
          <h3 className="text-base font-semibold text-white mb-4">Ações rápidas</h3>
          <div className="space-y-2">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => onNavigate(a.view)}
                className="w-full flex items-center justify-between p-3 rounded-lg border border-white/8 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg glass flex items-center justify-center ${a.accent}`}>
                    <a.icon className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm text-white">{a.label}</div>
                    <div className="text-[10px] text-tech-gray">{a.desc}</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-tech-gray group-hover:text-white transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* CEO status */}
        <div className="p-6 rounded-2xl glass border border-neon-green/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Status do CEO</h3>
            <span className="flex items-center gap-1 text-[10px] font-mono text-neon-green">
              <span className={`w-1.5 h-1.5 rounded-full ${
                ceo?.status === "thinking" ? "bg-[#00E0FF]" : ceo?.status === "working" ? "bg-[#b6ff3d]" : "bg-neon-green"
              } animate-blink-status`} />
              {ceo?.status === "thinking" ? "PENSANDO" : ceo?.status === "working" ? "EXECUTANDO" : "ATIVO"}
            </span>
          </div>
          {ceo ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00F5A0] to-[#00E0FF] flex items-center justify-center">
                  <Crown className="w-6 h-6 text-deep-black" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{ceo.name}</div>
                  <div className="text-[10px] text-tech-gray font-mono">{ceo.model} · {ceo.tier}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-2.5 rounded-lg bg-black/30 text-center">
                  <div className="text-lg font-bold text-white">{subagents.length}</div>
                  <div className="text-[9px] text-tech-gray uppercase">Subagents</div>
                </div>
                <div className="p-2.5 rounded-lg bg-black/30 text-center">
                  <div className="text-lg font-bold text-neon-green">{ceo.tasksCompleted}</div>
                  <div className="text-[9px] text-tech-gray uppercase">Feitas</div>
                </div>
                <div className="p-2.5 rounded-lg bg-black/30 text-center">
                  <div className="text-lg font-bold text-white">{activeTasks}</div>
                  <div className="text-[9px] text-tech-gray uppercase">Ativas</div>
                </div>
              </div>
              <button
                onClick={() => onNavigate("ceo")}
                className="w-full py-2 rounded-lg text-xs font-semibold bg-neon-green/10 border border-neon-green/30 text-neon-green hover:bg-neon-green/15 transition-all"
              >
                Abrir CEO Console →
              </button>
            </>
          ) : (
            <div className="text-sm text-tech-gray">CEO não encontrado.</div>
          )}
        </div>
      </div>

      {/* recent activity */}
      <div className="p-6 rounded-2xl glass border border-white/8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Atividade recente</h3>
          <button
            onClick={() => onNavigate("activity")}
            className="text-xs text-neon-green hover:underline flex items-center gap-1"
          >
            Ver tudo <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
          {activity.length === 0 && (
            <div className="text-center py-8 text-sm text-tech-gray">
              Nenhuma atividade ainda. Vá ao CEO Console e dê uma missão.
            </div>
          )}
          {activity.slice(0, 8).map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/[0.02]">
              <span
                className="text-base shrink-0"
                style={{ color: entry.accent === "green" ? "#00F5A0" : entry.accent === "blue" ? "#00E0FF" : entry.accent === "purple" ? "#a855f7" : entry.accent === "acid" ? "#b6ff3d" : "#ff8a3d" }}
              >
                ●
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-white leading-snug">
                  <span className="font-semibold">{entry.agentName}</span> — {entry.message}
                </div>
                <div className="text-[10px] text-tech-gray/60 font-mono mt-0.5">
                  {new Date(entry.timestamp).toLocaleTimeString("pt-BR")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
