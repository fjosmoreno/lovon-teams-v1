"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Key,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  HelpCircle,
  X,
  Zap,
  Gift,
  Rocket,
  Bot,
} from "lucide-react";
import { useLovonStore } from "@/lib/lovon/store";

// === Provider catalog ===
// Each entry: visual metadata + docsUrl (where to get a free key) + defaultBaseUrl + defaultModel + isFree
// All providers expose OpenAI-compatible /chat/completions unless otherwise noted.

export interface ProviderCatalogEntry {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  isFree: boolean;
  difficulty: "muito fácil" | "fácil" | "médio";
  signupMinutes: number;
  docsUrl: string; // page to grab a free API key
  defaultBaseUrl: string;
  defaultModel: string;
  recommendedModels?: { id: string; label: string; isFree?: boolean }[];
  highlight?: boolean; // shown at top with badge
}

export const PROVIDER_CATALOG: ProviderCatalogEntry[] = [
  {
    id: "openrouter",
    name: "OpenRouter",
    emoji: "🌐",
    tagline: "1 key = 20+ modelos grátis. O mais flexível.",
    isFree: true,
    difficulty: "muito fácil",
    signupMinutes: 2,
    docsUrl: "https://openrouter.ai/settings/keys",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "qwen/qwen-2.5-72b-instruct:free",
    recommendedModels: [
      { id: "qwen/qwen-2.5-72b-instruct:free", label: "Qwen 2.5 72B (free) ⭐", isFree: true },
      { id: "google/gemma-2-9b-it:free", label: "Gemma 2 9B (free)", isFree: true },
      { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B (free) — pode estar rate-limited", isFree: true },
      { id: "deepseek/deepseek-r1:free", label: "DeepSeek R1 (free)", isFree: true },
      { id: "mistralai/mistral-7b-instruct:free", label: "Mistral 7B (free)", isFree: true },
    ],
    highlight: true,
  },
  {
    id: "gemini",
    name: "Google Gemini",
    emoji: "✨",
    tagline: "Key em 30s com sua conta Google. Free tier generoso.",
    isFree: true,
    difficulty: "muito fácil",
    signupMinutes: 1,
    docsUrl: "https://aistudio.google.com/apikey",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-2.0-flash",
    recommendedModels: [
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (free)", isFree: true },
      { id: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite (free)", isFree: true },
    ],
    highlight: true,
  },
  {
    id: "groq",
    name: "Groq",
    emoji: "⚡",
    tagline: "Inferência ultra-rápida. Latência sub-200ms.",
    isFree: true,
    difficulty: "fácil",
    signupMinutes: 2,
    docsUrl: "https://console.groq.com/keys",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    recommendedModels: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile (free)", isFree: true },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant (free)", isFree: true },
      { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B (free)", isFree: true },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    emoji: "🧠",
    tagline: "GPT-4o, o3, Codex. Padrão da indústria (pago).",
    isFree: false,
    difficulty: "médio",
    signupMinutes: 3,
    docsUrl: "https://platform.openai.com/api-keys",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
    recommendedModels: [
      { id: "gpt-4o-mini", label: "GPT-4o Mini (barato)" },
      { id: "gpt-4o", label: "GPT-4o" },
      { id: "o3-mini", label: "o3 Mini (raciocínio)" },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    emoji: "🎭",
    tagline: "Claude Sonnet 4 & Opus 4. Melhor raciocínio longo (pago).",
    isFree: false,
    difficulty: "médio",
    signupMinutes: 3,
    docsUrl: "https://console.anthropic.com/settings/keys",
    defaultBaseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-sonnet-4-5",
    recommendedModels: [
      { id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
      { id: "claude-opus-4-1", label: "Claude Opus 4.1 (top)" },
      { id: "claude-haiku-4-5", label: "Claude Haiku 4.5 (rápido)" },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    emoji: "🐳",
    tagline: "Custo-benefício imbatível. R1 a preço de modelo pequeno.",
    isFree: false,
    difficulty: "fácil",
    signupMinutes: 2,
    docsUrl: "https://platform.deepseek.com/api_keys",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
    recommendedModels: [
      { id: "deepseek-chat", label: "DeepSeek V3 (barato)" },
      { id: "deepseek-reasoner", label: "DeepSeek R1 (raciocínio)" },
    ],
  },
];

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

export function ProviderSetup({ onComplete, onSkip }: Props) {
  const [enabledProviders, setEnabledProviders] = useState<Record<string, boolean>>(() => {
    const defaults: Record<string, boolean> = {};
    PROVIDER_CATALOG.forEach((p) => { defaults[p.id] = false; });
    return defaults;
  });
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [models, setModels] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    PROVIDER_CATALOG.forEach((p) => { defaults[p.id] = p.defaultModel; });
    return defaults;
  });
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; message: string; latencyMs?: number }>>({});
  const [showTutorial, setShowTutorial] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const createIntegration = useLovonStore((s) => s.createIntegration);

  async function handleTest(provider: ProviderCatalogEntry) {
    return handleTestImpl(provider, false);
  }

  async function handleTestReal(provider: ProviderCatalogEntry) {
    return handleTestImpl(provider, true);
  }

  async function handleTestImpl(provider: ProviderCatalogEntry, useRealPrompt: boolean) {
    const key = (keys[provider.id] ?? "").trim();
    if (!key) {
      setTestResults((r) => ({ ...r, [provider.id]: { ok: false, message: "Cole sua API key primeiro." } }));
      return;
    }
    setTestingId(provider.id);
    setTestResults((r) => ({ ...r, [provider.id]: { ok: false, message: useRealPrompt ? "Testando com prompt real..." : "Testando..." } }));
    try {
      const res = await fetch("/api/lovon/test-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: provider.defaultBaseUrl,
          apiKey: key,
          model: models[provider.id] ?? provider.defaultModel,
          provider: provider.id,
          real: useRealPrompt,
        }),
      });
      const data = await res.json();
      setTestResults((r) => ({ ...r, [provider.id]: data }));
    } catch (err) {
      setTestResults((r) => ({
        ...r,
        [provider.id]: { ok: false, message: err instanceof Error ? err.message : "Erro de conexão" },
      }));
    } finally {
      setTestingId(null);
    }
  }

  async function handleSaveAndContinue() {
    const enabled = PROVIDER_CATALOG.filter((p) => enabledProviders[p.id] && (keys[p.id] ?? "").trim());
    if (enabled.length === 0) {
      alert("Habilite pelo menos 1 provider e cole sua API key.\n\nOu clique 'Pular por agora' para entrar em modo demo (funcionalidade limitada).");
      return;
    }
    setSaving(true);
    try {
      for (const p of enabled) {
        await createIntegration({
          name: `${p.name} (${p.isFree ? "Free" : "Pago"})`,
          providerKey: p.id as any,
          capabilities: [],
          credentialsType: "api_key",
          credentialsValue: keys[p.id].trim(),
          config: {
            baseUrl: p.defaultBaseUrl,
            models: [models[p.id] ?? p.defaultModel],
          },
          allowedAgentSlugs: [],
        });
      }
      onComplete();
    } finally {
      setSaving(false);
    }
  }

  const freeProviders = PROVIDER_CATALOG.filter((p) => p.isFree);
  const paidProviders = PROVIDER_CATALOG.filter((p) => !p.isFree);
  const testedCount = Object.values(testResults).filter((r) => r.ok).length;
  const enabledCount = Object.values(enabledProviders).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-violet-bg overflow-y-auto">
      {/* bg accents */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.08] blur-3xl"
          style={{ background: "#935073" }}
        />
        <div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.06] blur-3xl"
          style={{ background: "#F6DBC0" }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-5 sm:px-8 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-4">
            <Sparkles className="w-3.5 h-3.5 text-beige" />
            <span className="text-xs font-mono text-beige uppercase tracking-wider">
              Configuração inicial
            </span>
          </div>
          <h1 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-bold text-cream mb-3">
            Escolha seus <span className="gradient-text-purple">provedores de IA</span>
          </h1>
          <p className="text-base sm:text-lg text-tech-gray max-w-2xl mx-auto leading-relaxed">
            Seus agentes precisam de um cérebro. Conecte 1 ou mais provedores de LLM —
            <span className="text-cream"> você pode usar LLMs 100% gratuitos</span>.
            Chaves ficam salvas só no seu navegador.
          </p>
        </motion.div>

        {/* Tip banner — recommended providers */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 p-4 rounded-2xl glass border border-beige/30 bg-beige/5"
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              <div className="w-9 h-9 rounded-lg bg-beige/15 border border-beige/30 flex items-center justify-center">
                <Gift className="w-4 h-4 text-beige" />
              </div>
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-cream mb-1">
                💡 Recomendação para começar em 2 minutos
              </div>
              <div className="text-xs text-tech-gray leading-relaxed">
                <span className="text-cream font-medium">OpenRouter</span> é o mais versátil: 1 key dá acesso a DeepSeek, Qwen, Llama, Gemini e outros modelos free.
                <br />
                <span className="text-cream font-medium">Google Gemini</span> é o mais rápido de configurar: key em 30s com sua conta Google já logada.
              </div>
            </div>
          </div>
        </motion.div>

        {/* Free providers section */}
        <ProviderSection
          title="🟢 Provedores gratuitos"
          subtitle="Tier gratuito permanente. Sem cartão de crédito."
          providers={freeProviders}
          enabledProviders={enabledProviders}
          setEnabledProviders={setEnabledProviders}
          keys={keys}
          setKeys={setKeys}
          models={models}
          setModels={setModels}
          showKey={showKey}
          setShowKey={setShowKey}
          testingId={testingId}
          testResults={testResults}
          handleTest={handleTest}
          handleTestReal={handleTestReal}
          setShowTutorial={setShowTutorial}
        />

        {/* Paid providers section */}
        <ProviderSection
          title="🔵 Provedores premium (pagos)"
          subtitle="Mais rápidos, mais inteligentes, com SLA."
          providers={paidProviders}
          enabledProviders={enabledProviders}
          setEnabledProviders={setEnabledProviders}
          keys={keys}
          setKeys={setKeys}
          models={models}
          setModels={setModels}
          showKey={showKey}
          setShowKey={setShowKey}
          testingId={testingId}
          testResults={testResults}
          handleTest={handleTest}
          handleTestReal={handleTestReal}
          setShowTutorial={setShowTutorial}
        />

        {/* Footer / actions */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-10 p-5 rounded-2xl glass border border-violet-subtle"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="text-xs text-tech-gray">
                {enabledCount > 0 ? (
                  <>
                    <span className="text-cream font-semibold">{enabledCount}</span> provider{enabledCount > 1 ? "s" : ""} habilitado{enabledCount > 1 ? "s" : ""}
                    {testedCount > 0 && (
                      <> · <span className="text-neon-green font-semibold">{testedCount}</span> testado{testedCount > 1 ? "s" : ""} com sucesso</>
                    )}
                  </>
                ) : (
                  "Nenhum provider habilitado ainda."
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onSkip}
                className="px-4 py-2 rounded-lg text-xs text-violet-muted hover:text-cream transition-colors"
              >
                Pular por agora
              </button>
              <button
                onClick={handleSaveAndContinue}
                disabled={saving || enabledCount === 0}
                className="px-5 py-2.5 rounded-lg bg-cream text-violet-bg text-sm font-semibold hover:bg-beige transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
                ) : (
                  <>Continuar <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tutorial modal */}
      <AnimatePresence>
        {showTutorial && (
          <TutorialModal
            provider={PROVIDER_CATALOG.find((p) => p.id === showTutorial)!}
            onClose={() => setShowTutorial(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// === Provider section ===

function ProviderSection({
  title,
  subtitle,
  providers,
  enabledProviders,
  setEnabledProviders,
  keys,
  setKeys,
  models,
  setModels,
  showKey,
  setShowKey,
  testingId,
  testResults,
  handleTest,
  handleTestReal,
  setShowTutorial,
}: any) {
  return (
    <div className="mb-8">
      <div className="mb-4">
        <h2 className="font-serif-display text-lg font-semibold text-cream mb-1">{title}</h2>
        <p className="text-xs text-tech-gray">{subtitle}</p>
      </div>
      <div className="space-y-3">
        {providers.map((p: ProviderCatalogEntry, idx: number) => (
          <ProviderCard
            key={p.id}
            provider={p}
            index={idx}
            enabled={enabledProviders[p.id] ?? false}
            onToggle={() => setEnabledProviders((m: any) => ({ ...m, [p.id]: !m[p.id] }))}
            apiKey={keys[p.id] ?? ""}
            onKeyChange={(v) => setKeys((m: any) => ({ ...m, [p.id]: v }))}
            model={models[p.id] ?? p.defaultModel}
            onModelChange={(v) => setModels((m: any) => ({ ...m, [p.id]: v }))}
            showKey={showKey[p.id] ?? false}
            onToggleShow={() => setShowKey((m: any) => ({ ...m, [p.id]: !m[p.id] }))}
            testing={testingId === p.id}
            testResult={testResults[p.id]}
            onTest={() => handleTest(p)}
            onTestReal={() => handleTestReal(p)}
            onShowTutorial={() => setShowTutorial(p.id)}
          />
        ))}
      </div>
    </div>
  );
}

// === Provider card ===

function ProviderCard({
  provider,
  index,
  enabled,
  onToggle,
  apiKey,
  onKeyChange,
  model,
  onModelChange,
  showKey,
  onToggleShow,
  testing,
  testResult,
  onTest,
  onTestReal,
  onShowTutorial,
}: {
  provider: ProviderCatalogEntry;
  index: number;
  enabled: boolean;
  onToggle: () => void;
  apiKey: string;
  onKeyChange: (v: string) => void;
  model: string;
  onModelChange: (v: string) => void;
  showKey: boolean;
  onToggleShow: () => void;
  testing: boolean;
  testResult?: { ok: boolean; message: string; latencyMs?: number };
  onTest: () => void;
  onTestReal: () => void;
  onShowTutorial: () => void;
}) {
  const isTestedOk = testResult?.ok === true;
  const isTestedFail = testResult?.ok === false && testResult?.message && testResult.message !== "Testando...";
  const difficultyColor = {
    "muito fácil": "text-neon-green",
    "fácil": "text-[#b6ff3d]",
    "médio": "text-[#ff8a3d]",
  }[provider.difficulty];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className={`p-4 rounded-xl border transition-all ${
        enabled
          ? "bg-violet-dark/60 border-beige/30 shadow-lg shadow-beige/5"
          : "bg-violet-dark/30 border-violet-subtle"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Toggle */}
        <button
          onClick={onToggle}
          className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
            enabled
              ? "bg-beige border-beige"
              : "border-violet-subtle hover:border-beige/50"
          }`}
          aria-label={enabled ? "Desabilitar" : "Habilitar"}
        >
          {enabled && <CheckCircle2 className="w-3 h-3 text-violet-bg" />}
        </button>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xl">{provider.emoji}</span>
            <h3 className="font-semibold text-cream text-sm">{provider.name}</h3>
            {provider.isFree && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-neon-green/15 text-neon-green border border-neon-green/30">
                FREE
              </span>
            )}
            {provider.highlight && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-beige/15 text-beige border border-beige/30">
                ⭐ TOP
              </span>
            )}
            <span className={`text-[10px] font-mono ${difficultyColor}`}>
              · {provider.difficulty} · ~{provider.signupMinutes}min
            </span>
          </div>
          <p className="text-xs text-tech-gray mb-3">{provider.tagline}</p>

          {/* Inputs — only when enabled */}
          {enabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2.5"
            >
              {/* API Key input */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-violet-muted mb-1 block">
                  <Key className="w-3 h-3 inline mr-1" /> API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => onKeyChange(e.target.value)}
                    placeholder={`Cole sua key do ${provider.name} aqui...`}
                    className="w-full pl-3 pr-24 py-2 rounded-lg bg-violet-bg/50 border border-violet-subtle text-xs text-cream placeholder:text-violet-muted/50 focus:outline-none focus:border-beige/30 focus:bg-violet-bg transition-all font-mono"
                  />
                  <button
                    onClick={onToggleShow}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-violet-muted hover:text-cream"
                    title={showKey ? "Esconder" : "Mostrar"}
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Model select */}
              {provider.recommendedModels && provider.recommendedModels.length > 1 && (
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-violet-muted mb-1 block">
                    <Bot className="w-3 h-3 inline mr-1" /> Modelo padrão
                  </label>
                  <select
                    value={model}
                    onChange={(e) => onModelChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-violet-bg/50 border border-violet-subtle text-xs text-cream focus:outline-none focus:border-beige/30 focus:bg-violet-bg transition-all"
                  >
                    {provider.recommendedModels.map((m) => (
                      <option key={m.id} value={m.id} className="bg-violet-bg">
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Test button + result */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <button
                  onClick={onTest}
                  disabled={testing || !apiKey.trim()}
                  className="px-3 py-1.5 rounded-lg bg-beige/15 text-beige border border-beige/30 hover:bg-beige/25 text-xs font-medium flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {testing ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Testando...</>
                  ) : (
                    <><Zap className="w-3 h-3" /> Testar conexão</>
                  )}
                </button>
                <button
                  onClick={onTestReal}
                  disabled={testing || !apiKey.trim()}
                  className="px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20 text-xs font-medium flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  title="Testa com prompt real (mimetiza chamada de produção). Pode falhar se o modelo não suportar prompts longos."
                >
                  {testing ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Testando...</>
                  ) : (
                    <><Zap className="w-3 h-3" /> Testar com prompt real</>
                  )}
                </button>
                {isTestedOk && (
                  <span className="text-[10px] text-neon-green flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3" /> {testResult?.latencyMs ? `${testResult.latencyMs}ms · ` : ""}OK
                  </span>
                )}
                {isTestedFail && (
                  <span className="text-[10px] text-[#ff8a3d] flex items-center gap-1 font-mono">
                    <AlertCircle className="w-3 h-3" /> {testResult?.message}
                  </span>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right side: Get key buttons */}
        <div className="flex flex-col gap-1.5 shrink-0 items-end">
          <a
            href={provider.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-md bg-violet-bg/60 border border-violet-subtle hover:border-beige/30 text-[10px] font-mono text-cream flex items-center gap-1 transition-colors"
            title={`Abrir página de signup do ${provider.name} em nova aba`}
          >
            <Rocket className="w-3 h-3" /> Pegar key grátis <ExternalLink className="w-2.5 h-2.5" />
          </a>
          <button
            onClick={onShowTutorial}
            className="text-[10px] text-violet-muted hover:text-cream flex items-center gap-1 transition-colors"
          >
            <HelpCircle className="w-3 h-3" /> Como pegar?
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// === Tutorial modal — shows step-by-step for grabbing a free API key ===

function TutorialModal({ provider, onClose }: { provider: ProviderCatalogEntry; onClose: () => void }) {
  const steps = getTutorialSteps(provider);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-5"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.2 }}
        className="relative max-w-lg w-full max-h-[85vh] overflow-y-auto bg-violet-dark border border-violet-subtle rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-violet-bg/60 text-violet-muted hover:text-cream transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{provider.emoji}</span>
            <h3 className="font-serif-display text-lg font-semibold text-cream">
              Como pegar sua key do {provider.name}
            </h3>
          </div>
          <p className="text-xs text-tech-gray mb-5">
            Tempo estimado: <span className="text-cream font-medium">~{provider.signupMinutes} minutos</span> · {provider.isFree ? "100% grátis" : "Requer cartão"}
          </p>

          <ol className="space-y-3 mb-5">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <div className="shrink-0 w-6 h-6 rounded-full bg-beige/15 border border-beige/30 flex items-center justify-center text-xs font-mono font-bold text-beige">
                  {i + 1}
                </div>
                <div className="flex-1 pt-0.5">
                  <div className="text-sm text-cream mb-0.5">{s.title}</div>
                  <div className="text-xs text-tech-gray leading-relaxed">{s.desc}</div>
                </div>
              </li>
            ))}
          </ol>

          <a
            href={provider.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 rounded-lg bg-cream text-violet-bg text-sm font-semibold hover:bg-beige transition-all flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" /> Abrir página do {provider.name}
          </a>

          <div className="mt-4 p-3 rounded-lg bg-violet-bg/40 border border-violet-subtle text-[10px] text-tech-gray leading-relaxed">
            🔒 Sua key fica salva <span className="text-cream">só no seu navegador</span> (localStorage). Não enviamos ela pra lugar nenhum — só usamos pra chamar o provider.
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function getTutorialSteps(p: ProviderCatalogEntry): { title: string; desc: string }[] {
  if (p.id === "openrouter") {
    return [
      { title: "Acesse openrouter.ai", desc: "Clique no botão 'Pegar key grátis' ao lado → cria conta com Google ou email." },
      { title: "Vá em Settings → Keys", desc: "Após login, clique no seu avatar (canto superior direito) → Settings → aba Keys." },
      { title: "Clique 'Create Key'", desc: "Dê um nome (ex: 'Lovon Teams') e clique em Create. Copie a key que aparece (começa com sk-or-v1-)." },
      { title: "Cole aqui", desc: "Volte pra essa tela, cole a key no campo e clique 'Testar conexão'. Se aparecer OK, tá pronto!" },
    ];
  }
  if (p.id === "gemini") {
    return [
      { title: "Acesse aistudio.google.com/apikey", desc: "Login automático com sua conta Google." },
      { title: "Clique 'Create API key'", desc: "Escolha um projeto Google Cloud (ou crie um novo gratuito)." },
      { title: "Copie a key", desc: "A key aparece em popup. Copie (começa com AIzaSy...)." },
      { title: "Cole aqui", desc: "Volte, cole no campo e clique 'Testar conexão'." },
    ];
  }
  if (p.id === "groq") {
    return [
      { title: "Acesse console.groq.com/keys", desc: "Crie conta com Google ou email." },
      { title: "Clique 'Create API Key'", desc: "Dê um nome e crie." },
      { title: "Copie a key (gsk_...)", desc: "⚠️ Essa key só aparece UMA VEZ. Copie imediatamente." },
      { title: "Cole aqui", desc: "Volte, cole no campo e teste." },
    ];
  }
  if (p.id === "openai") {
    return [
      { title: "Acesse platform.openai.com/api-keys", desc: "Requer cartão de crédito. Cota gratuita pode estar disponível." },
      { title: "Clique 'Create new secret key'", desc: "Dê um nome e crie." },
      { title: "Copie a key (sk-...)", desc: "⚠️ Aparece só uma vez. Copie imediatamente." },
      { title: "Cole aqui", desc: "Volte, cole e teste." },
    ];
  }
  if (p.id === "anthropic") {
    return [
      { title: "Acesse console.anthropic.com", desc: "Crie conta com email. Pode exigir verificação por telefone." },
      { title: "Vá em Settings → API Keys", desc: "Clique 'Create Key'." },
      { title: "Copie a key (sk-ant-...)", desc: "⚠️ Aparece só uma vez. Copie imediatamente." },
      { title: "Cole aqui", desc: "Volte, cole e teste." },
    ];
  }
  if (p.id === "deepseek") {
    return [
      { title: "Acesse platform.deepseek.com", desc: "Crie conta com email." },
      { title: "Vá em API Keys", desc: "Clique 'Create new key'." },
      { title: "Copie a key (sk-...)", desc: "⚠️ Aparece só uma vez. Copie imediatamente." },
      { title: "Cole aqui", desc: "Volte, cole e teste. DeepSeek cobra por uso (barato)." },
    ];
  }
  return [
    { title: `Acesse ${p.docsUrl}`, desc: "Crie conta no provider." },
    { title: "Gere uma API key", desc: "Procure por 'API Keys' ou 'Credentials' no painel." },
    { title: "Copie a key", desc: "⚠️ Geralmente aparece só uma vez. Copie imediatamente." },
    { title: "Cole aqui", desc: "Volte, cole no campo e clique 'Testar conexão'." },
  ];
}