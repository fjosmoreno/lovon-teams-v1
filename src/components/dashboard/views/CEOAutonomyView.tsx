"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Crown,
  Power,
  Clock,
  Zap,
  Target,
  Radio,
  Plus,
  Trash2,
  Check,
  AlertCircle,
  Activity,
  Calendar,
} from "lucide-react";
import { useLovonStore, Goal, Signal, SignalType } from "@/lib/lovon/store";

const SIGNAL_TYPE_LABELS: Record<SignalType, string> = {
  competitor_change: "Mudança de Concorrente",
  sales_low: "Vendas Baixas",
  pipeline_drop: "Queda no Pipeline",
  traffic_drop: "Queda de Tráfego",
  llm_errors_spike: "Pico de Erros LLM",
  budget_risk: "Risco de Orçamento",
  approval_pending: "Aprovação Pendente",
  knowledge_updated: "KB Atualizada",
  manual_note: "Nota Manual",
};

const SEVERITY_COLORS = {
  low: "text-violet-muted",
  medium: "text-[#ff8a3d]",
  high: "text-red-400",
};

export function CEOAutonomyView() {
  const ceoAutonomy = useLovonStore((s) => s.ceoAutonomy);
  const updateCEOAutonomy = useLovonStore((s) => s.updateCEOAutonomy);
  const goals = useLovonStore((s) => s.goals);
  const signals = useLovonStore((s) => s.signals);
  const addGoal = useLovonStore((s) => s.addGoal);
  const deleteGoal = useLovonStore((s) => s.deleteGoal);
  const addSignal = useLovonStore((s) => s.addSignal);
  const consumeSignals = useLovonStore((s) => s.consumeSignals);
  const agents = useLovonStore((s) => s.agents);
  const tasks = useLovonStore((s) => s.tasks);
  const company = useLovonStore((s) => s.company);

  const [showGoalForm, setShowGoalForm] = useState(false);
  const heartbeatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ceo = agents.find((a) => a.role === "ceo");
  const unconsumedSignals = signals.filter((s) => !s.consumedAt);
  const overdueTasks = tasks.filter((t) => t.dueAt && t.dueAt < Date.now() && t.status !== "completed" && t.status !== "archived");
  const initiatives = tasks.filter((t) => t.isInitiative);

  // Calculate next heartbeat time
  const frequencyMs = ceoAutonomy.frequency === "daily" ? 24 * 60 * 60 * 1000 : ceoAutonomy.frequency === "twice_daily" ? 12 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
  const nextHeartbeat = ceoAutonomy.lastHeartbeatAt ? ceoAutonomy.lastHeartbeatAt + frequencyMs : null;

  const triggerHeartbeat = useCallback(async () => {
    if (!ceo || !company) return;

    updateCEOAutonomy({ lastHeartbeatAt: Date.now() });

    try {
      const res = await fetch("/api/lovon/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: company.id,
          agentSlug: "ceo",
          idempotencyKey: `heartbeat-${Date.now()}`,
          companyName: company.name,
          agentName: ceo.name,
          companyConfig: useLovonStore.getState().companyConfig,
          knowledgeBase: useLovonStore.getState().knowledgeBase,
          activeGoals: goals.map((g) => `${g.title} (${g.priority})`).join("; "),
          tasksByStatus: {
            todo: tasks.filter((t) => t.status === "pending").length,
            in_progress: tasks.filter((t) => t.status === "in_progress").length,
            blocked: tasks.filter((t) => t.status === "blocked").length,
            done: tasks.filter((t) => t.status === "completed").length,
          },
          staleTaskCount: tasks.filter((t) => Date.now() - t.updatedAt > 48 * 60 * 60 * 1000).length,
          pendingConfirmations: useLovonStore.getState().confirmationRequests.filter((c) => c.status === "pending").length,
          budgetRemaining: "Verificar limits",
          dryRun: false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        useLovonStore.getState().logActivity({
          agentId: ceo.id,
          agentName: ceo.name,
          action: "completed",
          message: `Heartbeat automático executado. ${data.tokensUsed ?? 0} tokens usados. Verifique tarefas e iniciativas criadas.`,
          accent: "green",
        });
      }
    } catch (err) {
      console.error("[heartbeat] auto error:", err);
    }
  }, [ceo, company, goals, tasks, updateCEOAutonomy]);

  // Auto heartbeat scheduler
  useEffect(() => {
    if (!ceoAutonomy.enabled) {
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
      return;
    }

    // Check every 60s if it's time for heartbeat
    heartbeatTimerRef.current = setInterval(() => {
      const now = Date.now();
      if (!ceoAutonomy.lastHeartbeatAt || now >= (ceoAutonomy.lastHeartbeatAt + frequencyMs)) {
        triggerHeartbeat();
      }
    }, 60000);

    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [ceoAutonomy.enabled, ceoAutonomy.frequency, ceoAutonomy.lastHeartbeatAt, triggerHeartbeat]);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-5 h-5 text-beige" />
          <h1 className="text-2xl sm:text-3xl font-bold text-cream font-serif-display">CEO Autonomy</h1>
        </div>
        <p className="text-sm text-violet-muted max-w-2xl">
          O CEO não é um chatbot com delegação — é um executivo autônomo. Heartbeat agendado + Goals + Signals geram trabalho por iniciativa própria, com guardrails.
        </p>
      </div>

      {/* autonomy toggle */}
      <div className={`p-5 rounded-2xl border transition-all ${ceoAutonomy.enabled ? "bg-neon-green/5 border-neon-green/20" : "glass border-violet-subtle"}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-serif-display text-base font-semibold text-cream">Modo Autônomo do CEO</h3>
            <p className="text-xs text-violet-muted mt-0.5">
              {ceoAutonomy.enabled ? "ATIVO — CEO acorda automaticamente e cria iniciativas" : "DESATIVADO — CEO só executa quando você cria tarefas"}
            </p>
          </div>
          <button
            onClick={() => updateCEOAutonomy({ enabled: !ceoAutonomy.enabled })}
            className={`relative w-14 h-7 rounded-full transition-all ${ceoAutonomy.enabled ? "bg-neon-green/30" : "bg-white/10"}`}
          >
            <span className={`absolute top-0.5 w-6 h-6 rounded-full transition-all ${ceoAutonomy.enabled ? "left-7 bg-neon-green" : "left-0.5 bg-white"}`} />
          </button>
        </div>

        {ceoAutonomy.enabled && (
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-mono text-violet-muted uppercase mb-1.5 block">Frequência</label>
              <select
                value={ceoAutonomy.frequency}
                onChange={(e) => updateCEOAutonomy({ frequency: e.target.value as typeof ceoAutonomy.frequency })}
                className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
              >
                <option value="daily">Diário</option>
                <option value="twice_daily">2x ao dia</option>
                <option value="weekly">Semanal</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-violet-muted uppercase mb-1.5 block">Nível de Autonomia</label>
              <select
                value={ceoAutonomy.autonomyLevel}
                onChange={(e) => updateCEOAutonomy({ autonomyLevel: Number(e.target.value) as 0 | 1 | 2 | 3 })}
                className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
              >
                <option value={0}>Nível 0 — Só sugere</option>
                <option value={1}>Nível 1 — Interno auto</option>
                <option value={2}>Nível 2 — Externo com limites</option>
                <option value={3}>Nível 3 — Enterprise</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-mono text-violet-muted uppercase mb-1.5 block">Máx iniciativas/run</label>
              <input
                type="number"
                min={1}
                max={10}
                value={ceoAutonomy.maxInitiativesPerRun}
                onChange={(e) => updateCEOAutonomy({ maxInitiativesPerRun: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
              />
            </div>
          </div>
        )}

        {ceoAutonomy.enabled && (
          <div className="mt-4 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-violet-muted">
              <Clock className="w-3.5 h-3.5" />
              {ceoAutonomy.lastHeartbeatAt
                ? `Último: ${new Date(ceoAutonomy.lastHeartbeatAt).toLocaleString("pt-BR")}`
                : "Aguardando primeiro heartbeat"}
            </span>
            {nextHeartbeat && (
              <span className="flex items-center gap-1.5 text-beige">
                <Calendar className="w-3.5 h-3.5" />
                Próximo: {new Date(nextHeartbeat).toLocaleString("pt-BR")}
              </span>
            )}
            <button
              onClick={triggerHeartbeat}
              className="ml-auto px-3 py-1.5 rounded-md text-xs bg-beige/10 border border-beige/30 text-beige hover:bg-beige/20 flex items-center gap-1"
            >
              <Zap className="w-3 h-3" /> Executar agora
            </button>
          </div>
        )}
      </div>

      {/* stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Goals", value: goals.length, icon: Target, color: "text-beige" },
          { label: "Signals", value: unconsumedSignals.length, icon: Radio, color: "text-[#ff8a3d]" },
          { label: "Iniciativas", value: initiatives.length, icon: Zap, color: "text-neon-blue" },
          { label: "Overdue", value: overdueTasks.length, icon: AlertCircle, color: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="p-3 rounded-xl glass border border-violet-subtle text-center">
            <s.icon className={`w-4 h-4 ${s.color} mb-1 mx-auto`} />
            <div className="text-lg font-bold text-cream">{s.value}</div>
            <div className="text-[9px] text-violet-muted uppercase">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Goals */}
      <div className="p-5 rounded-2xl glass border border-violet-subtle">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-beige" />
            <h3 className="text-sm font-semibold text-cream">Goals / OKRs</h3>
            <span className="text-[10px] font-mono text-violet-muted">{goals.length} ativos</span>
          </div>
          <button onClick={() => setShowGoalForm(!showGoalForm)} className="text-xs text-beige hover:underline flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Novo goal
          </button>
        </div>

        {showGoalForm && (
          <GoalForm onSave={(goal) => { addGoal({ ...goal, workspaceId: "default", status: "active" }); setShowGoalForm(false); }} onCancel={() => setShowGoalForm(false)} />
        )}

        <div className="space-y-2">
          {goals.length === 0 && (
            <div className="text-xs text-violet-muted italic py-2">Nenhum goal configurado. Crie metas para o CEO perseguir.</div>
          )}
          {goals.map((goal) => (
            <div key={goal.id} className="p-3 rounded-lg bg-violet-bg/30 border border-violet-subtle group">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${
                      goal.priority === "critical" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                      goal.priority === "high" ? "bg-[#ff8a3d]/10 text-[#ff8a3d] border border-[#ff8a3d]/20" :
                      goal.priority === "medium" ? "bg-neon-blue/10 text-neon-blue border border-neon-blue/20" :
                      "bg-white/5 text-violet-muted border border-white/10"
                    }`}>{goal.priority}</span>
                    {goal.dueAt && <span className="text-[9px] font-mono text-violet-muted">Prazo: {new Date(goal.dueAt).toLocaleDateString("pt-BR")}</span>}
                  </div>
                  <div className="text-sm text-cream">{goal.title}</div>
                  {goal.kpis.length > 0 && (
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {goal.kpis.map((kpi, i) => (
                        <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet-dark/40 text-violet-muted border border-violet-subtle">
                          {kpi.name}: {kpi.target}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => deleteGoal(goal.id)} className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md bg-white/5 text-violet-muted hover:text-red-400 flex items-center justify-center transition-all">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Signals */}
      <div className="p-5 rounded-2xl glass border border-violet-subtle">
        <div className="flex items-center gap-2 mb-4">
          <Radio className="w-4 h-4 text-[#ff8a3d]" />
          <h3 className="text-sm font-semibold text-cream">Signals</h3>
          <span className="text-[10px] font-mono text-violet-muted">{unconsumedSignals.length} não consumidos</span>
        </div>

        <div className="space-y-2 max-h-80 overflow-y-auto no-scrollbar">
          {signals.length === 0 && (
            <div className="text-xs text-violet-muted italic py-2">Nenhum signal. Interações com integrações (web research, CRM, analytics) geram signals automaticamente.</div>
          )}
          {signals.slice(0, 20).map((signal) => (
            <div key={signal.id} className={`p-2.5 rounded-lg border ${signal.consumedAt ? "bg-violet-bg/10 border-violet-subtle opacity-50" : "bg-violet-bg/30 border-violet-subtle"}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[9px] font-mono uppercase ${SEVERITY_COLORS[signal.severity]}`}>{signal.severity}</span>
                    <span className="text-[10px] text-cream">{SIGNAL_TYPE_LABELS[signal.type]}</span>
                    {signal.consumedAt && <span className="text-[8px] font-mono text-neon-green">✓ consumido</span>}
                  </div>
                  <div className="text-[10px] text-violet-muted font-mono">{new Date(signal.createdAt).toLocaleString("pt-BR")}</div>
                  {Object.keys(signal.payload).length > 0 && (
                    <div className="text-[9px] text-violet-muted mt-0.5">{JSON.stringify(signal.payload).slice(0, 100)}</div>
                  )}
                </div>
                {!signal.consumedAt && (
                  <button
                    onClick={() => consumeSignals([signal.id], "board")}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-neon-green/10 text-neon-green border border-neon-green/20 hover:bg-neon-green/20"
                  >
                    Consumir
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Guardrails */}
      <div className="p-4 rounded-xl bg-[#ff8a3d]/5 border border-[#ff8a3d]/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-[#ff8a3d] mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-semibold text-[#ff8a3d] mb-1">Guardrails</div>
            <ul className="text-xs text-violet-muted space-y-1">
              <li>• Máx {ceoAutonomy.maxInitiativesPerRun} iniciativas por heartbeat</li>
              <li>• Toda iniciativa deve ter goal + signal (não cria trabalho aleatório)</li>
              <li>• Overdue crítico tem prioridade sobre novas iniciativas</li>
              <li>• Ações externas sempre gated por approval</li>
              <li>• Idempotência: não cria duplicatas no mesmo dia</li>
              <li>• Se pending approvals &gt; 3: prioriza limpar approvals</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalForm({ onSave, onCancel }: { onSave: (goal: Omit<Goal, "id" | "createdAt" | "workspaceId" | "status">) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Goal["priority"]>("high");
  const [kpiName, setKpiName] = useState("");
  const [kpiTarget, setKpiTarget] = useState("");
  const [kpis, setKpis] = useState<{ name: string; target: string }[]>([]);
  const [dueAt, setDueAt] = useState("");

  return (
    <div className="mb-3 p-3 rounded-lg bg-violet-bg/30 border border-violet-subtle space-y-2">
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título do goal (ex: Aumentar conversão)" className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30" />
      <select value={priority} onChange={(e) => setPriority(e.target.value as Goal["priority"])} className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30">
        <option value="critical">Crítica</option>
        <option value="high">Alta</option>
        <option value="medium">Média</option>
        <option value="low">Baixa</option>
      </select>
      <div className="flex items-center gap-2">
        <input type="text" value={kpiName} onChange={(e) => setKpiName(e.target.value)} placeholder="KPI (ex: Conversão)" className="flex-1 px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30" />
        <input type="text" value={kpiTarget} onChange={(e) => setKpiTarget(e.target.value)} placeholder="Meta (ex: 5%)" className="flex-1 px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30" />
        <button
          onClick={() => { if (kpiName && kpiTarget) { setKpis([...kpis, { name: kpiName, target: kpiTarget }]); setKpiName(""); setKpiTarget(""); } }}
          className="px-3 py-2 rounded-lg bg-beige/10 border border-beige/30 text-beige text-sm"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      {kpis.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {kpis.map((k, i) => (
            <span key={i} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-beige/10 text-beige border border-beige/20">{k.name}: {k.target}</span>
          ))}
        </div>
      )}
      <input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30" />
      <div className="flex items-center justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 rounded-md text-xs bg-white/5 border border-white/10 text-violet-muted hover:text-cream">Cancelar</button>
        <button
          onClick={() => { if (title.trim()) onSave({ title: title.trim(), priority, kpis, dueAt: dueAt ? new Date(dueAt).getTime() : undefined }); }}
          disabled={!title.trim()}
          className="px-3 py-1.5 rounded-md text-xs bg-beige/10 border border-beige/30 text-beige hover:bg-beige/20 disabled:opacity-40 flex items-center gap-1"
        >
          <Check className="w-3.5 h-3.5" /> Salvar goal
        </button>
      </div>
    </div>
  );
}
