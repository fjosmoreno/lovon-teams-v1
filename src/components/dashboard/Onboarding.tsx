"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Building2 } from "lucide-react";
import { useLovonStore } from "@/lib/lovon/store";
import { BUDGET_TIERS } from "@/lib/lovon/data";

interface Props {
  onDone: () => void;
}

const MISSION_SUGGESTIONS = [
  "Lançar MVP de plataforma SaaS B2B",
  "Aumentar receita em 50% no próximo trimestre",
  "Expandir operação para o mercado internacional",
  "Estruturar time de vendas outbound",
  "Criar campanha de lançamento de produto",
];

export function Onboarding({ onDone }: Props) {
  const createCompany = useLovonStore((s) => s.createCompany);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [mission, setMission] = useState("");
  const [budget, setBudget] = useState<"free" | "low" | "mid" | "unlimited">("free");

  const handleFinish = () => {
    const tier = BUDGET_TIERS.find((b) => b.id === budget);
    createCompany(
      name.trim() || "Minha Empresa",
      mission.trim() || "Construir produto rentável com agentes de IA.",
      budget,
      tier?.monthlyNum ?? 0
    );
    onDone();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-deep-black">
      {/* bg */}
      <div className="absolute inset-0 neural-bg pointer-events-none" />
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-xl p-8 rounded-3xl glass-strong border border-white/10"
      >
        {/* header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00F5A0] to-[#00E0FF] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-deep-black" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-xs font-mono text-neon-green uppercase tracking-wider">
              Onboarding Lovon
            </div>
            <div className="text-lg font-bold text-white">Configure sua empresa</div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1 — Company name */}
          {step === 1 && (
            <motion.div
              key="s1"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
            >
              <div className="flex items-center gap-2 mb-3 text-xs font-mono text-tech-gray">
                <Building2 className="w-3.5 h-3.5" />
                PASSO 1 DE 3
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Qual o nome da sua empresa?
              </h2>
              <p className="text-sm text-tech-gray mb-5">
                O CEO Agent assumirá o comando e criará subagentes automaticamente.
              </p>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Acme LTDA"
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/8 text-base text-white placeholder:text-tech-gray focus:outline-none focus:border-neon-green/40"
                onKeyDown={(e) => e.key === "Enter" && setStep(2)}
              />
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="btn-pill btn-primary-neon text-sm"
                >
                  Próximo <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Mission */}
          {step === 2 && (
            <motion.div
              key="s2"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
            >
              <div className="flex items-center gap-2 mb-3 text-xs font-mono text-tech-gray">
                <Sparkles className="w-3.5 h-3.5" />
                PASSO 2 DE 3
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Qual a missão da empresa?
              </h2>
              <p className="text-sm text-tech-gray mb-4">
                O CEO usará isso para decidir quais departamentos e subagentes criar.
              </p>
              <textarea
                value={mission}
                onChange={(e) => setMission(e.target.value)}
                placeholder="Ex: Lançar MVP de plataforma SaaS B2B em 90 dias"
                rows={3}
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/8 text-sm text-white placeholder:text-tech-gray focus:outline-none focus:border-neon-green/40 resize-none"
              />
              <div className="mt-3">
                <div className="text-[10px] font-mono text-tech-gray uppercase mb-2">
                  Sugestões rápidas
                </div>
                <div className="flex flex-wrap gap-2">
                  {MISSION_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setMission(s)}
                      className="px-2.5 py-1 rounded-md text-xs bg-white/5 border border-white/8 text-tech-gray hover:text-white hover:border-neon-green/30 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(1)}
                  className="btn-pill btn-secondary-neon text-sm"
                >
                  Voltar
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="btn-pill btn-primary-neon text-sm"
                >
                  Próximo <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Budget */}
          {step === 3 && (
            <motion.div
              key="s3"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
            >
              <div className="flex items-center gap-2 mb-3 text-xs font-mono text-tech-gray">
                <Sparkles className="w-3.5 h-3.5" />
                PASSO 3 DE 3
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Qual o orçamento mensal?
              </h2>
              <p className="text-sm text-tech-gray mb-4">
                Define quais modelos o CEO pode escolher. Grátis usa apenas free + local.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {BUDGET_TIERS.map((tier) => {
                  const isSelected = budget === tier.id;
                  return (
                    <button
                      key={tier.id}
                      onClick={() => setBudget(tier.id as typeof budget)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "border-neon-green/40 bg-neon-green/10"
                          : "border-white/8 bg-white/[0.02] hover:border-white/15"
                      }`}
                    >
                      <div className="text-sm font-bold text-white">{tier.label}</div>
                      <div className="text-[10px] text-tech-gray mt-1 leading-snug">
                        {tier.description}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="btn-pill btn-secondary-neon text-sm"
                >
                  Voltar
                </button>
                <button
                  onClick={handleFinish}
                  className="btn-pill btn-primary-neon text-sm"
                >
                  <Sparkles className="w-4 h-4" /> Criar empresa
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
