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
  ExternalLink,
  Loader2,
  GitBranch,
  Rocket,
  Globe,
  FileCode,
  Key,
  Lock,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useLovonStore } from "@/lib/lovon/store";
import {
  PROVIDER_CAPABILITIES,
  PROVIDER_PRESETS,
  ProviderPreset,
  Integration,
  IntegrationConfig,
  CapabilityId,
  ProviderId,
  ManualEndpoint,
} from "@/lib/lovon/work-products";

// Quick list of AI providers for the inline picker.
// These mirror what's in ProviderSetup's catalog.
const AI_PROVIDER_OPTIONS: Array<{
  key: ProviderId;
  name: string;
  emoji: string;
  baseUrl: string;
  defaultModel: string;
  isFree: boolean;
  signupUrl: string;
}> = [
  { key: "minimax", name: "MiniMax", emoji: "⚡", baseUrl: "https://api.minimax.io/v1", defaultModel: "MiniMax-M3", isFree: false, signupUrl: "https://platform.minimax.io/user-center/apikeys" },
  { key: "gemini", name: "Google Gemini", emoji: "✨", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", defaultModel: "gemini-2.0-flash", isFree: true, signupUrl: "https://aistudio.google.com/apikey" },
  { key: "groq", name: "Groq", emoji: "🟢", baseUrl: "https://api.groq.com/openai/v1", defaultModel: "llama-3.3-70b-versatile", isFree: true, signupUrl: "https://console.groq.com/keys" },
  { key: "openrouter", name: "OpenRouter", emoji: "🌐", baseUrl: "https://openrouter.ai/api/v1", defaultModel: "google/gemma-2-9b-it:free", isFree: true, signupUrl: "https://openrouter.ai/settings/keys" },
  { key: "nvidia", name: "NVIDIA NIM", emoji: "🟩", baseUrl: "https://integrate.api.nvidia.com/v1", defaultModel: "meta/llama-3.1-70b-instruct", isFree: true, signupUrl: "https://build.nvidia.com/explore/discover" },
  { key: "openai", name: "OpenAI", emoji: "🧠", baseUrl: "https://api.openai.com/v1", defaultModel: "gpt-4o-mini", isFree: false, signupUrl: "https://platform.openai.com/api-keys" },
  { key: "anthropic", name: "Anthropic", emoji: "🎭", baseUrl: "https://api.anthropic.com/v1", defaultModel: "claude-sonnet-4-5", isFree: false, signupUrl: "https://console.anthropic.com/settings/keys" },
  { key: "deepseek", name: "DeepSeek", emoji: "🐳", baseUrl: "https://api.deepseek.com/v1", defaultModel: "deepseek-chat", isFree: false, signupUrl: "https://platform.deepseek.com/api_keys" },
];

const PROVIDER_ICONS: Partial<Record<ProviderId, React.ComponentType<{ className?: string }>>> = {
  resend: Mail,
  brave: Search,
  openai: Zap,
  anthropic: Zap,
  groq: Zap,
  openrouter: Zap,
  deepseek: Zap,
  nvidia: Zap,
  minimax: Zap,
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

export function IntegrationsView({ initialFilterCapability: _initialFilterCapability }: { initialFilterCapability?: CapabilityId | null }) {
  const integrations = useLovonStore((s) => s.integrations);
  const createIntegration = useLovonStore((s) => s.createIntegration);
  const updateIntegration = useLovonStore((s) => s.updateIntegration);
  const deleteIntegration = useLovonStore((s) => s.deleteIntegration);
  const testIntegrationReal = useLovonStore((s) => s.testIntegrationReal);

  const [showWizard, setShowWizard] = useState(false);
  const [wizardPath, setWizardPath] = useState<"preset" | "openapi" | "http" | null>(null);
  const [showAIPicker, setShowAIPicker] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const aiProviders = integrations.filter((i) =>
    ["openai", "anthropic", "groq", "openrouter", "deepseek", "gemini", "nvidia", "minimax"].includes(i.providerKey)
  );
  const externalProviders = integrations.filter((i) =>
    !["openai", "anthropic", "groq", "openrouter", "deepseek", "gemini", "nvidia", "minimax", "internal"].includes(i.providerKey)
  );

  function addAIProvider(preset: typeof AI_PROVIDER_OPTIONS[number]) {
    const name = window.prompt(`Nome para identificar a integração (ou deixe vazio para "${preset.name}"):`, preset.name);
    if (name === null) return;
    const apiKey = window.prompt(`Cole sua API key do ${preset.name} (cadastre-se em ${preset.signupUrl}):`);
    if (!apiKey || !apiKey.trim()) return;
    createIntegration({
      providerKey: preset.key,
      name: name.trim() || preset.name,
      capabilities: [],
      credentialsType: "api_key",
      credentialsValue: apiKey.trim(),
      config: {
        baseUrl: preset.baseUrl,
        models: [preset.defaultModel],
      },
      allowedAgentSlugs: [],
    });
    // Auto-resume any blocked tasks
    import("@/lib/lovon/engine").then(({ tryAutoResumeBlockedTasks }) => {
      tryAutoResumeBlockedTasks({ reason: "provider-added" });
    });
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* === Header === */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Plug className="w-5 h-5 text-beige" />
          <h1 className="text-2xl sm:text-3xl font-bold text-cream font-serif-display">Integrações</h1>
        </div>
        <p className="text-sm text-violet-muted max-w-2xl">
          Conecte provedores de IA (Gemini, Groq, OpenRouter, MiniMax...) para seus agentes pensarem.
          Opcionalmente, conecte serviços externos (Resend, GitHub, Vercel) para dar superpoderes.
        </p>
      </div>

      {/* === Section 1: AI Providers === */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-cream flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-beige" /> Provedores de IA
            </h2>
            <p className="text-[11px] text-violet-muted mt-0.5">
              Onde seus agentes pensam. Roteamento automático, sem configuração manual.
            </p>
          </div>
          <button
            onClick={() => setShowAIPicker(true)}
            className="px-3 py-1.5 rounded-lg bg-beige/10 border border-beige/30 text-beige hover:bg-beige/20 text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar IA
          </button>
        </div>

        {aiProviders.length === 0 ? (
          <div className="p-6 rounded-xl border border-dashed border-beige/30 bg-beige/5 text-center">
            <Sparkles className="w-8 h-8 text-beige/40 mx-auto mb-2" />
            <p className="text-sm text-cream font-medium mb-1">Nenhum provedor de IA configurado</p>
            <p className="text-xs text-violet-muted mb-3">
              Seus agentes precisam de uma chave de API para funcionar. Configure agora.
            </p>
            <button
              onClick={() => setShowAIPicker(true)}
              className="px-4 py-2 rounded-lg bg-beige text-violet-bg text-xs font-semibold hover:bg-beige/90 transition-all"
            >
              Configurar provedor de IA →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {aiProviders.map((integration) => (
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
            ))}
          </div>
        )}
      </div>

      {/* === Section 2: External Integrations (collapsed by default) === */}
      <details className="rounded-xl glass border border-violet-subtle overflow-hidden group">
        <summary className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors flex items-center gap-3">
          <ChevronDown className="w-4 h-4 text-violet-muted transition-transform group-open:rotate-180" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-cream">🔌 Serviços externos (opcional)</h3>
            <p className="text-[11px] text-violet-muted mt-0.5">
              Resend (email), GitHub (repo), Vercel (deploy), HubSpot (CRM) e outros.
            </p>
          </div>
          {externalProviders.length > 0 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neon-green/15 text-neon-green border border-neon-green/30">
              {externalProviders.length} ativo{externalProviders.length > 1 ? "s" : ""}
            </span>
          )}
        </summary>
        <div className="p-4 border-t border-violet-subtle space-y-2">
          {externalProviders.length === 0 ? (
            <div className="p-4 rounded-lg border border-dashed border-violet-subtle text-center">
              <p className="text-xs text-violet-muted mb-2">
                Sem integrações externas configuradas. Seus agentes funcionam sem elas — são opcionais.
              </p>
              <button
                onClick={() => { setShowWizard(true); setWizardPath(null); }}
                className="px-3 py-1.5 rounded-lg bg-violet-bg/60 border border-violet-subtle text-cream hover:border-beige/30 text-xs font-medium inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar serviço externo
              </button>
            </div>
          ) : (
            <>
              {externalProviders.map((integration) => (
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
              ))}
              <button
                onClick={() => { setShowWizard(true); setWizardPath(null); }}
                className="w-full mt-2 px-3 py-2 rounded-lg bg-violet-bg/40 border border-dashed border-violet-subtle text-violet-muted hover:text-cream hover:border-beige/30 text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar outro serviço
              </button>
            </>
          )}
        </div>
      </details>

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
              // P0: trigger auto-resume for any tasks blocked by rate limit
              import("@/lib/lovon/engine").then(({ tryAutoResumeBlockedTasks }) => {
                tryAutoResumeBlockedTasks({ reason: "provider-added" });
              });
              return id;
            }}
          />
        )}
      </AnimatePresence>

      {/* === AI Provider Picker Modal === */}
      <AnimatePresence>
        {showAIPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowAIPicker(false)}
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
                  <h3 className="text-base font-semibold text-cream font-serif-display">Adicionar provedor de IA</h3>
                  <p className="text-xs text-violet-muted mt-0.5">Escolha 1 provedor. Os grátis não pedem cartão.</p>
                </div>
                <button onClick={() => setShowAIPicker(false)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-violet-muted hover:text-cream">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AI_PROVIDER_OPTIONS.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => {
                      setShowAIPicker(false);
                      addAIProvider(p);
                    }}
                    className="p-4 rounded-xl border border-violet-subtle hover:border-beige/30 hover:bg-beige/5 transition-all text-left flex items-center gap-3"
                  >
                    <span className="text-2xl shrink-0">{p.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-cream">{p.name}</span>
                        {p.isFree && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-neon-green/15 text-neon-green border border-neon-green/30">
                            FREE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-violet-muted mt-0.5 truncate">{p.defaultModel}</div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
            </div>
            {/* Capabilities chips */}
            {integration.capabilities.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {integration.capabilities.map((cap) => (
                  <span key={cap} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-beige/5 border border-beige/20 text-beige">
                    {cap}
                  </span>
                ))}
              </div>
            )}
            {/* Test result */}
            {integration.lastTestResult && (
              <div className={`mt-1 text-[10px] flex items-center gap-1 ${
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

// === Integration Wizard (3-path) ===
function IntegrationWizard({
  onClose,
  onPathSelect,
  wizardPath,
  onCreate,
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
}) {
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
              <h3 className="text-base font-semibold text-cream font-serif-display">Adicionar integração externa</h3>
              <p className="text-xs text-violet-muted mt-0.5">Escolha como conectar</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-violet-muted hover:text-cream">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-3">
            <button
              onClick={() => onPathSelect("preset")}
              className="w-full p-4 rounded-xl border border-violet-subtle hover:border-beige/30 hover:bg-beige/5 transition-all text-left flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-beige/10 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-beige" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-cream">Provider pronto</div>
                <div className="text-[11px] text-violet-muted">Resend, Brave, GitHub, Vercel, HubSpot... 17 providers disponíveis</div>
              </div>
            </button>

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

  if (wizardPath === "preset") {
    return <PresetWizard onClose={onClose} onCreate={onCreate} />;
  }

  if (wizardPath === "openapi") {
    return <OpenApiWizard onClose={onClose} onCreate={onCreate} />;
  }

  return <CustomHttpWizard onClose={onClose} onCreate={onCreate} />;
}

// === Preset Wizard ===
function PresetWizard({
  onClose,
  onCreate,
  initialCapability: _initialCapability,
}: {
  onClose: () => void;
  onCreate: (input: any) => string;
  initialCapability?: CapabilityId;
}) {
  const [selectedPreset, setSelectedPreset] = useState<ProviderPreset | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  if (!selectedPreset) {
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
          className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl glass-strong border border-violet-subtle overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between p-5 border-b border-violet-subtle">
            <div>
              <h3 className="text-base font-semibold text-cream font-serif-display">Escolha um provider</h3>
              <p className="text-xs text-violet-muted mt-0.5">{PROVIDER_PRESETS.length} integrações disponíveis</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-violet-muted hover:text-cream">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PROVIDER_PRESETS.map((preset) => (
              <button
                key={preset.key}
                onClick={() => {
                  setSelectedPreset(preset);
                  setName(`${preset.name} (${preset.category})`);
                }}
                className="p-4 rounded-xl border border-violet-subtle hover:border-beige/30 hover:bg-beige/5 transition-all text-left"
              >
                <div className="text-sm font-semibold text-cream mb-1">{preset.name}</div>
                <div className="text-[10px] font-mono text-violet-muted mb-2">{preset.category}</div>
                <div className="text-[11px] text-violet-muted line-clamp-2">{preset.description}</div>
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  const cfg = PROVIDER_CAPABILITIES[selectedPreset.key] ?? [];

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
        className="relative w-full max-w-md max-h-[85vh] flex flex-col rounded-2xl glass-strong border border-violet-subtle overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-violet-subtle">
          <h3 className="text-base font-semibold text-cream font-serif-display">Configurar {selectedPreset.name}</h3>
          <p className="text-xs text-violet-muted mt-0.5">{cfg.length} capabilities disponíveis</p>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto no-scrollbar">
          <div>
            <label className="text-[10px] font-mono uppercase text-violet-muted mb-1 block">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-violet-bg/50 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase text-violet-muted mb-1 block">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Cole sua key do ${selectedPreset.name}...`}
              className="w-full px-3 py-2 rounded-lg bg-violet-bg/50 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30 font-mono"
            />
          </div>
        </div>
        <div className="p-4 border-t border-violet-subtle flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded-lg text-xs text-violet-muted hover:text-cream">
            Cancelar
          </button>
          <button
            onClick={async () => {
              if (!apiKey.trim()) return;
              setCreating(true);
              try {
                onCreate({
                  providerKey: selectedPreset.key,
                  name: name || `${selectedPreset.name}`,
                  capabilities: cfg,
                  credentialsType: "api_key",
                  credentialsValue: apiKey.trim(),
                  config: { baseUrl: selectedPreset.defaultBaseUrl },
                });
              } finally {
                setCreating(false);
              }
            }}
            disabled={!apiKey.trim() || creating}
            className="px-4 py-2 rounded-lg bg-cream text-violet-bg text-xs font-semibold hover:bg-beige transition-all disabled:opacity-50"
          >
            {creating ? "Criando..." : "Criar"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// === OpenAPI Wizard (stub) ===
function OpenApiWizard({ onClose, onCreate: _onCreate }: { onClose: () => void; onCreate: any }) {
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
        className="relative w-full max-w-md p-5 rounded-2xl glass-strong border border-violet-subtle"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-cream mb-2">Custom OpenAPI</h3>
        <p className="text-xs text-violet-muted mb-4">
          Cole uma URL de spec OpenAPI JSON/YAML ou faça upload do arquivo.
        </p>
        <textarea
          placeholder="https://api.example.com/openapi.json"
          className="w-full h-32 px-3 py-2 rounded-lg bg-violet-bg/50 border border-violet-subtle text-xs text-cream focus:outline-none focus:border-beige/30 font-mono mb-3"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded-lg text-xs text-violet-muted">Cancelar</button>
          <button className="px-4 py-2 rounded-lg bg-cream text-violet-bg text-xs font-semibold">Gerar tools</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// === Custom HTTP Wizard (stub) ===
function CustomHttpWizard({ onClose, onCreate: _onCreate }: { onClose: () => void; onCreate: any }) {
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
        className="relative w-full max-w-md p-5 rounded-2xl glass-strong border border-violet-subtle"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-cream mb-2">Custom HTTP</h3>
        <p className="text-xs text-violet-muted mb-4">
          Cadastre endpoints manualmente com templates de path/body.
        </p>
        <div className="text-[10px] text-violet-muted/70 italic">Em breve — use Custom OpenAPI por enquanto.</div>
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-3 py-2 rounded-lg text-xs text-violet-muted">Fechar</button>
        </div>
      </motion.div>
    </motion.div>
  );
}