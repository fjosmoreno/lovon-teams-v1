"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  GripVertical,
  Zap,
  AlertTriangle,
  Crown,
  Plus,
  Trash2,
  Save,
} from "lucide-react";

const STATUS_META = {
  primary: { label: "Primário", icon: Zap, accent: "text-neon-green", border: "border-neon-green/40", bg: "bg-neon-green/10", glow: "rgba(0,245,160,0.4)" },
  fallback: { label: "Fallback", icon: AlertTriangle, accent: "text-neon-blue", border: "border-neon-blue/40", bg: "bg-neon-blue/10", glow: "rgba(0,224,255,0.4)" },
  "last-resort": { label: "Último recurso", icon: Crown, accent: "text-[#ff8a3d]", border: "border-[#ff8a3d]/40", bg: "bg-[#ff8a3d]/10", glow: "rgba(255,138,61,0.4)" },
} as const;

const INITIAL_AGENTS = [
  {
    id: "ceo",
    name: "Lovon CEO",
    role: "AI CEO Agent",
    emoji: "◆",
    accent: "green" as const,
    cascade: [
      { id: "1", model: "Claude Opus 4", tier: "premium" as const, status: "primary" as const },
      { id: "2", model: "GPT-4.1", tier: "premium" as const, status: "fallback" as const },
      { id: "3", model: "Gemini 2.5 Pro", tier: "premium" as const, status: "fallback" as const },
      { id: "4", model: "Ollama Llama 70B", tier: "local" as const, status: "last-resort" as const },
    ],
  },
  {
    id: "sales",
    name: "Sales Agent",
    role: "AI Sales Agent",
    emoji: "▲",
    accent: "blue" as const,
    cascade: [
      { id: "1", model: "Gemini Flash", tier: "free" as const, status: "primary" as const },
      { id: "2", model: "Groq Llama 70B", tier: "free" as const, status: "fallback" as const },
      { id: "3", model: "OpenRouter Free", tier: "free" as const, status: "fallback" as const },
      { id: "4", model: "GPT-4o mini", tier: "premium" as const, status: "last-resort" as const },
    ],
  },
  {
    id: "code",
    name: "Code Agent",
    role: "AI Code Agent",
    emoji: "◇",
    accent: "purple" as const,
    cascade: [
      { id: "1", model: "Claude Sonnet 4", tier: "premium" as const, status: "primary" as const },
      { id: "2", model: "DeepSeek V3", tier: "premium" as const, status: "fallback" as const },
      { id: "3", model: "Codex Mini", tier: "premium" as const, status: "fallback" as const },
      { id: "4", model: "Ollama Qwen 32B", tier: "local" as const, status: "last-resort" as const },
    ],
  },
];

const ACCENT_TEXT = {
  green: "text-neon-green",
  blue: "text-neon-blue",
  purple: "text-neon-purple",
};

export function RoutingView() {
  const [selectedAgent, setSelectedAgent] = useState(INITIAL_AGENTS[0].id);
  const agent = INITIAL_AGENTS.find((a) => a.id === selectedAgent)!;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Smart Routing</h1>
        <p className="text-sm text-tech-gray mt-1">
          Configure a cascata de fallback para cada agente. Arraste para reordenar.
        </p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* agent list */}
        <div className="p-4 rounded-2xl glass border border-white/8 h-fit lg:sticky lg:top-24">
          <div className="text-[10px] font-mono uppercase text-tech-gray mb-3">
            Selecionar agente
          </div>
          <div className="space-y-1.5">
            {INITIAL_AGENTS.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAgent(a.id)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left ${
                  selectedAgent === a.id
                    ? "bg-neon-green/10 border border-neon-green/20"
                    : "hover:bg-white/[0.03] border border-transparent"
                }`}
              >
                <div className="text-lg">{a.emoji}</div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{a.name}</div>
                  <div className="text-[10px] text-tech-gray">{a.cascade.length} níveis</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* cascade editor */}
        <div className="lg:col-span-3 p-6 rounded-2xl glass border border-white/8">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{agent.emoji}</div>
              <div>
                <h3 className="text-base font-semibold text-white">{agent.name}</h3>
                <p className="text-xs text-tech-gray">{agent.role}</p>
              </div>
            </div>
            <button className="btn-pill btn-primary-neon text-xs">
              <Save className="w-3.5 h-3.5" /> Salvar
            </button>
          </div>

          {/* cascade chain */}
          <div className="space-y-3">
            {agent.cascade.map((step, i) => {
              const meta = STATUS_META[step.status];
              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`relative p-4 rounded-xl border ${meta.border} ${meta.bg}`}
                  style={{ boxShadow: `0 0 24px ${meta.glow}20` }}
                >
                  <div className="flex items-center gap-3">
                    {/* drag handle */}
                    <div className="cursor-grab active:cursor-grabbing text-tech-gray hover:text-white">
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* step number */}
                    <div className={`w-8 h-8 rounded-lg bg-black/40 border ${meta.border} flex items-center justify-center text-xs font-mono font-bold ${meta.accent}`}>
                      {i + 1}
                    </div>

                    {/* model info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{step.model}</span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase ${meta.accent} ${meta.bg} border ${meta.border}`}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="text-[10px] text-tech-gray mt-0.5">
                        Tier: <span className="capitalize text-white">{step.tier}</span> · Latência: {120 + i * 60}ms · Custo:{" "}
                        {step.tier === "free" || step.tier === "local" ? (
                          <span className="text-neon-green">R$ 0</span>
                        ) : (
                          <span className="text-[#ff8a3d]">~R$ 0,0{i + 1}/1k</span>
                        )}
                      </div>
                    </div>

                    {/* meta icon */}
                    <div className={`w-9 h-9 rounded-lg ${meta.bg} border ${meta.border} flex items-center justify-center ${meta.accent}`}>
                      <meta.icon className="w-4 h-4" />
                    </div>

                    {/* delete */}
                    <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-tech-gray hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* connector arrow */}
                  {i < agent.cascade.length - 1 && (
                    <div className="absolute -bottom-3 left-12 text-tech-gray text-xs">
                      ↓
                    </div>
                  )}
                </motion.div>
              );
            })}

            {/* add step */}
            <button className="w-full p-4 rounded-xl border border-dashed border-white/15 hover:border-neon-green/40 hover:bg-neon-green/5 transition-all flex items-center justify-center gap-2 text-sm text-tech-gray hover:text-neon-green">
              <Plus className="w-4 h-4" />
              Adicionar nível de fallback
            </button>
          </div>

          {/* summary */}
          <div className="mt-6 p-4 rounded-xl bg-neon-green/5 border border-neon-green/20">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-[10px] font-mono text-tech-gray uppercase">Custo/1k calls</div>
                <div className="text-lg font-bold text-neon-green">R$ 0,02</div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-tech-gray uppercase">Uptime esperado</div>
                <div className="text-lg font-bold text-white">99.97%</div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-tech-gray uppercase">Latência p95</div>
                <div className="text-lg font-bold text-white">540ms</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
