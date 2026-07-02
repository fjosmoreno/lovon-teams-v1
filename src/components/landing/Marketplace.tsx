"use client";

import { motion } from "framer-motion";
import { Star, Plug, CheckCircle2 } from "lucide-react";
import { MARKET_CARDS, MarketCard } from "@/lib/lovon/data";

const ACCENT = {
  green: { text: "text-neon-green", border: "border-neon-green/30", bg: "bg-neon-green/10", dot: "bg-neon-green" },
  blue: { text: "text-neon-blue", border: "border-neon-blue/30", bg: "bg-neon-blue/10", dot: "bg-neon-blue" },
  purple: { text: "text-neon-purple", border: "border-[#a855f7]/30", bg: "bg-[#a855f7]/10", dot: "bg-[#a855f7]" },
  acid: { text: "text-[#b6ff3d]", border: "border-[#b6ff3d]/30", bg: "bg-[#b6ff3d]/10", dot: "bg-[#b6ff3d]" },
  orange: { text: "text-[#ff8a3d]", border: "border-[#ff8a3d]/30", bg: "bg-[#ff8a3d]/10", dot: "bg-[#ff8a3d]" },
};

const TIER_LABEL = {
  free: { label: "Grátis", accent: "text-neon-green" },
  premium: { label: "Premium", accent: "text-neon-blue" },
  local: { label: "Local", accent: "text-neon-purple" },
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${
            i < rating
              ? "fill-[#00F5A0] text-[#00F5A0]"
              : "text-white/15"
          }`}
        />
      ))}
    </div>
  );
}

export function Marketplace() {
  return (
    <section id="marketplace" className="relative py-24 sm:py-32">
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          background:
            "radial-gradient(circle at 30% 50%, rgba(168,85,247,0.08), transparent 50%)",
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
            <span className="text-xs font-mono text-neon-purple uppercase tracking-wider">
              Marketplace de Provedores
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
            Modelos disponíveis.
            <br />
            <span className="gradient-text-purple">Basta clicar em Conectar.</span>
          </h2>
          <p className="text-base sm:text-lg text-tech-gray leading-relaxed">
            Uma galeria curada de provedores e modelos. Veja avaliações, características,
            latência e custo. Conecte com um clique e o provedor fica disponível para
            todos os seus agentes.
          </p>
        </motion.div>

        {/* grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MARKET_CARDS.map((card: MarketCard, i) => {
            const a = ACCENT[card.accent];
            const tier = TIER_LABEL[card.tier];
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className={`relative p-5 rounded-2xl glass border border-white/8 ${a.border} hover:-translate-y-1 transition-transform duration-300 group`}
              >
                {/* status dot */}
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${a.dot} animate-blink-status`} />
                </div>

                {/* logo / avatar */}
                <div
                  className={`w-12 h-12 rounded-xl ${a.bg} ${a.border} border flex items-center justify-center mb-4`}
                >
                  <span className={`text-xl font-bold ${a.text}`}>
                    {card.name.charAt(0)}
                  </span>
                </div>

                <div className="mb-1 flex items-center gap-2">
                  <h3 className="text-base font-semibold text-white">{card.name}</h3>
                </div>

                <Stars rating={card.rating} />

                <div className={`text-[10px] font-mono uppercase mt-2 ${tier.accent}`}>
                  {card.tag}
                </div>

                <p className="text-xs text-tech-gray mt-3 mb-4 leading-relaxed min-h-[2.5rem]">
                  {card.description}
                </p>

                <button
                  className={`w-full py-2 rounded-lg text-xs font-semibold transition-all ${
                    card.connected
                      ? "bg-neon-green/10 border border-neon-green/30 text-neon-green"
                      : `bg-white/5 border border-white/10 text-white hover:bg-white/10`
                  }`}
                >
                  {card.connected ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <Plug className="w-3.5 h-3.5" /> Conectar
                    </span>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
