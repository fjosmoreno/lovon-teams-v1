"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  PiggyBank,
  Gift,
  Zap,
  Server,
  Scale,
  ArrowRight,
  ArrowLeft,
  Check,
  Terminal,
  Sparkles,
} from "lucide-react";
import { AGENT_GOALS, PROVIDERS, DEPARTMENT_TEMPLATES } from "@/lib/lovon/data";
import { useLovonStore, Accent } from "@/lib/lovon/store";
import { manualSpawnSubagent } from "@/lib/lovon/engine";

const GOAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  crown: Crown,
  "piggy-bank": PiggyBank,
  gift: Gift,
  zap: Zap,
  server: Server,
  scale: Scale,
};

const ACCENT: Record<string, { text: string; border: string; bg: string }> = {
  green: { text: "text-neon-green", border: "border-neon-green/30", bg: "bg-neon-green/10" },
  blue: { text: "text-neon-blue", border: "border-neon-blue/30", bg: "bg-neon-blue/10" },
  purple: { text: "text-neon-purple", border: "border-[#a855f7]/30", bg: "bg-[#a855f7]/10" },
  acid: { text: "text-[#b6ff3d]", border: "border-[#b6ff3d]/30", bg: "bg-[#b6ff3d]/10" },
  orange: { text: "text-[#ff8a3d]", border: "border-[#ff8a3d]/30", bg: "bg-[#ff8a3d]/10" },
};

const EMOJI_OPTIONS = ["◆", "▲", "●", "✦", "◇", "■", "◯", "◈", "◐", "◉", "✧", "·"];

interface Props {
  onDone: () => void;
}

export function CreateAgent({ onDone }: Props) {
  const agents = useLovonStore((s) => s.agents);
  const departments = useLovonStore((s) => s.departments);
  const logActivity = useLovonStore((s) => s.logActivity);

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [emoji, setEmoji] = useState("✧");
  const [objective, setObjective] = useState("balanced");
  const [tier, setTier] = useState<"free" | "premium" | "local">("free");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [parentId, setParentId] = useState<string>("");
  const [selectedProviders, setSelectedProviders] = useState<string[]>(["gemini-free", "groq"]);

  const ceo = agents.find((a) => a.role === "ceo");
  const parentOptions = agents.filter((a) => a.role !== "worker"); // CEO and heads can have children

  const toggleProvider = (id: string) => {
    setSelectedProviders((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleDeploy = () => {
    if (!ceo || !parentId) return;

    const goal = AGENT_GOALS.find((g) => g.id === objective);
    const accent: Accent = (goal?.accent as Accent) ?? "green";
    const model = goal?.recommendedModel ?? "Gemini Flash";
    const parent = agents.find((a) => a.id === parentId);

    // Ensure department exists if user picked one
    let finalDeptId = departmentId;
    if (departmentId && !departments.find((d) => d.id === departmentId)) {
      // create it inline
      useLovonStore.setState((s) => ({
        departments: [
          ...s.departments,
          {
            id: departmentId,
            name: departmentId.charAt(0).toUpperCase() + departmentId.slice(1),
            emoji,
            accent,
            headId: null,
            agentIds: [],
            kpis: [
              { label: "Tasks ativas", value: "0" },
              { label: "Tasks concluídas", value: "0" },
              { label: "Agentes", value: "1" },
            ],
          },
        ],
      }));
    }

    manualSpawnSubagent(parentId, {
      name: name.trim() || "Novo Agente",
      role: parent?.role === "ceo" ? "department-head" : "worker",
      departmentId: finalDeptId || null,
      emoji,
      specialty: specialty.trim() || goal?.label || "General",
      model,
      tier,
      accent,
    });

    logActivity({
      agentId: ceo.id,
      agentName: ceo.name,
      action: "spawned",
      message: `Criou subagente manualmente: ${name || "Novo Agente"} (${goal?.label ?? "agente"}) sob ${parent?.name}.`,
      accent,
    });

    onDone();
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Criar Agente</h1>
          <p className="text-sm text-tech-gray mt-1">
            Adicione um subagente à sua empresa. Ele será subordinado a um agente existente.
          </p>
        </div>
        <button onClick={onDone} className="text-sm text-tech-gray hover:text-white">
          Cancelar
        </button>
      </div>

      {/* progress */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex-1 flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= s
                  ? "bg-gradient-to-br from-[#00F5A0] to-[#00E0FF] text-deep-black"
                  : "bg-white/5 text-tech-gray border border-white/8"
              }`}
            >
              {step > s ? <Check className="w-3.5 h-3.5" /> : s}
            </div>
            {s < 4 && (
              <div className={`flex-1 h-px ${step > s ? "bg-neon-green/40" : "bg-white/8"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="p-6 rounded-2xl glass border border-white/8">
        <AnimatePresence mode="wait">
          {/* STEP 1 — Identity */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-lg font-semibold text-white mb-1">Identidade do agente</h2>
              <p className="text-xs text-tech-gray mb-5">Nome, especialidade e avatar.</p>

              <div className="grid sm:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="text-[10px] font-mono text-tech-gray uppercase mb-1.5 block">
                    Nome do agente
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Sales Lead SP"
                    className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-white/8 text-sm text-white placeholder:text-tech-gray focus:outline-none focus:border-neon-green/40"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-tech-gray uppercase mb-1.5 block">
                    Especialidade
                  </label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="Ex: Outbound B2B"
                    className="w-full px-4 py-2.5 rounded-lg bg-black/40 border border-white/8 text-sm text-white placeholder:text-tech-gray focus:outline-none focus:border-neon-green/40"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-tech-gray uppercase mb-2 block">
                  Avatar (emoji)
                </label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((e) => (
                    <button
                      key={e}
                      onClick={() => setEmoji(e)}
                      className={`w-10 h-10 rounded-lg border text-lg flex items-center justify-center transition-all ${
                        emoji === e
                          ? "border-neon-green/40 bg-neon-green/10 text-neon-green"
                          : "border-white/8 bg-white/[0.02] hover:border-white/15"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setStep(2)}
                  disabled={!name.trim()}
                  className="btn-pill btn-primary-neon text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Próximo <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2 — Hierarchy */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-lg font-semibold text-white mb-1">Hierarquia</h2>
              <p className="text-xs text-tech-gray mb-5">A quem este agente reporta e em qual departamento atua.</p>

              <div className="space-y-5">
                <div>
                  <label className="text-[10px] font-mono text-tech-gray uppercase mb-2 block">
                    Reporta a (parent)
                  </label>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {parentOptions.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setParentId(p.id)}
                        className={`p-3 rounded-lg border text-left flex items-center gap-3 transition-all ${
                          parentId === p.id
                            ? "border-neon-green/40 bg-neon-green/10"
                            : "border-white/8 bg-white/[0.02] hover:border-white/15"
                        }`}
                      >
                        <span className={`text-lg ${ACCENT[p.accent]?.text ?? "text-white"}`}>
                          {p.emoji}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-white truncate">{p.name}</div>
                          <div className="text-[10px] text-tech-gray">{p.role === "ceo" ? "CEO" : "Department Head"}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-tech-gray uppercase mb-2 block">
                    Departamento
                  </label>
                  <div className="grid sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => setDepartmentId("")}
                      className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                        departmentId === "" ? "border-neon-green/40 bg-neon-green/10 text-white" : "border-white/8 text-tech-gray hover:border-white/15"
                      }`}
                    >
                      Sem departamento
                    </button>
                    {departments.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setDepartmentId(d.id)}
                        className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center gap-2 ${
                          departmentId === d.id ? "border-neon-green/40 bg-neon-green/10 text-white" : "border-white/8 text-tech-gray hover:border-white/15"
                        }`}
                      >
                        <span>{d.emoji}</span>
                        <span className="truncate">{d.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button onClick={() => setStep(1)} className="btn-pill btn-secondary-neon text-sm">
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!parentId}
                  className="btn-pill btn-primary-neon text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Próximo <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3 — Objective + Provider */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-lg font-semibold text-white mb-1">Objetivo e provedor</h2>
              <p className="text-xs text-tech-gray mb-5">Define o modelo padrão e a tier de provedores.</p>

              <div className="mb-5">
                <label className="text-[10px] font-mono text-tech-gray uppercase mb-2 block">
                  Objetivo
                </label>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {AGENT_GOALS.map((goal) => {
                    const Icon = GOAL_ICONS[goal.icon] || Scale;
                    const a = ACCENT[goal.accent];
                    const isSelected = objective === goal.id;
                    return (
                      <button
                        key={goal.id}
                        onClick={() => setObjective(goal.id)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          isSelected ? `${a.border} ${a.bg}` : "border-white/8 bg-white/[0.02] hover:border-white/15"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-6 h-6 rounded ${a.bg} flex items-center justify-center ${a.text}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-semibold text-white">{goal.label}</span>
                        </div>
                        <div className={`text-[9px] font-mono ${a.text}`}>→ {goal.recommendedModel}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mb-5">
                <label className="text-[10px] font-mono text-tech-gray uppercase mb-2 block">
                  Tier
                </label>
                <div className="grid sm:grid-cols-3 gap-2">
                  {[
                    { id: "free" as const, label: "🟢 Gratuitos", desc: "R$ 0" },
                    { id: "premium" as const, label: "🔵 Premium", desc: "Pago" },
                    { id: "local" as const, label: "🟣 Local", desc: "On-prem" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTier(t.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        tier === t.id ? "border-neon-green/40 bg-neon-green/10" : "border-white/8 bg-white/[0.02] hover:border-white/15"
                      }`}
                    >
                      <div className="text-sm font-semibold text-white">{t.label}</div>
                      <div className="text-[10px] text-tech-gray">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {tier === "local" && (
                <div className="mb-5 p-3 rounded-lg bg-black/40 border border-[#a855f7]/20">
                  <div className="flex items-center gap-2 mb-2 text-xs font-mono text-tech-gray">
                    <Terminal className="w-3.5 h-3.5" />
                    <span>ENDPOINT LOCAL</span>
                  </div>
                  <input
                    type="text"
                    defaultValue="http://localhost:11434"
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-[#a855f7]/20 text-sm text-neon-purple font-mono focus:outline-none"
                  />
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button onClick={() => setStep(2)} className="btn-pill btn-secondary-neon text-sm">
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
                <button onClick={() => setStep(4)} className="btn-pill btn-primary-neon text-sm">
                  Próximo <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4 — Review */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-lg font-semibold text-white mb-1">Revisão e deploy</h2>
              <p className="text-xs text-tech-gray mb-5">Confirme as configurações do novo subagente.</p>

              <div className="space-y-3 mb-6">
                <Row label="Nome" value={name || "—"} />
                <Row label="Especialidade" value={specialty || "—"} />
                <Row label="Avatar" value={emoji} />
                <Row label="Objetivo" value={AGENT_GOALS.find((g) => g.id === objective)?.label ?? "—"} />
                <Row label="Modelo" value={AGENT_GOALS.find((g) => g.id === objective)?.recommendedModel ?? "—"} />
                <Row label="Tier" value={tier} />
                <Row label="Departamento" value={departments.find((d) => d.id === departmentId)?.name ?? "—"} />
                <Row label="Reporta a" value={agents.find((a) => a.id === parentId)?.name ?? "—"} />
              </div>

              <div className="p-4 rounded-xl bg-neon-green/5 border border-neon-green/20 mb-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-neon-green mt-0.5" />
                  <div>
                    <div className="text-sm font-semibold text-white">
                      Subagente será criado
                    </div>
                    <div className="text-xs text-tech-gray mt-1">
                      Ele aparecerá na lista de agentes e no organograma da empresa. Você poderá dar tasks a ele manualmente ou deixar o CEO delegar.
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button onClick={() => setStep(3)} className="btn-pill btn-secondary-neon text-sm">
                  <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
                <button onClick={handleDeploy} className="btn-pill btn-primary-neon text-sm">
                  <Zap className="w-4 h-4" /> Deploy Agente
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-black/30 border border-white/8 flex items-center justify-between">
      <span className="text-[10px] font-mono text-tech-gray uppercase">{label}</span>
      <span className="text-sm text-white">{value}</span>
    </div>
  );
}
