"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plug,
  Plus,
  Trash2,
  Check,
  X,
  Power,
  Shield,
  Search,
  Mail,
  Image as ImageIcon,
  Share2,
  Database,
  BarChart3,
  AlertCircle,
  Code2,
  Github,
  Cloud,
  Zap,
  Link2,
  Unlink,
  ExternalLink,
  Loader2,
  GitBranch,
  Rocket,
  Globe,
  FileCode,
  Settings,
  Key,
  Lock,
} from "lucide-react";
import { useLovonStore } from "@/lib/lovon/store";
import {
  CAPABILITY_CATALOG,
  PROVIDER_CAPABILITIES,
  PROVIDER_PRESETS,
  ProviderPreset,
  Integration,
  IntegrationConfig,
  CapabilityId,
  ProviderId,
  ManualEndpoint,
} from "@/lib/lovon/work-products";

const CAPABILITY_ICONS: Partial<Record<string, React.ComponentType<{ className?: string }>>> = {
  web_search: Search,
  email_send: Mail,
  email_schedule: Mail,
  image_generate: ImageIcon,
  social_publish: Share2,
  crm_read: Database,
  crm_write: Database,
  analytics_read: BarChart3,
  repo_read: GitBranch,
  repo_write: GitBranch,
  deploy_preview: Rocket,
  deploy_production: Rocket,
  web_build: Code2,
  domain_manage: Globe,
  custom_openapi: FileCode,
  http_request: Globe,
};

const PROVIDER_ICONS: Partial<Record<ProviderId, React.ComponentType<{ className?: string }>>> = {
  resend: Mail,
  brave: Search,
  openai: Zap,
  anthropic: Zap,
  groq: Zap,
  openrouter: Zap,
  deepseek: Zap,
  github: Github,
  gitlab: Github,
  vercel: Rocket,
  netlify: Rocket,
  cloudflare: Cloud,
  hubspot: Database,
  umami: BarChart3,
  buffer: Share2,
  gemini: ImageIcon,
  custom_openapi: FileCode,
  custom_http: Code2,
  internal: Plug,
};

export function IntegrationsView({ initialFilterCapability }: { initialFilterCapability?: CapabilityId | null }) {
  const integrations = useLovonStore((s) => s.integrations);
  const agents = useLovonStore((s) => s.agents);
  const addIntegration = useLovonStore((s) => s.addIntegration);
  const createIntegration = useLovonStore((s) => s.createIntegration);
  const updateIntegration = useLovonStore((s) => s.updateIntegration);
  const deleteIntegration = useLovonStore((s) => s.deleteIntegration);
  const testIntegrationReal = useLovonStore((s) => s.testIntegrationReal);
  const capabilityBindings = useLovonStore((s) => s.capabilityBindings);
  const bindCapability = useLovonStore((s) => s.bindCapability);
  const unbindCapability = useLovonStore((s) => s.unbindCapability);

  const [showWizard, setShowWizard] = useState(false);
  const [wizardPath, setWizardPath] = useState<"preset" | "openapi" | "http" | null>(null);
  const [tab, setTab] = useState<"connections" | "bindings" | "capabilities">("connections");
  const [filterCapability, setFilterCapability] = useState<CapabilityId | "all">("all");
  const [testingId, setTestingId] = useState<string | null>(null);

  // If navigated here from WhyBlockedModal with a capability filter, apply it
  useEffect(() => {
    if (initialFilterCapability) {
      setFilterCapability(initialFilterCapability);
      setTab("bindings");
    }
  }, [initialFilterCapability]);

  const filteredIntegrations = integrations.filter((i) => {
    if (filterCapability === "all") return true;
    return i.capabilities.includes(filterCapability);
  });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Plug className="w-5 h-5 text-beige" />
          <h1 className="text-2xl sm:text-3xl font-bold text-cream font-serif-display">Integrações</h1>
        </div>
        <p className="text-sm text-violet-muted max-w-2xl">
          Conecte provedores de IA (Gemini, Groq, OpenRouter...) e serviços externos (Resend, GitHub, etc).
          Suas chamadas de IA são roteadas automaticamente — não precisa vincular.
        </p>
      </div>

      {/* filter by capability (shown when navigated from WhyBlockedModal) */}
      {filterCapability !== "all" && (
        <div className="p-3 rounded-lg bg-[#ff8a3d]/10 border border-[#ff8a3d]/30 flex items-center gap-2 text-xs text-[#ff8a3d]">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Filtrando por capability: <span className="font-mono font-bold">{filterCapability}</span></span>
          <button
            onClick={() => setFilterCapability("all")}
            className="ml-auto px-2 py-0.5 rounded bg-[#ff8a3d]/20 hover:bg-[#ff8a3d]/30 text-[10px]"
          >
            Limpar filtro
          </button>
        </div>
      )}

      {/* tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-violet-bg/40 border border-violet-subtle w-fit">
        {([
          { id: "connections", label: "Conexões" },
          { id: "bindings", label: "Bindings" },
          { id: "capabilities", label: "Capabilities" },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
              tab === t.id ? "bg-beige/15 text-beige" : "text-violet-muted hover:text-cream"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* === Tab: Connections === */}
      {tab === "connections" && (
        <div className="space-y-4">
          {/* Section 1: AI Providers (LLM backends) */}
          <ConnectionsSection
            title="🧠 Provedores de IA"
            subtitle="Onde seus agentes pensam. Roteamento automático, sem binding."
            integrations={filteredIntegrations.filter((i) =>
              ["openai", "anthropic", "groq", "openrouter", "deepseek", "gemini"].includes(i.providerKey)
            )}
            testingId={testingId}
            onTest={async (id) => {
              setTestingId(id);
              await testIntegrationReal(id);
              setTestingId(null);
            }}
            onToggle={(i) =>
              updateIntegration(i.id, { status: i.status === "active" ? "disabled" : "active" })
            }
            onDelete={deleteIntegration}
            emptyMessage="Nenhum provedor de IA configurado. Adicione um para seus agentes funcionarem."
          />

          {/* Section 2: External Integrations (everything else) */}
          <ConnectionsSection
            title="🔌 Integrações externas"
            subtitle="Resend (email), GitHub (repo), Vercel (deploy), etc. Use para dar superpoderes aos agentes."
            integrations={filteredIntegrations.filter((i) =>
              !["openai", "anthropic", "groq", "openrouter", "deepseek", "gemini", "internal"].includes(i.providerKey)
            )}
            testingId={testingId}
            onTest={async (id) => {
              setTestingId(id);
              await testIntegrationReal(id);
              setTestingId(null);
            }}
            onToggle={(i) =>
              updateIntegration(i.id, { status: i.status === "active" ? "disabled" : "active" })
            }
            onDelete={deleteIntegration}
            onAdd={() => { setShowWizard(true); setWizardPath(null); }}
            emptyMessage="Nenhuma integração externa. Adicione Resend para email, GitHub para repositório, etc."
          />

          {/* Hidden by default: Internal stubs (collapsed) */}
          {(() => {
            const internalStubs = filteredIntegrations.filter((i) => i.providerKey === "internal");
            if (internalStubs.length === 0) return null;
            return (
              <details className="rounded-xl glass border border-violet-subtle overflow-hidden">
                <summary className="p-3 cursor-pointer text-xs text-violet-muted hover:text-cream transition-colors flex items-center gap-2">
                  <span>🗂️ Stubs internos do sistema ({internalStubs.length})</span>
                  <span className="text-[10px] text-violet-muted/70">— apenas para debug. Não requerem configuração.</span>
                </summary>
                <div className="p-3 space-y-2 border-t border-violet-subtle">
                  {internalStubs.map((integration) => {
                    const Icon = PROVIDER_ICONS[integration.providerKey] ?? Plug;
                    return (
                      <IntegrationCard
                        key={integration.id}
                        integration={integration}
                        onTest={async () => {
                          setTestingId(integration.id);
                          await testIntegrationReal(integration.id);
                          setTestingId(null);
                        }}
                        testing={testingId === integration.id}
                        onToggle={() =>
                          updateIntegration(integration.id, {
                            status: integration.status === "active" ? "disabled" : "active",
                          })
                        }
                        onDelete={() => deleteIntegration(integration.id)}
                      />
                    );
                  })}
                </div>
              </details>
            );
          })()}
        </div>
      )}

      {/* === Tab: Bindings (capability → integration) === */}
      {tab === "bindings" && (
        <BindingPanel
          filterCapability={filterCapability}
          onFilterChange={setFilterCapability}
        />
      )}

      {/* === Tab: Capabilities (catalog) === */}
      {tab === "capabilities" && (
        <div className="space-y-3">
          <p className="text-xs text-violet-muted">
            Catálogo de capabilities disponíveis. Cada capability pode ser atendida por uma integração.
            Vá em "Bindings" para configurar qual integração atende qual capability.
          </p>
          {CAPABILITY_CATALOG.map((cap) => {
            const Icon = CAPABILITY_ICONS[cap.id] ?? Zap;
            const binding = capabilityBindings.find((b) => b.capability === cap.id);
            const boundIntegration = binding
              ? integrations.find((i) => i.id === binding.integrationId)
              : null;
            return (
              <div key={cap.id} className="p-4 rounded-xl glass border border-violet-subtle flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-beige/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-beige" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-cream">{cap.name}</span>
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/5 border border-violet-subtle text-violet-muted">
                      {cap.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-violet-muted">{cap.description}</div>
                </div>
                <div className="flex-shrink-0">
                  {boundIntegration ? (
                    <span className="text-[10px] font-mono px-2 py-1 rounded bg-neon-green/10 border border-neon-green/30 text-neon-green">
                      → {boundIntegration.name}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono px-2 py-1 rounded bg-[#ff8a3d]/10 border border-[#ff8a3d]/30 text-[#ff8a3d]">
                      não bound
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* === Wizard Modal === */}
      <AnimatePresence>
        {showWizard && (
          <IntegrationWizard
            onClose={() => { setShowWizard(false); setWizardPath(null); }}
            onPathSelect={setWizardPath}
            wizardPath={wizardPath}
            onCreate={(input) => {
              const id = createIntegration(input);
              setShowWizard(false);
              setWizardPath(null);
              // Switch to bindings tab so user can bind the new integration
              setTab("bindings");
              return id;
            }}
            initialCapability={filterCapability !== "all" ? filterCapability : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// === Connections Section (group of integrations) ===
function ConnectionsSection({
  title,
  subtitle,
  integrations,
  testingId,
  onTest,
  onToggle,
  onDelete,
  onAdd,
  emptyMessage,
}: {
  title: string;
  subtitle: string;
  integrations: Integration[];
  testingId: string | null;
  onTest: (id: string) => void;
  onToggle: (i: Integration) => void;
  onDelete: (id: string) => void;
  onAdd?: () => void;
  emptyMessage: string;
}) {
  return (
    <div>
      <div className="flex items-end justify-between mb-2">
        <div>
          <h2 className="text-sm font-semibold text-cream">{title}</h2>
          <p className="text-[11px] text-violet-muted">{subtitle}</p>
        </div>
        {onAdd && (
          <button
            onClick={onAdd}
            className="px-3 py-1.5 rounded-lg bg-beige/10 border border-beige/30 text-beige hover:bg-beige/20 text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar
          </button>
        )}
      </div>
      {integrations.length === 0 ? (
        <div className="p-6 rounded-xl border border-dashed border-violet-subtle text-center">
          <p className="text-xs text-violet-muted">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {integrations.map((integration) => {
            const Icon = PROVIDER_ICONS[integration.providerKey] ?? Plug;
            return (
              <IntegrationCard
                key={integration.id}
                integration={integration}
                onTest={() => onTest(integration.id)}
                testing={testingId === integration.id}
                onToggle={() => onToggle(integration)}
                onDelete={() => onDelete(integration.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// === Integration Card ===
function IntegrationCard({
  integration,
  onTest,
  testing,
  onToggle,
  onDelete,
}: {
  integration: Integration;
  onTest: () => void;
  testing: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const Icon = PROVIDER_ICONS[integration.providerKey] ?? Plug;
  return (
    <div className="group p-4 rounded-xl glass border border-violet-subtle">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-beige/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-beige" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-sm font-semibold text-cream">{integration.name}</span>
              <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                integration.status === "active"
                  ? "bg-neon-green/10 text-neon-green border-neon-green/20"
                  : integration.status === "error"
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : "bg-white/5 text-violet-muted border-white/10"
              }`}>
                {integration.status}
              </span>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/5 border border-violet-subtle text-violet-muted">
                {integration.providerKey}
              </span>
              <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/5 border border-violet-subtle text-violet-muted">
                {integration.credentialsType ?? "none"}
              </span>
            </div>
            <div className="text-[10px] text-violet-muted mb-2">
              {integration.capabilities.length} capabilities · {integration.secretRef}
            </div>
            {/* Capabilities chips */}
            <div className="flex flex-wrap gap-1">
              {integration.capabilities.map((cap) => {
                const CapIcon = CAPABILITY_ICONS[cap] ?? Zap;
                return (
                  <span key={cap} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-beige/5 border border-beige/20 text-beige flex items-center gap-1">
                    <CapIcon className="w-2.5 h-2.5" /> {cap}
                  </span>
                );
              })}
            </div>
            {/* Test result */}
            {integration.lastTestResult && (
              <div className={`mt-2 text-[10px] flex items-center gap-1 ${
                integration.lastTestResult.ok ? "text-neon-green" : "text-[#ff8a3d]"
              }`}>
                {integration.lastTestResult.ok ? <Check className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
                {integration.lastTestResult.message}
                {integration.lastTestedAt && (
                  <span className="text-violet-muted ml-1">
                    · {new Date(integration.lastTestedAt).toLocaleString("pt-BR")}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onTest}
            disabled={testing}
            className="px-2.5 py-1 rounded-md text-xs bg-beige/10 border border-beige/30 text-beige hover:bg-beige/20 flex items-center gap-1 disabled:opacity-50"
          >
            {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Testar
          </button>
          <button
            onClick={onToggle}
            className="w-7 h-7 rounded-md bg-white/5 border border-white/8 text-violet-muted hover:text-cream flex items-center justify-center"
            title={integration.status === "active" ? "Desativar" : "Ativar"}
          >
            <Power className="w-3 h-3" />
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 rounded-md bg-white/5 border border-white/8 text-violet-muted hover:text-red-400 flex items-center justify-center"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// === Binding Panel (capability → integration dropdown) ===
function BindingPanel({
  filterCapability,
  onFilterChange,
}: {
  filterCapability: CapabilityId | "all";
  onFilterChange: (cap: CapabilityId | "all") => void;
}) {
  const integrations = useLovonStore((s) => s.integrations);
  const capabilityBindings = useLovonStore((s) => s.capabilityBindings);
  const bindCapability = useLovonStore((s) => s.bindCapability);
  const unbindCapability = useLovonStore((s) => s.unbindCapability);

  const capsToShow = filterCapability === "all"
    ? CAPABILITY_CATALOG
    : CAPABILITY_CATALOG.filter((c) => c.id === filterCapability);

  return (
    <div className="space-y-3">
      {/* Info banner: LLM capabilities are auto-routed */}
      <div className="p-3 rounded-xl bg-neon-green/5 border border-neon-green/20 flex items-start gap-2">
        <Zap className="w-4 h-4 text-neon-green shrink-0 mt-0.5" />
        <div className="text-xs text-tech-gray leading-relaxed">
          <span className="text-cream font-medium">Capacidades de IA são roteadas automaticamente</span> — você não precisa vincular Gemini/Groq/OpenRouter aqui. Esta página é só para vincular serviços externos (Resend para email, GitHub para repo, etc).
        </div>
      </div>

      {/* Filter dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-violet-muted">Filtrar:</span>
        <select
          value={filterCapability}
          onChange={(e) => onFilterChange(e.target.value as CapabilityId | "all")}
          className="px-3 py-1.5 rounded-lg bg-violet-bg/40 border border-violet-subtle text-xs text-cream focus:outline-none focus:border-beige/30"
        >
          <option value="all">Todas as capabilities</option>
          {CAPABILITY_CATALOG.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.category})</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-violet-muted">
        Cada capability externa pode ser atendida por UMA integração. Escolha qual integração atende cada capability.
        Se uma capability não tem binding, agentes que tentarem usá-la recebem <code className="text-[#ff8a3d]">CAPABILITY_NOT_CONFIGURED</code>.
      </p>

      {/* Binding rows */}
      <div className="space-y-2">
        {capsToShow.map((cap) => {
          const Icon = CAPABILITY_ICONS[cap.id] ?? Zap;
          const binding = capabilityBindings.find((b) => b.capability === cap.id);
          const compatibleIntegrations = integrations.filter(
            (i) => i.capabilities.includes(cap.id) && i.status === "active"
          );
          return (
            <div key={cap.id} className="p-3 rounded-xl glass border border-violet-subtle flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-beige/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-beige" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-cream">{cap.name}</div>
                <div className="text-[10px] text-violet-muted">{cap.description}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {compatibleIntegrations.length === 0 ? (
                  <span className="text-[10px] text-[#ff8a3d] flex items-center gap-1">
                    <AlertCircle className="w-2.5 h-2.5" /> Nenhuma integração compatível
                  </span>
                ) : (
                  <select
                    value={binding?.integrationId ?? ""}
                    onChange={(e) => {
                      if (e.target.value === "") {
                        unbindCapability(cap.id);
                      } else {
                        bindCapability(cap.id, e.target.value);
                      }
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-violet-bg/40 border border-violet-subtle text-xs text-cream focus:outline-none focus:border-beige/30 max-w-[200px]"
                  >
                    <option value="">— não bound —</option>
                    {compatibleIntegrations.map((intg) => (
                      <option key={intg.id} value={intg.id}>
                        {intg.name} ({intg.providerKey})
                      </option>
                    ))}
                  </select>
                )}
                {binding && (
                  <button
                    onClick={() => unbindCapability(cap.id)}
                    className="w-6 h-6 rounded-md bg-white/5 border border-violet-subtle text-violet-muted hover:text-red-400 flex items-center justify-center"
                    title="Desvincular"
                  >
                    <Unlink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// === Integration Wizard (3-path) ===
function IntegrationWizard({
  onClose,
  onPathSelect,
  wizardPath,
  onCreate,
  initialCapability,
}: {
  onClose: () => void;
  onPathSelect: (path: "preset" | "openapi" | "http") => void;
  wizardPath: "preset" | "openapi" | "http" | null;
  onCreate: (input: {
    providerKey: ProviderId;
    name: string;
    capabilities: CapabilityId[];
    config?: IntegrationConfig;
    credentialsType: "api_key" | "bearer" | "basic" | "none";
    credentialsValue?: string;
    limits?: { perRun?: number; perDay?: number; perMonth?: number };
    allowedAgentSlugs?: string[];
  }) => string;
  initialCapability?: CapabilityId;
}) {
  // === Path selection screen ===
  if (!wizardPath) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 12 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 12 }}
          className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl glass-strong border border-violet-subtle overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between p-5 border-b border-violet-subtle">
            <div>
              <h3 className="text-base font-semibold text-cream font-serif-display">Adicionar integração</h3>
              <p className="text-xs text-violet-muted mt-0.5">Escolha como conectar</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-violet-muted hover:text-cream">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-3">
            {/* Path 1: Provider presets */}
            <button
              onClick={() => onPathSelect("preset")}
              className="w-full p-4 rounded-xl border border-violet-subtle hover:border-beige/30 hover:bg-beige/5 transition-all text-left flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-beige/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-beige" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-cream">Provider pronto</div>
                <div className="text-[11px] text-violet-muted">OpenAI, Anthropic, Resend, Brave, GitHub, Vercel... 17 providers disponíveis</div>
              </div>
            </button>

            {/* Path 2: Custom OpenAPI */}
            <button
              onClick={() => onPathSelect("openapi")}
              className="w-full p-4 rounded-xl border border-violet-subtle hover:border-beige/30 hover:bg-beige/5 transition-all text-left flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-beige/10 flex items-center justify-center flex-shrink-0">
                <FileCode className="w-4 h-4 text-beige" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-cream">Custom OpenAPI <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neon-green/10 text-neon-green border border-neon-green/20 ml-1">API do zero</span></div>
                <div className="text-[11px] text-violet-muted">Cole um spec OpenAPI JSON/YAML. O sistema gera tools automaticamente.</div>
              </div>
            </button>

            {/* Path 3: Custom HTTP (manual endpoints) */}
            <button
              onClick={() => onPathSelect("http")}
              className="w-full p-4 rounded-xl border border-violet-subtle hover:border-beige/30 hover:bg-beige/5 transition-all text-left flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-beige/10 flex items-center justify-center flex-shrink-0">
                <Code2 className="w-4 h-4 text-beige" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-cream">Custom HTTP (manual)</div>
                <div className="text-[11px] text-violet-muted">Cadastra 1-5 endpoints manualmente com templates de path/body</div>
              </div>
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // === Path: Preset ===
  if (wizardPath === "preset") {
    return <PresetWizard onClose={onClose} onCreate={onCreate} initialCapability={initialCapability} />;
  }

  // === Path: Custom OpenAPI ===
  if (wizardPath === "openapi") {
    return <OpenApiWizard onClose={onClose} onCreate={onCreate} initialCapability={initialCapability} />;
  }

  // === Path: Custom HTTP ===
  return <CustomHttpWizard onClose={onClose} onCreate={onCreate} initialCapability={initialCapability} />;
}

// === Preset Wizard (provider cards) ===
function PresetWizard({
  onClose,
  onCreate,
  initialCapability,
}: {
  onClose: () => void;
  onCreate: (input: {
    providerKey: ProviderId;
    name: string;
    capabilities: CapabilityId[];
    config?: IntegrationConfig;
    credentialsType: "api_key" | "bearer" | "basic" | "none";
    credentialsValue?: string;
    limits?: { perRun?: number; perDay?: number; perMonth?: number };
    allowedAgentSlugs?: string[];
  }) => string;
  initialCapability?: CapabilityId;
}) {
  const [selectedPreset, setSelectedPreset] = useState<ProviderPreset | null>(null);
  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [perDay, setPerDay] = useState("");
  const [perMonth, setPerMonth] = useState("");

  // Group presets by category
  const categories = ["AI", "Email", "Search", "Web Dev", "CRM", "Analytics", "Social", "Custom"] as const;
  const presetsByCategory = categories.map((cat) => ({
    category: cat,
    presets: PROVIDER_PRESETS.filter((p) => p.category === cat),
  })).filter((g) => g.presets.length > 0);

  // Filter presets by initialCapability if set
  const visiblePresets = initialCapability
    ? presetsByCategory.map((g) => ({
        ...g,
        presets: g.presets.filter((p) => p.suggestedCapabilities.includes(initialCapability)),
      })).filter((g) => g.presets.length > 0)
    : presetsByCategory;

  const handleCreate = () => {
    if (!selectedPreset || !name.trim()) return;
    onCreate({
      providerKey: selectedPreset.key,
      name: name.trim(),
      capabilities: selectedPreset.suggestedCapabilities,
      credentialsType: selectedPreset.authType,
      credentialsValue: apiKey || undefined,
      config: {},
      limits: {
        perDay: perDay ? Number(perDay) : undefined,
        perMonth: perMonth ? Number(perMonth) : undefined,
      },
    });
  };

  return (
    <WizardShell title="Provider pronto" onClose={onClose}>
      {!selectedPreset ? (
        <div className="space-y-4">
          {initialCapability && (
            <div className="p-2 rounded-lg bg-beige/10 border border-beige/20 text-xs text-beige">
              Mostrando providers compatíveis com <span className="font-mono">{initialCapability}</span>
            </div>
          )}
          {visiblePresets.map((group) => (
            <div key={group.category}>
              <div className="text-[10px] font-mono uppercase text-violet-muted mb-2">{group.category}</div>
              <div className="grid sm:grid-cols-2 gap-2">
                {group.presets.map((preset) => {
                  const Icon = PROVIDER_ICONS[preset.key] ?? Plug;
                  return (
                    <button
                      key={preset.key}
                      onClick={() => {
                        setSelectedPreset(preset);
                        setName(`${preset.name}`);
                      }}
                      className="p-3 rounded-lg border border-violet-subtle hover:border-beige/30 hover:bg-beige/5 transition-all text-left flex items-start gap-2"
                    >
                      <Icon className="w-4 h-4 text-beige mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-cream">{preset.name}</div>
                        <div className="text-[10px] text-violet-muted">{preset.description}</div>
                        {preset.suggestedCapabilities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {preset.suggestedCapabilities.map((cap) => (
                              <span key={cap} className="text-[8px] font-mono px-1 py-0.5 rounded bg-beige/5 text-beige">
                                {cap}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {visiblePresets.length === 0 && (
            <div className="text-center py-8 text-sm text-violet-muted">
              Nenhum provider compatível com a capability "{initialCapability}".
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Selected preset summary */}
          <div className="p-3 rounded-lg bg-beige/5 border border-beige/20 flex items-center gap-2">
            <span className="text-sm font-semibold text-cream">{selectedPreset.name}</span>
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/5 border border-violet-subtle text-violet-muted">
              {selectedPreset.authType}
            </span>
            {selectedPreset.docsUrl && (
              <a
                href={selectedPreset.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-auto text-[10px] text-beige hover:underline flex items-center gap-0.5"
              >
                Docs <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>

          {/* Name */}
          <WizardField label="Nome da integração">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Ex.: ${selectedPreset.name} – Produção`}
              className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
            />
          </WizardField>

          {/* API Key (secret — never re-displayed) */}
          <WizardField label={selectedPreset.authType === "api_key" ? "API Key (secreto — não reexibido)" : selectedPreset.authType === "bearer" ? "Bearer Token (secreto)" : "Credenciais (secreto)"}>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-violet-muted" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={selectedPreset.authType === "api_key" ? "Cole sua API key aqui" : "Cole seu token aqui"}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30 font-mono"
              />
            </div>
            <div className="text-[10px] text-violet-muted mt-1">
              A chave é armazenada em vault seguro e nunca será exibida novamente.
            </div>
          </WizardField>

          {/* Limits */}
          <div className="grid grid-cols-2 gap-3">
            <WizardField label="Limite por dia (opcional)">
              <input
                type="number"
                value={perDay}
                onChange={(e) => setPerDay(e.target.value)}
                placeholder="Ex.: 100"
                className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
              />
            </WizardField>
            <WizardField label="Limite por mês (opcional)">
              <input
                type="number"
                value={perMonth}
                onChange={(e) => setPerMonth(e.target.value)}
                placeholder="Ex.: 1000"
                className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
              />
            </WizardField>
          </div>

          {/* Capabilities (auto from preset) */}
          <div>
            <div className="text-xs font-medium text-violet-muted mb-1.5">Capabilities (auto-preenchido)</div>
            <div className="flex flex-wrap gap-1">
              {selectedPreset.suggestedCapabilities.length === 0 ? (
                <span className="text-[10px] text-violet-muted">Este provider não mapeia para capabilities de tool (é um backend de LLM).</span>
              ) : (
                selectedPreset.suggestedCapabilities.map((cap) => (
                  <span key={cap} className="text-[10px] font-mono px-2 py-1 rounded bg-beige/10 border border-beige/20 text-beige">
                    {cap}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-violet-subtle">
            <button
              onClick={() => setSelectedPreset(null)}
              className="text-xs text-violet-muted hover:text-cream"
            >
              ← Voltar
            </button>
            <button
              onClick={handleCreate}
              disabled={!name.trim()}
              className="btn-pill btn-primary-neon text-xs disabled:opacity-40"
            >
              <Plus className="w-3.5 h-3.5" /> Criar integração
            </button>
          </div>
        </div>
      )}
    </WizardShell>
  );
}

// === Custom OpenAPI Wizard ===
function OpenApiWizard({
  onClose,
  onCreate,
  initialCapability,
}: {
  onClose: () => void;
  onCreate: (input: {
    providerKey: ProviderId;
    name: string;
    capabilities: CapabilityId[];
    config?: IntegrationConfig;
    credentialsType: "api_key" | "bearer" | "basic" | "none";
    credentialsValue?: string;
    limits?: { perRun?: number; perDay?: number; perMonth?: number };
  }) => string;
  initialCapability?: CapabilityId;
}) {
  const [name, setName] = useState("");
  const [openapiSpec, setOpenapiSpec] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [authType, setAuthType] = useState<"api_key" | "bearer" | "basic" | "none">("api_key");
  const [apiKey, setApiKey] = useState("");
  const [allowedOps, setAllowedOps] = useState("");
  const [approvalOps, setApprovalOps] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);

  const handleCreate = () => {
    let parsedSpec: unknown;
    try {
      parsedSpec = JSON.parse(openapiSpec);
      setParseError(null);
    } catch {
      setParseError("JSON inválido. Cole um spec OpenAPI válido (JSON).");
      return;
    }

    onCreate({
      providerKey: "custom_openapi",
      name: name.trim() || "Custom OpenAPI",
      capabilities: ["custom_openapi"],
      credentialsType: authType,
      credentialsValue: apiKey || undefined,
      config: {
        openapi: parsedSpec,
        baseUrl: baseUrl.trim() || undefined,
        allowedOperations: allowedOps ? allowedOps.split(",").map((s) => s.trim()).filter(Boolean) : [],
        requiresApprovalForOperations: approvalOps ? approvalOps.split(",").map((s) => s.trim()).filter(Boolean) : [],
      },
    });
  };

  return (
    <WizardShell title="Custom OpenAPI — API do zero" onClose={onClose}>
      <div className="space-y-3">
        <div className="p-3 rounded-lg bg-neon-green/5 border border-neon-green/20 text-xs text-violet-muted">
          <span className="text-neon-green font-semibold">Como funciona:</span> Cole o spec OpenAPI da sua API.
          O sistema gera tools automaticamente a partir dos <code className="text-cream">operationId</code>.
          Você controla quais operações são permitidas e quais exigem approval.
        </div>

        <WizardField label="Nome da integração">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Internal API – Produção"
            className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
          />
        </WizardField>

        <WizardField label="OpenAPI Spec (JSON)">
          <textarea
            value={openapiSpec}
            onChange={(e) => setOpenapiSpec(e.target.value)}
            rows={10}
            placeholder={`{\n  "openapi": "3.0.0",\n  "info": { "title": "My API", "version": "1.0" },\n  "paths": { ... }\n}`}
            className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-xs text-cream focus:outline-none focus:border-beige/30 font-mono resize-y"
          />
          {parseError && (
            <div className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-2.5 h-2.5" /> {parseError}
            </div>
          )}
        </WizardField>

        <WizardField label="Base URL (opcional)">
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.mycompany.com"
            className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
          />
        </WizardField>

        <div className="grid grid-cols-2 gap-3">
          <WizardField label="Tipo de auth">
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value as typeof authType)}
              className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
            >
              <option value="api_key">API Key</option>
              <option value="bearer">Bearer Token</option>
              <option value="basic">Basic Auth</option>
              <option value="none">Nenhuma</option>
            </select>
          </WizardField>
          <WizardField label="Credencial (secreto)">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Cole a chave/token aqui"
              className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30 font-mono"
            />
          </WizardField>
        </div>

        <WizardField label="Operações permitidas (comma-separated operationIds)">
          <input
            type="text"
            value={allowedOps}
            onChange={(e) => setAllowedOps(e.target.value)}
            placeholder="listUsers, createUser, getUser"
            className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30 font-mono"
          />
          <div className="text-[10px] text-violet-muted mt-1">Deixe vazio para permitir todas.</div>
        </WizardField>

        <WizardField label="Operações que exigem approval (comma-separated)">
          <input
            type="text"
            value={approvalOps}
            onChange={(e) => setApprovalOps(e.target.value)}
            placeholder="deleteUser, deleteUser"
            className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30 font-mono"
          />
          <div className="text-[10px] text-[#ff8a3d] mt-1">Estas operações criarão confirmation requests antes de executar.</div>
        </WizardField>

        <div className="flex items-center justify-between pt-3 border-t border-violet-subtle">
          <button
            onClick={() => onClose()}
            className="text-xs text-violet-muted hover:text-cream"
          >
            ← Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!openapiSpec.trim()}
            className="btn-pill btn-primary-neon text-xs disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" /> Criar integração OpenAPI
          </button>
        </div>
      </div>
    </WizardShell>
  );
}

// === Custom HTTP Wizard (manual endpoints) ===
function CustomHttpWizard({
  onClose,
  onCreate,
  initialCapability,
}: {
  onClose: () => void;
  onCreate: (input: {
    providerKey: ProviderId;
    name: string;
    capabilities: CapabilityId[];
    config?: IntegrationConfig;
    credentialsType: "api_key" | "bearer" | "basic" | "none";
    credentialsValue?: string;
    limits?: { perRun?: number; perDay?: number; perMonth?: number };
  }) => string;
  initialCapability?: CapabilityId;
}) {
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [authType, setAuthType] = useState<"api_key" | "bearer" | "basic" | "none">("api_key");
  const [apiKey, setApiKey] = useState("");
  const [endpoints, setEndpoints] = useState<ManualEndpoint[]>([
    { id: `ep_${Date.now()}`, method: "GET", path: "", capabilityAction: "", bodyTemplate: "", description: "" },
  ]);

  const updateEndpoint = (id: string, partial: Partial<ManualEndpoint>) => {
    setEndpoints((eps) => eps.map((e) => (e.id === id ? { ...e, ...partial } : e)));
  };
  const addEndpoint = () => {
    if (endpoints.length >= 5) return;
    setEndpoints([...endpoints, { id: `ep_${Date.now()}`, method: "GET", path: "", capabilityAction: "", bodyTemplate: "", description: "" }]);
  };
  const removeEndpoint = (id: string) => {
    setEndpoints((eps) => eps.filter((e) => e.id !== id));
  };

  const handleCreate = () => {
    const validEndpoints = endpoints.filter((e) => e.path.trim() && e.capabilityAction.trim());
    onCreate({
      providerKey: "custom_http",
      name: name.trim() || "Custom HTTP",
      capabilities: ["http_request"],
      credentialsType: authType,
      credentialsValue: apiKey || undefined,
      config: {
        baseUrl: baseUrl.trim() || undefined,
        endpoints: validEndpoints,
      },
    });
  };

  return (
    <WizardShell title="Custom HTTP — Endpoints manuais" onClose={onClose}>
      <div className="space-y-3">
        <div className="p-3 rounded-lg bg-beige/5 border border-beige/20 text-xs text-violet-muted">
          Cadastre 1-5 endpoints manualmente. Cada endpoint tem método, path template
          (ex.: <code className="text-cream">/repos/{"{owner}"}/{"{repo}"}/issues</code>), e um "capability action"
          que mapeia para o que o agente pede.
        </div>

        <WizardField label="Nome da integração">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Webhook API"
            className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
          />
        </WizardField>

        <div className="grid grid-cols-2 gap-3">
          <WizardField label="Base URL">
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com"
              className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
            />
          </WizardField>
          <WizardField label="Tipo de auth">
            <select
              value={authType}
              onChange={(e) => setAuthType(e.target.value as typeof authType)}
              className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
            >
              <option value="api_key">API Key</option>
              <option value="bearer">Bearer Token</option>
              <option value="basic">Basic Auth</option>
              <option value="none">Nenhuma</option>
            </select>
          </WizardField>
        </div>

        <WizardField label="Credencial (secreto)">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Cole a chave/token aqui"
            className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30 font-mono"
          />
        </WizardField>

        {/* Endpoints */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-violet-muted">Endpoints ({endpoints.length}/5)</span>
            {endpoints.length < 5 && (
              <button onClick={addEndpoint} className="text-[10px] px-2 py-1 rounded bg-beige/10 border border-beige/30 text-beige hover:bg-beige/20 flex items-center gap-1">
                <Plus className="w-2.5 h-2.5" /> Adicionar endpoint
              </button>
            )}
          </div>
          <div className="space-y-2">
            {endpoints.map((ep, i) => (
              <div key={ep.id} className="p-3 rounded-lg bg-violet-bg/30 border border-violet-subtle space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-violet-muted">#{i + 1}</span>
                  <select
                    value={ep.method}
                    onChange={(e) => updateEndpoint(ep.id, { method: e.target.value as ManualEndpoint["method"] })}
                    className="px-2 py-1 rounded bg-violet-bg/40 border border-violet-subtle text-xs text-cream focus:outline-none focus:border-beige/30"
                  >
                    {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={ep.path}
                    onChange={(e) => updateEndpoint(ep.id, { path: e.target.value })}
                    placeholder="/api/v1/resource/{id}"
                    className="flex-1 px-2 py-1 rounded bg-violet-bg/40 border border-violet-subtle text-xs text-cream focus:outline-none focus:border-beige/30 font-mono"
                  />
                  {endpoints.length > 1 && (
                    <button
                      onClick={() => removeEndpoint(ep.id)}
                      className="w-6 h-6 rounded bg-white/5 border border-violet-subtle text-violet-muted hover:text-red-400 flex items-center justify-center"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={ep.capabilityAction}
                    onChange={(e) => updateEndpoint(ep.id, { capabilityAction: e.target.value })}
                    placeholder="capability action (ex.: getUser)"
                    className="px-2 py-1 rounded bg-violet-bg/40 border border-violet-subtle text-[11px] text-cream focus:outline-none focus:border-beige/30 font-mono"
                  />
                  <input
                    type="text"
                    value={ep.description ?? ""}
                    onChange={(e) => updateEndpoint(ep.id, { description: e.target.value })}
                    placeholder="descrição (opcional)"
                    className="px-2 py-1 rounded bg-violet-bg/40 border border-violet-subtle text-[11px] text-cream focus:outline-none focus:border-beige/30"
                  />
                </div>
                {(ep.method === "POST" || ep.method === "PUT" || ep.method === "PATCH") && (
                  <textarea
                    value={ep.bodyTemplate ?? ""}
                    onChange={(e) => updateEndpoint(ep.id, { bodyTemplate: e.target.value })}
                    rows={2}
                    placeholder='Body template JSON: {"name": "{{name}}", "email": "{{email}}"}'
                    className="w-full px-2 py-1 rounded bg-violet-bg/40 border border-violet-subtle text-[11px] text-cream focus:outline-none focus:border-beige/30 font-mono resize-y"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-violet-subtle">
          <button
            onClick={() => onClose()}
            className="text-xs text-violet-muted hover:text-cream"
          >
            ← Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || endpoints.every((e) => !e.path.trim())}
            className="btn-pill btn-primary-neon text-xs disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" /> Criar integração HTTP
          </button>
        </div>
      </div>
    </WizardShell>
  );
}

// === Shared wizard shell ===
function WizardShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 12 }}
        className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl glass-strong border border-violet-subtle overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-violet-subtle">
          <h3 className="text-base font-semibold text-cream font-serif-display">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-violet-muted hover:text-cream">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-5">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function WizardField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-violet-muted mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
