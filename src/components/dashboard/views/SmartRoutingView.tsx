"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Cpu,
  Plus,
  Trash2,
  Check,
  X,
  Power,
  Shield,
  Key,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  DollarSign,
  Clock,
} from "lucide-react";
import { useLovonStore, AIIntegration, AgentRoutingPolicy, CascadeEntry } from "@/lib/lovon/store";

const PROVIDER_NAMES: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic (Claude)",
  openrouter: "OpenRouter",
  groq: "Groq",
  minimax: "Minimax",
  zai: "z.ai",
  gemini: "Google Gemini",
  deepseek: "DeepSeek",
  ollama: "Ollama (Local)",
};

export function SmartRoutingView() {
  const aiIntegrations = useLovonStore((s) => s.aiIntegrations);
  const agents = useLovonStore((s) => s.agents);
  const routingPolicies = useLovonStore((s) => s.routingPolicies);
  const addAIIntegration = useLovonStore((s) => s.addAIIntegration);
  const updateAIIntegration = useLovonStore((s) => s.updateAIIntegration);
  const deleteAIIntegration = useLovonStore((s) => s.deleteAIIntegration);
  const testAIIntegration = useLovonStore((s) => s.testAIIntegration);
  const setAgentRoutingPolicy = useLovonStore((s) => s.setAgentRoutingPolicy);

  const [tab, setTab] = useState<"providers" | "routing">("providers");
  const [showForm, setShowForm] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);
  const selectedPolicy = selectedAgentId ? routingPolicies[selectedAgentId] : null;

  const toggleAllow = (integrationId: string) => {
    if (!selectedAgentId) return;
    const current = routingPolicies[selectedAgentId];
    if (!current) return;
    const allowed = current.allowedIntegrationIds.includes(integrationId);
    const newAllowed = allowed
      ? current.allowedIntegrationIds.filter((id) => id !== integrationId)
      : [...current.allowedIntegrationIds, integrationId];
    // Also remove from cascade if being removed
    const newCascade = allowed
      ? current.cascade.filter((c) => c.integrationId !== integrationId)
      : current.cascade;
    setAgentRoutingPolicy(selectedAgentId, { ...current, allowedIntegrationIds: newAllowed, cascade: newCascade });
  };

  const moveCascade = (index: number, direction: "up" | "down") => {
    if (!selectedAgentId || !selectedPolicy) return;
    const cascade = [...selectedPolicy.cascade];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= cascade.length) return;
    [cascade[index], cascade[targetIndex]] = [cascade[targetIndex], cascade[index]];
    setAgentRoutingPolicy(selectedAgentId, { ...selectedPolicy, cascade });
  };

  const addToCascade = (integrationId: string) => {
    if (!selectedAgentId || !selectedPolicy) return;
    const integration = aiIntegrations.find((i) => i.id === integrationId);
    if (!integration) return;
    const newEntry: CascadeEntry = {
      integrationId,
      model: integration.defaultModel || "default",
      purpose: "text",
    };
    setAgentRoutingPolicy(selectedAgentId, {
      ...selectedPolicy,
      cascade: [...selectedPolicy.cascade, newEntry],
    });
  };

  const removeFromCascade = (index: number) => {
    if (!selectedAgentId || !selectedPolicy) return;
    const cascade = selectedPolicy.cascade.filter((_, i) => i !== index);
    setAgentRoutingPolicy(selectedAgentId, { ...selectedPolicy, cascade });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Cpu className="w-5 h-5 text-beige" />
          <h1 className="text-2xl sm:text-3xl font-bold text-cream font-serif-display">Smart Routing</h1>
        </div>
        <p className="text-sm text-violet-muted max-w-2xl">
          Controle quais provedores de IA cada agente pode usar. Allowlist obrigatória — se não estiver marcado, nunca será usado, nem em fallback. Configure a cascata para resiliência.
        </p>
      </div>

      {/* tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-violet-bg/40 border border-violet-subtle w-fit">
        {(["providers", "routing"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
              tab === t ? "bg-beige/15 text-beige" : "text-violet-muted hover:text-cream"
            }`}
          >
            {t === "providers" ? "Provedores de IA" : "Roteamento por Agente"}
          </button>
        ))}
      </div>

      {/* Tab: Providers */}
      {tab === "providers" && (
        <div className="space-y-3">
          <button onClick={() => setShowForm(true)} className="btn-pill btn-primary-neon text-sm">
            <Plus className="w-4 h-4" /> Adicionar provedor de IA
          </button>

          {aiIntegrations.length === 0 ? (
            <div className="text-center py-12">
              <Cpu className="w-12 h-12 mx-auto text-violet-muted/30 mb-3" />
              <p className="text-sm text-violet-muted">Nenhum provedor de IA configurado ainda.</p>
            </div>
          ) : (
            aiIntegrations.map((integration, i) => (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="p-4 rounded-xl glass border border-violet-subtle group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-cream">{integration.name}</span>
                      <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                        integration.health.status === "ok"
                          ? "bg-neon-green/10 text-neon-green border border-neon-green/20"
                          : integration.health.status === "down"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-[#ff8a3d]/10 text-[#ff8a3d] border border-[#ff8a3d]/20"
                      }`}>
                        {integration.health.status}
                      </span>
                      {!integration.enabled && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-violet-muted border border-white/10">
                          desabilitado
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-violet-muted">
                      Provider: {PROVIDER_NAMES[integration.provider] ?? integration.provider}
                      {integration.defaultModel && ` · Model: ${integration.defaultModel}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => testAIIntegration(integration.id)}
                      className="px-2.5 py-1 rounded-md text-xs bg-beige/10 border border-beige/30 text-beige hover:bg-beige/20 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Testar
                    </button>
                    <button
                      onClick={() => updateAIIntegration(integration.id, { enabled: !integration.enabled })}
                      className="w-7 h-7 rounded-md bg-white/5 border border-white/8 text-violet-muted hover:text-cream flex items-center justify-center"
                    >
                      <Power className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => deleteAIIntegration(integration.id)}
                      className="w-7 h-7 rounded-md bg-white/5 border border-white/8 text-violet-muted hover:text-red-400 flex items-center justify-center"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* capabilities */}
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  {Object.entries(integration.capabilities).filter(([, v]) => v).map(([cap]) => (
                    <span key={cap} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet-dark/40 text-cream border border-violet-subtle">
                      {cap}
                    </span>
                  ))}
                </div>

                {/* limits + usage */}
                <div className="flex items-center gap-4 text-[10px] font-mono text-violet-muted">
                  {integration.limits.monthlyUsd && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-2.5 h-2.5" /> ${integration.usage.totalCostUsd.toFixed(2)}/${integration.limits.monthlyUsd}/mês
                    </span>
                  )}
                  <span>Tokens: {integration.usage.totalTokens.toLocaleString()}</span>
                  {integration.usage.errors > 0 && (
                    <span className="text-red-400">Erros: {integration.usage.errors}</span>
                  )}
                </div>

                {/* last test */}
                {integration.lastTestResult && (
                  <div className={`mt-2 text-[10px] flex items-center gap-1 ${integration.lastTestResult.ok ? "text-neon-green" : "text-red-400"}`}>
                    {integration.lastTestResult.ok ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {integration.lastTestResult.message}
                    {integration.lastTestedAt && ` · ${new Date(integration.lastTestedAt).toLocaleString("pt-BR")}`}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Tab: Routing per Agent */}
      {tab === "routing" && (
        <div className="space-y-4">
          {/* agent selector */}
          <div>
            <label className="text-xs font-medium text-violet-muted mb-2 block">Selecionar agente</label>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => {
                    setSelectedAgentId(agent.id);
                    if (!routingPolicies[agent.id]) {
                      setAgentRoutingPolicy(agent.id, {
                        workspaceId: "default",
                        agentId: agent.id,
                        allowedIntegrationIds: [],
                        cascade: [],
                        routingRules: {},
                      });
                    }
                  }}
                  className={`p-3 rounded-lg border text-left transition-all flex items-center gap-2 ${
                    selectedAgentId === agent.id
                      ? "border-beige/40 bg-beige/10"
                      : "border-violet-subtle bg-violet-bg/30 hover:border-violet-strong"
                  }`}
                >
                  <span className="text-lg">{agent.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-cream truncate">{agent.name}</div>
                    <div className="text-[9px] text-violet-muted">
                      {routingPolicies[agent.id]?.allowedIntegrationIds.length ?? 0} provedores · {routingPolicies[agent.id]?.cascade.length ?? 0} na cascata
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedAgent && selectedPolicy && (
            <>
              {/* Allowlist */}
              <div className="p-5 rounded-2xl glass border border-violet-subtle">
                <h3 className="font-serif-display text-base font-semibold text-cream mb-1">Allowlist obrigatória</h3>
                <p className="text-xs text-violet-muted mb-4">Se um serviço não estiver autorizado aqui, ele nunca será usado — nem em fallback.</p>
                <div className="space-y-2">
                  {aiIntegrations.map((integration) => {
                    const isAllowed = selectedPolicy.allowedIntegrationIds.includes(integration.id);
                    return (
                      <div key={integration.id} className="flex items-center justify-between p-2.5 rounded-lg bg-violet-bg/30 border border-violet-subtle">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleAllow(integration.id)}
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                              isAllowed
                                ? "bg-neon-green border-neon-green text-deep-black"
                                : "border-white/20"
                            }`}
                          >
                            {isAllowed && <Check className="w-3 h-3" strokeWidth={3} />}
                          </button>
                          <div>
                            <div className="text-xs text-cream">{integration.name}</div>
                            <div className="text-[9px] text-violet-muted">{PROVIDER_NAMES[integration.provider]}</div>
                          </div>
                        </div>
                        <span className={`text-[9px] font-mono ${isAllowed ? "text-neon-green" : "text-violet-muted"}`}>
                          {isAllowed ? "AUTORIZADO" : "BLOQUEADO"}
                        </span>
                      </div>
                    );
                  })}
                  {aiIntegrations.length === 0 && (
                    <div className="text-xs text-violet-muted italic py-2">Adicione provedores na aba "Provedores de IA" primeiro.</div>
                  )}
                </div>
              </div>

              {/* Cascade */}
              <div className="p-5 rounded-2xl glass border border-violet-subtle">
                <h3 className="font-serif-display text-base font-semibold text-cream mb-1">Cascata de fallback</h3>
                <p className="text-xs text-violet-muted mb-4">Ordem de tentativa. Se o 1º falhar (502/timeout), tenta o próximo.</p>
                <div className="space-y-2">
                  {selectedPolicy.cascade.map((entry, index) => {
                    const integration = aiIntegrations.find((i) => i.id === entry.integrationId);
                    return (
                      <div key={index} className="flex items-center gap-2 p-2.5 rounded-lg bg-violet-bg/30 border border-violet-subtle">
                        <span className="text-[10px] font-mono text-beige w-6">{index + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-cream">{integration?.name ?? "Unknown"}</div>
                          <div className="text-[9px] text-violet-muted font-mono">{entry.model} · {entry.purpose}</div>
                        </div>
                        <button
                          onClick={() => moveCascade(index, "up")}
                          disabled={index === 0}
                          className="w-6 h-6 rounded-md bg-white/5 border border-white/8 text-violet-muted hover:text-cream disabled:opacity-30 flex items-center justify-center"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => moveCascade(index, "down")}
                          disabled={index === selectedPolicy.cascade.length - 1}
                          className="w-6 h-6 rounded-md bg-white/5 border border-white/8 text-violet-muted hover:text-cream disabled:opacity-30 flex items-center justify-center"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeFromCascade(index)}
                          className="w-6 h-6 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 flex items-center justify-center"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                  {/* Add to cascade */}
                  <div className="flex items-center gap-2 mt-2">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addToCascade(e.target.value);
                          e.target.value = "";
                        }
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
                      defaultValue=""
                    >
                      <option value="">+ Adicionar à cascata...</option>
                      {aiIntegrations
                        .filter((i) => selectedPolicy.allowedIntegrationIds.includes(i.id))
                        .filter((i) => !selectedPolicy.cascade.some((c) => c.integrationId === i.id))
                        .map((i) => (
                          <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                    </select>
                  </div>
                  {selectedPolicy.cascade.length === 0 && (
                    <div className="text-xs text-violet-muted italic">Adicione provedores autorizados à cascata.</div>
                  )}
                </div>
              </div>

              {/* Routing Rules */}
              <div className="p-5 rounded-2xl glass border border-violet-subtle">
                <h3 className="font-serif-display text-base font-semibold text-cream mb-3">Regras opcionais</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-2.5 rounded-lg bg-violet-bg/30 border border-violet-subtle cursor-pointer">
                    <div>
                      <div className="text-xs text-cream">Preferir modelos gratuitos/baixo custo</div>
                      <div className="text-[9px] text-violet-muted">Quando possível, usa provedores mais econômicos</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedPolicy.routingRules.preferLowCost ?? false}
                      onChange={(e) => {
                        setAgentRoutingPolicy(selectedAgent.id, {
                          ...selectedPolicy,
                          routingRules: { ...selectedPolicy.routingRules, preferLowCost: e.target.checked },
                        });
                      }}
                      className="accent-beige w-4 h-4"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-mono text-violet-muted mb-1 block">Máx custo por execução (USD)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={selectedPolicy.routingRules.maxCostUsd ?? ""}
                        onChange={(e) => {
                          setAgentRoutingPolicy(selectedAgent.id, {
                            ...selectedPolicy,
                            routingRules: { ...selectedPolicy.routingRules, maxCostUsd: e.target.value ? Number(e.target.value) : undefined },
                          });
                        }}
                        placeholder="ex: 0.50"
                        className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-violet-muted mb-1 block">Máx latência (ms)</label>
                      <input
                        type="number"
                        value={selectedPolicy.routingRules.maxLatencyMs ?? ""}
                        onChange={(e) => {
                          setAgentRoutingPolicy(selectedAgent.id, {
                            ...selectedPolicy,
                            routingRules: { ...selectedPolicy.routingRules, maxLatencyMs: e.target.value ? Number(e.target.value) : undefined },
                          });
                        }}
                        placeholder="ex: 30000"
                        className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Enforcement info */}
              <div className="p-4 rounded-xl bg-[#ff8a3d]/5 border border-[#ff8a3d]/20">
                <div className="flex items-start gap-3">
                  <Shield className="w-4 h-4 text-[#ff8a3d] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-[#ff8a3d] mb-1">Enforcement</div>
                    <p className="text-xs text-violet-muted leading-relaxed">
                      O roteador NUNCA usa provedor fora da allowlist. Se a cascata acabar sem sucesso: retorna <span className="font-mono text-[#ff8a3d]">NO_ROUTE_AVAILABLE</span>.
                      Erro 401/invalid key → desabilita integração + alerta Board. Erro 502/timeout → fallback para próximo.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {!selectedAgent && (
            <div className="text-center py-12">
              <Cpu className="w-12 h-12 mx-auto text-violet-muted/30 mb-3" />
              <p className="text-sm text-violet-muted">Selecione um agente para configurar o roteamento.</p>
            </div>
          )}
        </div>
      )}

      {/* form modal */}
      <AnimatePresence>
        {showForm && (
          <AIProviderForm
            onClose={() => setShowForm(false)}
            onSave={(integration) => {
              addAIIntegration(integration);
              setShowForm(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AIProviderForm({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (integration: AIIntegration) => void;
}) {
  const [name, setName] = useState("");
  const [provider, setProvider] = useState<string>("openai");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [defaultModel, setDefaultModel] = useState("");
  const [caps, setCaps] = useState({ text: true, vision: false, image: false, embeddings: false, tools: false, jsonSchema: false });

  const handleSave = () => {
    if (!name.trim()) return;
    const integration: AIIntegration = {
      id: `ai_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      workspaceId: "default",
      provider,
      name: name.trim(),
      secretRef: apiKey ? `vault:${btoa(apiKey).slice(0, 16)}` : "vault:not-set",
      enabled: true,
      capabilities: caps,
      limits: {},
      health: { status: "ok" },
      usage: { totalTokens: 0, totalCostUsd: 0, errors: 0 },
      baseUrl: baseUrl || undefined,
      defaultModel: defaultModel || undefined,
      createdAt: Date.now(),
    };
    onSave(integration);
  };

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
        className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl glass-strong border border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-violet-subtle">
          <h3 className="text-base font-semibold text-cream font-serif-display">Adicionar provedor de IA</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-violet-muted hover:text-cream">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 no-scrollbar space-y-3">
          <div>
            <label className="text-xs font-medium text-violet-muted mb-1.5 block">Nome da conexão</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="ex: OpenAI – Produção" className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-violet-muted mb-1.5 block">Provider</label>
            <select value={provider} onChange={(e) => setProvider(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30">
              {Object.entries(PROVIDER_NAMES).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-violet-muted mb-1.5 block flex items-center gap-1">
              <Key className="w-3 h-3" /> API Key (secreto — não exibido novamente)
            </label>
            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-violet-muted mb-1.5 block">Base URL (opcional)</label>
              <input type="text" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://api.openai.com/v1" className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30" />
            </div>
            <div>
              <label className="text-xs font-medium text-violet-muted mb-1.5 block">Modelo padrão</label>
              <input type="text" value={defaultModel} onChange={(e) => setDefaultModel(e.target.value)} placeholder="ex: gpt-4o" className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-violet-muted mb-2 block">Capabilities</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(caps) as (keyof typeof caps)[]).map((cap) => (
                <button
                  key={cap}
                  onClick={() => setCaps({ ...caps, [cap]: !caps[cap] })}
                  className={`p-2 rounded-lg border text-xs transition-all ${
                    caps[cap] ? "border-beige/30 bg-beige/10 text-beige" : "border-violet-subtle text-violet-muted"
                  }`}
                >
                  {cap}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-violet-subtle flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-violet-muted hover:text-cream">Cancelar</button>
          <button onClick={handleSave} disabled={!name.trim()} className="btn-pill btn-primary-neon text-xs disabled:opacity-40">
            <Plus className="w-3.5 h-3.5" /> Adicionar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
