"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Search,
  Mail,
  Heart,
  ListChecks,
  Calendar,
  UserPlus,
  Wrench,
  Shield,
  Check,
  X,
  AlertTriangle,
  Power,
} from "lucide-react";
import { useLovonStore, Skill, Tool } from "@/lib/lovon/store";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  core: Heart,
  research: Search,
  communication: Mail,
  productivity: ListChecks,
  integration: Wrench,
};

const RISK_COLORS: Record<string, string> = {
  low: "text-neon-green",
  medium: "text-[#ff8a3d]",
  high: "text-red-400",
  destructive: "text-red-500",
};

export function SkillsView() {
  const skillCatalog = useLovonStore((s) => s.skillCatalog);
  const toolCatalog = useLovonStore((s) => s.toolCatalog);
  const agents = useLovonStore((s) => s.agents);
  const workspaceSkillPolicy = useLovonStore((s) => s.workspaceSkillPolicy);
  const assignSkillToAgent = useLovonStore((s) => s.assignSkillToAgent);
  const revokeSkillFromAgent = useLovonStore((s) => s.revokeSkillFromAgent);
  const toggleWorkspaceSkill = useLovonStore((s) => s.toggleWorkspaceSkill);
  const toggleWorkspaceTool = useLovonStore((s) => s.toggleWorkspaceTool);

  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [tab, setTab] = useState<"skills" | "tools" | "policy">("skills");

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-beige" />
          <h1 className="text-2xl sm:text-3xl font-bold text-cream font-serif-display">Skills & Ferramentas</h1>
        </div>
        <p className="text-sm text-violet-muted max-w-2xl">
          Atribua skills a agentes e controle ferramentas. Skills declaram quais tools precisam. A plataforma bloqueia tools não autorizadas no backend — prompts sozinhos não seguram nada.
        </p>
      </div>

      {/* tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-violet-bg/40 border border-violet-subtle w-fit">
        {(["skills", "tools", "policy"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
              tab === t ? "bg-beige/15 text-beige" : "text-violet-muted hover:text-cream"
            }`}
          >
            {t === "skills" ? "Skills" : t === "tools" ? "Ferramentas" : "Política do Workspace"}
          </button>
        ))}
      </div>

      {/* === Tab: Skills === */}
      {tab === "skills" && (
        <div className="space-y-4">
          {/* agent selector */}
          <div>
            <label className="text-xs font-medium text-violet-muted mb-2 block">Selecionar agente para gerenciar skills</label>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`p-3 rounded-lg border text-left transition-all flex items-center gap-2 ${
                    selectedAgentId === agent.id
                      ? "border-beige/40 bg-beige/10"
                      : "border-violet-subtle bg-violet-bg/30 hover:border-violet-strong"
                  }`}
                >
                  <span className="text-lg">{agent.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-cream truncate">{agent.name}</div>
                    <div className="text-[9px] text-violet-muted">{(agent.skills ?? []).length} skills · {(agent.tools ?? []).length} tools</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* skill catalog */}
          {selectedAgent && (
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase text-violet-muted">
                Skills do agente: {selectedAgent.name}
              </div>
              {skillCatalog.map((skill, i) => {
                const Icon = CATEGORY_ICONS[skill.category] ?? Sparkles;
                const isAssigned = (selectedAgent.skills ?? []).includes(skill.slug);
                const isGloballyDisabled = workspaceSkillPolicy.disabledSkills.includes(skill.slug);
                return (
                  <motion.div
                    key={skill.slug}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    className={`p-4 rounded-xl border transition-all ${
                      isGloballyDisabled
                        ? "border-red-500/20 bg-red-500/5 opacity-60"
                        : isAssigned
                        ? "border-beige/30 bg-beige/5"
                        : "border-violet-subtle bg-violet-bg/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-9 h-9 rounded-lg ${isAssigned ? "bg-beige/10" : "bg-violet-dark/40"} border border-violet-subtle flex items-center justify-center shrink-0`}>
                          <Icon className={`w-4 h-4 ${isAssigned ? "text-beige" : "text-violet-muted"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-cream">{skill.name}</span>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet-bg/40 text-violet-muted border border-violet-subtle">
                              v{skill.version}
                            </span>
                            {skill.requiresApproval && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#ff8a3d]/10 text-[#ff8a3d] border border-[#ff8a3d]/20 flex items-center gap-0.5">
                                <Shield className="w-2.5 h-2.5" /> Aprovação
                              </span>
                            )}
                            {isGloballyDisabled && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                                DESATIVADA
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-violet-muted leading-snug mb-2">{skill.description}</p>
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[9px] font-mono text-violet-muted">Tools:</span>
                            {skill.tools.map((t) => (
                              <span key={t} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-violet-dark/40 text-violet-muted border border-violet-subtle">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {!isGloballyDisabled && (
                          isAssigned ? (
                            <button
                              onClick={() => revokeSkillFromAgent(selectedAgent.id, skill.slug)}
                              className="px-3 py-1.5 rounded-md text-xs bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 flex items-center gap-1"
                            >
                              <X className="w-3 h-3" /> Revogar
                            </button>
                          ) : (
                            <button
                              onClick={() => assignSkillToAgent(selectedAgent.id, skill.slug)}
                              className="px-3 py-1.5 rounded-md text-xs bg-beige/10 border border-beige/30 text-beige hover:bg-beige/20 flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Atribuir
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {!selectedAgent && (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 mx-auto text-violet-muted/30 mb-3" />
              <p className="text-sm text-violet-muted">Selecione um agente para gerenciar suas skills.</p>
            </div>
          )}
        </div>
      )}

      {/* === Tab: Tools === */}
      {tab === "tools" && (
        <div className="space-y-3">
          <div className="text-xs font-mono uppercase text-violet-muted mb-2">Catálogo de Ferramentas</div>
          {toolCatalog.map((tool, i) => {
            const isGloballyDisabled = workspaceSkillPolicy.disabledTools.includes(tool.id);
            const agentsWithTool = agents.filter((a) => a.tools.includes(tool.id));
            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className={`p-4 rounded-xl border ${isGloballyDisabled ? "border-red-500/20 bg-red-500/5" : "border-violet-subtle bg-violet-bg/20"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-cream">{tool.name}</span>
                      <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${RISK_COLORS[tool.riskLevel]}`}>
                        {tool.riskLevel}
                      </span>
                      {tool.requiresApproval && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#ff8a3d]/10 text-[#ff8a3d] border border-[#ff8a3d]/20 flex items-center gap-0.5">
                          <Shield className="w-2.5 h-2.5" /> Requer approval
                        </span>
                      )}
                      {isGloballyDisabled && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                          BLOQUEADA
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-violet-muted mb-2">{tool.description}</p>
                    <div className="text-[9px] font-mono text-violet-muted">
                      Agentes com acesso: {agentsWithTool.length > 0 ? agentsWithTool.map((a) => a.name).join(", ") : "Nenhum"}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleWorkspaceTool(tool.id, isGloballyDisabled)}
                    className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-1 shrink-0 ${
                      isGloballyDisabled
                        ? "bg-neon-green/10 border border-neon-green/30 text-neon-green hover:bg-neon-green/20"
                        : "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
                    }`}
                  >
                    <Power className="w-3 h-3" /> {isGloballyDisabled ? "Ativar" : "Bloquear"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* === Tab: Policy === */}
      {tab === "policy" && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl glass border border-violet-subtle">
            <h3 className="font-serif-display text-base font-semibold text-cream mb-2">Política de Skills do Workspace</h3>
            <p className="text-xs text-violet-muted mb-4">
              Desative skills globalmente para TODOS os agentes. Mesmo agentes com a skill atribuída não poderão executá-la.
            </p>
            <div className="space-y-2">
              {skillCatalog.map((skill) => {
                const isDisabled = workspaceSkillPolicy.disabledSkills.includes(skill.slug);
                return (
                  <div key={skill.slug} className="flex items-center justify-between p-3 rounded-lg bg-violet-bg/30 border border-violet-subtle">
                    <div>
                      <div className="text-sm text-cream">{skill.name}</div>
                      <div className="text-[9px] text-violet-muted">{skill.slug}</div>
                    </div>
                    <button
                      onClick={() => toggleWorkspaceSkill(skill.slug, isDisabled)}
                      className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-1 ${
                        isDisabled
                          ? "bg-neon-green/10 border border-neon-green/30 text-neon-green"
                          : "bg-red-500/10 border border-red-500/30 text-red-400"
                      }`}
                    >
                      <Power className="w-3 h-3" /> {isDisabled ? "Ativar" : "Desativar"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-5 rounded-2xl glass border border-violet-subtle">
            <h3 className="font-serif-display text-base font-semibold text-cream mb-2">Política de Tools do Workspace</h3>
            <p className="text-xs text-violet-muted mb-4">
              Bloqueie ferramentas globalmente. O backend recusa chamadas mesmo se o agente tentar.
            </p>
            <div className="space-y-2">
              {toolCatalog.map((tool) => {
                const isDisabled = workspaceSkillPolicy.disabledTools.includes(tool.id);
                return (
                  <div key={tool.id} className="flex items-center justify-between p-3 rounded-lg bg-violet-bg/30 border border-violet-subtle">
                    <div>
                      <div className="text-sm text-cream">{tool.name}</div>
                      <div className="text-[9px] text-violet-muted">{tool.id} · {tool.riskLevel}</div>
                    </div>
                    <button
                      onClick={() => toggleWorkspaceTool(tool.id, isDisabled)}
                      className={`px-3 py-1.5 rounded-md text-xs flex items-center gap-1 ${
                        isDisabled
                          ? "bg-neon-green/10 border border-neon-green/30 text-neon-green"
                          : "bg-red-500/10 border border-red-500/30 text-red-400"
                      }`}
                    >
                      <Power className="w-3 h-3" /> {isDisabled ? "Ativar" : "Bloquear"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#ff8a3d]/5 border border-[#ff8a3d]/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-[#ff8a3d] mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-semibold text-[#ff8a3d] mb-1">Como funciona o enforcement</div>
                <p className="text-xs text-violet-muted leading-relaxed">
                  Skills e tools são enforced no BACKEND, não no prompt. Mesmo que o LLM tente chamar uma ferramenta não autorizada, a API retorna <span className="font-mono text-[#ff8a3d]">POLICY_BLOCKED</span>. Isso é segurança real — prompts sozinhos não seguram nada.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
