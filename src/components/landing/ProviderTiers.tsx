"use client";

import { motion } from "framer-motion";
import { Check, Terminal } from "lucide-react";
import { PROVIDERS } from "@/lib/lovon/data";

const TIER_META = {
  free: {
    label: "Gratuitos",
    icon: "🟢",
    accent: "green",
    description: "Camada gratuita permanente ou free tier generoso.",
    badge: "R$ 0",
    textClass: "text-neon-green",
    borderClass: "border-neon-green/30",
    bgClass: "bg-neon-green/5",
  },
  premium: {
    label: "Premium",
    icon: "🔵",
    accent: "blue",
    description: "APIs pagas, modelos de ponta, SLA empresarial.",
    badge: "Pago",
    textClass: "text-neon-blue",
    borderClass: "border-neon-blue/30",
    bgClass: "bg-neon-blue/5",
  },
  local: {
    label: "Local (100% gratuito)",
    icon: "🟣",
    accent: "purple",
    description: "Roda no seu hardware. Privacidade total, custo zero.",
    badge: "On-Prem",
    textClass: "text-neon-purple",
    borderClass: "border-[#a855f7]/30",
    bgClass: "bg-[#a855f7]/5",
  },
} as const;

export function ProviderTiers() {
  const tiers = Object.keys(TIER_META) as (keyof typeof TIER_META)[];

  return (
    <section id="provedores" className="relative py-24 sm:py-32">
      {/* bg accent */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(0,224,255,0.08), transparent 50%)",
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
            <span className="text-xs font-mono text-neon-blue uppercase tracking-wider">
              Provedor de IA
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
            Três caminhos.
            <br />
            <span className="gradient-text-purple">Uma plataforma.</span>
          </h2>
          <p className="text-base sm:text-lg text-tech-gray leading-relaxed">
            Na tela de configuração do agente há um campo chamado{" "}
            <span className="text-white">Provedor de IA</span>. Escolha entre grátis,
            premium ou local — ou deixe a Lovon escolher automaticamente com base no
            seu orçamento.
          </p>
        </motion.div>

        {/* tier columns */}
        <div className="grid lg:grid-cols-3 gap-5">
          {tiers.map((tierKey, idx) => {
            const meta = TIER_META[tierKey];
            const providers = PROVIDERS.filter((p) => p.tier === tierKey);
            return (
              <motion.div
                key={tierKey}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`relative p-6 rounded-2xl glass border ${meta.borderClass}`}
              >
                {/* header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{meta.icon}</span>
                    <h3 className={`text-lg font-bold ${meta.textClass}`}>{meta.label}</h3>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-2 py-1 rounded-full border ${meta.borderClass} ${meta.textClass}`}
                  >
                    {meta.badge}
                  </span>
                </div>
                <p className="text-xs text-tech-gray mb-5">{meta.description}</p>

                {/* local example endpoint */}
                {tierKey === "local" && (
                  <div className="mb-5 p-3 rounded-lg bg-black/40 border border-white/5 font-mono text-xs">
                    <div className="flex items-center gap-2 text-tech-gray">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>endpoint</span>
                    </div>
                    <div className="mt-1 text-neon-green">
                      http://localhost:11434
                    </div>
                  </div>
                )}

                {/* provider list */}
                <ul className="space-y-2.5">
                  {providers.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-start gap-2.5 text-sm group/p"
                    >
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${meta.textClass}`} />
                      <div className="flex-1">
                        <div className="font-medium text-white group-hover/p:text-white">
                          {p.name}
                        </div>
                        <div className="text-xs text-tech-gray leading-snug">
                          {p.description}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
