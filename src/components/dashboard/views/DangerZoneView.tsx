"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Database,
  Users,
  Layers,
  Eye,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react";
import {
  useLovonStore,
  WorkspaceResetScope,
  WorkspaceResetPreview,
  WorkspaceResetResult,
} from "@/lib/lovon/store";

type Preset = "minimal" | "default" | "custom";

// === Preset scopes for the 3 quick-action buttons ===
const PRESET_SCOPES: Record<string, { scope: WorkspaceResetScope; label: string; description: string; icon: typeof Database }> = {
  kb: {
    label: "Reset Company Data (KB)",
    description:
      "Limpa todos os documentos da Knowledge Base (links, textos, PDFs) e reseta o Company Core. O usuário precisa cadastrar a empresa novamente. Agentes, tarefas e integrações são preservados.",
    icon: Database,
    scope: { companyData: true },
  },
  agents: {
    label: "Reset Agents (incl. CEO)",
    description:
      "Arquiva TODOS os agentes (inclusive o CEO) e recria o core team a partir do catálogo padrão. Tarefas ficam órfãs — recomendo marcar também 'Tasks'. Skills, tools e policies voltam ao default.",
    icon: Users,
    scope: { agents: true, tasks: true },
  },
  full: {
    label: "Full Reset (advanced)",
    description:
      "Zera o workspace por completo: KB, agentes, tarefas, metas, sinais, work products e histórico de emails. Audit log é preservado (append-only). Integrações exigem confirmação extra.",
    icon: Layers,
    scope: {
      companyData: true,
      agents: true,
      tasks: true,
      goals: true,
      signals: true,
      workProducts: true,
      emailHistory: true,
    },
  },
};

export function DangerZoneView() {
  const company = useLovonStore((s) => s.company);
  const currentGeneration = useLovonStore((s) => s.currentGeneration);
  const resetCount = useLovonStore((s) => s.resetCount);
  const resetInProgress = useLovonStore((s) => s.resetInProgress);
  const previewWorkspaceReset = useLovonStore((s) => s.previewWorkspaceReset);
  const workspaceReset = useLovonStore((s) => s.workspaceReset);

  // Currently selected preset ("kb" | "agents" | "full" | null)
  const [activePreset, setActivePreset] = useState<string | null>(null);
  // Customizable scope (initialized from preset, user can tweak checkboxes)
  const [scope, setScope] = useState<WorkspaceResetScope>({});
  // Options
  const [preset, setPreset] = useState<Preset>("default");
  const [purgeKB, setPurgeKB] = useState(false);
  const [recreateAgents, setRecreateAgents] = useState(true);
  // Confirmations
  const [typedWord, setTypedWord] = useState("");
  const [typedWorkspaceName, setTypedWorkspaceName] = useState("");
  const [typedIntegrationsPhrase, setTypedIntegrationsPhrase] = useState("");
  // Preview + result state
  const [preview, setPreview] = useState<WorkspaceResetPreview | null>(null);
  const [result, setResult] = useState<WorkspaceResetResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const workspaceName = company?.name ?? "Lovon Teams";
  const requiresIntegrationsPhrase = !!scope.integrations;

  const selectPreset = (presetKey: string) => {
    setActivePreset(presetKey);
    setScope({ ...PRESET_SCOPES[presetKey].scope });
    setPreview(null);
    setResult(null);
    setError(null);
    setTypedWord("");
    setTypedWorkspaceName("");
    setTypedIntegrationsPhrase("");
    setPurgeKB(false);
    setRecreateAgents(true);
    setPreset("default");
  };

  const toggleScopeFlag = (flag: keyof WorkspaceResetScope) => {
    setScope((s) => ({ ...s, [flag]: !s[flag] }));
    setPreview(null);
    setResult(null);
    setError(null);
  };

  const handlePreview = () => {
    setError(null);
    setResult(null);
    const p = previewWorkspaceReset(scope);
    setPreview(p);
  };

  const handleReset = () => {
    setError(null);
    setResult(null);
    setBusy(true);

    // Validate confirmations client-side first (better UX — server also validates)
    if (typedWord.trim() !== "RESET") {
      setError('Digite exatamente "RESET" no primeiro campo de confirmação.');
      setBusy(false);
      return;
    }
    if (typedWorkspaceName.trim().toLowerCase() !== workspaceName.trim().toLowerCase()) {
      setError(`Nome do workspace incorreto. Digite exatamente: "${workspaceName}".`);
      setBusy(false);
      return;
    }
    if (requiresIntegrationsPhrase && typedIntegrationsPhrase.trim() !== "DELETE INTEGRATIONS") {
      setError('Para resetar integrações, digite "DELETE INTEGRATIONS" no segundo campo.');
      setBusy(false);
      return;
    }

    // Generate an idempotency key — combination of timestamp + random
    const idempotencyKey = `reset-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

    try {
      const res = workspaceReset({
        workspaceId: "default",
        requestedBy: { kind: "board", userId: "user" },
        scope,
        options: {
          purgeKnowledgeFiles: purgeKB,
          recreateCoreAgents: recreateAgents,
          coreTeamPreset: preset,
          keepAuditLog: true,
        },
        confirmations: {
          typedWord: "RESET",
          workspaceName: typedWorkspaceName,
          typedIntegrationsPhrase: requiresIntegrationsPhrase ? "DELETE INTEGRATIONS" : undefined,
        },
        idempotencyKey,
      });

      setResult(res);
      if (!res.ok) {
        setError(res.error ?? "Falha desconhecida no reset.");
      } else {
        // Clear form on success
        setTypedWord("");
        setTypedWorkspaceName("");
        setTypedIntegrationsPhrase("");
        setPreview(null);
        setActivePreset(null);
        setScope({});
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="w-5 h-5 text-[#ff8a3d]" />
          <h1 className="text-2xl sm:text-3xl font-bold text-cream font-serif-display">Danger Zone</h1>
        </div>
        <p className="text-sm text-violet-muted max-w-2xl">
          Reinicie o workspace por geração. Os dados anteriores não são deletados — eles são
          arquivados em gerações passadas e continuam acessíveis via audit log. O audit log é{" "}
          <span className="text-beige">append-only</span> e sempre preservado.
        </p>
        <div className="mt-3 flex items-center gap-3 text-xs text-violet-muted">
          <span className="px-2 py-1 rounded bg-violet-dark/40 border border-violet-subtle font-mono">
            Geração atual: <span className="text-beige">#{currentGeneration}</span>
          </span>
          <span className="px-2 py-1 rounded bg-violet-dark/40 border border-violet-subtle font-mono">
            Resets executados: <span className="text-beige">{resetCount}</span>
          </span>
          {resetInProgress && (
            <span className="px-2 py-1 rounded bg-[#ff8a3d]/10 border border-[#ff8a3d]/30 text-[#ff8a3d] font-mono flex items-center gap-1">
              <Loader2 className="w-2.5 h-2.5 animate-spin" /> Reset em andamento
            </span>
          )}
        </div>
      </div>

      {/* preset cards */}
      <div className="grid md:grid-cols-3 gap-3">
        {Object.entries(PRESET_SCOPES).map(([key, p]) => {
          const Icon = p.icon;
          const isActive = activePreset === key;
          return (
            <button
              key={key}
              onClick={() => selectPreset(key)}
              className={`text-left p-4 rounded-xl border transition-all ${
                isActive
                  ? "bg-[#ff8a3d]/10 border-[#ff8a3d]/40 ring-1 ring-[#ff8a3d]/30"
                  : "glass border-violet-subtle hover:border-[#ff8a3d]/30 hover:bg-[#ff8a3d]/5"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${isActive ? "text-[#ff8a3d]" : "text-violet-muted"}`} />
                <span className={`text-sm font-semibold ${isActive ? "text-[#ff8a3d]" : "text-cream"}`}>
                  {p.label}
                </span>
              </div>
              <p className="text-[11px] text-violet-muted leading-relaxed line-clamp-4">{p.description}</p>
            </button>
          );
        })}
      </div>

      {/* configuration panel — only shown after a preset is selected */}
      <AnimatePresence>
        {activePreset && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-5 rounded-xl glass border border-[#ff8a3d]/20 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-cream">
                Configurar reset: <span className="text-[#ff8a3d]">{PRESET_SCOPES[activePreset].label}</span>
              </h3>
              <button
                onClick={() => {
                  setActivePreset(null);
                  setScope({});
                  setPreview(null);
                  setResult(null);
                  setError(null);
                }}
                className="text-xs text-violet-muted hover:text-cream"
              >
                Cancelar
              </button>
            </div>

            {/* scope checkboxes */}
            <div>
              <div className="text-[10px] font-mono uppercase text-violet-muted mb-2">Escopo do reset</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    ["companyData", "Company Data / KB"],
                    ["agents", "Agents (incl. CEO)"],
                    ["tasks", "Tasks / Backlog"],
                    ["goals", "Goals / OKRs"],
                    ["signals", "Signals"],
                    ["workProducts", "Work Products"],
                    ["emailHistory", "Email history"],
                    ["integrations", "Integrations (danger)"],
                  ] as [keyof WorkspaceResetScope, string][]
                ).map(([flag, label]) => (
                  <label
                    key={flag}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                      scope[flag]
                        ? "bg-[#ff8a3d]/10 border-[#ff8a3d]/40 text-[#ff8a3d]"
                        : "bg-violet-bg/30 border-violet-subtle text-violet-muted hover:text-cream"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!scope[flag]}
                      onChange={() => toggleScopeFlag(flag)}
                      className="accent-[#ff8a3d]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* options */}
            {(scope.companyData || scope.agents) && (
              <div className="p-3 rounded-lg bg-violet-dark/30 border border-violet-subtle space-y-2">
                <div className="text-[10px] font-mono uppercase text-violet-muted">Opções</div>
                {scope.companyData && (
                  <label className="flex items-center gap-2 text-xs text-violet-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={purgeKB}
                      onChange={(e) => setPurgeKB(e.target.checked)}
                      className="accent-[#ff8a3d]"
                    />
                    Hard purge de arquivos KB (remove permanentemente do storage + embeddings). Default: soft reset (apenas oculta).
                  </label>
                )}
                {scope.agents && (
                  <>
                    <label className="flex items-center gap-2 text-xs text-violet-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={recreateAgents}
                        onChange={(e) => setRecreateAgents(e.target.checked)}
                        className="accent-[#ff8a3d]"
                      />
                      Recriar core team do catálogo após reset
                    </label>
                    {recreateAgents && (
                      <div className="flex items-center gap-2 text-xs text-violet-muted">
                        <span>Preset do core team:</span>
                        <div className="flex items-center gap-1 p-0.5 rounded-md bg-violet-bg/40 border border-violet-subtle">
                          {(["minimal", "default", "custom"] as Preset[]).map((p) => (
                            <button
                              key={p}
                              onClick={() => setPreset(p)}
                              className={`px-2.5 py-1 rounded text-[10px] font-medium transition-colors ${
                                preset === p ? "bg-beige/15 text-beige" : "text-violet-muted hover:text-cream"
                              }`}
                            >
                              {p === "minimal" ? "Mínimo (CEO)" : p === "default" ? "Padrão (4 agents)" : "Custom"}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* preview button + result */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreview}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-beige/10 border border-beige/30 text-beige hover:bg-beige/20 flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" /> Preview changes
              </button>
              <span className="text-[10px] text-violet-muted">
                Mostra contagens do que será arquivado/ocultado.
              </span>
            </div>

            <AnimatePresence>
              {preview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-lg bg-black/30 border border-violet-subtle"
                >
                  <div className="text-[10px] font-mono uppercase text-violet-muted mb-2">Preview</div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-xs">
                    {Object.entries(preview.counts).map(([k, v]) => (
                      <div key={k} className="text-center p-2 rounded bg-violet-bg/30 border border-violet-subtle">
                        <div className={`text-sm font-bold ${v > 0 ? "text-[#ff8a3d]" : "text-violet-muted"}`}>
                          {v}
                        </div>
                        <div className="text-[9px] text-violet-muted uppercase">{k}</div>
                      </div>
                    ))}
                  </div>
                  {preview.warnings.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {preview.warnings.map((w, i) => (
                        <div key={i} className="text-[10px] text-[#ff8a3d] flex items-start gap-1">
                          <AlertTriangle className="w-2.5 h-2.5 mt-0.5 flex-shrink-0" /> {w}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* confirmations */}
            <div className="p-3 rounded-lg bg-[#ff8a3d]/5 border border-[#ff8a3d]/20 space-y-3">
              <div className="text-[10px] font-mono uppercase text-[#ff8a3d]">Confirmações obrigatórias</div>
              <div>
                <label className="text-xs text-violet-muted mb-1 block">
                  Digite <span className="font-mono text-[#ff8a3d]">RESET</span> para confirmar
                </label>
                <input
                  type="text"
                  value={typedWord}
                  onChange={(e) => setTypedWord(e.target.value)}
                  placeholder="RESET"
                  className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-[#ff8a3d]/40 font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-violet-muted mb-1 block">
                  Digite o nome do workspace: <span className="text-beige font-mono">{workspaceName}</span>
                </label>
                <input
                  type="text"
                  value={typedWorkspaceName}
                  onChange={(e) => setTypedWorkspaceName(e.target.value)}
                  placeholder={workspaceName}
                  className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-[#ff8a3d]/40"
                />
              </div>
              {requiresIntegrationsPhrase && (
                <div>
                  <label className="text-xs text-violet-muted mb-1 block">
                    Reset de integrações exige confirmação extra. Digite{" "}
                    <span className="font-mono text-[#ff8a3d]">DELETE INTEGRATIONS</span>
                  </label>
                  <input
                    type="text"
                    value={typedIntegrationsPhrase}
                    onChange={(e) => setTypedIntegrationsPhrase(e.target.value)}
                    placeholder="DELETE INTEGRATIONS"
                    className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-[#ff8a3d]/40 font-mono"
                  />
                </div>
              )}
            </div>

            {/* error display */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2">
                <XCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <div>{error}</div>
              </div>
            )}

            {/* success result */}
            {result && result.ok && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-lg bg-neon-green/10 border border-neon-green/30 text-xs space-y-2"
              >
                <div className="flex items-center gap-2 text-neon-green font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Reset concluído: geração #{result.oldGeneration} → #{result.newGeneration}
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-[10px]">
                  {Object.entries(result.archived).map(([k, v]) => (
                    <div key={k} className="text-center p-1.5 rounded bg-black/20">
                      <div className="text-neon-green font-bold">{v}</div>
                      <div className="text-violet-muted uppercase">{k}</div>
                    </div>
                  ))}
                </div>
                {result.recreatedAgents && result.recreatedAgents.length > 0 && (
                  <div className="pt-2 border-t border-neon-green/20">
                    <div className="text-[10px] font-mono uppercase text-neon-green/70 mb-1">
                      Agentes recriados do catálogo
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {result.recreatedAgents.map((a) => (
                        <span
                          key={a.agentId}
                          className="px-2 py-0.5 rounded bg-neon-green/10 border border-neon-green/20 text-neon-green text-[10px] font-mono"
                        >
                          {a.slug} → {a.agentId.slice(0, 8)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {result.auditTraceId && (
                  <div className="pt-2 text-[10px] text-violet-muted font-mono">
                    Audit trace: {result.auditTraceId}
                  </div>
                )}
              </motion.div>
            )}

            {/* action button */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-violet-subtle">
              <button
                onClick={() => {
                  setActivePreset(null);
                  setScope({});
                  setPreview(null);
                  setResult(null);
                  setError(null);
                }}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-violet-muted hover:text-cream"
              >
                Cancelar
              </button>
              <button
                onClick={handleReset}
                disabled={busy || resetInProgress || typedWord !== "RESET" || typedWorkspaceName.trim().toLowerCase() !== workspaceName.trim().toLowerCase() || (requiresIntegrationsPhrase && typedIntegrationsPhrase !== "DELETE INTEGRATIONS")}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#ff8a3d] text-white hover:bg-[#ff8a3d]/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {busy ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Resetando...</>
                ) : (
                  <><RefreshCw className="w-3.5 h-3.5" /> Reset now</>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* footer info */}
      <div className="p-4 rounded-xl glass border border-violet-subtle">
        <div className="text-[10px] font-mono uppercase text-violet-muted mb-2">Como funciona o reset por geração</div>
        <div className="grid sm:grid-cols-3 gap-3 text-xs text-violet-muted">
          <div>
            <div className="text-beige font-semibold mb-1">1. Incrementa geração</div>
            O contador <code className="text-cream">currentGeneration</code> do workspace sobe de N para N+1. Todas as entidades criadas a partir de agora recebem a nova geração.
          </div>
          <div>
            <div className="text-beige font-semibold mb-1">2. Filtra por geração</div>
            As views e selectors (<code className="text-cream">getActiveAgents</code>, <code className="text-cream">getActiveTasks</code> etc.) só retornam entidades da geração atual. As antigas permanecem no store para auditoria.
          </div>
          <div>
            <div className="text-beige font-semibold mb-1">3. Recria core team</div>
            Se você resetou agentes, o CEO + Email/Research/Marketing são recriados do catálogo padrão com skills atualizadas. O CEO antigo continua no store, mas invisível.
          </div>
        </div>
      </div>
    </div>
  );
}
