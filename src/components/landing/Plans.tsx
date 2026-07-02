"use client";

import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { BUDGET_TIERS } from "@/lib/lovon/data";

const ACCENT = {
  green: { text: "text-neon-green", border: "border-neon-green/40", bg: "bg-neon-green/10", glow: "rgba(0,245,160,0.25)" },
  blue: { text: "text-neon-blue", border: "border-neon-blue/40", bg: "bg-neon-blue/10", glow: "rgba(0,224,255,0.25)" },
  purple: { text: "text-neon-purple", border: "border-[#a855f7]/40", bg: "bg-[#a855f7]/10", glow: "rgba(168,85,247,0.25)" },
  orange: { text: "text-[#ff8a3d]", border: "border-[#ff8a3d]/40", bg: "bg-[#ff8a3d]/10", glow: "rgba(255,138,61,0.25)" },
};

interface Props {
  onLaunch: () => void;
}

export function Plans({ onLaunch }: Props) {
  return (
    <section id="planos" className="relative py-24 sm:py-32">
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(0,245,160,0.06), transparent 60%)",
        }}
      />
      <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
        {/* header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-16 text-center mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-5">
            <span className="text-xs font-mono text-neon-green uppercase tracking-wider">
              Planos
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
            Comece grátis.
            <br />
            <span className="gradient-text">Escale quando fizer sentido.</span>
          </h2>
          <p className="text-base sm:text-lg text-tech-gray leading-relaxed">
            Cobrança apenas em modelos premium. Tudo que for roteado para grátis ou local
            continua grátis para sempre. Sem surpresas no fim do mês.
          </p>
        </motion.div>

        {/* grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {BUDGET_TIERS.map((tier, i) => {
            const a = ACCENT[tier.accent];
            const isHighlight = i === 0; // free is highlight
            return (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={`relative p-6 rounded-2xl glass border ${
                  isHighlight ? a.border : "border-white/8"
                }`}
                style={
                  isHighlight
                    ? { boxShadow: `0 0 32px ${a.glow}` }
                    : undefined
                }
              >
                {isHighlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-[#00F5A0] to-[#00E0FF] text-deep-black text-[10px] font-bold uppercase tracking-wider">
                    Mais popular
                  </div>
                )}

                <div className={`text-sm font-mono uppercase ${a.text} mb-1`}>
                  {tier.label}
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  {tier.monthly}
                  {tier.monthlyNum > 0 && (
                    <span className="text-sm text-tech-gray font-normal">/mês</span>
                  )}
                </div>
                <p className="text-xs text-tech-gray leading-relaxed mb-5 min-h-[3rem]">
                  {tier.description}
                </p>

                <button
                  onClick={onLaunch}
                  className={`w-full py-2 rounded-lg text-sm font-semibold transition-all mb-5 ${
                    isHighlight
                      ? "bg-gradient-to-r from-[#00F5A0] to-[#00E0FF] text-deep-black hover:shadow-lg hover:shadow-neon-green/20"
                      : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                  }`}
                >
                  {tier.id === "free" ? "Começar grátis" : "Escolher plano"}
                </button>

                <ul className="space-y-2">
                  {tier.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-xs">
                      <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${a.text}`} />
                      <span className="text-tech-gray leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* enterprise strip */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-8 p-6 rounded-2xl glass border border-white/8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00F5A0] to-[#00E0FF] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-deep-black" />
            </div>
            <div>
              <div className="text-base font-semibold text-white">
                Enterprise / White-label
              </div>
              <div className="text-xs text-tech-gray">
                Deploy on-prem, SLA 99.99%, SSO/SAML, auditoria SOC 2, modelo próprio.
              </div>
            </div>
          </div>
          <button
            onClick={onLaunch}
            className="btn-pill btn-secondary-neon text-sm whitespace-nowrap"
          >
            Falar com vendas
          </button>
        </motion.div>
      </div>
    </section>
  );
}
