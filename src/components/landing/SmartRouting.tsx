"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowDown, Zap, AlertTriangle, Crown, CheckCircle2 } from "lucide-react";
import { ROUTING_CHAIN } from "@/lib/lovon/data";

const STATUS_META = {
  primary: {
    label: "Primário",
    icon: Zap,
    accent: "text-neon-green",
    border: "border-neon-green/40",
    bg: "bg-neon-green/10",
    glow: "rgba(0,245,160,0.4)",
  },
  fallback: {
    label: "Fallback",
    icon: AlertTriangle,
    accent: "text-neon-blue",
    border: "border-neon-blue/40",
    bg: "bg-neon-blue/10",
    glow: "rgba(0,224,255,0.4)",
  },
  "last-resort": {
    label: "Último recurso",
    icon: Crown,
    accent: "text-[#ff8a3d]",
    border: "border-[#ff8a3d]/40",
    bg: "bg-[#ff8a3d]/10",
    glow: "rgba(255,138,61,0.4)",
  },
} as const;

export function SmartRouting() {
  const [activeStep, setActiveStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  // auto-advance the active step to demo the cascade
  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % (ROUTING_CHAIN.length + 1));
    }, 1800);
    return () => clearInterval(interval);
  }, [autoPlay]);

  return (
    <section id="routing" className="relative py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
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
              Smart Routing
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
            O usuário praticamente
            <br />
            <span className="gradient-text">nunca ficaria sem IA</span>.
          </h2>
          <p className="text-base sm:text-lg text-tech-gray leading-relaxed">
            Configure uma cascata de provedores. A Lovon tenta o primário, e se atingir
            limite ou falhar, cai automaticamente para o próximo. GPT-4.1 só é acionado
            quando absolutamente necessário — preservando seu orçamento.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT — visual cascade */}
          <div className="relative">
            {/* CEO node at top */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative mx-auto w-72 p-4 rounded-2xl glass-strong border border-white/10 mb-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00F5A0] to-[#00E0FF] flex items-center justify-center">
                  <Crown className="w-5 h-5 text-deep-black" />
                </div>
                <div>
                  <div className="text-xs font-mono text-neon-green uppercase">CEO Agent</div>
                  <div className="text-sm font-semibold text-white">Task: Strategic decision</div>
                </div>
              </div>
            </motion.div>

            {/* cascade chain */}
            <div className="relative pl-2">
              {ROUTING_CHAIN.map((step, i) => {
                const meta = STATUS_META[step.status];
                const isActive = activeStep === i;
                const isPast = activeStep > i;
                return (
                  <div key={step.id}>
                    {/* arrow connector */}
                    {i > 0 && (
                      <div className="flex items-center gap-2 py-1.5 pl-4">
                        <ArrowDown
                          className={`w-4 h-4 ${
                            isPast ? meta.accent : "text-tech-gray/30"
                          }`}
                        />
                        <span
                          className={`text-[10px] font-mono uppercase ${
                            isPast ? meta.accent : "text-tech-gray/40"
                          }`}
                        >
                          {isPast ? "fallback acionado" : "aguardando"}
                        </span>
                      </div>
                    )}

                    <motion.div
                      animate={{
                        scale: isActive ? 1.03 : 1,
                        opacity: isActive ? 1 : isPast ? 0.5 : 0.7,
                      }}
                      transition={{ duration: 0.3 }}
                      className={`relative p-4 rounded-xl border ${
                        isActive ? meta.border : "border-white/8"
                      } glass`}
                      style={
                        isActive
                          ? { boxShadow: `0 0 32px ${meta.glow}` }
                          : undefined
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg ${meta.bg} ${meta.border} border flex items-center justify-center ${meta.accent}`}
                          >
                            <meta.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className={`text-[10px] font-mono uppercase ${meta.accent}`}>
                              {step.label}
                            </div>
                            <div className="text-sm font-semibold text-white">
                              {step.model}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-mono text-white">{step.cost}</div>
                          <div className="text-[10px] text-tech-gray">{step.latency}</div>
                        </div>
                      </div>

                      {/* active indicator */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute -right-2 top-1/2 -translate-y-1/2"
                          >
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neon-green/20 border border-neon-green/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-blink-status" />
                              <span className="text-[9px] font-mono text-neon-green uppercase">
                                now
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                );
              })}

              {/* success end */}
              {activeStep >= ROUTING_CHAIN.length && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 rounded-xl border border-neon-green/40 glass flex items-center gap-3"
                >
                  <CheckCircle2 className="w-6 h-6 text-neon-green" />
                  <div>
                    <div className="text-sm font-semibold text-white">
                      Resposta entregue ao CEO
                    </div>
                    <div className="text-xs text-tech-gray">
                      Custo total: <span className="text-neon-green">R$ 0,00</span> · Latência total: 540ms
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* RIGHT — explanation */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="p-6 rounded-2xl glass border border-white/8"
            >
              <h3 className="text-lg font-semibold text-white mb-3">
                Como funciona a cascata
              </h3>
              <p className="text-sm text-tech-gray leading-relaxed mb-4">
                Cada agente tem uma{" "}
                <span className="text-neon-green">política de routing</span> definida na
                criação. A Lovon monitora limites de taxa, erros 429 e timeouts em tempo
                real, e move para o próximo provedor sem interromper a experiência do
                usuário.
              </p>
              <div className="space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-black/40">
                  <span className="text-tech-gray">→ Gemini Flash</span>
                  <span className="text-neon-green">FREE · 60 req/min</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-black/40">
                  <span className="text-tech-gray">→ Groq Llama 70B</span>
                  <span className="text-neon-green">FREE · 30 req/min</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-black/40">
                  <span className="text-tech-gray">→ OpenRouter Free</span>
                  <span className="text-neon-green">FREE · 20 req/min</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-black/40">
                  <span className="text-tech-gray">→ GPT-4.1</span>
                  <span className="text-[#ff8a3d]">PAID · R$ 0,02/1k</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="p-6 rounded-2xl glass border border-white/8"
            >
              <h3 className="text-lg font-semibold text-white mb-3">
                Configure por agente
              </h3>
              <p className="text-sm text-tech-gray leading-relaxed mb-4">
                Cada agente pode ter sua própria política. O CEO usa Claude Opus com
                fallback para GPT-4.1. O atendimento usa Gemini Flash com fallback para
                Groq. O desenvolvedor usa Codex com fallback para DeepSeek. Tudo
                auditável em tempo real.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Latência média", value: "320ms", accent: "text-neon-green" },
                  { label: "Uptime", value: "99.97%", accent: "text-neon-blue" },
                  { label: "Economia", value: "87%", accent: "text-neon-purple" },
                ].map((s) => (
                  <div key={s.label} className="p-3 rounded-lg bg-black/40 text-center">
                    <div className={`text-xl font-bold font-mono ${s.accent}`}>
                      {s.value}
                    </div>
                    <div className="text-[10px] text-tech-gray uppercase mt-1">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
