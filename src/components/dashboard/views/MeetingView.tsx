"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Plus,
  X,
  Send,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sparkles,
  UserPlus,
  StopCircle,
  Target,
  Zap,
} from "lucide-react";
import { useLovonStore, Meeting, MeetingPolicy } from "@/lib/lovon/store";
import { AgentAvatar, BigMetricCard, StatusChip, SectionTitle, ACCENT_COLORS } from "../design-system";

export function MeetingView() {
  const meetings = useLovonStore((s) => s.meetings);
  const agents = useLovonStore((s) => s.agents);
  const companyConfig = useLovonStore((s) => s.companyConfig);
  const knowledgeBase = useLovonStore((s) => s.knowledgeBase);
  const createMeeting = useLovonStore((s) => s.createMeeting);
  const startMeeting = useLovonStore((s) => s.startMeeting);
  const cancelMeeting = useLovonStore((s) => s.cancelMeeting);
  const getActiveMeeting = useLovonStore((s) => s.getActiveMeeting);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const activeMeeting = getActiveMeeting();
  const recentMeetings = meetings.filter((m) => m.status !== "live").slice(0, 5);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-beige" />
            <h1 className="text-2xl sm:text-3xl font-bold text-cream font-serif-display">Modo Reunião</h1>
          </div>
          <p className="text-sm text-violet-muted max-w-2xl">
            Sessão estruturada com o CEO: agenda, context pack automático, chat com opções A/B/C, e outcomes que viram tasks.
            O CEO vira moderador executivo — ele propõe, você decide.
          </p>
        </div>
        {!activeMeeting && (
          <button onClick={() => setShowCreateForm(true)} className="btn-pill btn-primary-neon text-sm">
            <Plus className="w-4 h-4" /> Nova reunião
          </button>
        )}
      </div>

      {/* Active meeting (live) */}
      {activeMeeting ? (
        <LiveMeetingPanel meeting={activeMeeting} />
      ) : (
        <>
          {/* Quick stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <BigMetricCard
              label="Reuniões realizadas"
              value={meetings.filter((m) => m.status === "ended").length}
              accent="green"
              icon={<CheckCircle2 className="w-4 h-4" />}
            />
            <BigMetricCard
              label="Reuniões agendadas"
              value={meetings.filter((m) => m.status === "scheduled").length}
              accent="blue"
              icon={<Clock className="w-4 h-4" />}
            />
            <BigMetricCard
              label="Total de participantes"
              value={meetings.reduce((acc, m) => acc + m.participants.length, 0)}
              accent="cream"
              icon={<Users className="w-4 h-4" />}
            />
            <BigMetricCard
              label="Actions geradas"
              value={meetings.reduce((acc, m) => acc + (m.outcome?.actionItems.length ?? 0), 0)}
              accent="orange"
              icon={<Target className="w-4 h-4" />}
            />
          </div>

          {/* Scheduled meetings (waiting to start) */}
          {meetings.filter((m) => m.status === "scheduled").length > 0 && (
            <div>
              <SectionTitle title="Agendadas" subtitle="Reuniões esperando início" icon={<Clock className="w-4 h-4" />} />
              <div className="space-y-2">
                {meetings.filter((m) => m.status === "scheduled").map((m) => (
                  <ScheduledMeetingRow key={m.id} meeting={m} onStart={() => startMeeting(m.id)} onCancel={() => cancelMeeting(m.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Recent meetings */}
          {recentMeetings.length > 0 && (
            <div>
              <SectionTitle title="Recentes" subtitle="Últimas reuniões encerradas" icon={<CheckCircle2 className="w-4 h-4" />} />
              <div className="space-y-2">
                {recentMeetings.map((m) => (
                  <EndedMeetingRow key={m.id} meeting={m} />
                ))}
              </div>
            </div>
          )}

          {meetings.length === 0 && (
            <div className="text-center py-16">
              <Calendar className="w-12 h-12 mx-auto text-violet-muted/30 mb-3" />
              <p className="text-sm text-violet-muted">Nenhuma reunião ainda.</p>
              <p className="text-xs text-violet-muted/70 mt-1">
                Clique em "Nova reunião" para agendar com o CEO.
              </p>
            </div>
          )}
        </>
      )}

      {/* Create meeting modal */}
      <AnimatePresence>
        {showCreateForm && (
          <CreateMeetingModal
            onClose={() => setShowCreateForm(false)}
            onCreate={(input) => {
              const id = createMeeting(input);
              startMeeting(id); // auto-start for MVP (skip scheduled state)
              setShowCreateForm(false);
            }}
            defaultAutonomy={companyConfig?.autonomyLevel ?? 0}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// === Live meeting panel (chat + sidebar) ===
function LiveMeetingPanel({ meeting }: { meeting: Meeting }) {
  const agents = useLovonStore((s) => s.agents);
  const companyConfig = useLovonStore((s) => s.companyConfig);
  const knowledgeBase = useLovonStore((s) => s.knowledgeBase);
  const postMeetingMessage = useLovonStore((s) => s.postMeetingMessage);
  const inviteAgentToMeeting = useLovonStore((s) => s.inviteAgentToMeeting);
  const endMeeting = useLovonStore((s) => s.endMeeting);
  const cancelMeeting = useLovonStore((s) => s.cancelMeeting);

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ceo = agents.find((a) => a.role === "ceo");
  const guestAgents = meeting.participants.filter((p) => p.role === "guest_expert");
  const availableAgents = agents.filter(
    (a) => a.role !== "ceo" && !meeting.participants.some((p) => p.id === a.id)
  );

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [meeting.messages.length]);

  const handleSend = async () => {
    if (!input.trim() || busy) return;
    const userMessage = input.trim();
    setInput("");
    setBusy(true);

    // Post board message
    postMeetingMessage({
      meetingId: meeting.id,
      sender: { kind: "board", id: "user", name: "Você" },
      content: userMessage,
    });

    // Call CEO LLM to respond
    try {
      const res = await fetch("/api/lovon/meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId: meeting.id,
          meetingTitle: meeting.title,
          meetingObjective: meeting.objective,
          agenda: meeting.agenda,
          contextPack: meeting.contextPack,
          history: meeting.messages.slice(-10).map((m) => ({
            sender: m.sender,
            content: m.content,
            proposedOptions: m.proposedOptions,
          })),
          newUserMessage: userMessage,
          responder: {
            agentName: ceo?.name ?? "CEO",
            agentRole: "ceo",
            specialty: ceo?.specialty ?? "Strategy",
            department: "executive",
            model: ceo?.model,
          },
          companyConfig,
          knowledgeBase,
          isGuestExpert: false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const msgId = postMeetingMessage({
          meetingId: meeting.id,
          sender: { kind: "agent", id: ceo?.id ?? "ceo", name: ceo?.name ?? "CEO" },
          content: data.response,
          proposedOptions: data.parsedOptions,
        });
        if (!msgId) {
          // postMeetingMessage returned null — meeting may have ended or CEO hit a turn limit
          postMeetingMessage({
            meetingId: meeting.id,
            sender: { kind: "agent", id: "system", name: "Sistema" },
            content: `⚠️ Não foi possível postar a resposta do CEO. A reunião pode ter sido encerrada.`,
          });
        }
      } else {
        postMeetingMessage({
          meetingId: meeting.id,
          sender: { kind: "agent", id: "system", name: "Sistema" },
          content: `⚠️ Erro ao consultar CEO: ${data.error ?? "desconhecido"}${data.error?.includes("Company Core") ? "\n\nConfigure o Company Core em Configurações → Empresa antes de iniciar reuniões." : ""}`,
        });
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "erro de rede";
      postMeetingMessage({
        meetingId: meeting.id,
        sender: { kind: "agent", id: "system", name: "Sistema" },
        content: `⚠️ Erro de rede: ${errMsg}`,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleInviteAgent = async (agentId: string, reason: string) => {
    const result = inviteAgentToMeeting(meeting.id, agentId, reason);
    if (!result.ok) {
      alert(result.error);
    } else {
      setShowInvite(false);
    }
  };

  const handleEndMeeting = (createTasks: boolean) => {
    // Build outcome from parsed decisions/action items in the chat
    // (In a real implementation, the CEO would generate these via LLM at end time.
    // For MVP, we extract them from the messages' parsed blocks.)
    const decisions = meeting.messages
      .flatMap((m) => {
        // Look for DECISION: blocks in the content (use [\s\S] instead of /s flag for TS compat)
        const matches = [...m.content.matchAll(/>>>DECISION:\s*([\s\S]+?)\s*<<<END_DECISION/g)];
        return matches.map((match) => ({
          id: `dec-${match[0].slice(0, 8)}`,
          text: match[1].trim(),
          decidedAt: m.createdAt,
          decidedBy: { kind: m.sender.kind, id: m.sender.id, name: m.sender.name } as const,
        }));
      });

    const actionItems: import("@/lib/lovon/store").MeetingActionItem[] = meeting.messages
      .flatMap((m) => {
        const match = m.content.match(/>>>ACTION_ITEMS:\s*\n([\s\S]*?)<<<END_ACTION_ITEMS/);
        if (!match) return [];
        const lines = match[1].split("\n").map((l) => l.trim()).filter(Boolean);
        const items: import("@/lib/lovon/store").MeetingActionItem[] = [];
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lm = line.match(/^-\s*\[([^\]]+)\]\s*(.+)$/);
          if (lm) {
            const owner = lm[1].trim();
            const parts = lm[2].split("|").map((p: string) => p.trim());
            items.push({
              id: `ai-${m.id}-${i}`,
              text: parts[0],
              ownerAgentSlug: owner,
              acceptanceCriteria: parts.slice(1),
              priority: "medium",
            });
          }
        }
        return items;
      });

    const approvalRequests: import("@/lib/lovon/store").MeetingApprovalRequest[] = [];

    endMeeting(meeting.id, {
      meetingId: meeting.id,
      decisions,
      actionItems,
      approvalRequests,
      summary: `Reunião "${meeting.title}" encerrada com ${meeting.messages.length} mensagens.`,
    }, createTasks);

    setShowEndConfirm(false);
  };

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {/* Left: Chat panel (2 cols) */}
      <div className="lg:col-span-2 flex flex-col rounded-2xl glass border border-violet-subtle overflow-hidden" style={{ minHeight: "70vh" }}>
        {/* Chat header */}
        <div className="p-4 border-b border-violet-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-neon-green/10 border border-neon-green/30">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
              <span className="text-[10px] font-mono uppercase text-neon-green">Live</span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-cream">{meeting.title}</h3>
              <p className="text-[10px] text-violet-muted">{meeting.objective}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowInvite(true)}
              className="px-3 py-1.5 rounded-lg text-xs bg-beige/10 border border-beige/30 text-beige hover:bg-beige/20 flex items-center gap-1"
            >
              <UserPlus className="w-3 h-3" /> Convidar
            </button>
            <button
              onClick={() => setShowEndConfirm(true)}
              className="px-3 py-1.5 rounded-lg text-xs bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 flex items-center gap-1"
            >
              <StopCircle className="w-3 h-3" /> Encerrar
            </button>
          </div>
        </div>

        {/* Agenda */}
        <div className="px-4 py-2 bg-violet-bg/30 border-b border-violet-subtle">
          <div className="text-[10px] font-mono uppercase text-violet-muted mb-1">Agenda</div>
          <div className="flex flex-wrap gap-2">
            {meeting.agenda.map((a, i) => (
              <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-white/5 border border-violet-subtle text-cream">
                {i + 1}. {a}
              </span>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
          {/* Context Pack summary (first message) */}
          {meeting.contextPack && (
            <ContextPackSummary pack={meeting.contextPack} />
          )}

          {meeting.messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} ceoName={ceo?.name ?? "CEO"} />
          ))}

          {busy && (
            <div className="flex items-center gap-2 text-xs text-violet-muted">
              <Loader2 className="w-3 h-3 animate-spin" /> CEO está pensando...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-violet-subtle">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Digite sua mensagem para o CEO... (Enter para enviar, Shift+Enter para nova linha)"
              rows={2}
              className="flex-1 px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30 resize-none"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || busy}
              className="btn-pill btn-primary-neon text-sm disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Right: Participants + Context sidebar */}
      <div className="space-y-3">
        {/* Participants */}
        <div className="p-4 rounded-2xl glass border border-violet-subtle">
          <div className="text-[10px] font-mono uppercase text-violet-muted mb-3">Participantes</div>
          <div className="space-y-2">
            {/* Board host */}
            <div className="flex items-center gap-2">
              <AgentAvatar name="Você" accent="green" status="active" size="sm" />
              <div>
                <div className="text-xs font-semibold text-cream">Você (Board)</div>
                <div className="text-[9px] text-violet-muted">Host</div>
              </div>
            </div>
            {/* CEO */}
            {ceo && (
              <div className="flex items-center gap-2">
                <AgentAvatar name={ceo.name} accent={ceo.accent} status={ceo.status} size="sm" emoji={ceo.emoji} />
                <div>
                  <div className="text-xs font-semibold text-cream">{ceo.name}</div>
                  <div className="text-[9px] text-violet-muted">CEO · {meeting.participants.find((p) => p.id === ceo.id)?.messagesPosted ?? 0}/{meeting.policy.maxTurnsPerAgent} msgs</div>
                </div>
              </div>
            )}
            {/* Guest experts */}
            {guestAgents.map((p) => {
              const agent = agents.find((a) => a.id === p.id);
              if (!agent) return null;
              return (
                <div key={p.id} className="flex items-center gap-2">
                  <AgentAvatar name={agent.name} accent={agent.accent} status={agent.status} size="sm" emoji={agent.emoji} />
                  <div>
                    <div className="text-xs font-semibold text-cream">{agent.name}</div>
                    <div className="text-[9px] text-violet-muted">{agent.specialty} · {p.messagesPosted}/{meeting.policy.maxTurnsPerAgent} msgs</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-violet-subtle text-[10px] text-violet-muted">
            Limite: {meeting.policy.maxAgentsInvited} agentes convidados · {meeting.policy.maxTurnsPerAgent} turnos cada
          </div>
        </div>

        {/* Policy */}
        <div className="p-4 rounded-2xl glass border border-violet-subtle">
          <div className="text-[10px] font-mono uppercase text-violet-muted mb-2">Policy</div>
          <div className="space-y-1 text-[11px] text-violet-muted">
            <div>Autonomia: <span className="text-cream">Nível {meeting.policy.autonomyLevel}</span></div>
            {meeting.policy.budgetMaxUsd && (
              <div>Budget máx: <span className="text-cream">$ {meeting.policy.budgetMaxUsd}</span></div>
            )}
            <div>Aprovações externas: <span className="text-cream">{meeting.policy.approvalsRequiredForExternalActions ? "Obrigatórias" : "Não"}</span></div>
          </div>
        </div>
      </div>

      {/* Invite agent modal */}
      <AnimatePresence>
        {showInvite && (
          <InviteAgentModal
            availableAgents={availableAgents}
            onClose={() => setShowInvite(false)}
            onInvite={handleInviteAgent}
            currentCount={guestAgents.length}
            maxAgents={meeting.policy.maxAgentsInvited}
          />
        )}
      </AnimatePresence>

      {/* End meeting confirmation */}
      <AnimatePresence>
        {showEndConfirm && (
          <EndMeetingModal
            onClose={() => setShowEndConfirm(false)}
            onEnd={(createTasks) => handleEndMeeting(createTasks)}
            messageCount={meeting.messages.length}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// === Context Pack Summary (shown at top of chat) ===
function ContextPackSummary({ pack }: { pack: NonNullable<Meeting["contextPack"]> }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="p-3 rounded-xl bg-beige/5 border border-beige/20">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-beige" />
          <span className="text-[10px] font-mono uppercase text-beige">Context Pack (pre-read do CEO)</span>
        </div>
        <span className="text-[10px] text-violet-muted">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded && (
        <div className="mt-2 space-y-2 text-[11px] text-violet-muted">
          <div>
            <span className="text-[#ff8a3d]">⚠ Overdue:</span> {pack.overdueTasks.length} task(s)
            {pack.overdueTasks.slice(0, 3).map((t) => (
              <div key={t.id} className="ml-3 text-[10px]">• [{t.priority}] {t.title} ({t.daysOverdue}d)</div>
            ))}
          </div>
          <div>
            <span className="text-neon-blue">📡 Signals:</span> {pack.recentSignals.length} recente(s)
          </div>
          <div>
            <span className="text-beige">⏳ Approvals:</span> {pack.pendingApprovals.length} pendente(s)
          </div>
          <div>
            <span className="text-neon-green">💰 Budget:</span> ${pack.budgetSnapshot.spent} / ${pack.budgetSnapshot.limit}
          </div>
          <div>
            <span className="text-cream">🚀 Iniciativas:</span> {pack.activeInitiatives.length} ativa(s)
          </div>
        </div>
      )}
    </div>
  );
}

// === Message bubble ===
function MessageBubble({ message, ceoName }: { message: import("@/lib/lovon/store").MeetingMessage; ceoName: string }) {
  const isBoard = message.sender.kind === "board";
  const isCEO = message.sender.kind === "agent" && message.sender.name === ceoName;
  const isSystem = message.sender.name === "Sistema";

  // Strip structured blocks from displayed content (we render them separately)
  const displayContent = message.content
    .replace(/>>>OPTIONS:[\s\S]*?<<<END_OPTIONS/g, "")
    .replace(/>>>DECISION:[\s\S]*?<<<END_DECISION/g, "")
    .replace(/>>>ACTION_ITEMS:[\s\S]*?<<<END_ACTION_ITEMS/g, "")
    .trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isBoard ? "flex-row-reverse" : ""}`}
    >
      <div className={`flex-shrink-0 ${isBoard ? "ml-2" : "mr-2"}`}>
        <AgentAvatar
          name={message.sender.name}
          accent={isBoard ? "green" : isCEO ? "green" : isSystem ? "orange" : "blue"}
          size="sm"
        />
      </div>
      <div className={`flex-1 max-w-[80%] ${isBoard ? "text-right" : ""}`}>
        <div className="text-[10px] text-violet-muted mb-1">
          {message.sender.name} · {new Date(message.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </div>
        <div className={`inline-block px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
          isBoard
            ? "bg-beige/10 border border-beige/20 text-cream"
            : isSystem
            ? "bg-[#ff8a3d]/5 border border-[#ff8a3d]/20 text-[#ff8a3d]"
            : "bg-violet-bg/40 border border-violet-subtle text-cream"
        }`}>
          {displayContent}
        </div>

        {/* Render proposed options as buttons */}
        {message.proposedOptions && message.proposedOptions.length > 0 && (
          <div className="mt-2 space-y-1">
            <div className="text-[10px] font-mono uppercase text-beige">Opções propostas:</div>
            {message.proposedOptions.map((opt) => (
              <div
                key={opt.id}
                className={`p-2 rounded-lg border text-xs ${
                  opt.recommended
                    ? "bg-neon-green/10 border-neon-green/30"
                    : "bg-violet-bg/30 border-violet-subtle"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-beige">{opt.id})</span>
                  {opt.recommended && <span className="text-[9px] text-neon-green">★ Recomendada</span>}
                </div>
                <div className="text-cream font-semibold mt-0.5">{opt.title}</div>
                <div className="text-violet-muted text-[11px] mt-0.5">{opt.tradeoffs}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// === Create meeting modal ===
function CreateMeetingModal({
  onClose,
  onCreate,
  defaultAutonomy,
}: {
  onClose: () => void;
  onCreate: (input: { title: string; objective: string; agenda: string[]; policy?: Partial<MeetingPolicy>; createdByUserId: string }) => void;
  defaultAutonomy: 0 | 1 | 2 | 3;
}) {
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [agendaText, setAgendaText] = useState("");
  const [autonomy, setAutonomy] = useState<0 | 1 | 2 | 3>(defaultAutonomy);
  const [budgetMax, setBudgetMax] = useState("");

  const agenda = agendaText.split("\n").map((a) => a.trim()).filter(Boolean);

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
        className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl glass-strong border border-violet-subtle overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-violet-subtle">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-beige" />
            <h3 className="text-base font-semibold text-cream font-serif-display">Nova reunião com CEO</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-violet-muted hover:text-cream">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-3">
          <div>
            <label className="text-xs font-medium text-violet-muted mb-1.5 block">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Revisão de Q3, Campanha de mídia paga..."
              className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-violet-muted mb-1.5 block">Objetivo</label>
            <input
              type="text"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Ex.: Decidir budget de marketing para outubro"
              className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-violet-muted mb-1.5 block">Agenda (um item por linha)</label>
            <textarea
              value={agendaText}
              onChange={(e) => setAgendaText(e.target.value)}
              rows={4}
              placeholder={"Vendas baixas\nCampanha nova\nIncidente de email"}
              className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30 resize-y"
            />
            {agenda.length > 0 && (
              <div className="text-[10px] text-violet-muted mt-1">{agenda.length} item(s) na agenda</div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-violet-muted mb-1.5 block">Autonomia</label>
              <select
                value={autonomy}
                onChange={(e) => setAutonomy(Number(e.target.value) as 0 | 1 | 2 | 3)}
                className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
              >
                <option value={0}>Nível 0 (aprova tudo)</option>
                <option value={1}>Nível 1 (internas auto)</option>
                <option value={2}>Nível 2 (externas baixo risco)</option>
                <option value={3}>Nível 3 (ampla)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-violet-muted mb-1.5 block">Budget máx (USD)</label>
              <input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="Ex.: 50"
                className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
              />
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-violet-subtle flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-violet-muted hover:text-cream">
            Cancelar
          </button>
          <button
            onClick={() => {
              if (title && objective && agenda.length > 0) {
                onCreate({
                  title,
                  objective,
                  agenda,
                  policy: {
                    autonomyLevel: autonomy,
                    budgetMaxUsd: budgetMax ? Number(budgetMax) : undefined,
                  },
                  createdByUserId: "user",
                });
              }
            }}
            disabled={!title || !objective || agenda.length === 0}
            className="btn-pill btn-primary-neon text-xs disabled:opacity-40"
          >
            <Zap className="w-3.5 h-3.5" /> Criar e iniciar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// === Invite agent modal ===
function InviteAgentModal({
  availableAgents,
  onClose,
  onInvite,
  currentCount,
  maxAgents,
}: {
  availableAgents: import("@/lib/lovon/store").Agent[];
  onClose: () => void;
  onInvite: (agentId: string, reason: string) => void;
  currentCount: number;
  maxAgents: number;
}) {
  const [reason, setReason] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const atLimit = currentCount >= maxAgents;

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
        className="relative w-full max-w-md max-h-[80vh] flex flex-col rounded-2xl glass-strong border border-violet-subtle overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-5 border-b border-violet-subtle">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-beige" />
            <h3 className="text-base font-semibold text-cream font-serif-display">Convidar especialista</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-violet-muted hover:text-cream">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-3">
          {atLimit ? (
            <div className="text-center py-8 text-sm text-[#ff8a3d]">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
              Limite de {maxAgents} agentes convidados atingido.
            </div>
          ) : (
            <>
              <div className="text-[10px] text-violet-muted">
                {currentCount}/{maxAgents} convidados · cada um tem 2 turnos
              </div>
              <div className="space-y-1.5">
                {availableAgents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => setSelected(agent.id)}
                    className={`w-full p-3 rounded-lg border text-left flex items-center gap-2 transition-colors ${
                      selected === agent.id
                        ? "bg-beige/10 border-beige/30"
                        : "bg-violet-bg/30 border-violet-subtle hover:bg-violet-bg/50"
                    }`}
                  >
                    <AgentAvatar name={agent.name} accent={agent.accent} size="sm" emoji={agent.emoji} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-cream">{agent.name}</div>
                      <div className="text-[10px] text-violet-muted truncate">{agent.specialty}</div>
                    </div>
                  </button>
                ))}
              </div>
              {selected && (
                <div>
                  <label className="text-xs font-medium text-violet-muted mb-1.5 block">Motivo do convite</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Ex.: Preciso da sua opinião sobre arquitetura"
                    className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30"
                  />
                </div>
              )}
            </>
          )}
        </div>
        <div className="p-4 border-t border-violet-subtle flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-violet-muted hover:text-cream">
            Cancelar
          </button>
          <button
            onClick={() => selected && onInvite(selected, reason || "Consultoria técnica")}
            disabled={!selected || atLimit}
            className="btn-pill btn-primary-neon text-xs disabled:opacity-40"
          >
            <UserPlus className="w-3.5 h-3.5" /> Convidar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// === End meeting modal ===
function EndMeetingModal({
  onClose,
  onEnd,
  messageCount,
}: {
  onClose: () => void;
  onEnd: (createTasks: boolean) => void;
  messageCount: number;
}) {
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
        className="relative w-full max-w-md rounded-2xl glass-strong border border-violet-subtle overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-violet-subtle flex items-center gap-2">
          <StopCircle className="w-5 h-5 text-red-400" />
          <h3 className="text-base font-semibold text-cream font-serif-display">Encerrar reunião</h3>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-sm text-violet-muted">
            A reunião teve <span className="text-cream font-semibold">{messageCount} mensagens</span>. O CEO vai gerar um outcome com:
          </p>
          <ul className="text-xs text-violet-muted space-y-1 ml-3">
            <li>• Decisions (o que foi decidido)</li>
            <li>• Action items (tarefas com owner e DoD)</li>
            <li>• Approval requests (se precisar do board)</li>
          </ul>
          <div className="pt-3 border-t border-violet-subtle">
            <div className="text-xs font-medium text-cream mb-2">Criar tasks dos action items?</div>
            <div className="flex gap-2">
              <button
                onClick={() => onEnd(true)}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-neon-green/10 border border-neon-green/30 text-neon-green hover:bg-neon-green/20"
              >
                Sim, criar tasks
              </button>
              <button
                onClick={() => onEnd(false)}
                className="flex-1 px-3 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-violet-subtle text-violet-muted hover:text-cream"
              >
                Só registrar outcome
              </button>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-violet-subtle flex items-center justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-violet-muted hover:text-cream">
            Cancelar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// === Scheduled meeting row ===
function ScheduledMeetingRow({ meeting, onStart, onCancel }: { meeting: Meeting; onStart: () => void; onCancel: () => void }) {
  return (
    <div className="p-4 rounded-xl glass border border-violet-subtle flex items-center justify-between">
      <div>
        <div className="text-sm font-semibold text-cream">{meeting.title}</div>
        <div className="text-[11px] text-violet-muted">{meeting.objective}</div>
        <div className="text-[10px] text-violet-muted mt-1">
          {meeting.agenda.length} item(s) na agenda · criada em {new Date(meeting.createdAt).toLocaleString("pt-BR")}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onStart} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neon-green/10 border border-neon-green/30 text-neon-green hover:bg-neon-green/20">
          Iniciar
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-violet-subtle text-violet-muted hover:text-red-400">
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

// === Ended meeting row ===
function EndedMeetingRow({ meeting }: { meeting: Meeting }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl glass border border-violet-subtle overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02]"
      >
        <div className="text-left">
          <div className="text-sm font-semibold text-cream">{meeting.title}</div>
          <div className="text-[11px] text-violet-muted">
            {new Date(meeting.startedAt ?? meeting.createdAt).toLocaleString("pt-BR")} · {meeting.messages.length} msgs
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusChip status={meeting.status} />
          {meeting.outcome && (
            <span className="text-[10px] text-violet-muted">
              {meeting.outcome.decisions.length} decisions · {meeting.outcome.actionItems.length} actions
            </span>
          )}
        </div>
      </button>
      {expanded && meeting.outcome && (
        <div className="p-4 border-t border-violet-subtle space-y-3 text-xs">
          <div>
            <div className="text-[10px] font-mono uppercase text-beige mb-1">Decisions</div>
            {meeting.outcome.decisions.length === 0 ? (
              <div className="text-violet-muted">Nenhuma decisão registrada.</div>
            ) : (
              <ul className="space-y-1 text-violet-muted">
                {meeting.outcome.decisions.map((d) => (
                  <li key={d.id}>• {d.text}</li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-beige mb-1">Action items</div>
            {meeting.outcome.actionItems.length === 0 ? (
              <div className="text-violet-muted">Nenhum action item.</div>
            ) : (
              <ul className="space-y-1 text-violet-muted">
                {meeting.outcome.actionItems.map((a) => (
                  <li key={a.id}>
                    • [{a.ownerAgentSlug}] {a.text}
                    {a.createdTaskId && <span className="text-neon-green ml-1">→ task criada</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
