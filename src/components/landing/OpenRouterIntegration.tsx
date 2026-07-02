"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Filter, Search } from "lucide-react";
import { OPENROUTER_FILTERS } from "@/lib/lovon/data";

const MOCK_MODELS = [
  { id: "1", name: "Llama 3.3 70B Instruct", provider: "Meta", tags: ["free", "oss"], modality: "text", ctx: "128K" },
  { id: "2", name: "GPT-4.1", provider: "OpenAI", tags: ["premium"], modality: "multimodal", ctx: "1M" },
  { id: "3", name: "Claude Opus 4", provider: "Anthropic", tags: ["premium"], modality: "text", ctx: "200K" },
  { id: "4", name: "DeepSeek R1", provider: "DeepSeek", tags: ["oss"], modality: "text", ctx: "64K" },
  { id: "5", name: "Qwen 2.5 Coder 32B", provider: "Alibaba", tags: ["free", "oss", "code"], modality: "text", ctx: "128K" },
  { id: "6", name: "Gemini 2.5 Pro", provider: "Google", tags: ["premium", "vision", "multimodal"], modality: "multimodal", ctx: "2M" },
  { id: "7", name: "Pixtral 12B", provider: "Mistral", tags: ["free", "vision", "multimodal"], modality: "multimodal", ctx: "128K" },
  { id: "8", name: "Ollama Llama 3.3 70B", provider: "Local", tags: ["local", "oss"], modality: "text", ctx: "128K" },
  { id: "9", name: "Codex Mini", provider: "OpenAI", tags: ["premium", "code"], modality: "text", ctx: "200K" },
  { id: "10", name: "Mistral 7B Instruct", provider: "Mistral", tags: ["free", "oss", "local"], modality: "text", ctx: "32K" },
];

export function OpenRouterIntegration() {
  const [active, setActive] = useState<Record<string, boolean>>({
    free: true,
    oss: false,
    local: false,
    code: false,
    vision: false,
    multimodal: false,
  });

  const filtered = MOCK_MODELS.filter((m) => {
    return Object.entries(active).every(([key, on]) => {
      if (!on) return true;
      return m.tags.includes(key);
    });
  });

  return (
    <section className="relative py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-5">
            <span className="text-xs font-mono text-neon-blue uppercase tracking-wider">
              Integração OpenRouter
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
            Filtros poderosos.
            <br />
            <span className="gradient-text-purple">Apenas os modelos que importam.</span>
          </h2>
          <p className="text-base sm:text-lg text-tech-gray leading-relaxed">
            Acesse mais de 300 modelos via OpenRouter com filtros inteligentes. Mostre
            somente gratuitos, open source, locais, ou especializados por tarefa —
            programação, visão, multimodal.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* filters */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-5 rounded-2xl glass border border-white/8"
          >
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-neon-blue" />
              <span className="text-sm font-semibold text-white">Filtros</span>
            </div>
            <div className="space-y-2.5">
              {OPENROUTER_FILTERS.map((f) => (
                <label
                  key={f.id}
                  className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={!!active[f.id]}
                    onChange={(e) =>
                      setActive({ ...active, [f.id]: e.target.checked })
                    }
                    className="mt-0.5 accent-[#00F5A0]"
                  />
                  <div>
                    <div className="text-sm text-white">{f.label}</div>
                    <div className="text-[10px] text-tech-gray">{f.description}</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-5 pt-5 border-t border-white/8">
              <div className="text-[10px] font-mono text-tech-gray uppercase mb-2">
                Resultados
              </div>
              <div className="text-2xl font-bold text-neon-blue">
                {filtered.length}
                <span className="text-sm text-tech-gray font-normal"> / {MOCK_MODELS.length}</span>
              </div>
            </div>
          </motion.div>

          {/* model list */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-2 p-5 rounded-2xl glass border border-white/8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tech-gray" />
                <input
                  type="text"
                  placeholder="Buscar modelo..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-black/40 border border-white/8 text-sm text-white placeholder:text-tech-gray focus:outline-none focus:border-neon-blue/40"
                />
              </div>
              <div className="text-xs font-mono text-tech-gray">via OpenRouter</div>
            </div>

            <div className="space-y-1.5 max-h-[440px] overflow-y-auto pr-2 no-scrollbar">
              {filtered.map((m) => (
                <div
                  key={m.id}
                  className="p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-neon-blue/30 hover:bg-white/[0.04] transition-all group"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white truncate">
                          {m.name}
                        </span>
                        {m.tags.includes("free") && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neon-green/15 text-neon-green border border-neon-green/30">
                            FREE
                          </span>
                        )}
                        {m.tags.includes("oss") && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neon-purple/15 text-neon-purple border border-[#a855f7]/30">
                            OSS
                          </span>
                        )}
                        {m.tags.includes("local") && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neon-blue/15 text-neon-blue border border-neon-blue/30">
                            LOCAL
                          </span>
                        )}
                        {m.tags.includes("vision") && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#b6ff3d]/15 text-[#b6ff3d] border border-[#b6ff3d]/30">
                            VISION
                          </span>
                        )}
                        {m.tags.includes("code") && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#ff8a3d]/15 text-[#ff8a3d] border border-[#ff8a3d]/30">
                            CODE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-tech-gray mt-0.5">
                        {m.provider} · {m.modality} · {m.ctx} ctx
                      </div>
                    </div>
                    <button className="text-[11px] px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neon-blue/10 hover:border-neon-blue/40 hover:text-neon-blue">
                      + Add
                    </button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-tech-gray text-sm">
                  Nenhum modelo corresponde aos filtros.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
