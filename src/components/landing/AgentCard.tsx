"use client";

import { motion } from "framer-motion";
import { AgentProfile } from "@/lib/lovon/data";

const ACCENT_MAP = {
  green: {
    text: "text-neon-green",
    border: "border-neon-green/30",
    bg: "bg-neon-green/10",
    glow: "rgba(0, 245, 160, 0.35)",
    grad: "from-[#00F5A0]/20 to-transparent",
  },
  blue: {
    text: "text-neon-blue",
    border: "border-neon-blue/30",
    bg: "bg-neon-blue/10",
    glow: "rgba(0, 224, 255, 0.35)",
    grad: "from-[#00E0FF]/20 to-transparent",
  },
  purple: {
    text: "text-neon-purple",
    border: "border-[#a855f7]/30",
    bg: "bg-[#a855f7]/10",
    glow: "rgba(168, 85, 247, 0.35)",
    grad: "from-[#a855f7]/20 to-transparent",
  },
  acid: {
    text: "text-[#b6ff3d]",
    border: "border-[#b6ff3d]/30",
    bg: "bg-[#b6ff3d]/10",
    glow: "rgba(182, 255, 61, 0.35)",
    grad: "from-[#b6ff3d]/20 to-transparent",
  },
  orange: {
    text: "text-[#ff8a3d]",
    border: "border-[#ff8a3d]/30",
    bg: "bg-[#ff8a3d]/10",
    glow: "rgba(255, 138, 61, 0.35)",
    grad: "from-[#ff8a3d]/20 to-transparent",
  },
};

interface Props {
  agent: AgentProfile;
  size?: "sm" | "md" | "lg";
}

export function AgentCard({ agent, size = "md" }: Props) {
  const a = ACCENT_MAP[agent.accent];

  const dimensions =
    size === "sm" ? "w-44 h-64" : size === "lg" ? "w-60 h-80" : "w-52 h-72";

  return (
    <div
      className={`relative ${dimensions} shrink-0 rounded-[2rem] glass overflow-hidden group`}
      style={{ boxShadow: `0 0 30px ${a.glow}` }}
    >
      {/* gradient top */}
      <div className={`absolute inset-0 bg-gradient-to-b ${a.grad} opacity-60`} />

      {/* scan line animation */}
      <div className="absolute inset-x-0 top-0 h-px overflow-hidden">
        <div
          className={`h-full w-1/2 ${a.bg} animate-scan-line`}
          style={{ boxShadow: `0 0 8px ${a.glow}` }}
        />
      </div>

      {/* status indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          {agent.status === "active" && (
            <span className="absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-60 animate-ping" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              agent.status === "active"
                ? "bg-neon-green"
                : agent.status === "thinking"
                ? "bg-[#00E0FF]"
                : "bg-[#A1A1AA]"
            }`}
          />
        </span>
        <span className="text-[9px] uppercase tracking-wider font-mono text-tech-gray">
          {agent.status === "active" ? "Ativo" : agent.status === "thinking" ? "Pensando" : agent.status === "working" ? "Trabalhando" : "Ocioso"}
        </span>
      </div>

      {/* avatar / core */}
      <div className="relative h-32 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className={`relative w-24 h-24 rounded-full ${a.bg} ${a.border} border flex items-center justify-center`}
        >
          {/* orbit ring */}
          <div
            className={`absolute inset-0 rounded-full border ${a.border}`}
            style={{ transform: "scale(1.3)" }}
          />
          <div
            className={`absolute inset-0 rounded-full border ${a.border}`}
            style={{ transform: "scale(1.6)" }}
          />
          {/* orbiting particles */}
          <div className="absolute inset-0">
            <div
              className={`absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full ${a.bg}`}
              style={{
                background: a.glow.replace("0.35", "1"),
                animation: "orbit 4s linear infinite",
              }}
            />
            <div
              className={`absolute top-1/2 left-1/2 w-1 h-1 rounded-full`}
              style={{
                background: a.glow.replace("0.35", "1"),
                animation: "orbit 6s linear infinite reverse",
              }}
            />
          </div>
          {/* core emoji */}
          <span className={`text-3xl ${a.text}`}>{agent.emoji}</span>
        </motion.div>
      </div>

      {/* content */}
      <div className="relative px-4 pb-4 text-center">
        <div className={`text-[10px] uppercase tracking-wider font-mono ${a.text} mb-1`}>
          {agent.role}
        </div>
        <div className="text-white font-semibold text-sm mb-2">{agent.name}</div>
        <div className="text-[10px] text-tech-gray mb-3">
          Especialidade: <span className="text-white/90">{agent.specialty}</span>
        </div>

        {/* tasks running */}
        <div className="flex items-center justify-between text-[10px] font-mono">
          <div className="text-tech-gray">
            Tarefas: <span className="text-white">{agent.tasksRunning}</span>
          </div>
          <div className={`${a.text}`}>{agent.model}</div>
        </div>

        {/* mini bar chart */}
        <div className="mt-3 flex items-end gap-1 h-6">
          {[40, 65, 35, 80, 55, 70, 45].map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className={`flex-1 rounded-sm ${a.bg}`}
              style={{ background: a.glow.replace("0.35", "0.6") }}
            />
          ))}
        </div>
      </div>

      {/* hover glow border */}
      <div
        className={`absolute inset-0 rounded-[2rem] border ${a.border} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`}
      />
    </div>
  );
}
