"use client";

import { motion } from "framer-motion";
import { ArrowRight, Github, Terminal, Cloud, Server, Check, Shield, Zap } from "lucide-react";

interface Props {
  onLaunch: () => void;
}

export function Hero({ onLaunch }: Props) {
  return (
    <section
      id="top"
      className="relative min-h-screen flex items-center justify-center pt-24 pb-16 overflow-hidden"
    >
      {/* subtle bg */}
      <div className="absolute inset-0 neural-bg pointer-events-none" />

      {/* radial glow — very subtle */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, rgba(147, 80, 115, 0.12), transparent 50%)",
        }}
      />

      <div className="relative max-w-5xl mx-auto px-5 sm:px-8 text-center">
        {/* tagline pill */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-subtle mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-beige animate-blink-status" />
          <span className="text-xs font-mono text-violet-muted">
            O sistema operacional para empresas de agentes
          </span>
        </motion.div>

        {/* headline — serif, big, minimal */}
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="font-serif-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-semibold leading-[1.1] tracking-tight text-cream"
        >
          Gerencie uma
          <br />
          <span className="gradient-text">empresa de agentes de IA</span>
          <br />
          <span className="text-2xl sm:text-3xl lg:text-4xl text-violet-muted font-normal">
            com CEO, CTO, CMO e aprovações
          </span>
        </motion.h1>

        {/* subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-8 text-base sm:text-lg text-violet-muted max-w-2xl mx-auto leading-relaxed"
        >
          Controle custos, aprovações, auditoria e integrações.
          Escolha: <span className="text-cream font-semibold">Cloud gerenciado</span> ou{" "}
          <span className="text-cream font-semibold">Self-host (MIT)</span>.
        </motion.p>

        {/* === Dual CTAs — Cloud vs Self-host === */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          {/* Cloud CTA (primary) */}
          <div className="flex flex-col items-center gap-2">
            <button onClick={onLaunch} className="btn-pill btn-primary-neon text-base px-8 py-3">
              <Cloud className="w-4 h-4" />
              Criar workspace (Cloud)
              <ArrowRight className="w-4 h-4" />
            </button>
            <span className="text-[11px] text-violet-muted">
              Sem cartão, sem setup técnico
            </span>
          </div>

          {/* Self-host CTA (secondary) */}
          <div className="flex flex-col items-center gap-2">
            <a href="#github" className="btn-pill btn-secondary-neon text-base px-8 py-3">
              <Server className="w-4 h-4" />
              Rodar self-host
            </a>
            <code className="text-[11px] text-violet-muted font-mono">
              npx lovon-teams onboard --yes
            </code>
          </div>
        </motion.div>

        {/* === Feature pills — what you get === */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-14 flex flex-wrap items-center justify-center gap-3"
        >
          {[
            { icon: Shield, label: "Audit log imutável" },
            { icon: Check, label: "Approvals workflow" },
            { icon: Zap, label: "Smart Routing de IA" },
            { icon: Server, label: "BYOK — bring your own keys" },
          ].map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-dark/40 border border-violet-subtle"
            >
              <f.icon className="w-3.5 h-3.5 text-beige" />
              <span className="text-xs text-cream">{f.label}</span>
            </div>
          ))}
        </motion.div>

        {/* === Visual preview — mock screenshot frame === */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 mx-auto max-w-3xl"
        >
          <div className="rounded-2xl border border-violet-subtle overflow-hidden shadow-2xl">
            {/* window bar */}
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-violet-bg-deep border-b border-violet-subtle">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400/50" />
              <div className="ml-3 text-[10px] font-mono text-violet-muted">lovon-teams / dashboard</div>
            </div>
            {/* mock content */}
            <div className="p-5 bg-violet-bg/40 grid grid-cols-3 gap-3 text-left">
              {/* CEO card */}
              <div className="col-span-1 p-4 rounded-xl bg-violet-dark/40 border border-violet-subtle">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-neon-green/20 flex items-center justify-center">
                    <span className="text-neon-green text-sm font-bold">◆</span>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-cream">Lovon CEO</div>
                    <div className="text-[9px] text-neon-green">● active</div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="text-[10px] text-violet-muted">Marketing Lead (CMO)</div>
                  <div className="text-[10px] text-violet-muted">Engineering Lead (CTO)</div>
                  <div className="text-[10px] text-violet-muted">Email Agent</div>
                </div>
              </div>
              {/* Tasks + blockers */}
              <div className="col-span-2 p-4 rounded-xl bg-violet-dark/40 border border-violet-subtle space-y-2">
                <div className="text-[10px] font-mono uppercase text-violet-muted mb-2">Tasks ativas</div>
                {[
                  { title: "Campanha de mídia paga", status: "in_progress", color: "text-[#b6ff3d]" },
                  { title: "Enviar email para cliente", status: "in_review", color: "text-[#ff8a3d]" },
                  { title: "Deploy produção v2.1", status: "blocked", color: "text-red-400" },
                ].map((t, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-violet-bg/30">
                    <span className="text-[11px] text-cream">{t.title}</span>
                    <span className={`text-[9px] font-mono uppercase ${t.color}`}>{t.status}</span>
                  </div>
                ))}
                {/* Why blocked badge */}
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-[#ff8a3d]/5 border border-[#ff8a3d]/20">
                  <span className="text-[9px] font-mono text-[#ff8a3d]">📦 MISSING_WORK_PRODUCTS</span>
                  <span className="text-[9px] text-violet-muted">→ esperado 1 campaign_brief</span>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-violet-muted text-center">
            Mock da interface — organograma, tasks com status visual, e blockers estruturados ("Why blocked?")
          </p>
        </motion.div>
      </div>
    </section>
  );
}
