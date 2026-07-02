"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Crown,
  PiggyBank,
  Gift,
  Zap,
  Server,
  Scale,
} from "lucide-react";
import { AGENT_GOALS, ECONOMIC_TASKS, BUDGET_TIERS } from "@/lib/lovon/data";

const GOAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  crown: Crown,
  "piggy-bank": PiggyBank,
  gift: Gift,
  zap: Zap,
  server: Server,
  scale: Scale,
};

const ACCENT_CLASSES = {
  green: { text: "text-neon-green", border: "border-neon-green/30", bg: "bg-neon-green/10" },
  blue: { text: "text-neon-blue", border: "border-neon-blue/30", bg: "bg-neon-blue/10" },
  purple: { text: "text-neon-purple", border: "border-[#a855f7]/30", bg: "bg-[#a855f7]/10" },
  acid: { text: "text-[#b6ff3d]", border: "border-[#b6ff3d]/30", bg: "bg-[#b6ff3d]/10" },
  orange: { text: "text-[#ff8a3d]", border: "border-[#ff8a3d]/30", bg: "bg-[#ff8a3d]/10" },
};

export function SmartEconomicMode() {
  const [selectedGoal, setSelectedGoal] = useState("balanced");
  const [selectedBudget, setSelectedBudget] = useState("free");

  return (
    <section id="economico" className="relative py-24 sm:py-32">
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background:
            "radial-gradient(circle at 70% 30%, rgba(0,245,160,0.08), transparent 50%)",
        }}
      />
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        {/* header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-5">
            <span className="text-xs font-mono text-neon-green uppercase tracking-wider">
              Modo Econômico Inteligente
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
            Uma IA para cada tarefa.
            <br />
            <span className="gradient-text">Custo otimizado automaticamente.</span>
          </h2>
          <p className="text-base sm:text-lg text-tech-gray leading-relaxed">
            Em vez de um único modelo para todos os agentes, a Lovon orquesta: atendimento
            usa Gemini Flash grátis, marketing usa Qwen, programação usa Claude, CEO usa o
            melhor do orçamento. Você sente uma única IA — a plataforma decide o modelo
            ideal em milissegundos.
          </p>
        </motion.div>

        {/* goal selector */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg glass flex items-center justify-center text-neon-green font-mono text-sm">
              1
            </div>
            <h3 className="text-lg font-semibold text-white">
              Na criação do agente — Qual o objetivo?
            </h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {AGENT_GOALS.map((goal) => {
              const Icon = GOAL_ICONS[goal.icon] || Scale;
              const a = ACCENT_CLASSES[goal.accent];
              const isSelected = selectedGoal === goal.id;
              return (
                <button
                  key={goal.id}
                  onClick={() => setSelectedGoal(goal.id)}
                  className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                    isSelected
                      ? `${a.border} ${a.bg}`
                      : "border-white/8 hover:border-white/15 bg-white/[0.02]"
                  }`}
                  style={
                    isSelected
                      ? { boxShadow: "0 0 24px rgba(0,245,160,0.15)" }
                      : undefined
                  }
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 rounded-lg ${a.bg} flex items-center justify-center ${a.text}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-white">{goal.label}</span>
                  </div>
                  <p className="text-xs text-tech-gray leading-relaxed mb-2">
                    {goal.description}
                  </p>
                  <div className={`text-[10px] font-mono ${a.text}`}>
                    Modelo: {goal.recommendedModel}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* budget selector */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg glass flex items-center justify-center text-neon-green font-mono text-sm">
              2
            </div>
            <h3 className="text-lg font-semibold text-white">
              Criar Empresa — Como você deseja usar a IA?
            </h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {BUDGET_TIERS.map((tier) => {
              const a = ACCENT_CLASSES[tier.accent];
              const isSelected = selectedBudget === tier.id;
              return (
                <button
                  key={tier.id}
                  onClick={() => setSelectedBudget(tier.id)}
                  className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                    isSelected
                      ? `${a.border} ${a.bg}`
                      : "border-white/8 hover:border-white/15 bg-white/[0.02]"
                  }`}
                  style={
                    isSelected
                      ? { boxShadow: "0 0 24px rgba(0,224,255,0.15)" }
                      : undefined
                  }
                >
                  <div className={`text-xl font-bold ${a.text} mb-1`}>{tier.label}</div>
                  <div className="text-[11px] text-tech-gray leading-relaxed">
                    {tier.description}
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* economic mode mapping table */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="p-6 rounded-2xl glass border border-white/8 overflow-hidden"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-lg glass flex items-center justify-center text-neon-green font-mono text-sm">
              3
            </div>
            <h3 className="text-lg font-semibold text-white">
              A Lovon escolhe dinamicamente o modelo por tipo de tarefa
            </h3>
          </div>

          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-tech-gray border-b border-white/8">
                  <th className="py-3 font-mono text-xs uppercase tracking-wider">Função</th>
                  <th className="py-3 font-mono text-xs uppercase tracking-wider">Free</th>
                  <th className="py-3 font-mono text-xs uppercase tracking-wider">Premium</th>
                  <th className="py-3 font-mono text-xs uppercase tracking-wider">Local</th>
                  <th className="py-3 font-mono text-xs uppercase tracking-wider">Recomendado</th>
                </tr>
              </thead>
              <tbody>
                {ECONOMIC_TASKS.map((task, i) => (
                  <tr
                    key={task.role}
                    className={`border-b border-white/5 ${
                      i % 2 === 0 ? "bg-white/[0.01]" : ""
                    }`}
                  >
                    <td className="py-3 font-semibold text-white">{task.role}</td>
                    <td className="py-3 text-neon-green">{task.free}</td>
                    <td className="py-3 text-neon-blue">{task.premium}</td>
                    <td className="py-3 text-neon-purple">{task.local}</td>
                    <td className="py-3">
                      <div className="text-white font-medium">{task.recommended}</div>
                      <div className="text-[10px] text-tech-gray mt-0.5">{task.reason}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 p-4 rounded-xl bg-neon-green/5 border border-neon-green/20">
            <p className="text-sm text-white">
              <span className="text-neon-green font-semibold">Resultado:</span>{" "}
              sensação de uma única IA, enquanto a Lovon roteia dinamicamente para o
              modelo mais adequado. Economia típica de{" "}
              <span className="text-neon-green font-bold">87%</span> vs. usar GPT-4.1
              para tudo.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
