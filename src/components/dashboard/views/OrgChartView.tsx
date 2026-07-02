"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  Building2,
  Crown,
  Bot,
  Zap,
  ChevronDown,
  ChevronRight,
  Users,
  ListTodo,
  FileText,
  X,
  Download,
  Search,
  Filter,
  RefreshCw,
  GripVertical,
} from "lucide-react";
import { useLovonStore, Agent, Task } from "@/lib/lovon/store";
import { DEPARTMENT_TEMPLATES } from "@/lib/lovon/data";

type View = "command" | "overview" | "ceo" | "company" | "orgchart" | "tasks" | "activity" | "agents" | "create" | "market" | "routing" | "analytics" | "settings" | "audit";

interface Props {
  onNavigate: (v: View) => void;
}

const ACCENT_TEXT: Record<string, string> = {
  green: "text-beige",
  blue: "text-neon-blue",
  purple: "text-neon-purple",
  acid: "text-[#b6ff3d]",
  orange: "text-[#ff8a3d]",
};

const ACCENT_BORDER: Record<string, string> = {
  green: "border-beige/30",
  blue: "border-neon-blue/30",
  purple: "border-[#a855f7]/30",
  acid: "border-[#b6ff3d]/30",
  orange: "border-[#ff8a3d]/30",
};

const ACCENT_BG: Record<string, string> = {
  green: "bg-beige/10",
  blue: "bg-neon-blue/10",
  purple: "bg-[#a855f7]/10",
  acid: "bg-[#b6ff3d]/10",
  orange: "bg-[#ff8a3d]/10",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  idle: "Ocioso",
  working: "Trabalhando",
  thinking: "Pensando",
};

const TASK_STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: "Pendente", color: "text-violet-muted", bg: "bg-white/5", border: "border-white/10" },
  in_progress: { label: "Em execução", color: "text-[#b6ff3d]", bg: "bg-[#b6ff3d]/10", border: "border-[#b6ff3d]/30" },
  delegated: { label: "Delegada", color: "text-neon-blue", bg: "bg-neon-blue/10", border: "border-neon-blue/30" },
  completed: { label: "Concluída", color: "text-beige", bg: "bg-beige/10", border: "border-beige/30" },
  failed: { label: "Falhou", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30" },
};

export function OrgChartView({ onNavigate }: Props) {
  const agents = useLovonStore((s) => s.agents);
  const departments = useLovonStore((s) => s.departments);
  const tasks = useLovonStore((s) => s.tasks);
  const moveAgentToDepartment = useLovonStore((s) => s.moveAgentToDepartment);
  const reassignTask = useLovonStore((s) => s.reassignTask);
  const hireWorker = useLovonStore((s) => s.hireWorker);
  const autoArchiveIdleWorkers = useLovonStore((s) => s.autoArchiveIdleWorkers);
  const getHeadcountStats = useLovonStore((s) => s.getHeadcountStats);
  const workspacePolicy = useLovonStore((s) => s.workspacePolicy);

  const [expandedDept, setExpandedDept] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [reassignTaskId, setReassignTaskId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "idle" | "working" | "thinking">("all");
  const [filterDept, setFilterDept] = useState<string>("all");
  const [showCoreOnly, setShowCoreOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [hireResult, setHireResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const orgRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const ceo = agents.find((a) => a.role === "ceo");
  const regularDepts = departments.filter((d) => d.id !== "executive");
  const topLevelTasks = tasks.filter((t) => !t.parentTaskId);
  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) ?? null : null;
  const reassigningTask = reassignTaskId ? tasks.find((t) => t.id === reassignTaskId) ?? null : null;

  // Filter agents
  const filterAgent = (agent: Agent): boolean => {
    if (agent.role === "ceo") return true; // always show CEO
    // P0 — Dynamic hiring: hide archived workers unless showArchived is on
    if (agent.isArchived && !showArchived) return false;
    // P0 — Dynamic hiring: show only core team (CEO + Leads) when showCoreOnly is on
    if (showCoreOnly && agent.role === "worker" && !agent.isAutoHired) {
      // Keep Email Agent (core worker) even in core-only mode
      // But hide dynamically hired workers
    }
    if (showCoreOnly && agent.isAutoHired) return false;
    if (filterStatus !== "all" && agent.status !== filterStatus) return false;
    if (filterDept !== "all" && agent.departmentId !== filterDept) return false;
    if (search) {
      const lower = search.toLowerCase();
      if (!agent.name.toLowerCase().includes(lower) && !agent.specialty.toLowerCase().includes(lower)) {
        return false;
      }
    }
    return true;
  };

  const visibleAgents = agents.filter(filterAgent);

  const getAgentsInTask = (task: Task): Agent[] => {
    const involved = new Set<string>();
    const result: Agent[] = [];
    if (task.createdBy) involved.add(task.createdBy);
    if (task.assignedTo) involved.add(task.assignedTo);
    const subtasks = tasks.filter((t) => t.parentTaskId === task.id);
    for (const sub of subtasks) {
      if (sub.assignedTo) involved.add(sub.assignedTo);
      if (sub.createdBy) involved.add(sub.createdBy);
    }
    for (const id of involved) {
      const agent = agents.find((a) => a.id === id);
      if (agent && !result.find((a) => a.id === agent.id)) {
        result.push(agent);
      }
    }
    return result;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null);
    const { active, over } = event;
    if (!over) return;
    const agentId = active.id as string;
    const targetDeptId = over.id as string;

    // targetDeptId can be "no-dept" or a department id
    const agent = agents.find((a) => a.id === agentId);
    if (!agent || agent.role === "ceo") return;

    const newDeptId = targetDeptId === "no-dept" ? null : targetDeptId;
    if (agent.departmentId === newDeptId) return; // no change

    moveAgentToDepartment(agentId, newDeptId);
  };

  const exportPNG = async () => {
    if (!orgRef.current) return;
    try {
      // Use html2canvas-like approach via dom-to-image alternative
      // Since we can't install new packages, we'll create a downloadable SVG snapshot
      const svg = generateOrgSVG();
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `organograma-lovon-teams-${new Date().toISOString().slice(0, 10)}.svg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const generateOrgSVG = (): string => {
    const lines: string[] = [];
    lines.push(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${200 + regularDepts.length * 180}" viewBox="0 0 1200 ${200 + regularDepts.length * 180}">`);
    lines.push(`<rect width="100%" height="100%" fill="#1D1127"/>`);
    lines.push(`<text x="600" y="40" text-anchor="middle" fill="#F8F4E9" font-family="Georgia, serif" font-size="24" font-weight="bold">Lovon Teams — Organograma</text>`);
    lines.push(`<text x="600" y="65" text-anchor="middle" fill="#A88BA8" font-family="sans-serif" font-size="12">Exportado em ${new Date().toLocaleString("pt-BR")}</text>`);

    // CEO
    if (ceo) {
      lines.push(`<rect x="500" y="90" width="200" height="60" rx="12" fill="#2D1A3A" stroke="#F6DBC0" stroke-width="2"/>`);
      lines.push(`<text x="600" y="115" text-anchor="middle" fill="#F6DBC0" font-family="sans-serif" font-size="10">CEO</text>`);
      lines.push(`<text x="600" y="135" text-anchor="middle" fill="#F8F4E9" font-family="sans-serif" font-size="14" font-weight="bold">${escapeXml(ceo.name)}</text>`);
    }

    // Departments
    regularDepts.forEach((dept, i) => {
      const y = 180 + i * 160;
      const head = dept.headId ? agents.find((a) => a.id === dept.headId) : null;
      const members = agents.filter((a) => a.departmentId === dept.id && a.role === "worker");
      lines.push(`<rect x="50" y="${y}" width="1100" height="${100 + members.length * 22}" rx="12" fill="#170D25" stroke="rgba(248,244,233,0.08)" stroke-width="1"/>`);
      lines.push(`<text x="70" y="${y + 25}" fill="#F6DBC0" font-family="sans-serif" font-size="14" font-weight="bold">${escapeXml(dept.emoji + " " + dept.name)}</text>`);
      lines.push(`<text x="70" y="${y + 42}" fill="#A88BA8" font-family="sans-serif" font-size="10">${dept.agentIds.length} agente(s)</text>`);
      if (head) {
        lines.push(`<text x="70" y="${y + 65}" fill="#F8F4E9" font-family="sans-serif" font-size="11">Líder: ${escapeXml(head.name)} — ${escapeXml(head.specialty)}</text>`);
      }
      members.forEach((m, j) => {
        lines.push(`<text x="90" y="${y + 85 + j * 22}" fill="#A88BA8" font-family="sans-serif" font-size="10">• ${escapeXml(m.name)} — ${escapeXml(m.specialty)} [${STATUS_LABEL[m.status]}]</text>`);
      });
    });

    lines.push(`</svg>`);
    return lines.join("\n");
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-beige" />
            <h1 className="text-2xl sm:text-3xl font-bold text-cream font-serif-display">Organograma</h1>
          </div>
          <p className="text-sm text-violet-muted max-w-2xl">
            Hierarquia de agentes e departamentos. Arraste agentes entre departamentos, clique nas tarefas para reatribuir, filtre por status ou departamento.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportPNG}
            className="btn-pill btn-secondary-neon text-xs"
          >
            <Download className="w-3.5 h-3.5" /> Exportar
          </button>
          <button
            onClick={() => onNavigate("audit")}
            className="btn-pill btn-secondary-neon text-xs"
          >
            Histórico
          </button>
        </div>
      </div>

      {/* === Headcount Stats Panel (P0 — Dynamic Hiring) === */}
      {(() => {
        const stats = getHeadcountStats();
        const headcountPct = Math.round((stats.totalActive / stats.limits.maxAgentsTotal) * 100);
        const autoHirePct = Math.round((stats.autoHiresToday / stats.limits.maxAutoHiresPerDay) * 100);
        return (
          <div className="p-4 rounded-2xl glass border border-violet-subtle">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[10px] font-mono uppercase text-violet-muted">Headcount & Auto-hire</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const result = autoArchiveIdleWorkers();
                    setHireResult({
                      ok: true,
                      msg: result.archivedCount > 0
                        ? `${result.archivedCount} worker(s) arquivado(s) por inatividade.`
                        : "Nenhum worker ocioso para arquivar.",
                    });
                    setTimeout(() => setHireResult(null), 4000);
                  }}
                  className="text-[10px] px-2 py-1 rounded-md bg-white/5 border border-violet-subtle text-violet-muted hover:text-cream flex items-center gap-1"
                >
                  <RefreshCw className="w-2.5 h-2.5" /> Arquivar ociosos
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Total headcount */}
              <div className="p-3 rounded-lg bg-violet-bg/40 border border-violet-subtle">
                <div className="text-[9px] font-mono uppercase text-violet-muted mb-1">Agentes ativos</div>
                <div className={`text-xl font-bold ${headcountPct >= 90 ? "text-red-400" : headcountPct >= 70 ? "text-[#ff8a3d]" : "text-cream"}`}>
                  {stats.totalActive}<span className="text-sm text-violet-muted">/{stats.limits.maxAgentsTotal}</span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full ${headcountPct >= 90 ? "bg-red-400" : headcountPct >= 70 ? "bg-[#ff8a3d]" : "bg-neon-green"}`}
                    style={{ width: `${Math.min(headcountPct, 100)}%` }}
                  />
                </div>
              </div>
              {/* Auto-hires today */}
              <div className="p-3 rounded-lg bg-violet-bg/40 border border-violet-subtle">
                <div className="text-[9px] font-mono uppercase text-violet-muted mb-1">Auto-hires hoje</div>
                <div className={`text-xl font-bold ${autoHirePct >= 100 ? "text-red-400" : "text-cream"}`}>
                  {stats.autoHiresToday}<span className="text-sm text-violet-muted">/{stats.limits.maxAutoHiresPerDay}</span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full ${autoHirePct >= 100 ? "bg-red-400" : "bg-neon-blue"}`}
                    style={{ width: `${Math.min(autoHirePct, 100)}%` }}
                  />
                </div>
              </div>
              {/* Archived */}
              <div className="p-3 rounded-lg bg-violet-bg/40 border border-violet-subtle">
                <div className="text-[9px] font-mono uppercase text-violet-muted mb-1">Arquivados</div>
                <div className="text-xl font-bold text-violet-muted">{stats.totalArchived}</div>
                <div className="text-[9px] text-violet-muted mt-1">ociosos {stats.limits.idleWorkerArchiveDays}+ dias</div>
              </div>
              {/* Workers per dept */}
              <div className="p-3 rounded-lg bg-violet-bg/40 border border-violet-subtle">
                <div className="text-[9px] font-mono uppercase text-violet-muted mb-1">Máx workers/dept</div>
                <div className="text-xl font-bold text-cream">{stats.limits.maxWorkersPerDept}</div>
                <div className="text-[9px] text-violet-muted mt-1">limite por departamento</div>
              </div>
            </div>
            {/* Department breakdown */}
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {Object.entries(stats.byDepartment).map(([dept, counts]) => (
                <span key={dept} className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-violet-subtle text-violet-muted">
                  {dept}: <span className="text-cream">{counts.active}</span>{counts.archived > 0 && <span className="text-violet-muted/70"> (+{counts.archived} arch)</span>}
                </span>
              ))}
            </div>
            {/* Hire result feedback */}
            {hireResult && (
              <div className={`mt-3 p-2 rounded-lg text-xs ${hireResult.ok ? "bg-neon-green/10 border border-neon-green/30 text-neon-green" : "bg-[#ff8a3d]/10 border border-[#ff8a3d]/30 text-[#ff8a3d]"}`}>
                {hireResult.msg}
              </div>
            )}
          </div>
        );
      })()}

      {/* Core team filter + archived toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex items-center gap-2 text-xs text-violet-muted cursor-pointer">
          <input type="checkbox" checked={showCoreOnly} onChange={(e) => setShowCoreOnly(e.target.checked)} className="accent-beige" />
          Mostrar apenas core team
        </label>
        <label className="flex items-center gap-2 text-xs text-violet-muted cursor-pointer">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="accent-beige" />
          Mostrar arquivados
        </label>
      </div>

      {/* filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-muted" />
          <input
            type="text"
            placeholder="Buscar agente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream placeholder:text-violet-muted focus:outline-none focus:border-beige/30"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
          className="px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
        >
          <option value="all">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="working">Trabalhando</option>
          <option value="thinking">Pensando</option>
          <option value="idle">Ociosos</option>
        </select>
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
        >
          <option value="all">Todos os departamentos</option>
          {regularDepts.map((d) => (
            <option key={d.id} value={d.id}>{d.emoji} {d.name}</option>
          ))}
        </select>
        {(search || filterStatus !== "all" || filterDept !== "all") && (
          <button
            onClick={() => { setSearch(""); setFilterStatus("all"); setFilterDept("all"); }}
            className="px-3 py-2 rounded-lg text-xs text-violet-muted hover:text-cream flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Limpar
          </button>
        )}
      </div>

      {/* DnD context */}
      {agents.length === 0 ? (
        <div className="text-center py-16">
          <Bot className="w-12 h-12 mx-auto text-violet-muted/30 mb-3" />
          <p className="text-sm text-violet-muted">Nenhum agente criado ainda.</p>
          <button onClick={() => onNavigate("ceo")} className="mt-4 btn-pill btn-primary-neon text-sm">
            <Crown className="w-4 h-4" /> Abrir Console do CEO
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div ref={orgRef} className="space-y-4">
            {/* CEO node */}
            {ceo && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center"
              >
                <AgentNode agent={ceo} ceo activeTask={tasks.find((t) => t.assignedTo === ceo.id && t.status === "in_progress")} />
                {regularDepts.length > 0 && (
                  <div className="w-px h-8 bg-violet-border-strong" />
                )}
              </motion.div>
            )}

            {/* Departments grid — each is a droppable zone */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {regularDepts.map((dept) => {
                const head = dept.headId ? agents.find((a) => a.id === dept.headId) : null;
                const members = agents.filter((a) => a.departmentId === dept.id && a.role === "worker");
                const visibleMembers = members.filter((m) => visibleAgents.includes(m));
                const deptTasks = tasks.filter((t) => t.departmentId === dept.id);
                const completed = deptTasks.filter((t) => t.status === "completed").length;
                const template = DEPARTMENT_TEMPLATES.find((d) => d.id === dept.id);
                const accent = template?.accent ?? "blue";
                const isExpanded = expandedDept === dept.id;
                const isOver = activeDragId !== null;

                return (
                  <DroppableDeptCard
                    key={dept.id}
                    deptId={dept.id}
                    dept={dept}
                    accent={accent}
                    isExpanded={isExpanded}
                    isOver={isOver}
                    onToggle={() => setExpandedDept(isExpanded ? null : dept.id)}
                    head={head}
                    visibleMembers={visibleMembers}
                    allMembers={members}
                    deptTasks={deptTasks}
                    completed={completed}
                    agents={agents}
                    onSelectTask={(id) => setSelectedTaskId(id)}
                    onReassignTask={(id) => setReassignTaskId(id)}
                  />
                );
              })}

              {/* "No department" drop zone */}
              <DroppableNoDept
                agents={agents}
                visibleAgents={visibleAgents}
                onSelectTask={() => {}}
              />
            </div>
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            {activeDragId ? (
              <div className="px-3 py-2 rounded-lg glass-strong border border-beige/40 flex items-center gap-2 shadow-2xl">
                {(() => {
                  const agent = agents.find((a) => a.id === activeDragId);
                  if (!agent) return null;
                  return (
                    <>
                      <span className={`text-sm ${ACCENT_TEXT[agent.accent] ?? "text-cream"}`}>{agent.emoji}</span>
                      <span className="text-xs text-cream font-medium">{agent.name}</span>
                    </>
                  );
                })()}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Tasks + involved agents section */}
      {topLevelTasks.length > 0 && (
        <div className="p-5 rounded-2xl glass border border-violet-subtle">
          <div className="flex items-center gap-2 mb-4">
            <ListTodo className="w-4 h-4 text-beige" />
            <h3 className="text-sm font-semibold text-cream">Agentes envolvidos por tarefa</h3>
            <span className="text-[10px] font-mono text-violet-muted">
              {topLevelTasks.length} {topLevelTasks.length === 1 ? "missão" : "missões"}
            </span>
          </div>
          <div className="space-y-3">
            {topLevelTasks.map((task) => {
              const involvedAgents = getAgentsInTask(task);
              const subtasks = tasks.filter((t) => t.parentTaskId === task.id);
              const meta = TASK_STATUS_META[task.status] ?? TASK_STATUS_META.pending;

              return (
                <div key={task.id} className="p-4 rounded-xl bg-violet-bg/30 border border-violet-subtle">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${meta.bg} ${meta.color} border ${meta.border}`}>
                          {meta.label}
                        </span>
                        <span className="text-[9px] font-mono text-violet-muted">
                          {subtasks.length} {subtasks.length === 1 ? "subtarefa" : "subtarefas"}
                        </span>
                        {task.result && (
                          <button
                            onClick={() => setSelectedTaskId(task.id)}
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-beige/10 text-beige border border-beige/30 hover:bg-beige/20 flex items-center gap-1"
                          >
                            <FileText className="w-2.5 h-2.5" /> Ver conclusão
                          </button>
                        )}
                      </div>
                      <div className="text-sm font-medium text-cream">{task.title}</div>
                    </div>
                  </div>

                  {/* involved agents */}
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-[9px] font-mono uppercase text-violet-muted flex items-center gap-1">
                      <Users className="w-3 h-3" /> Envolvidos:
                    </span>
                    {involvedAgents.length === 0 && (
                      <span className="text-[10px] text-violet-muted italic">Nenhum agente atribuído</span>
                    )}
                    {involvedAgents.map((agent) => (
                      <div key={agent.id} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-violet-dark/40 border border-violet-subtle">
                        <span className={`text-xs ${ACCENT_TEXT[agent.accent] ?? "text-cream"}`}>{agent.emoji}</span>
                        <span className="text-[10px] text-cream">{agent.name}</span>
                        <span className={`w-1 h-1 rounded-full ${
                          agent.status === "working" ? "bg-[#b6ff3d]" :
                          agent.status === "thinking" ? "bg-[#00E0FF]" :
                          "bg-violet-muted"
                        }`} />
                      </div>
                    ))}
                  </div>

                  {/* subtasks with assignees + reassign button */}
                  {subtasks.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-violet-subtle space-y-1.5">
                      {subtasks.map((sub) => {
                        const subMeta = TASK_STATUS_META[sub.status] ?? TASK_STATUS_META.pending;
                        const subAssignee = sub.assignedTo ? agents.find((a) => a.id === sub.assignedTo) : null;
                        return (
                          <div key={sub.id} className="flex items-center gap-2 p-2 rounded-lg bg-violet-bg/40 group">
                            <span className={`text-[8px] font-mono uppercase px-1 py-0.5 rounded ${subMeta.bg} ${subMeta.color} border ${subMeta.border} shrink-0`}>
                              {subMeta.label}
                            </span>
                            <span className="text-[11px] text-cream flex-1 truncate">{sub.title}</span>
                            {subAssignee && (
                              <span className={`text-[9px] font-mono ${ACCENT_TEXT[subAssignee.accent] ?? "text-cream"} shrink-0`}>
                                {subAssignee.emoji} {subAssignee.name}
                              </span>
                            )}
                            <button
                              onClick={() => setReassignTaskId(sub.id)}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/8 text-violet-muted hover:text-beige hover:border-beige/30 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                            >
                              Reatribuir
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task detail modal */}
      <AnimatePresence>
        {selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            agents={agents}
            tasks={tasks}
            onClose={() => setSelectedTaskId(null)}
          />
        )}
      </AnimatePresence>

      {/* Reassign modal */}
      <AnimatePresence>
        {reassigningTask && (
          <ReassignModal
            task={reassigningTask}
            agents={agents}
            onClose={() => setReassignTaskId(null)}
            onReassign={(agentId) => {
              reassignTask(reassigningTask.id, agentId);
              setReassignTaskId(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// === Droppable Department Card ===

function DroppableDeptCard({
  deptId,
  dept,
  accent,
  isExpanded,
  isOver,
  onToggle,
  head,
  visibleMembers,
  allMembers,
  deptTasks,
  completed,
  agents,
  onSelectTask,
  onReassignTask,
}: {
  deptId: string;
  dept: ReturnType<typeof useLovonStore.getState>["departments"][0];
  accent: string;
  isExpanded: boolean;
  isOver: boolean;
  onToggle: () => void;
  head: Agent | null | undefined;
  visibleMembers: Agent[];
  allMembers: Agent[];
  deptTasks: Task[];
  completed: number;
  agents: Agent[];
  onSelectTask: (id: string) => void;
  onReassignTask: (id: string) => void;
}) {
  const { setNodeRef, isOver: isOverDrop } = useDroppable({ id: deptId });
  const showHighlight = isOver && (isOverDrop || true);

  return (
    <div
      ref={setNodeRef}
      className={`p-4 rounded-xl glass border transition-all ${
        showHighlight
          ? "border-beige/50 bg-beige/5 scale-[1.02]"
          : `${ACCENT_BORDER[accent] ?? "border-violet-subtle"}`
      }`}
    >
      {/* dept header */}
      <button onClick={onToggle} className="w-full flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{dept.emoji}</span>
          <span className="text-sm font-semibold text-cream">{dept.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-violet-muted">
            {allMembers.length + (head ? 1 : 0)} ag · {completed} tasks
          </span>
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-violet-muted" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-violet-muted" />
          )}
        </div>
      </button>

      {/* head */}
      {head ? (
        <div className="mb-2">
          <DraggableAgent agent={head} compact showGrip={false} activeTask={undefined} />
        </div>
      ) : (
        <div className="p-2 rounded-lg bg-violet-bg/30 border border-dashed border-violet-subtle mb-2 text-center text-[10px] text-violet-muted">
          Sem líder
        </div>
      )}

      {/* members */}
      {!isExpanded && visibleMembers.length > 0 && (
        <div className="space-y-1">
          {visibleMembers.slice(0, 3).map((m) => (
            <DraggableAgent key={m.id} agent={m} compact showGrip activeTask={undefined} />
          ))}
          {visibleMembers.length > 3 && (
            <div className="text-[9px] font-mono text-violet-muted text-center pt-1">
              +{visibleMembers.length - 3} mais
            </div>
          )}
        </div>
      )}
      {!isExpanded && visibleMembers.length === 0 && allMembers.length === 0 && (
        <div className="p-2 rounded-lg bg-violet-bg/20 border border-dashed border-violet-subtle text-center text-[10px] text-violet-muted">
          Solte agentes aqui
        </div>
      )}

      {/* expanded */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-2 space-y-2"
        >
          {visibleMembers.length === 0 && (
            <div className="text-[10px] text-violet-muted text-center py-2">
              Nenhum operador visível
            </div>
          )}
          {visibleMembers.map((m) => (
            <DraggableAgent key={m.id} agent={m} compact showGrip activeTask={undefined} />
          ))}

          {/* dept tasks */}
          {deptTasks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-violet-subtle">
              <div className="text-[9px] font-mono uppercase text-violet-muted mb-2 flex items-center gap-1">
                <ListTodo className="w-3 h-3" /> Tarefas do departamento
              </div>
              <div className="space-y-1.5">
                {deptTasks.slice(0, 5).map((task) => {
                  const meta = TASK_STATUS_META[task.status] ?? TASK_STATUS_META.pending;
                  const assignee = task.assignedTo ? agents.find((a) => a.id === task.assignedTo) : null;
                  return (
                    <div key={task.id} className="p-2 rounded-lg bg-violet-bg/30 border border-violet-subtle group">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[8px] font-mono uppercase px-1 py-0.5 rounded ${meta.bg} ${meta.color} border ${meta.border}`}>
                          {meta.label}
                        </span>
                        {assignee && (
                          <span className={`text-[9px] ${ACCENT_TEXT[assignee.accent] ?? "text-cream"}`}>
                            {assignee.emoji} {assignee.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <button
                          onClick={() => onSelectTask(task.id)}
                          className="text-[11px] text-cream truncate text-left flex-1 hover:text-beige"
                        >
                          {task.title}
                        </button>
                        <button
                          onClick={() => onReassignTask(task.id)}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 border border-white/8 text-violet-muted hover:text-beige hover:border-beige/30 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                        >
                          Reatribuir
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// === Droppable "No Department" zone ===

function DroppableNoDept({
  agents,
  visibleAgents,
  onSelectTask,
}: {
  agents: Agent[];
  visibleAgents: Agent[];
  onSelectTask: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "no-dept" });
  const noDeptAgents = visibleAgents.filter((a) => a.role !== "ceo" && !a.departmentId);

  if (noDeptAgents.length === 0 && !isOver) return null;

  return (
    <div
      ref={setNodeRef}
      className={`p-4 rounded-xl border border-dashed transition-all ${
        isOver
          ? "border-beige/50 bg-beige/5"
          : "border-violet-subtle bg-violet-bg/20"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-violet-muted">Sem departamento</span>
        <span className="text-[9px] font-mono text-violet-muted">{noDeptAgents.length} ag</span>
      </div>
      <div className="space-y-1">
        {noDeptAgents.map((m) => (
          <DraggableAgent key={m.id} agent={m} compact showGrip activeTask={undefined} />
        ))}
        {noDeptAgents.length === 0 && isOver && (
          <div className="text-[10px] text-beige text-center py-2">Solte aqui</div>
        )}
      </div>
    </div>
  );
}

// === Draggable Agent ===

function DraggableAgent({
  agent,
  compact,
  showGrip,
  activeTask,
}: {
  agent: Agent;
  ceo?: boolean;
  compact?: boolean;
  showGrip?: boolean;
  activeTask?: Task | undefined;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: agent.id });
  const canDrag = agent.role !== "ceo";

  return (
    <div
      ref={canDrag ? setNodeRef : undefined}
      {...(canDrag ? attributes : {})}
      {...(canDrag ? listeners : {})}
      className={`flex items-center gap-2.5 p-2 rounded-lg bg-violet-bg/40 border border-violet-subtle ${
        canDrag ? "cursor-grab active:cursor-grabbing hover:border-violet-strong" : ""
      } ${isDragging ? "opacity-40" : ""}`}
    >
      {showGrip && canDrag && (
        <GripVertical className="w-3 h-3 text-violet-muted/50 shrink-0" />
      )}
      <div className={`w-8 h-8 rounded-lg ${ACCENT_BG[agent.accent] ?? "bg-white/5"} border ${ACCENT_BORDER[agent.accent] ?? "border-white/10"} flex items-center justify-center shrink-0`}>
        <span className={`text-sm ${ACCENT_TEXT[agent.accent] ?? "text-cream"}`}>{agent.emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-cream truncate">{agent.name}</div>
        <div className="text-[9px] text-violet-muted truncate">
          {agent.specialty}
          {activeTask && <span className="text-[#b6ff3d]"> · {activeTask.title.slice(0, 30)}</span>}
        </div>
      </div>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
        agent.status === "working" ? "bg-[#b6ff3d] animate-blink-status" :
        agent.status === "thinking" ? "bg-[#00E0FF] animate-blink-status" :
        "bg-violet-muted"
      }`} />
    </div>
  );
}

// === Agent Node (CEO) ===

function AgentNode({
  agent,
  ceo,
  activeTask,
}: {
  agent: Agent;
  ceo?: boolean;
  compact?: boolean;
  activeTask?: Task;
}) {
  if (ceo) {
    return (
      <div className="relative p-4 rounded-2xl glass-strong border-2 border-beige/30 w-72">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cream flex items-center justify-center">
            <Crown className="w-6 h-6 text-violet-bg" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-beige">CEO</div>
            <div className="text-sm font-semibold text-cream">{agent.name}</div>
            <div className="text-[10px] text-violet-muted">{agent.model}</div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${
            agent.status === "working" ? "bg-[#b6ff3d]" :
            agent.status === "thinking" ? "bg-[#00E0FF]" :
            "bg-beige"
          } animate-blink-status`} />
          <span className="text-[10px] font-mono uppercase text-violet-muted">
            {STATUS_LABEL[agent.status] ?? agent.status}
          </span>
          {activeTask && (
            <span className="text-[10px] text-cream/80 truncate ml-2">
              · {activeTask.title}
            </span>
          )}
        </div>
      </div>
    );
  }
  return null;
}

// === Reassign Modal ===

function ReassignModal({
  task,
  agents,
  onClose,
  onReassign,
}: {
  task: Task;
  agents: Agent[];
  onClose: () => void;
  onReassign: (agentId: string) => void;
}) {
  const currentAssignee = task.assignedTo ? agents.find((a) => a.id === task.assignedTo) : null;

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
        className="relative w-full max-w-md max-h-[80vh] flex flex-col rounded-2xl glass-strong border border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-start justify-between p-5 border-b border-violet-subtle">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-mono uppercase text-beige mb-1">Reatribuir tarefa</div>
            <h3 className="text-sm font-semibold text-cream">{task.title}</h3>
            {currentAssignee && (
              <p className="text-[10px] text-violet-muted mt-1">
                Responsável atual: {currentAssignee.emoji} {currentAssignee.name}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-violet-muted hover:text-cream shrink-0 ml-3"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* body — agent list */}
        <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
          <div className="text-[10px] font-mono uppercase text-violet-muted mb-2">
            Selecione o novo responsável
          </div>
          <div className="space-y-1.5">
            {agents.filter((a) => a.role !== "ceo").map((agent) => {
              const isCurrent = agent.id === task.assignedTo;
              return (
                <button
                  key={agent.id}
                  onClick={() => onReassign(agent.id)}
                  disabled={isCurrent}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-lg border transition-all text-left ${
                    isCurrent
                      ? "border-beige/30 bg-beige/10 opacity-60 cursor-not-allowed"
                      : "border-violet-subtle bg-violet-bg/30 hover:border-beige/30 hover:bg-violet-bg/50"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${ACCENT_BG[agent.accent] ?? "bg-white/5"} border ${ACCENT_BORDER[agent.accent] ?? "border-white/10"} flex items-center justify-center shrink-0`}>
                    <span className={`text-sm ${ACCENT_TEXT[agent.accent] ?? "text-cream"}`}>{agent.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-cream truncate">{agent.name}</div>
                    <div className="text-[9px] text-violet-muted truncate">{agent.specialty}</div>
                  </div>
                  {isCurrent && (
                    <span className="text-[9px] font-mono text-beige">ATUAL</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* footer */}
        <div className="p-4 border-t border-violet-subtle">
          <button onClick={onClose} className="btn-pill btn-secondary-neon text-xs w-full">
            Cancelar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// === Task Detail Modal ===

function TaskDetailModal({
  task,
  agents,
  tasks,
  onClose,
}: {
  task: Task;
  agents: Agent[];
  tasks: Task[];
  onClose: () => void;
}) {
  const subtasks = tasks.filter((t) => t.parentTaskId === task.id);
  const creator = agents.find((a) => a.id === task.createdBy);
  const assignee = task.assignedTo ? agents.find((a) => a.id === task.assignedTo) : null;
  const meta = TASK_STATUS_META[task.status] ?? TASK_STATUS_META.pending;

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
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl glass-strong border border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-violet-subtle">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded ${meta.bg} ${meta.color} border ${meta.border}`}>
                {meta.label}
              </span>
              <span className="text-[10px] font-mono text-violet-muted">
                {task.result?.length ?? 0} caracteres
              </span>
            </div>
            <h3 className="text-base font-semibold text-cream font-serif-display">{task.title}</h3>
            {task.description && <p className="text-xs text-violet-muted mt-1">{task.description}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-violet-muted hover:text-cream shrink-0 ml-3">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 no-scrollbar space-y-4">
          <div>
            <div className="text-xs font-mono uppercase text-violet-muted mb-2 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Agentes envolvidos
            </div>
            <div className="space-y-2">
              {creator && (
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-violet-bg/40 border border-violet-subtle">
                  <div className={`w-8 h-8 rounded-lg ${ACCENT_BG[creator.accent] ?? "bg-white/5"} border ${ACCENT_BORDER[creator.accent] ?? "border-white/10"} flex items-center justify-center`}>
                    <span className={`text-sm ${ACCENT_TEXT[creator.accent] ?? "text-cream"}`}>{creator.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-cream">{creator.name}</div>
                    <div className="text-[10px] text-violet-muted">Criou a tarefa</div>
                  </div>
                </div>
              )}
              {assignee && assignee.id !== creator?.id && (
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-violet-bg/40 border border-violet-subtle">
                  <div className={`w-8 h-8 rounded-lg ${ACCENT_BG[assignee.accent] ?? "bg-white/5"} border ${ACCENT_BORDER[assignee.accent] ?? "border-white/10"} flex items-center justify-center`}>
                    <span className={`text-sm ${ACCENT_TEXT[assignee.accent] ?? "text-cream"}`}>{assignee.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-cream">{assignee.name}</div>
                    <div className="text-[10px] text-violet-muted">Responsável pela execução</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {subtasks.length > 0 && (
            <div>
              <div className="text-xs font-mono uppercase text-violet-muted mb-2 flex items-center gap-1">
                <ListTodo className="w-3.5 h-3.5" /> Subtarefas ({subtasks.length})
              </div>
              <div className="space-y-1.5">
                {subtasks.map((sub) => {
                  const subMeta = TASK_STATUS_META[sub.status] ?? TASK_STATUS_META.pending;
                  const subAssignee = sub.assignedTo ? agents.find((a) => a.id === sub.assignedTo) : null;
                  return (
                    <div key={sub.id} className="p-2.5 rounded-lg bg-violet-bg/30 border border-violet-subtle">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded ${subMeta.bg} ${subMeta.color} border ${subMeta.border}`}>
                          {subMeta.label}
                        </span>
                        {subAssignee && (
                          <span className={`text-[9px] ${ACCENT_TEXT[subAssignee.accent] ?? "text-cream"}`}>
                            {subAssignee.emoji} {subAssignee.name}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-cream">{sub.title}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {task.result && (
            <div>
              <div className="text-xs font-mono uppercase text-violet-muted mb-2 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Conclusão
              </div>
              <div className="p-3 rounded-lg bg-beige/5 border border-beige/15 text-xs text-cream/90 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto no-scrollbar">
                {task.result}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-violet-subtle flex items-center justify-between">
          <span className="text-[10px] font-mono text-violet-muted">
            {new Date(task.updatedAt).toLocaleString("pt-BR")}
          </span>
          <button onClick={onClose} className="btn-pill btn-secondary-neon text-xs">Fechar</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// === Helpers ===

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
