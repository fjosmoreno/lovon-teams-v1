"use client";

import { motion } from "framer-motion";
import { Activity as ActivityIcon, Radio } from "lucide-react";
import { useLovonStore, Activity as ActivityEntry } from "@/lib/lovon/store";

const ACTION_META: Record<
  ActivityEntry["action"],
  { label: string; color: string; bg: string }
> = {
  created: { label: "criou", color: "text-neon-green", bg: "bg-neon-green/10" },
  delegated: { label: "delegou", color: "text-neon-blue", bg: "bg-neon-blue/10" },
  started: { label: "iniciou", color: "text-[#b6ff3d]", bg: "bg-[#b6ff3d]/10" },
  completed: { label: "concluiu", color: "text-neon-green", bg: "bg-neon-green/10" },
  failed: { label: "falhou", color: "text-red-400", bg: "bg-red-400/10" },
  spawned: { label: "criou", color: "text-neon-purple", bg: "bg-[#a855f7]/10" },
  thinking: { label: "pensando", color: "text-[#00E0FF]", bg: "bg-[#00E0FF]/10" },
  message: { label: "msg", color: "text-tech-gray", bg: "bg-white/5" },
};

const ACCENT_TEXT: Record<string, string> = {
  green: "text-neon-green",
  blue: "text-neon-blue",
  purple: "text-neon-purple",
  acid: "text-[#b6ff3d]",
  orange: "text-[#ff8a3d]",
};

export function ActivityFeed() {
  const activity = useLovonStore((s) => s.activity);
  const agents = useLovonStore((s) => s.agents);

  // Group by agent
  const byAgent = agents
    .map((a) => ({
      agent: a,
      entries: activity.filter((e) => e.agentId === a.id),
    }))
    .filter((g) => g.entries.length > 0);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Radio className="w-5 h-5 text-neon-green animate-blink-status" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Activity Feed</h1>
        </div>
        <p className="text-sm text-tech-gray">
          Stream ao vivo de todas as ações dos agentes. {activity.length} eventos registrados.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* main feed */}
        <div className="lg:col-span-2 p-5 rounded-2xl glass border border-white/8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ActivityIcon className="w-4 h-4 text-neon-green" />
              <h3 className="text-sm font-semibold text-white">Linha do tempo</h3>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-mono text-neon-green">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-blink-status" />
              AO VIVO
            </span>
          </div>

          <div className="space-y-1 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
            {activity.length === 0 && (
              <div className="text-center py-16 text-tech-gray text-sm">
                <ActivityIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
                Nenhuma atividade ainda.
              </div>
            )}
            {activity.map((entry, i) => {
              const meta = ACTION_META[entry.action];
              const isLast = i === 0;
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`relative flex items-start gap-3 p-3 rounded-lg ${
                    isLast ? "bg-neon-green/5 border border-neon-green/15" : "hover:bg-white/[0.02]"
                  }`}
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
        </div>

        {/* sidebar — activity by agent */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl glass border border-white/8">
            <h3 className="text-sm font-semibold text-white mb-3">Atividade por agente</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
              {byAgent.length === 0 && (
                <div className="text-xs text-tech-gray italic py-4 text-center">
                  Sem atividade ainda.
                </div>
              )}
              {byAgent.map(({ agent, entries }) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]"
                >
                  <span className={`text-base ${ACCENT_TEXT[agent.accent] ?? "text-white"}`}>
                    {agent.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white truncate">{agent.name}</div>
                    <div className="text-[9px] text-tech-gray font-mono">
                      {entries.length} ações
                    </div>
                  </div>
                  <div
                    className={`text-[10px] font-mono ${ACCENT_TEXT[agent.accent] ?? "text-white"}`}
                  >
                    {entries.length}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl glass border border-white/8">
            <h3 className="text-sm font-semibold text-white mb-3">Distribuição de ações</h3>
            <div className="space-y-2">
              {Object.entries(ACTION_META).map(([action, meta]) => {
                const count = activity.filter((a) => a.action === action).length;
                const pct = activity.length > 0 ? (count / activity.length) * 100 : 0;
                return (
                  <div key={action} className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded shrink-0 w-14 text-center ${meta.bg} ${meta.color} border border-current/20`}
                    >
                      {meta.label}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full ${meta.bg.replace("/10", "/40")} rounded-full`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-tech-gray w-8 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
