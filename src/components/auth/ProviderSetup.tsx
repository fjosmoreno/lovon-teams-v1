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
  Eye,
  EyeOff,
  HelpCircle,
  X,
  Zap,
  Gift,
  Rocket,
  Bot,
  Plus,
  ChevronDown,
} from "lucide-react";
import { useLovonStore } from "@/lib/lovon/store";

// === Provider catalog ===
// Minimum needed for the dropdown + key field.
// All providers expose OpenAI-compatible /chat/completions unless otherwise noted.

export interface ProviderCatalogEntry {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  isFree: boolean;
  signupMinutes: number;
  docsUrl: string;
  defaultBaseUrl: string;
  defaultModel: string;
  recommendedModels?: { id: string; label: string; isFree?: boolean }[];
  verified?: boolean; // tested OK with real prompt — user can trust the default
}

export const PROVIDER_CATALOG: ProviderCatalogEntry[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    emoji: "✨",
    tagline: "Key em 30s com sua conta Google. Free tier generoso.",
    isFree: true,
    signupMinutes: 1,
    docsUrl: "https://aistudio.google.com/apikey",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-2.0-flash",
    recommendedModels: [
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash (free) ⭐", isFree: true },
      { id: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite (free)", isFree: true },
    ],
    verified: true,
  },
  {
    id: "groq",
    name: "Groq",
    emoji: "⚡",
    tagline: "Inferência ultra-rápida. Latência sub-200ms.",
    isFree: true,
    signupMinutes: 2,
    docsUrl: "https://console.groq.com/keys",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    recommendedModels: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile (free) ⭐", isFree: true },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant (free)", isFree: true },
    ],
    verified: true,
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    emoji: "🌐",
    tagline: "1 key = 4 modelos grátis. Fallback automático entre eles evita rate limit.",
    isFree: true,
    signupMinutes: 2,
    docsUrl: "https://openrouter.ai/settings/keys",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "google/gemma-2-9b-it:free",
    recommendedModels: [
      { id: "google/gemma-2-9b-it:free", label: "Gemma 2 9B (free) ⭐", isFree: true },
      { id: "mistralai/mistral-7b-instruct:free", label: "Mistral 7B (free)", isFree: true },
      { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B (free)", isFree: true },
      { id: "deepseek/deepseek-r1:free", label: "DeepSeek R1 (free)", isFree: true },
    ],
  },
  {
    id: "nvidia",
    name: "NVIDIA NIM",
    emoji: "🟢",
    tagline: "Free endpoint em build.nvidia.com. Modelos Llama 3.1 70B, Mistral, DeepSeek etc.",
    isFree: true,
    signupMinutes: 2,
    docsUrl: "https://build.nvidia.com/explore/discover",
    defaultBaseUrl: "https://integrate.api.nvidia.com/v1",
    defaultModel: "meta/llama-3.1-70b-instruct",
    recommendedModels: [
      { id: "meta/llama-3.1-70b-instruct", label: "Llama 3.1 70B Instruct (free)", isFree: true },
      { id: "meta/llama-3.1-8b-instruct", label: "Llama 3.1 8B Instruct (free, rápido)", isFree: true },
      { id: "mistralai/mistral-large-2-instruct", label: "Mistral Large 2 (free)", isFree: true },
      { id: "deepseek-ai/deepseek-r1", label: "DeepSeek R1 (free)", isFree: true },
      { id: "google/gemma-2-27b-it", label: "Gemma 2 27B IT (free)", isFree: true },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    emoji: "🧠",
    tagline: "GPT-4o, o3, Codex. Padrão da indústria (pago).",
    isFree: false,
    signupMinutes: 3,
    docsUrl: "https://platform.openai.com/api-keys",
    defaultBaseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o-mini",
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    emoji: "🎭",
    tagline: "Claude Sonnet 4 & Opus 4. Melhor raciocínio longo (pago).",
    isFree: false,
    signupMinutes: 3,
    docsUrl: "https://console.anthropic.com/settings/keys",
    defaultBaseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-sonnet-4-5",
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    emoji: "🐳",
    tagline: "Custo-benefício imbatível. R1 a preço de modelo pequeno.",
    isFree: false,
    signupMinutes: 2,
    docsUrl: "https://platform.deepseek.com/api_keys",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    defaultModel: "deepseek-chat",
  },
];

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

export function ProviderSetup({ onComplete, onSkip }: Props) {
  const createIntegration = useLovonStore((s) => s.createIntegration);

  // === Primary provider (the one user picks first) ===
  const [primaryId, setPrimaryId] = useState<string>("openrouter");
  const [primaryKey, setPrimaryKey] = useState("");
  const [primaryModel, setPrimaryModel] = useState<string>("google/gemma-2-9b-it:free");
  const [primaryModels, setPrimaryModels] = useState<string[]>([
    "google/gemma-2-9b-it:free",
    "mistralai/mistral-7b-instruct:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "deepseek/deepseek-r1:free",
  ]);
  const [showPrimaryKey, setShowPrimaryKey] = useState(false);
  const [primaryTestResult, setPrimaryTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [primaryTesting, setPrimaryTesting] = useState(false);

  // === Optional fallback provider (collapsed by default) ===
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [fallbackId, setFallbackId] = useState<string>("groq");
  const [fallbackKey, setFallbackKey] = useState("");
  const [fallbackModel, setFallbackModel] = useState<string>("llama-3.3-70b-versatile");
  const [showFallbackKey, setShowFallbackKey] = useState(false);
  const [fallbackTestResult, setFallbackTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [fallbackTesting, setFallbackTesting] = useState(false);

  // === Tutorial modal ===
  const [showTutorial, setShowTutorial] = useState<string | null>(null);

  // === Saving ===
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const primary = PROVIDER_CATALOG.find((p) => p.id === primaryId)!;
  const fallback = PROVIDER_CATALOG.find((p) => p.id === fallbackId)!;

  async function testKey(provider: ProviderCatalogEntry, apiKey: string, model: string, setResult: (r: { ok: boolean; message: string } | null) => void, setTesting: (b: boolean) => void) {
    if (!apiKey.trim()) {
      setResult({ ok: false, message: "Cole sua API key primeiro." });
      return;
    }
    setTesting(true);
    setResult({ ok: false, message: "Testando..." });
    try {
      const res = await fetch("/api/lovon/test-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl: provider.defaultBaseUrl,
          apiKey: apiKey.trim(),
          model,
          provider: provider.id,
        }),
      });
      const data = await res.json();
      setResult({ ok: !!data.ok, message: data.message ?? (data.ok ? "OK" : "Falhou") });
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : "Erro de conexão" });
    } finally {
      setTesting(false);
    }
  }

  async function handleSaveAndContinue() {
    setError(null);
    if (!primaryKey.trim()) {
      setError("Cole sua API key do " + primary.name + " para continuar.");
      return;
    }
    setSaving(true);
    try {
      // Save primary — include ALL models for anti-rate-limit rotation
      const primaryModelsToSave = primaryModels.length > 0 ? primaryModels : [primaryModel];
      await createIntegration({
        name: `${primary.name} (${primary.isFree ? "Free" : "Pago"})`,
        providerKey: primary.id as any,
        capabilities: [],
        credentialsType: "api_key",
        credentialsValue: primaryKey.trim(),
        config: {
          baseUrl: primary.defaultBaseUrl,
          models: primaryModelsToSave,
        },
        allowedAgentSlugs: [],
      });
      // Save fallback if user added one
      if (fallbackOpen && fallbackKey.trim() && fallbackId !== primaryId) {
        await createIntegration({
          name: `${fallback.name} (${fallback.isFree ? "Free" : "Pago"})`,
          providerKey: fallback.id as any,
          capabilities: [],
          credentialsType: "api_key",
          credentialsValue: fallbackKey.trim(),
          config: {
            baseUrl: fallback.defaultBaseUrl,
            models: [fallbackModel],
          },
          allowedAgentSlugs: [],
        });
      }
      // P0: trigger auto-resume for any tasks blocked by rate limit
      // (user just added provider keys during onboarding)
      import("@/lib/lovon/engine").then(({ tryAutoResumeBlockedTasks }) => {
        tryAutoResumeBlockedTasks({ reason: "provider-added" });
      });
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-violet-bg overflow-y-auto">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.08] blur-3xl" style={{ background: "#935073" }} />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full opacity-[0.06] blur-3xl" style={{ background: "#F6DBC0" }} />
      </div>

      <div className="relative max-w-xl mx-auto px-5 sm:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-3">
            <Sparkles className="w-3.5 h-3.5 text-beige" />
            <span className="text-xs font-mono text-beige uppercase tracking-wider">
              Passo 1 de 1
            </span>
          </div>
          <h1 className="font-serif-display text-3xl sm:text-4xl font-bold text-cream mb-2">
            Conecte sua <span className="gradient-text-purple">IA</span>
          </h1>
          <p className="text-sm text-tech-gray max-w-md mx-auto">
            Escolha 1 provedor, cole sua key grátis, e pronto. Seus agentes já podem trabalhar.
          </p>
        </motion.div>

        {/* === Primary provider card === */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="p-6 rounded-2xl glass-strong border border-beige/30 mb-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <Bot className="w-4 h-4 text-beige" />
            <h2 className="text-sm font-semibold text-cream">Provedor principal</h2>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neon-green/15 text-neon-green border border-neon-green/30">
              OBRIGATÓRIO
            </span>
          </div>

          {/* Provider dropdown */}
          <div className="mb-4">
            <label className="text-[10px] font-mono uppercase tracking-wider text-violet-muted mb-1.5 block">
              Provedor
            </label>
            <select
              value={primaryId}
              onChange={(e) => {
                const id = e.target.value;
                setPrimaryId(id);
                const p = PROVIDER_CATALOG.find((x) => x.id === id);
                if (p) {
                  setPrimaryModel(p.defaultModel);
                  // Reset models list to provider's default set
                  setPrimaryModels(p.recommendedModels?.map((m) => m.id) ?? [p.defaultModel]);
                }
                setPrimaryTestResult(null);
              }}
              className="w-full px-3 py-2.5 rounded-lg bg-violet-bg/50 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30 transition-all"
            >
              {PROVIDER_CATALOG.map((p) => (
                <option key={p.id} value={p.id} className="bg-violet-bg">
                  {p.emoji} {p.name} {p.isFree ? "(grátis)" : "(pago)"}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-violet-muted mt-1.5">{primary.tagline}</p>
          </div>

          {/* API key */}
          <div className="mb-4">
            <label className="text-[10px] font-mono uppercase tracking-wider text-violet-muted mb-1.5 block">
              <Key className="w-3 h-3 inline mr-1" /> API Key
            </label>
            <div className="relative">
              <input
                type={showPrimaryKey ? "text" : "password"}
                value={primaryKey}
                onChange={(e) => {
                  setPrimaryKey(e.target.value);
                  setPrimaryTestResult(null);
                }}
                placeholder={primary.id === "gemini" ? "AIzaSy..." : primary.id === "groq" ? "gsk_..." : primary.id === "openrouter" ? "sk-or-v1-..." : "sk-..."}
                className="w-full pl-3 pr-24 py-2.5 rounded-lg bg-violet-bg/50 border border-violet-subtle text-sm text-cream placeholder:text-violet-muted/50 focus:outline-none focus:border-beige/30 transition-all font-mono"
              />
              <button
                onClick={() => setShowPrimaryKey(!showPrimaryKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-violet-muted hover:text-cream"
                title={showPrimaryKey ? "Esconder" : "Mostrar"}
              >
                {showPrimaryKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Model (if multiple options) */}
          {primary.recommendedModels && primary.recommendedModels.length > 1 && (
            <div className="mb-4">
              <label className="text-[10px] font-mono uppercase tracking-wider text-violet-muted mb-1.5 block">
                Modelos ({primary.id === "openrouter" ? `4 salvos = fallback automático contra rate limit` : "1 selecionado"})
              </label>
              {primary.id === "openrouter" ? (
                <div className="space-y-1.5 p-2.5 rounded-lg bg-neon-green/5 border border-neon-green/20">
                  {primary.recommendedModels.map((m, idx) => (
                    <label key={m.id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-white/5 rounded px-2 py-1">
                      <input
                        type="checkbox"
                        checked={primaryModels.includes(m.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPrimaryModels([...primaryModels, m.id]);
                          } else {
                            setPrimaryModels(primaryModels.filter((x) => x !== m.id));
                          }
                        }}
                        className="accent-neon-green"
                      />
                      <span className="text-cream font-mono text-[11px] flex-1">{m.label}</span>
                      <span className="text-[9px] text-violet-muted">#{idx + 1}</span>
                    </label>
                  ))}
                  <p className="text-[10px] text-neon-green mt-1.5 leading-relaxed">
                    ✓ Marcados = salvos como fallback. Se o #1 der 429, vai pro #2 automaticamente.
                  </p>
                </div>
              ) : (
                <select
                  value={primaryModel}
                  onChange={(e) => setPrimaryModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-violet-bg/50 border border-violet-subtle text-xs text-cream focus:outline-none focus:border-beige/30 transition-all"
                >
                  {primary.recommendedModels.map((m) => (
                    <option key={m.id} value={m.id} className="bg-violet-bg">{m.label}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Test + Get key row */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => testKey(primary, primaryKey, primaryModel, setPrimaryTestResult, setPrimaryTesting)}
              disabled={primaryTesting || !primaryKey.trim()}
              className="px-3 py-1.5 rounded-lg bg-beige/15 text-beige border border-beige/30 hover:bg-beige/25 text-xs font-medium flex items-center gap-1.5 disabled:opacity-40 transition-all"
            >
              {primaryTesting ? (
                <><Loader2 className="w-3 h-3 animate-spin" /> Testando...</>
              ) : (
                <><Zap className="w-3 h-3" /> Testar</>
              )}
            </button>
            <a
              href={primary.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-violet-bg/60 border border-violet-subtle hover:border-beige/30 text-xs font-mono text-cream flex items-center gap-1 transition-colors"
            >
              <Rocket className="w-3 h-3" /> Pegar key grátis <ExternalLink className="w-2.5 h-2.5" />
            </a>
            <button
              onClick={() => setShowTutorial(primaryId)}
              className="text-[10px] text-violet-muted hover:text-cream flex items-center gap-1 transition-colors ml-auto"
            >
              <HelpCircle className="w-3 h-3" /> Como pegar?
            </button>
            {primaryTestResult?.ok && (
              <span className="text-[10px] text-neon-green flex items-center gap-1 font-mono w-full mt-1">
                <CheckCircle2 className="w-3 h-3" /> {primaryTestResult.message}
              </span>
            )}
            {primaryTestResult && !primaryTestResult.ok && primaryTestResult.message !== "Testando..." && (
              <span className="text-[10px] text-[#ff8a3d] flex items-center gap-1 font-mono w-full mt-1">
                <AlertCircle className="w-3 h-3" /> {primaryTestResult.message}
              </span>
            )}
          </div>
        </motion.div>

        {/* === Fallback (collapsed by default) === */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="rounded-2xl glass border border-violet-subtle overflow-hidden mb-4"
        >
          <button
            onClick={() => setFallbackOpen(!fallbackOpen)}
            className="w-full p-4 flex items-center gap-2 text-left hover:bg-white/5 transition-colors"
          >
            <Plus className={`w-4 h-4 text-violet-muted transition-transform ${fallbackOpen ? "rotate-45" : ""}`} />
            <span className="text-sm font-medium text-cream">Adicionar provedor de fallback (opcional)</span>
            <span className="text-[10px] text-violet-muted ml-1">— se o principal cair, usa esse</span>
            <ChevronDown className={`w-4 h-4 text-violet-muted ml-auto transition-transform ${fallbackOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence>
            {fallbackOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="border-t border-violet-subtle p-5 space-y-4"
              >
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-violet-muted mb-1.5 block">
                    Provedor
                  </label>
                  <select
                    value={fallbackId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setFallbackId(id);
                      const p = PROVIDER_CATALOG.find((x) => x.id === id);
                      if (p) setFallbackModel(p.defaultModel);
                      setFallbackTestResult(null);
                    }}
                    className="w-full px-3 py-2.5 rounded-lg bg-violet-bg/50 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
                  >
                    {PROVIDER_CATALOG.filter((p) => p.id !== primaryId).map((p) => (
                      <option key={p.id} value={p.id} className="bg-violet-bg">
                        {p.emoji} {p.name} {p.isFree ? "(grátis)" : "(pago)"}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-violet-muted mt-1.5">{fallback.tagline}</p>
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-violet-muted mb-1.5 block">
                    <Key className="w-3 h-3 inline mr-1" /> API Key
                  </label>
                  <div className="relative">
                    <input
                      type={showFallbackKey ? "text" : "password"}
                      value={fallbackKey}
                      onChange={(e) => {
                        setFallbackKey(e.target.value);
                        setFallbackTestResult(null);
                      }}
                      placeholder="Cole sua key..."
                      className="w-full pl-3 pr-12 py-2.5 rounded-lg bg-violet-bg/50 border border-violet-subtle text-sm text-cream placeholder:text-violet-muted/50 focus:outline-none focus:border-beige/30 font-mono"
                    />
                    <button
                      onClick={() => setShowFallbackKey(!showFallbackKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-violet-muted hover:text-cream"
                    >
                      {showFallbackKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {fallback.recommendedModels && fallback.recommendedModels.length > 1 && (
                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-violet-muted mb-1.5 block">
                      Modelo
                    </label>
                    <select
                      value={fallbackModel}
                      onChange={(e) => setFallbackModel(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-violet-bg/50 border border-violet-subtle text-xs text-cream focus:outline-none focus:border-beige/30"
                    >
                      {fallback.recommendedModels.map((m) => (
                        <option key={m.id} value={m.id} className="bg-violet-bg">{m.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => testKey(fallback, fallbackKey, fallbackModel, setFallbackTestResult, setFallbackTesting)}
                    disabled={fallbackTesting || !fallbackKey.trim()}
                    className="px-3 py-1.5 rounded-lg bg-beige/15 text-beige border border-beige/30 hover:bg-beige/25 text-xs font-medium flex items-center gap-1.5 disabled:opacity-40 transition-all"
                  >
                    {fallbackTesting ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Testando...</>
                    ) : (
                      <><Zap className="w-3 h-3" /> Testar</>
                    )}
                  </button>
                  <a
                    href={fallback.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-violet-bg/60 border border-violet-subtle hover:border-beige/30 text-xs font-mono text-cream flex items-center gap-1 transition-colors"
                  >
                    <Rocket className="w-3 h-3" /> Pegar key grátis <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  {fallbackTestResult?.ok && (
                    <span className="text-[10px] text-neon-green flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3 h-3" /> {fallbackTestResult.message}
                    </span>
                  )}
                  {fallbackTestResult && !fallbackTestResult.ok && fallbackTestResult.message !== "Testando..." && (
                    <span className="text-[10px] text-[#ff8a3d] flex items-center gap-1 font-mono">
                      <AlertCircle className="w-3 h-3" /> {fallbackTestResult.message}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* === Bottom info banner === */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="p-3 rounded-xl bg-beige/5 border border-beige/20 mb-4 flex items-start gap-2"
        >
          <Gift className="w-4 h-4 text-beige shrink-0 mt-0.5" />
          <div className="text-xs text-tech-gray leading-relaxed">
            <span className="text-cream font-medium">Recomendado:</span> Gemini é o mais rápido de configurar (key em 30s com sua conta Google).
            <br />
            <span className="text-cream font-medium">Mais opções?</span> OpenRouter dá acesso a 20+ modelos com 1 key.
          </div>
        </motion.div>

        {/* === Error === */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 mb-4"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </motion.div>
        )}

        {/* === Action buttons === */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="space-y-2"
        >
          <button
            onClick={handleSaveAndContinue}
            disabled={saving}
            className="w-full py-3 rounded-lg bg-cream text-violet-bg text-sm font-bold hover:bg-beige transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
            ) : (
              <>Continuar <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
          <button
            onClick={onSkip}
            className="w-full py-2 text-xs text-violet-muted hover:text-cream transition-colors"
          >
            Pular (usar modo demo com limitações)
          </button>
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
      { title: "Cole aqui", desc: "Volte pra essa tela, cole a key no campo e clique 'Testar'. Se aparecer OK, tá pronto!" },
    ];
  }
  if (p.id === "gemini") {
    return [
      { title: "Acesse aistudio.google.com/apikey", desc: "Login automático com sua conta Google." },
      { title: "Clique 'Create API key'", desc: "Escolha um projeto Google Cloud (ou crie um novo gratuito)." },
      { title: "Copie a key", desc: "A key aparece em popup. Copie (começa com AIzaSy...)." },
      { title: "Cole aqui", desc: "Volte, cole no campo e clique 'Testar'." },
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
    { title: "Cole aqui", desc: "Volte, cole no campo e clique 'Testar'." },
  ];
}
