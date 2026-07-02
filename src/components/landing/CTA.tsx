"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

interface Props {
  onLaunch: () => void;
}

export function CTA({ onLaunch }: Props) {
  return (
    <section className="relative py-24 sm:py-32 border-t border-violet-subtle">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-subtle mb-6">
            <Sparkles className="w-3 h-3 text-beige" />
            <span className="text-xs font-mono text-violet-muted">Comece em 60 segundos</span>
          </div>

          <h2 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight text-cream mb-4">
            Sua empresa de IA
            <br />
            <span className="gradient-text">começa agora.</span>
          </h2>

          <p className="text-base text-violet-muted max-w-xl mx-auto mb-8 leading-relaxed">
            Crie sua empresa, defina a primeira meta, contrate o CEO. Sem cartão de crédito, sem
            configuração técnica. A Lovon Teams cuida do resto.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={onLaunch} className="btn-pill btn-primary-neon">
              Começar
              <ArrowRight className="w-4 h-4" />
            </button>
            <a href="#docs" className="btn-pill btn-secondary-neon">
              Ler a documentação
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-violet-muted">
            <span>✓ Sem cartão</span>
            <span>✓ Plano grátis para sempre</span>
            <span>✓ Código aberto</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
