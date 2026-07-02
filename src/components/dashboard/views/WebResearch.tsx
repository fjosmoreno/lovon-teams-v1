"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Trash2, Globe, Clock, FileText, X, ExternalLink, Calendar } from "lucide-react";
import { useLovonStore, ResearchReport } from "@/lib/lovon/store";
import ZAI from "z-ai-web-dev-sdk";

export function WebResearch() {
  const researchReports = useLovonStore((s) => s.researchReports);
  const researchConfig = useLovonStore((s) => s.researchConfig);
  const updateResearchConfig = useLovonStore((s) => s.updateResearchConfig);
  const addResearchReport = useLovonStore((s) => s.addResearchReport);
  const deleteResearchReport = useLovonStore((s) => s.deleteResearchReport);
  const agents = useLovonStore((s) => s.agents);

  const [showConfig, setShowConfig] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ResearchReport | null>(null);
  const [newCompetitor, setNewCompetitor] = useState("");
  const [running, setRunning] = useState(false);

  const ceo = agents.find((a) => a.role === "ceo");
  const competitors = researchConfig?.competitors ?? [];
  const topics = researchConfig?.topics ?? ["features", "preço", "posicionamento"];

  const handleAddCompetitor = () => {
    if (!newCompetitor.trim()) return;
    updateResearchConfig({ competitors: [...competitors, newCompetitor.trim()] });
    setNewCompetitor("");
  };

  const handleRemoveCompetitor = (name: string) => {
    updateResearchConfig({ competitors: competitors.filter((c) => c !== name) });
  };

  const handleRunResearch = async () => {
    if (competitors.length === 0 || running) return;
    setRunning(true);
    try {
      // Call the agent API to generate a research report
      const companyConfig = useLovonStore.getState().companyConfig;
      const knowledgeBase = useLovonStore.getState().knowledgeBase;

      const res = await fetch("/api/lovon/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: "Research Agent",
          agentRole: "worker",
          specialty: "Market & Competitor Research",
          mission: `Pesquisar concorrentes: ${competitors.join(", ")}`,
          taskTitle: `Relatório de pesquisa competitiva — ${competitors.length} concorrentes`,
          taskDescription: `Pesquisar features, preço, posicionamento, anúncios e reviews de: ${competitors.join(", ")}. Gerar relatório com resumo executivo, achados, implicações, recomendações e fontes (links).`,
          companyName: useLovonStore.getState().company?.name ?? "Lovon Teams",
          mode: "execute",
          companyConfig,
          knowledgeBase,
        }),
      });
      const data = await res.json();
      if (data.success) {
        // Parse the conclusion into a report structure
        const conclusion = data.conclusion as string;
        addResearchReport({
          title: `Pesquisa competitiva — ${new Date().toLocaleDateString("pt-BR")}`,
          competitors,
          topics,
          executiveSummary: conclusion.slice(0, 500) + "...",
          findings: [],
          implications: "",
          recommendations: [],
          sources: [],
          taskIds: [],
          createdBy: ceo?.id ?? "",
        });
      } else {
        // Show error — likely Company Core not configured
        alert(`Erro ao pesquisar: ${data.error ?? "desconhecido"}${data.enforcement === "company_core_required" ? "\n\nConfigure o Company Core em: Configurações → Empresa" : ""}`);
      }
    } catch (err) {
      console.error("Research failed:", err);
      alert(`Erro de rede ao pesquisar: ${err instanceof Error ? err.message : "desconhecido"}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-5 h-5 text-beige" />
            <h1 className="text-2xl sm:text-3xl font-bold text-cream font-serif-display">Web Research</h1>
          </div>
          <p className="text-sm text-violet-muted max-w-2xl">
            Monitora concorrentes e tendências. Toda afirmação externa vem com fonte (link). Relatórios viram tickets para execução.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowConfig(true)} className="btn-pill btn-secondary-neon text-xs">
            <Plus className="w-3.5 h-3.5" /> Configurar
          </button>
          <button
            onClick={handleRunResearch}
            disabled={competitors.length === 0 || running}
            className="btn-pill btn-primary-neon text-xs disabled:opacity-40"
          >
            <Search className="w-3.5 h-3.5" /> {running ? "Pesquisando..." : "Rodar pesquisa"}
          </button>
        </div>
      </div>

      {/* config summary */}
      <div className="p-4 rounded-xl glass border border-violet-subtle">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-cream">Configuração atual</h3>
          {researchConfig?.lastRunAt && (
            <span className="text-[10px] font-mono text-violet-muted flex items-center gap-1">
              <Clock className="w-3 h-3" /> Última execução: {new Date(researchConfig.lastRunAt).toLocaleDateString("pt-BR")}
            </span>
          )}
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] font-mono uppercase text-violet-muted mb-1">Concorrentes ({competitors.length})</div>
            {competitors.length === 0 ? (
              <span className="text-xs text-violet-muted italic">Nenhum concorrente configurado</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {competitors.map((c) => (
                  <span key={c} className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-dark/40 text-cream border border-violet-subtle">{c}</span>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-violet-muted mb-1">Tópicos</div>
            <div className="flex flex-wrap gap-1.5">
              {topics.map((t) => (
                <span key={t} className="text-[10px] font-mono px-2 py-0.5 rounded bg-beige/10 text-beige border border-beige/20">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* reports */}
      <div>
        <h3 className="text-sm font-semibold text-cream mb-3">Relatórios ({researchReports.length})</h3>
        {researchReports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-violet-muted/30 mb-3" />
            <p className="text-sm text-violet-muted">Nenhum relatório ainda. Configure concorrentes e rode uma pesquisa.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {researchReports.map((report, i) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="p-4 rounded-xl glass border border-violet-subtle group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-cream">{report.title}</div>
                    <div className="text-[10px] text-violet-muted">
                      {new Date(report.createdAt).toLocaleString("pt-BR")} · {report.competitors.length} concorrentes
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setSelectedReport(report)} className="w-7 h-7 rounded-md bg-white/5 border border-white/8 text-violet-muted hover:text-beige flex items-center justify-center">
                      <FileText className="w-3 h-3" />
                    </button>
                    <button onClick={() => deleteResearchReport(report.id)} className="w-7 h-7 rounded-md bg-white/5 border border-white/8 text-violet-muted hover:text-red-400 flex items-center justify-center">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-violet-muted line-clamp-3">{report.executiveSummary}</p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* config modal */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowConfig(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              className="relative w-full max-w-md max-h-[80vh] flex flex-col rounded-2xl glass-strong border border-white/10 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between p-5 border-b border-violet-subtle">
                <h3 className="text-base font-semibold text-cream font-serif-display">Configurar pesquisa</h3>
                <button onClick={() => setShowConfig(false)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-violet-muted hover:text-cream">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 no-scrollbar space-y-4">
                <div>
                  <label className="text-xs font-medium text-violet-muted mb-2 block">Concorrentes</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newCompetitor}
                      onChange={(e) => setNewCompetitor(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddCompetitor()}
                      placeholder="ex: Paperclip, LangChain, CrewAI"
                      className="flex-1 px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
                    />
                    <button onClick={handleAddCompetitor} className="px-3 py-2 rounded-lg bg-beige/10 border border-beige/30 text-beige text-sm">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {competitors.map((c) => (
                      <div key={c} className="flex items-center justify-between p-2 rounded-lg bg-violet-bg/30 border border-violet-subtle">
                        <span className="text-xs text-cream">{c}</span>
                        <button onClick={() => handleRemoveCompetitor(c)} className="text-violet-muted hover:text-red-400">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-violet-muted mb-2 block">Frequência</label>
                  <select
                    value={researchConfig?.frequency ?? "manual"}
                    onChange={(e) => updateResearchConfig({ frequency: e.target.value as "weekly" | "monthly" | "manual" })}
                    className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
                  >
                    <option value="manual">Manual (rodar sob demanda)</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                </div>
              </div>
              <div className="p-4 border-t border-violet-subtle">
                <button onClick={() => setShowConfig(false)} className="btn-pill btn-primary-neon text-xs w-full">
                  Salvar configuração
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* report detail modal */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedReport(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl glass-strong border border-white/10 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between p-5 border-b border-violet-subtle">
                <div>
                  <h3 className="text-base font-semibold text-cream font-serif-display">{selectedReport.title}</h3>
                  <p className="text-[10px] text-violet-muted">{new Date(selectedReport.createdAt).toLocaleString("pt-BR")}</p>
                </div>
                <button onClick={() => setSelectedReport(null)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-violet-muted hover:text-cream">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 no-scrollbar">
                <div className="text-xs font-mono uppercase text-violet-muted mb-2">Resumo executivo</div>
                <p className="text-sm text-cream/90 leading-relaxed whitespace-pre-wrap mb-4">{selectedReport.executiveSummary}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedReport.competitors.map((c) => (
                    <span key={c} className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-dark/40 text-cream border border-violet-subtle">{c}</span>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t border-violet-subtle">
                <button onClick={() => setSelectedReport(null)} className="btn-pill btn-secondary-neon text-xs w-full">Fechar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
