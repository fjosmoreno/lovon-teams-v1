"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Plus, Check, X, Clock, Send, Trash2, AlertCircle, ExternalLink, FileText, Loader2 } from "lucide-react";
import { useLovonStore, EmailDraft } from "@/lib/lovon/store";

interface EmailConfig {
  fromEmail: string;
  fromName: string;
  isSandbox: boolean;
  warning: string | null;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  draft: { label: "Rascunho", color: "text-violet-muted", bg: "bg-white/5", border: "border-white/10" },
  pending_approval: { label: "Aguardando aprovação", color: "text-[#ff8a3d]", bg: "bg-[#ff8a3d]/10", border: "border-[#ff8a3d]/30" },
  approved: { label: "Aprovado", color: "text-beige", bg: "bg-beige/10", border: "border-beige/30" },
  scheduled: { label: "Agendado", color: "text-neon-blue", bg: "bg-neon-blue/10", border: "border-neon-blue/30" },
  sent: { label: "Enviado", color: "text-neon-green", bg: "bg-neon-green/10", border: "border-neon-green/30" },
  failed: { label: "Falhou", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30" },
  cancelled: { label: "Cancelado", color: "text-violet-muted", bg: "bg-white/5", border: "border-white/10" },
};

export function EmailAgent() {
  const emailDrafts = useLovonStore((s) => s.emailDrafts);
  const addEmailDraft = useLovonStore((s) => s.addEmailDraft);
  const approveEmailDraft = useLovonStore((s) => s.approveEmailDraft);
  const scheduleEmail = useLovonStore((s) => s.scheduleEmail);
  const cancelEmail = useLovonStore((s) => s.cancelEmail);
  const markEmailSent = useLovonStore((s) => s.markEmailSent);
  const markEmailFailed = useLovonStore((s) => s.markEmailFailed);
  const agents = useLovonStore((s) => s.agents);
  const companyConfig = useLovonStore((s) => s.companyConfig);

  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "scheduled" | "sent">("all");
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null);

  useEffect(() => {
    fetch("/api/lovon/email-config")
      .then((r) => r.json())
      .then((data: EmailConfig) => setEmailConfig(data))
      .catch(() => setEmailConfig(null));
  }, []);

  const ceo = agents.find((a) => a.role === "ceo");
  const autonomyLevel = companyConfig?.autonomyLevel ?? 0;

  const handleSendEmail = async (draft: EmailDraft) => {
    setSendingId(draft.id);
    try {
      const res = await fetch("/api/lovon/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: draft.to,
          subject: draft.subject,
          html: draft.body.replace(/\n/g, "<br>"),
          // `from` omitted — server uses env RESEND_FROM_EMAIL / RESEND_FROM_NAME.
          // Only override if the draft explicitly set one (not currently exposed in UI).
          traceId: `manual:${draft.id}`,
          requestedByAgentSlug: "user",
          taskId: draft.sourceTaskId,
          workspaceId: "default",
        }),
      });
      const data = await res.json();
      // The API now always returns a `receipt` object, regardless of success.
      const receipt = data.receipt as
        | import("@/lib/lovon/store").EmailSendReceipt
        | undefined;
      if (data.success && receipt?.providerMessageId) {
        markEmailSent(draft.id, receipt);
      } else {
        markEmailFailed(
          draft.id,
          data.error || receipt?.error || "Resend não retornou message id",
          receipt
        );
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Erro de rede";
      markEmailFailed(draft.id, errMsg);
    } finally {
      setSendingId(null);
    }
  };

  const filtered = emailDrafts.filter((d) => {
    if (filter === "pending") return d.status === "pending_approval" || d.status === "draft";
    if (filter === "scheduled") return d.status === "scheduled" || d.status === "approved";
    if (filter === "sent") return d.status === "sent" || d.status === "failed";
    return true;
  });

  const stats = {
    total: emailDrafts.length,
    pending: emailDrafts.filter((d) => d.status === "pending_approval").length,
    scheduled: emailDrafts.filter((d) => d.status === "scheduled").length,
    sent: emailDrafts.filter((d) => d.status === "sent").length,
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-5 h-5 text-beige" />
            <h1 className="text-2xl sm:text-3xl font-bold text-cream font-serif-display">Email Agent</h1>
          </div>
          <p className="text-sm text-violet-muted max-w-2xl">
            Redige, programa e rastreia e-mails com trilha de auditoria. Envios externos exigem aprovação. Nível de autonomia atual: <span className="text-beige">Nível {autonomyLevel}</span>.
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-pill btn-primary-neon text-sm">
          <Plus className="w-4 h-4" /> Novo email
        </button>
      </div>

      {/* autonomy info */}
      <div className="p-3 rounded-lg bg-violet-dark/30 border border-violet-subtle text-xs text-violet-muted">
        {autonomyLevel === 0 && "🔒 Nível 0: Todos os envios exigem aprovação manual."}
        {autonomyLevel === 1 && "🔶 Nível 1: Envios internos automáticos. Externos exigem aprovação."}
        {autonomyLevel === 2 && "🟢 Nível 2: Envios externos de baixo risco automáticos com limites."}
        {autonomyLevel === 3 && "⚡ Nível 3: Execução ampla com budgets e playbooks."}
      </div>

      {/* Resend from-address + sandbox warning */}
      {emailConfig && (
        <div className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
          emailConfig.isSandbox
            ? "bg-[#ff8a3d]/10 border-[#ff8a3d]/30 text-[#ff8a3d]"
            : "bg-neon-green/5 border-neon-green/20 text-neon-green"
        }`}>
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-medium">
              Remetente: <span className="font-mono">{emailConfig.fromName} &lt;{emailConfig.fromEmail}&gt;</span>
            </div>
            {emailConfig.isSandbox ? (
              <div className="mt-1 text-[11px] leading-relaxed">
                {emailConfig.warning}
                <a
                  href="https://resend.com/domains"
                  target="_blank"
                  rel="noreferrer"
                  className="ml-1 underline hover:no-underline inline-flex items-center gap-0.5"
                >
                  Configurar domínio <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            ) : (
              <div className="mt-1 text-[11px]">Domínio próprio configurado — e-mails podem ser entregues a qualquer destinatário.</div>
            )}
          </div>
        </div>
      )}

      {/* stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-cream" },
          { label: "Pendentes", value: stats.pending, color: "text-[#ff8a3d]" },
          { label: "Agendados", value: stats.scheduled, color: "text-neon-blue" },
          { label: "Enviados", value: stats.sent, color: "text-neon-green" },
        ].map((s) => (
          <div key={s.label} className="p-3 rounded-xl glass border border-violet-subtle text-center">
            <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
            <div className="text-[9px] text-violet-muted uppercase">{s.label}</div>
          </div>
        ))}
      </div>

      {/* filters */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-violet-bg/40 border border-violet-subtle w-fit">
        {(["all", "pending", "scheduled", "sent"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              filter === f ? "bg-beige/15 text-beige" : "text-violet-muted hover:text-cream"
            }`}
          >
            {f === "all" ? "Todos" : f === "pending" ? "Pendentes" : f === "scheduled" ? "Agendados" : "Enviados"}
          </button>
        ))}
      </div>

      {/* list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Mail className="w-12 h-12 mx-auto text-violet-muted/30 mb-3" />
          <p className="text-sm text-violet-muted">Nenhum email ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((draft, i) => {
            const meta = STATUS_META[draft.status] ?? STATUS_META.draft;
            const creator = agents.find((a) => a.id === draft.createdBy);
            return (
              <motion.div
                key={draft.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="p-4 rounded-xl glass border border-violet-subtle"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded ${meta.bg} ${meta.color} border ${meta.border}`}>
                        {meta.label}
                      </span>
                      {draft.isExternal && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#ff8a3d]/10 text-[#ff8a3d] border border-[#ff8a3d]/20 flex items-center gap-0.5">
                          <ExternalLink className="w-2.5 h-2.5" /> Externo
                        </span>
                      )}
                      {creator && <span className="text-[9px] text-violet-muted">por {creator.name}</span>}
                    </div>
                    <div className="text-sm font-semibold text-cream">{draft.subject}</div>
                    <div className="text-[10px] text-violet-muted">Para: {draft.to}</div>
                  </div>
                </div>
                <p className="text-xs text-violet-muted line-clamp-2 mb-2">{draft.body}</p>
                {draft.error && (
                  <div className="text-[10px] text-red-400 mb-2 flex items-center gap-1">
                    <AlertCircle className="w-2.5 h-2.5" /> {draft.error}
                  </div>
                )}
                {/* Receipt info — proves the email actually went out via Resend */}
                {draft.receipt && (
                  <div className="text-[9px] font-mono text-violet-muted/80 mb-2 p-2 rounded bg-black/20 border border-violet-subtle/50 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-beige/70">Provider:</span>
                      <span className="text-cream">{draft.receipt.provider}</span>
                    </div>
                    {draft.receipt.providerMessageId && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-beige/70">Message ID:</span>
                        <span className="text-neon-green truncate">{draft.receipt.providerMessageId}</span>
                      </div>
                    )}
                    {draft.receipt.sentAt && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-beige/70">Enviado em:</span>
                        <span className="text-cream">{new Date(draft.receipt.sentAt).toLocaleString("pt-BR")}</span>
                      </div>
                    )}
                    {draft.receipt.from && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-beige/70">From:</span>
                        <span className="text-cream truncate">{draft.receipt.from}</span>
                      </div>
                    )}
                    {draft.sourceTaskId && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-beige/70">Task:</span>
                        <span className="text-cream truncate">{draft.sourceTaskId}</span>
                      </div>
                    )}
                  </div>
                )}
                {/* actions */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-violet-subtle">
                  {(draft.status === "pending_approval" || draft.status === "draft") && (
                    <>
                      <button
                        onClick={() => approveEmailDraft(draft.id, "Você")}
                        className="flex-1 py-1.5 rounded-md text-xs bg-beige/10 border border-beige/30 text-beige hover:bg-beige/20 flex items-center justify-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Aprovar
                      </button>
                      {draft.status === "pending_approval" && (
                        <button
                          onClick={() => scheduleEmail(draft.id, Date.now() + 3600000)}
                          className="px-3 py-1.5 rounded-md text-xs bg-neon-blue/10 border border-neon-blue/30 text-neon-blue hover:bg-neon-blue/20 flex items-center gap-1"
                        >
                          <Clock className="w-3 h-3" /> Agendar +1h
                        </button>
                      )}
                    </>
                  )}
                  {draft.status === "approved" && (
                    <button
                      onClick={() => handleSendEmail(draft)}
                      disabled={sendingId === draft.id}
                      className="flex-1 py-1.5 rounded-md text-xs bg-neon-green/10 border border-neon-green/30 text-neon-green hover:bg-neon-green/20 flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {sendingId === draft.id ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Enviando...</>
                      ) : (
                        <><Send className="w-3 h-3" /> Enviar agora</>
                      )}
                    </button>
                  )}
                  {(draft.status === "scheduled" || draft.status === "approved") && (
                    <button
                      onClick={() => cancelEmail(draft.id)}
                      className="px-3 py-1.5 rounded-md text-xs bg-white/5 border border-white/8 text-violet-muted hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* form modal */}
      <AnimatePresence>
        {showForm && (
          <EmailFormModal
            onClose={() => setShowForm(false)}
            onSave={(data) => {
              const autonomy = autonomyLevel;
              const needsApproval = data.isExternal && autonomy < 2;
              addEmailDraft({
                ...data,
                status: needsApproval ? "pending_approval" : "approved",
                createdBy: ceo?.id ?? "",
              });
              setShowForm(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EmailFormModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: { to: string; subject: string; body: string; tone: string; isExternal: boolean; contextSources: string[] }) => void;
}) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [tone, setTone] = useState("profissional, direto");
  const [isExternal, setIsExternal] = useState(true);

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
          <h3 className="text-base font-semibold text-cream font-serif-display">Novo email</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-violet-muted hover:text-cream">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 no-scrollbar space-y-3">
          <div>
            <label className="text-xs font-medium text-violet-muted mb-1.5 block">Para</label>
            <input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="destinatario@email.com" className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-violet-muted mb-1.5 block">Assunto</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Assunto do email" className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-violet-muted mb-1.5 block">Tom</label>
            <input type="text" value={tone} onChange={(e) => setTone(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-violet-muted mb-1.5 block">Corpo</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="Conteúdo do email..." className="w-full px-3 py-2 rounded-lg bg-violet-bg/40 border border-violet-subtle text-sm text-cream focus:outline-none focus:border-beige/30 resize-y" />
          </div>
          <label className="flex items-center gap-2 text-xs text-violet-muted cursor-pointer">
            <input type="checkbox" checked={isExternal} onChange={(e) => setIsExternal(e.target.checked)} className="accent-beige" />
            Email externo (cliente/lead) — exige aprovação se autonomia &lt; Nível 2
          </label>
        </div>
        <div className="p-4 border-t border-violet-subtle flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 text-violet-muted hover:text-cream">Cancelar</button>
          <button
            onClick={() => { if (to && subject && body) onSave({ to, subject, body, tone, isExternal, contextSources: [] }); }}
            disabled={!to || !subject || !body}
            className="btn-pill btn-primary-neon text-xs disabled:opacity-40"
          >
            <Mail className="w-3.5 h-3.5" /> Criar rascunho
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
