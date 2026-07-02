"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bot, Plus, MoreVertical, Pause, Play, Trash2, Pencil, X, Check, Users, Zap } from "lucide-react";
import { useLovonStore, Agent, Accent, AgentStatus } from "@/lib/lovon/store";
import { DEPARTMENT_TEMPLATES } from "@/lib/lovon/data";

interface Props {
  onCreate: () => void;
}

const ACCENT_TEXT: Record<string, string> = {
  green: "text-neon-green",
  blue: "text-neon-blue",
  purple: "text-neon-purple",
  acid: "text-[#b6ff3d]",
  orange: "text-[#ff8a3d]",
};

const ACCENT_OPTIONS: { id: Accent; label: string; color: string }[] = [
  { id: "green", label: "Verde", color: "#34D399" },
  { id: "blue", label: "Azul", color: "#60A5FA" },
  { id: "purple", label: "Violeta", color: "#A78BFA" },
  { id: "acid", label: "Lima", color: "#b6ff3d" },
  { id: "orange", label: "Laranja", color: "#ff8a3d" },
];

const EMOJI_OPTIONS = ["◆", "▲", "●", "✦", "◇", "■", "◯", "◈", "◐", "◉", "✧", "·"];

const ROLE_LABEL: Record<string, string> = {
  ceo: "CEO",
  "department-head": "Líder",
  worker: "Operador",
};

const STATUS_OPTIONS: { id: AgentStatus; label: string }[] = [
  { id: "active", label: "Ativo" },
  { id: "idle", label: "Ocioso" },
  { id: "working", label: "Trabalhando" },
  { id: "thinking", label: "Pensando" },
];

export function AgentsList({ onCreate }: Props) {
  const agents = useLovonStore((s) => s.agents);
  const departments = useLovonStore((s) => s.departments);
  const tasks = useLovonStore((s) => s.tasks);
  const toggleAgentStatus = useLovonStore((s) => s.toggleAgentStatus);
  const updateAgent = useLovonStore((s) => s.updateAgent);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "idle">("all");
  const [editingAgentId, setEditingAgentId] = useState<string | null>(null);

  const filtered = agents.filter((a) => {
    if (filter === "active" && a.status !== "active" && a.status !== "working" && a.status !== "thinking") return false;
    if (filter === "idle" && (a.status === "active" || a.status === "working" || a.status === "thinking")) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.specialty.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDelete = (id: string) => {
    useLovonStore.setState((s) => ({
      agents: s.agents.filter((a) => a.id !== id),
      departments: s.departments.map((d) => ({
        ...d,
        agentIds: d.agentIds.filter((aid) => aid !== id),
        headId: d.headId === id ? null : d.headId,
      })),
    }));
  };

  const editingAgent = editingAgentId ? agents.find((a) => a.id === editingAgentId) ?? null : null;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-serif-display">Agentes</h1>
          <p className="text-sm text-tech-gray mt-1">
            {agents.length} agentes · {agents.filter(a => a.status === "active" || a.status === "working").length} ativos agora
          </p>
        </div>
        <button onClick={onCreate} className="btn-pill btn-primary-neon text-sm">
          <Plus className="w-4 h-4" />
          Criar Agente
        </button>
      </div>

      {/* filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tech-gray" />
          <input
            type="text"
            placeholder="Buscar agentes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-black/40 border border-white/8 text-sm text-white placeholder:text-tech-gray focus:outline-none focus:border-neon-green/40"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/8">
          {(["all", "active", "idle"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filter === f
                  ? "bg-neon-green/15 text-neon-green"
                  : "text-tech-gray hover:text-white"
              }`}
            >
              {f === "all" ? "Todos" : f === "active" ? "Ativos" : "Inativos"}
            </button>
          ))}
        </div>
      </div>

      {/* grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((agent, i) => {
          const dept = agent.departmentId ? departments.find((d) => d.id === agent.departmentId) : null;
          const agentTasks = tasks.filter((t) => t.assignedTo === agent.id);
          const activeTask = agentTasks.find((t) => t.status === "in_progress");
          const parent = agent.parentId ? agents.find((a) => a.id === agent.parentId) : null;

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="group p-5 rounded-2xl glass border border-white/8 hover:border-white/15 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl glass flex items-center justify-center text-xl">
                    <span className={ACCENT_TEXT[agent.accent] ?? "text-white"}>{agent.emoji}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{agent.name}</div>
                    <div className="text-[10px] text-tech-gray">
                      {ROLE_LABEL[agent.role] ?? agent.role}
                      {parent && ` · responde a ${parent.name}`}
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <button
                    className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-tech-gray"
                    aria-label="ações"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* status */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-neon-green/10 border border-neon-green/20 text-[10px] font-mono text-neon-green">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    agent.status === "working" ? "bg-[#b6ff3d]" : agent.status === "thinking" ? "bg-[#00E0FF]" : "bg-neon-green"
                  } animate-blink-status`} />
                  {agent.status === "working" ? "Trabalhando" : agent.status === "thinking" ? "Pensando" : agent.status === "idle" ? "Ocioso" : "Ativo"}
                </span>
                {dept && (
                  <span className="text-[10px] text-tech-gray font-mono">
                    {dept.emoji} {dept.name}
                  </span>
                )}
              </div>

              {/* active task */}
              {activeTask && (
                <div className="mb-3 p-2.5 rounded-lg bg-[#b6ff3d]/5 border border-[#b6ff3d]/20">
                  <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase text-[#b6ff3d] mb-1">
                    <Zap className="w-2.5 h-2.5" /> Tarefa ativa
                  </div>
                  <div className="text-xs text-white truncate">{activeTask.title}</div>
                </div>
              )}

              {/* metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-2.5 rounded-lg bg-black/30">
                  <div className="text-[10px] text-tech-gray uppercase">Especialidade</div>
                  <div className="text-xs font-medium text-white">{agent.specialty}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-black/30">
                  <div className="text-[10px] text-tech-gray uppercase">Modelo</div>
                  <div className={`text-xs font-bold font-mono ${ACCENT_TEXT[agent.accent] ?? "text-white"}`}>
                    {agent.model}
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-black/30">
                  <div className="text-[10px] text-tech-gray uppercase">Tarefas concluídas</div>
                  <div className="text-lg font-bold text-white font-mono">{agent.tasksCompleted}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-black/30">
                  <div className="text-[10px] text-tech-gray uppercase">Tarefas ativas</div>
                  <div className="text-lg font-bold text-[#b6ff3d] font-mono">
                    {agentTasks.filter((t) => t.status === "in_progress").length}
                  </div>
                </div>
              </div>

              {/* actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                <button
                  onClick={() => toggleAgentStatus(agent.id)}
                  className="flex-1 py-1.5 rounded-md text-xs bg-white/5 border border-white/8 text-white hover:bg-white/10 flex items-center justify-center gap-1.5"
                >
                  {agent.status === "active" || agent.status === "working" ? (
                    <><Pause className="w-3 h-3" /> Pausar</>
                  ) : (
                    <><Play className="w-3 h-3" /> Iniciar</>
                  )}
                </button>
                <button
                  onClick={() => setEditingAgentId(agent.id)}
                  className="px-2.5 py-1.5 rounded-md text-xs bg-white/5 border border-white/8 text-tech-gray hover:text-neon-green hover:border-neon-green/30"
                  aria-label="editar agente"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                {agent.role !== "ceo" && (
                  <button
                    onClick={() => handleDelete(agent.id)}
                    className="px-2.5 py-1.5 rounded-md text-xs bg-white/5 border border-white/8 text-tech-gray hover:text-red-400"
                    aria-label="excluir agente"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <Bot className="w-12 h-12 mx-auto text-tech-gray/30 mb-3" />
          <p className="text-sm text-tech-gray">Nenhum agente encontrado.</p>
          <button onClick={onCreate} className="mt-4 btn-pill btn-primary-neon text-sm">
            <Plus className="w-4 h-4" /> Criar primeiro agente
          </button>
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingAgent && (
          <EditAgentModal
            agent={editingAgent}
            departments={departments}
            onClose={() => setEditingAgentId(null)}
            onSave={(partial) => {
              updateAgent(editingAgent.id, partial);
              setEditingAgentId(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// === Edit Agent Modal ===

interface EditModalProps {
  agent: Agent;
  departments: ReturnType<typeof useLovonStore.getState>["departments"];
  onClose: () => void;
  onSave: (partial: Partial<Agent>) => void;
}

function EditAgentModal({ agent, departments, onClose, onSave }: EditModalProps) {
  const [name, setName] = useState(agent.name);
  const [specialty, setSpecialty] = useState(agent.specialty);
  const [model, setModel] = useState(agent.model);
  const [emoji, setEmoji] = useState(agent.emoji);
  const [accent, setAccent] = useState<Accent>(agent.accent);
  const [status, setStatus] = useState<AgentStatus>(agent.status);
  const [departmentId, setDepartmentId] = useState<string>(agent.departmentId ?? "");

  const handleSave = () => {
    onSave({
      name: name.trim() || agent.name,
      specialty: specialty.trim() || agent.specialty,
      model: model.trim() || agent.model,
      emoji,
      accent,
      status,
      departmentId: departmentId || null,
    });
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
        {/* header */}
        <div className="flex items-start justify-between p-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl glass flex items-center justify-center text-xl">
              <span className={ACCENT_TEXT[agent.accent] ?? "text-white"}>{emoji}</span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-white font-serif-display">Editar agente</h3>
              <p className="text-xs text-tech-gray">{ROLE_LABEL[agent.role] ?? agent.role}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-tech-gray hover:text-white shrink-0 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto p-5 no-scrollbar space-y-4">
          {/* name */}
          <div>
            <label className="text-xs font-medium text-tech-gray mb-1.5 block">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/8 text-sm text-white focus:outline-none focus:border-neon-green/40"
            />
          </div>

          {/* specialty */}
          <div>
            <label className="text-xs font-medium text-tech-gray mb-1.5 block">Especialidade</label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/8 text-sm text-white focus:outline-none focus:border-neon-green/40"
            />
          </div>

          {/* model */}
          <div>
            <label className="text-xs font-medium text-tech-gray mb-1.5 block">Modelo de IA</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="ex: Claude Sonnet 4, Gemini Flash, GPT-4.1"
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/8 text-sm text-white focus:outline-none focus:border-neon-green/40"
            />
          </div>

          {/* department */}
          <div>
            <label className="text-xs font-medium text-tech-gray mb-1.5 block">Departamento</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDepartmentId("")}
                className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                  departmentId === "" ? "border-neon-green/40 bg-neon-green/10 text-white" : "border-white/8 text-tech-gray hover:border-white/15"
                }`}
              >
                <Users className="w-3.5 h-3.5 mb-1 opacity-50" />
                Sem dept
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

          {/* status */}
          <div>
            <label className="text-xs font-medium text-tech-gray mb-1.5 block">Status</label>
            <div className="grid grid-cols-4 gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStatus(s.id)}
                  className={`py-2 rounded-lg border text-xs font-medium transition-all ${
                    status === s.id
                      ? "border-neon-green/40 bg-neon-green/10 text-neon-green"
                      : "border-white/8 text-tech-gray hover:text-white"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* accent */}
          <div>
            <label className="text-xs font-medium text-tech-gray mb-1.5 block">Cor de destaque</label>
            <div className="flex items-center gap-2">
              {ACCENT_OPTIONS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAccent(a.id)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    accent === a.id ? "border-white scale-110" : "border-transparent opacity-50 hover:opacity-100"
                  }`}
                  style={{ background: a.color }}
                  aria-label={a.label}
                />
              ))}
            </div>
          </div>

          {/* emoji */}
          <div>
            <label className="text-xs font-medium text-tech-gray mb-1.5 block">Avatar</label>
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
        </div>

        {/* footer */}
        <div className="p-4 border-t border-white/8 flex items-center justify-between">
          <span className="text-[10px] font-mono text-tech-gray">
            Editando {agent.name}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-tech-gray hover:text-white"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="btn-pill btn-primary-neon text-xs"
            >
              <Check className="w-3.5 h-3.5" /> Salvar alterações
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
