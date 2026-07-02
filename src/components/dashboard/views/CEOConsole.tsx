"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  Send,
  Sparkles,
  Zap,
  Activity,
  Bot,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useLovonStore, Activity as ActivityEntry } from "@/lib/lovon/store";
import { runCEOMission } from "@/lib/lovon/engine";

const MISSION_PRESETS = [
  "Lançar MVP de plataforma SaaS B2B em 90 dias",
  "Aumentar receita em 50% no próximo trimestre",
  "Expandir operação para o mercado internacional",
  "Estruturar time de vendas outbound",
  "Criar campanha de lançamento de produto",
];

const ACTION_META: Record<
  ActivityEntry["action"],
  { label: string; color: string; bg: string }
> = {
  created: { label: "create", color: "text-neon-green", bg: "bg-neon-green/10" },
  delegated: { label: "delegate", color: "text-neon-blue", bg: "bg-neon-blue/10" },
  started: { label: "start", color: "text-[#b6ff3d]", bg: "bg-[#b6ff3d]/10" },
  completed: { label: "done", color: "text-neon-green", bg: "bg-neon-green/10" },
  failed: { label: "fail", color: "text-red-400", bg: "bg-red-400/10" },
  spawned: { label: "spawn", color: "text-neon-purple", bg: "bg-[#a855f7]/10" },
  thinking: { label: "think", color: "text-[#00E0FF]", bg: "bg-[#00E0FF]/10" },
  message: { label: "msg", color: "text-tech-gray", bg: "bg-white/5" },
};

const ACCENT_TEXT: Record<string, string> = {
  green: "text-neon-green",
  blue: "text-neon-blue",
  purple: "text-neon-purple",
  acid: "text-[#b6ff3d]",
  orange: "text-[#ff8a3d]",
};

export function CEOConsole() {
  const company = useLovonStore((s) => s.company);
  const agents = useLovonStore((s) => s.agents);
  const activity = useLovonStore((s) => s.activity);
  const tasks = useLovonStore((s) => s.tasks);

  const [mission, setMission] = useState("");
  const [running, setRunning] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const activityEndRef = useRef<HTMLDivElement>(null);

  const ceo = agents.find((a) => a.role === "ceo");
  const subagents = agents.filter((a) => a.role !== "ceo");

  // Auto-scroll activity feed when new entries arrive
  useEffect(() => {
    activityEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activity.length]);

  const handleRun = async () => {
    if (!mission.trim() || running) return;
    setRunning(true);
    try {
      await runCEOMission(mission.trim());
    } catch (e) {
      console.error(e);
    } finally {
      setRunning(false);
    }
  };

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const activeTasks = tasks.filter((t) => t.status === "in_progress" || t.status === "delegated").length;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-5 h-5 text-neon-green" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Console do CEO</h1>
          {running && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neon-green/10 border border-neon-green/30 text-[10px] font-mono text-neon-green">
              <Loader2 className="w-2.5 h-2.5 animate-spin" /> EXECUTANDO
            </span>
          )}
        </div>
        <p className="text-sm text-tech-gray">
          {company?.name} — Dê uma missão ao CEO. Ele vai analisar, criar subagentes, delegar tasks e coordenar a execução ao vivo.
        </p>
      </div>

      {/* mission input */}
      <div className="p-5 rounded-2xl glass border border-white/8">
        <div className="flex items-center gap-2 mb-3 text-xs font-mono text-tech-gray uppercase">
          <Sparkles className="w-3.5 h-3.5 text-neon-green" />
          Nova missão para o CEO
        </div>
        <div className="flex gap-3 flex-wrap sm:flex-nowrap">
          <input
            type="text"
            value={mission}
            onChange={(e) => setMission(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRun()}
            placeholder="Ex: Lançar MVP de plataforma SaaS B2B em 90 dias"
            disabled={running}
            className="flex-1 min-w-[260px] px-4 py-3 rounded-xl bg-black/40 border border-white/8 text-sm text-white placeholder:text-tech-gray focus:outline-none focus:border-neon-green/40 disabled:opacity-50"
          />
          <button
            onClick={handleRun}
            disabled={!mission.trim() || running}
            className="btn-pill btn-primary-neon text-sm disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {running ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Executando...</>
            ) : (
              <><Send className="w-3.5 h-3.5" /> Delegar ao CEO</>
            )}
          </button>
        </div>

        {/* mission presets */}
        <div className="mt-3 flex flex-wrap gap-2">
          {MISSION_PRESETS.map((m) => (
            <button
              key={m}
              onClick={() => setMission(m)}
              disabled={running}
              className="px-2.5 py-1 rounded-md text-xs bg-white/5 border border-white/8 text-tech-gray hover:text-white hover:border-neon-green/30 transition-all disabled:opacity-40"
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* live grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* activity feed */}
        <div className="lg:col-span-2 p-5 rounded-2xl glass border border-white/8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-neon-green" />
              <h3 className="text-sm font-semibold text-white">Feed de atividade ao vivo</h3>
            </div>
            <span className="text-[10px] font-mono text-tech-gray">
              {activity.length} eventos
            </span>
          </div>

          <div
            ref={feedRef}
            className="space-y-2 max-h-[460px] overflow-y-auto pr-2 no-scrollbar"
          >
            <AnimatePresence initial={false}>
              {activity.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16 text-tech-gray text-sm"
                >
                  <Bot className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  Nenhuma atividade ainda. Dê uma missão ao CEO acima.
                </motion.div>
              )}
              {activity.map((entry) => {
                const meta = ACTION_META[entry.action];
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/[0.02]"
                  >
                    <span
                      className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded shrink-0 ${meta.bg} ${meta.color} border border-current/20`}
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
                      <div className="text-[10px] text-tech-gray/60 font-mono mt-0.5">
                        {new Date(entry.timestamp).toLocaleTimeString("pt-BR")}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={activityEndRef} />
          </div>
        </div>

        {/* live stats */}
        <div className="space-y-4">
          {/* CEO card */}
          {ceo && (
            <div className="p-4 rounded-2xl glass border border-neon-green/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F5A0] to-[#00E0FF] flex items-center justify-center">
                  <Crown className="w-5 h-5 text-deep-black" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{ceo.name}</div>
                  <div className="text-[10px] font-mono text-tech-gray">CEO · {ceo.model}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full animate-blink-status ${
                    ceo.status === "thinking"
                      ? "bg-[#00E0FF]"
                      : ceo.status === "working"
                      ? "bg-[#b6ff3d]"
                      : "bg-neon-green"
                  }`}
                />
                <span className="text-[10px] font-mono uppercase text-tech-gray">
                  {ceo.status === "thinking"
                    ? "Pensando..."
                    : ceo.status === "working"
                    ? "Executando..."
                    : "Ativo"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                <div className="p-2 rounded-lg bg-black/30">
                  <div className="text-sm font-bold text-white">{subagents.length}</div>
                  <div className="text-[9px] text-tech-gray uppercase">Subagentes</div>
                </div>
                <div className="p-2 rounded-lg bg-black/30">
                  <div className="text-sm font-bold text-white">{ceo.tasksCompleted}</div>
                  <div className="text-[9px] text-tech-gray uppercase">Concluídas</div>
                </div>
              </div>
            </div>
          )}

          {/* task stats */}
          <div className="p-4 rounded-2xl glass border border-white/8">
            <div className="text-[10px] font-mono text-tech-gray uppercase mb-3">
              Tasks
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-tech-gray">Em andamento</span>
                <span className="text-sm font-mono text-[#b6ff3d]">{activeTasks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-tech-gray">Concluídas</span>
                <span className="text-sm font-mono text-neon-green">{completedTasks}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-tech-gray">Total</span>
                <span className="text-sm font-mono text-white">{tasks.length}</span>
              </div>
            </div>
          </div>

          {/* subagents list */}
          <div className="p-4 rounded-2xl glass border border-white/8">
            <div className="text-[10px] font-mono text-tech-gray uppercase mb-3">
              Subagentes ativos
            </div>
            <div className="space-y-1.5 max-h-44 overflow-y-auto no-scrollbar">
              {subagents.length === 0 && (
                <div className="text-xs text-tech-gray italic py-4 text-center">
                  Nenhum subagente ainda. Execute uma missão.
                </div>
              )}
              {subagents.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-xs">
                  <span className={`text-base ${ACCENT_TEXT[a.accent] ?? "text-white"}`}>
                    {a.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-white truncate">{a.name}</div>
                    <div className="text-[9px] text-tech-gray font-mono">{a.specialty}</div>
                  </div>
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      a.status === "working"
                        ? "bg-[#b6ff3d] animate-blink-status"
                        : a.status === "thinking"
                        ? "bg-[#00E0FF] animate-blink-status"
                        : "bg-neon-green"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
