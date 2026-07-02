"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Star, Plug, CheckCircle2, Search, Filter } from "lucide-react";
import { PROVIDERS, OPENROUTER_FILTERS } from "@/lib/lovon/data";

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

export function MarketView() {
  const [search, setSearch] = useState("");
  const [activeTier, setActiveTier] = useState<"all" | "free" | "premium" | "local">("all");
  const [connected, setConnected] = useState<string[]>(["gemini-free", "groq", "ollama"]);
  const [filters, setFilters] = useState<Record<string, boolean>>({
    free: false, oss: false, local: false, code: false, vision: false, multimodal: false,
  });

  const filtered = PROVIDERS.filter((p) => {
    if (activeTier !== "all" && p.tier !== activeTier) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggle = (id: string) => {
    setConnected((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Marketplace de Provedores</h1>
        <p className="text-sm text-tech-gray mt-1">
          {connected.length} conectados · {PROVIDERS.length} disponíveis · 300+ via OpenRouter
        </p>
      </div>

      {/* search + filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tech-gray" />
          <input
            type="text"
            placeholder="Buscar provedor ou modelo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-black/40 border border-white/8 text-sm text-white placeholder:text-tech-gray focus:outline-none focus:border-neon-green/40"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/8">
          {(["all", "free", "premium", "local"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTier(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${
                activeTier === t
                  ? "bg-neon-green/15 text-neon-green"
                  : "text-tech-gray hover:text-white"
              }`}
            >
              {t === "all" ? "Todos" : t === "free" ? "Grátis" : t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* main list */}
        <div className="lg:col-span-3 grid sm:grid-cols-2 gap-3">
          {filtered.map((p, i) => {
            const a = ACCENT[p.accent];
            const tier = TIER_LABEL[p.tier];
            const isConnected = connected.includes(p.id);
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`p-4 rounded-2xl glass border ${a.border} hover:-translate-y-1 transition-transform`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${a.bg} ${a.border} border flex items-center justify-center ${a.text} font-bold`}>
                    {p.name.charAt(0)}
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-mono">
                    <Star className="w-3 h-3 fill-[#00F5A0] text-[#00F5A0]" />
                    <span className="text-white">{p.quality}/5</span>
                  </span>
                </div>

                <div className="text-sm font-semibold text-white">{p.name}</div>
                <div className={`text-[10px] font-mono uppercase mt-0.5 ${tier.accent}`}>
                  {tier.label} · {p.speed}
                </div>
                <p className="text-[11px] text-tech-gray mt-2 mb-3 leading-relaxed min-h-[2.5rem]">
                  {p.description}
                </p>

                <div className="flex flex-wrap gap-1 mb-3">
                  {p.models.slice(0, 2).map((m) => (
                    <span
                      key={m}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-tech-gray border border-white/5"
                    >
                      {m}
                    </span>
                  ))}
                  {p.models.length > 2 && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded text-tech-gray">
                      +{p.models.length - 2}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => toggle(p.id)}
                  className={`w-full py-1.5 rounded-md text-xs font-semibold transition-all ${
                    isConnected
                      ? "bg-neon-green/10 border border-neon-green/30 text-neon-green"
                      : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                  }`}
                >
                  {isConnected ? (
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

        {/* sidebar — OpenRouter filters */}
        <div className="p-5 rounded-2xl glass border border-white/8 h-fit lg:sticky lg:top-24">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-neon-blue" />
            <span className="text-sm font-semibold text-white">Filtros OpenRouter</span>
          </div>
          <div className="space-y-2">
            {OPENROUTER_FILTERS.map((f) => (
              <label
                key={f.id}
                className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/[0.03] cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={!!filters[f.id]}
                  onChange={(e) => setFilters({ ...filters, [f.id]: e.target.checked })}
                  className="mt-0.5 accent-[#00F5A0]"
                />
                <div>
                  <div className="text-xs text-white">{f.label}</div>
                  <div className="text-[9px] text-tech-gray">{f.description}</div>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-5 pt-5 border-t border-white/8">
            <div className="text-[10px] font-mono text-tech-gray uppercase mb-1">
              OpenRouter
            </div>
            <div className="text-sm text-white">312 modelos</div>
            <div className="text-[10px] text-neon-green mt-1">
              73 free · 89 open source · 28 locais
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
