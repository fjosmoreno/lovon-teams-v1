"use client";

import { Sparkles, Github, Twitter, Linkedin } from "lucide-react";

const FOOTER_LINKS = [
  {
    title: "Produto",
    links: [
      { label: "Organograma", href: "#" },
      { label: "Metas", href: "#" },
      { label: "Tarefas", href: "#" },
      { label: "Orçamentos", href: "#" },
      { label: "Tickets", href: "#" },
    ],
  },
  {
    title: "Recursos",
    links: [
      { label: "Documentação", href: "#docs" },
      { label: "Blog", href: "#blog" },
      { label: "GitHub", href: "#github" },
      { label: "Changelog", href: "#" },
      { label: "Roadmap", href: "#" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { label: "Sobre", href: "#" },
      { label: "Carreiras", href: "#" },
      { label: "Contato", href: "#" },
      { label: "Privacidade", href: "#" },
      { label: "Termos", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-violet-subtle pt-16 pb-8 mt-12">
      <div className="max-w-5xl mx-auto px-5 sm:px-8">
        <div className="grid lg:grid-cols-5 gap-10 mb-12">
          {/* brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-violet-bg" strokeWidth={2.5} />
              </div>
              <span className="text-lg font-semibold tracking-tight text-cream font-serif-display">
                Lovon Teams
              </span>
            </div>
            <p className="text-sm text-violet-muted leading-relaxed mb-5 max-w-xs">
              O app que pessoas usam para gerenciar agentes de IA no trabalho. Organograma, metas,
              tarefas e orçamentos em um só lugar.
            </p>
            <div className="flex items-center gap-3">
              {[Github, Twitter, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-lg border border-violet-subtle flex items-center justify-center text-violet-muted hover:text-cream hover:border-beige/30 transition-all"
                  aria-label="social"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* link columns */}
          {FOOTER_LINKS.map((col) => (
            <div key={col.title}>
              <div className="text-xs font-mono uppercase tracking-wider text-violet-muted mb-4">
                {col.title}
              </div>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-cream/80 hover:text-beige transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* wordmark — large, serif like Paperclip */}
        <div className="py-8 border-t border-violet-subtle">
          <div className="font-serif-display text-3xl sm:text-4xl font-semibold text-cream/90 tracking-tight">
            Lovon Teams
          </div>
        </div>

        {/* bottom bar */}
        <div className="pt-6 border-t border-violet-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-xs text-violet-muted">
            © 2026 Lovon Teams. Código aberto. MIT licensed.
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-violet-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-beige animate-blink-status" />
              Sistemas operacionais
            </span>
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
