"use client";

import { motion } from "framer-motion";
import {
  Megaphone,
  Calendar,
  Image as ImageIcon,
  FileText,
  Check,
  Clock,
  ArrowRight,
} from "lucide-react";

const WORK_PRODUCTS = [
  {
    icon: FileText,
    type: "campaign_brief",
    name: "Campaign Brief",
    desc: "Objetivo, KPIs, ICP, value prop, canais, positioning",
    fields: ["objective", "kpis", "audience", "valueProposition", "channels", "positioning"],
    color: "border-beige/30 bg-beige/5",
  },
  {
    icon: Calendar,
    type: "content_plan",
    name: "Content Plan",
    desc: "Calendário de posts por canal com hook + CTA",
    fields: ["timeframe", "strategySummary", "items", "postingCadence"],
    color: "border-neon-blue/30 bg-neon-blue/5",
  },
  {
    icon: Megaphone,
    type: "social_post_card",
    name: "Social Post Card",
    desc: "Post pronto com hook, body, CTA, hashtags, creative",
    fields: ["channel", "format", "hook", "body", "cta", "hashtags", "creative"],
    color: "border-[#b6ff3d]/30 bg-[#b6ff3d]/5",
  },
  {
    icon: ImageIcon,
    type: "creative_asset",
    name: "Creative Asset",
    desc: "Imagem gerada com prompt, seed, variações, compliance",
    fields: ["concept", "prompt", "negativePrompt", "styleHints", "variations"],
    color: "border-[#ff8a3d]/30 bg-[#ff8a3d]/5",
  },
];

const FLOW = [
  { label: "Brief", icon: FileText },
  { label: "Plan", icon: Calendar },
  { label: "Cards", icon: Megaphone },
  { label: "Assets", icon: ImageIcon },
  { label: "Approve", icon: Check },
  { label: "Schedule", icon: Clock },
];

export function WorkProducts() {
  return (
    <section id="work-products" className="relative py-24 px-5 sm:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-subtle mb-4">
            <Megaphone className="w-3 h-3 text-beige" />
            <span className="text-xs font-mono text-violet-muted">Work Products</span>
          </div>
          <h2 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-cream leading-tight">
            Não são relatórios.
            <br />
            <span className="gradient-text">São artefatos visuais.</span>
          </h2>
          <p className="mt-4 text-base text-violet-muted max-w-2xl mx-auto leading-relaxed">
            Cada task produz work products estruturados (JSON validado por Zod), não textão.
            A UI renderiza cards, kanban e calendário — não logs.
          </p>
        </motion.div>

        {/* Flow diagram */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 flex items-center justify-center gap-2 sm:gap-4 flex-wrap"
        >
          {FLOW.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2 sm:gap-4">
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-xl bg-violet-dark/50 border border-violet-subtle flex items-center justify-center">
                  <step.icon className="w-4 h-4 text-beige" />
                </div>
                <span className="text-[10px] text-violet-muted font-mono">{step.label}</span>
              </div>
              {i < FLOW.length - 1 && (
                <ArrowRight className="w-3 h-3 text-violet-muted/50" />
              )}
            </div>
          ))}
        </motion.div>

        {/* Work Product cards */}
        <div className="grid sm:grid-cols-2 gap-4">
          {WORK_PRODUCTS.map((wp, i) => (
            <motion.div
              key={wp.type}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i * 0.1, 0.4) }}
              className={`p-5 rounded-2xl border ${wp.color}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-violet-dark/50 flex items-center justify-center">
                  <wp.icon className="w-4 h-4 text-cream" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-cream">{wp.name}</div>
                  <div className="text-[10px] font-mono text-violet-muted">{wp.type}</div>
                </div>
              </div>
              <p className="text-xs text-violet-muted mb-3 leading-relaxed">{wp.desc}</p>
              <div className="flex flex-wrap gap-1">
                {wp.fields.map((f) => (
                  <span key={f} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/20 border border-violet-subtle text-violet-muted">
                    {f}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Hard gate note */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 p-5 rounded-2xl bg-[#ff8a3d]/5 border border-[#ff8a3d]/20 flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-[#ff8a3d]/10 flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4 text-[#ff8a3d]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-cream mb-1">Hard gate: task não fecha sem artefato</div>
            <p className="text-xs text-violet-muted leading-relaxed">
              Se a task declara <code className="text-cream">expectedWorkProducts: {`{ campaign_brief: 1, social_post_card: 6 }`}</code>,
              o engine recusa marcar como "concluída" até os artefatos existirem. Blocker estruturado:{" "}
              <code className="text-[#ff8a3d]">MISSING_WORK_PRODUCTS</code> — esperado 1 campaign_brief, encontrado 0.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
