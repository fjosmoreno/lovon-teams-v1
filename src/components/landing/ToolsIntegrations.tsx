"use client";

import { motion } from "framer-motion";
import {
  Search,
  Mail,
  Image as ImageIcon,
  Share2,
  Database,
  BarChart3,
  GitBranch,
  Rocket,
  Code2,
  Globe,
  FileCode,
  Zap,
  Plug,
  Key,
  Shield,
  ArrowRight,
} from "lucide-react";

const CAPABILITIES = [
  { icon: Search, name: "Web Search", desc: "Pesquisa na web", provider: "Brave" },
  { icon: Mail, name: "Email Send + Schedule", desc: "Envio com receipts", provider: "Resend" },
  { icon: ImageIcon, name: "Image Generation", desc: "Geração de imagens", provider: "Gemini" },
  { icon: Share2, name: "Social Publish", desc: "Publicação em redes", provider: "Buffer" },
  { icon: GitBranch, name: "Repo / PR", desc: "Ler e criar PRs", provider: "GitHub" },
  { icon: Rocket, name: "Deploy", desc: "Preview + produção", provider: "Vercel" },
  { icon: Database, name: "CRM Read/Write", desc: "Contatos e pipeline", provider: "HubSpot" },
  { icon: FileCode, name: "Custom OpenAPI", desc: "API do zero", provider: "Seu spec" },
];

const PROVIDERS = [
  "OpenAI", "Anthropic", "Groq", "OpenRouter", "DeepSeek", "Gemini",
  "Resend", "Brave", "GitHub", "Vercel", "Cloudflare", "HubSpot", "Buffer",
];

const STATUS_BADGES = {
  builtin: { label: "Built-in", color: "text-neon-green bg-neon-green/10 border-neon-green/20" },
  extension: { label: "Extension", color: "text-beige bg-beige/10 border-beige/20" },
  roadmap: { label: "Roadmap", color: "text-violet-muted bg-white/5 border-white/10" },
};

const EXTENSIONS = [
  { name: "Alertas Slack", desc: "Notifique o Slack quando tasks bloquearem ou approvals pendentes surgirem", status: "extension" as const, config: "Integrações → Slack" },
  { name: "Guardrails de Custo", desc: "Auto-pause quando budget estourar (por agente, workspace, ou projeto)", status: "builtin" as const, config: "Smart Routing → Budgets" },
  { name: "Sync GitHub", desc: "Auto-criar issues de tasks bloqueadas, sync PR status", status: "extension" as const, config: "Integrações → repo_write" },
  { name: "Heartbeats Customizados", desc: "CEO acorda sozinho por frequência configurada e gera iniciativas", status: "builtin" as const, config: "CEO Autonomy → Heartbeat" },
  { name: "Webhook Bridge", desc: "Receba webhooks (Resend opened, Stripe paid) e gere Signals para o CEO", status: "roadmap" as const, config: "Integrações → Webhooks" },
  { name: "Construa a sua", desc: "Cole um spec OpenAPI e o sistema gera tools automaticamente", status: "extension" as const, config: "Integrações → Custom OpenAPI" },
];

export function ToolsIntegrations() {
  return (
    <section id="tools" className="relative py-24 px-5 sm:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-subtle mb-4">
            <Plug className="w-3 h-3 text-beige" />
            <span className="text-xs font-mono text-violet-muted">Ferramentas & Integrações</span>
          </div>
          <h2 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-cream leading-tight">
            Conecte capabilities aos providers
            <br />
            <span className="gradient-text">que você autoriza</span>
          </h2>
          <p className="mt-4 text-base text-violet-muted max-w-2xl mx-auto leading-relaxed">
            Agentes chamam <span className="text-cream font-semibold">capabilities</span> (email, web search, repo),
            não providers. O sistema é obrigado a usar apenas os serviços configurados —
            se algo não está bound, a task bloqueia com <code className="text-[#ff8a3d]">CAPABILITY_NOT_CONFIGURED</code>.
          </p>
        </motion.div>

        {/* === Layer 1: Capabilities === */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-4 h-4 text-beige" />
            <h3 className="text-lg font-semibold text-cream">Capabilities</h3>
            <span className="text-xs text-violet-muted">— o que o sistema sabe fazer</span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {CAPABILITIES.map((cap, i) => (
              <motion.div
                key={cap.name}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.05, 0.3) }}
                className="p-4 rounded-xl glass border border-violet-subtle"
              >
                <div className="w-9 h-9 rounded-lg bg-beige/10 flex items-center justify-center mb-3">
                  <cap.icon className="w-4 h-4 text-beige" />
                </div>
                <div className="text-sm font-semibold text-cream mb-1">{cap.name}</div>
                <div className="text-[11px] text-violet-muted mb-2">{cap.desc}</div>
                <div className="flex items-center gap-1 text-[10px] text-violet-muted">
                  <Key className="w-2.5 h-2.5" />
                  <span>{cap.provider}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* === Layer 2: Providers (BYOK) === */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <Key className="w-4 h-4 text-beige" />
            <h3 className="text-lg font-semibold text-cream">Providers</h3>
            <span className="text-xs text-violet-muted">— bring your own keys</span>
          </div>
          <div className="p-6 rounded-2xl glass border border-violet-subtle">
            <p className="text-sm text-violet-muted mb-4">
              Traga suas próprias chaves de API. Suportamos 17+ providers prontos + custom OpenAPI ("API do zero").
            </p>
            <div className="flex flex-wrap gap-2">
              {PROVIDERS.map((p) => (
                <span
                  key={p}
                  className="px-3 py-1.5 rounded-lg bg-violet-bg/40 border border-violet-subtle text-xs font-medium text-cream"
                >
                  {p}
                </span>
              ))}
              <span className="px-3 py-1.5 rounded-lg bg-neon-green/10 border border-neon-green/30 text-xs font-medium text-neon-green flex items-center gap-1">
                <FileCode className="w-3 h-3" /> + Custom OpenAPI
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-violet-subtle flex items-center gap-2 text-xs text-violet-muted">
              <Shield className="w-3.5 h-3.5 text-beige" />
              <span>Chaves armazenadas em vault seguro. O engine nunca loga valores — apenas <code className="text-cream">vault://integration/&lt;id&gt;</code></span>
            </div>
          </div>
        </div>

        {/* === Layer 3: Smart Routing === */}
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <ArrowRight className="w-4 h-4 text-beige" />
            <h3 className="text-lg font-semibold text-cream">Smart Routing</h3>
            <span className="text-xs text-violet-muted">— por agente, com allowlist obrigatória</span>
          </div>
          <div className="p-6 rounded-2xl glass border border-violet-subtle space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-neon-green/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-neon-green text-xs font-bold">1</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-cream">Allowlist obrigatória</div>
                <div className="text-xs text-violet-muted">Cada agente só usa os providers que você autorizar. Sem allowlist = <code className="text-red-400">NO_ROUTE_AVAILABLE</code></div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-neon-green/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-neon-green text-xs font-bold">2</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-cream">Fallback ordenado</div>
                <div className="text-xs text-violet-muted">Configure a cascata: se OpenAI falhar, tente Anthropic, depois Groq. Drag-and-drop na UI</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-neon-green/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-neon-green text-xs font-bold">3</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-cream">Budgets + auto-pause</div>
                <div className="text-xs text-violet-muted">Hard cap por agente/workspace. Se estourar, heartbeats pausam e tasks bloqueiam com <code className="text-[#ff8a3d]">BUDGET_EXCEEDED</code></div>
              </div>
            </div>
          </div>
        </div>

        {/* === Extensions === */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Plug className="w-4 h-4 text-beige" />
            <h3 className="text-lg font-semibold text-cream">Extensões</h3>
            <span className="text-xs text-violet-muted">— built-in, extension, e roadmap</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {EXTENSIONS.map((ext, i) => {
              const badge = STATUS_BADGES[ext.status];
              return (
                <motion.div
                  key={ext.name}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(i * 0.05, 0.3) }}
                  className="p-4 rounded-xl glass border border-violet-subtle"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="text-sm font-semibold text-cream">{ext.name}</div>
                    <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="text-[11px] text-violet-muted mb-2 leading-relaxed">{ext.desc}</div>
                  <div className="flex items-center gap-1 text-[10px] text-beige">
                    <ArrowRight className="w-2.5 h-2.5" />
                    <span className="font-mono">{ext.config}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
