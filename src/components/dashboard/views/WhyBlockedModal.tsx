"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, ExternalLink, Wrench, Clock, MessageSquare, Settings, Plug } from "lucide-react";
import { TaskBlocker, Task, TaskComment } from "@/lib/lovon/store";
import { BLOCKER_CODE_META } from "@/lib/lovon/blockerClassifier";

interface WhyBlockedModalProps {
  open: boolean;
  onClose: () => void;
  taskTitle: string;
  blockers: TaskBlocker[];
  // Optional: pass the full task so we can detect in_review vs blocked and show
  // the latest approval-type comment for in_review tasks.
  task?: Task;
  // Optional: callback when user clicks "Configurar agora" — navigates to Integrations tab
  // filtered by the missing capability. The parent (Tasks view) wires this to the Dashboard's
  // navigation + IntegrationsView's initialFilterCapability prop.
  onConfigureNow?: (capability: string) => void;
}

export function WhyBlockedModal({ open, onClose, taskTitle, blockers, task, onConfigureNow }: WhyBlockedModalProps) {
  const isInReview = task?.status === "in_review";
  // For in_review tasks, find the most recent approval-type comment as the "reason"
  const approvalComment = isInReview
    ? [...(task?.comments ?? [])]
        .filter((c) => c.type === "approval" || c.type === "system")
        .sort((a, b) => b.timestamp - a.timestamp)[0]
    : null;

  const modalTitle = isInReview ? "Por que está aguardando aprovação?" : "Por que está bloqueada?";
  const modalIcon = isInReview ? <Clock className="w-5 h-5 text-[#ff8a3d]" /> : <AlertTriangle className="w-5 h-5 text-[#ff8a3d]" />;

  return (
    <AnimatePresence>
      {open && (
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
            className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl glass-strong border border-[#ff8a3d]/30 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* header */}
            <div className="flex items-start justify-between p-5 border-b border-violet-subtle">
              <div className="flex items-center gap-2">
                {modalIcon}
                <div>
                  <h3 className="text-base font-semibold text-cream font-serif-display">
                    {modalTitle}
                  </h3>
                  <p className="text-xs text-violet-muted mt-0.5">
                    Task: <span className="text-beige">{taskTitle}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-violet-muted hover:text-cream"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto p-5 no-scrollbar space-y-3">
              {isInReview ? (
                // === in_review branch — approval pending ===
                <div className="space-y-3">
                  <div className="p-4 rounded-xl border bg-[#ff8a3d]/10 border-[#ff8a3d]/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-[#ff8a3d]" />
                      <span className="text-xs font-mono uppercase text-[#ff8a3d]">AGUARDANDO APROVAÇÃO</span>
                    </div>
                    <div className="text-sm text-cream mb-3">
                      Esta task está aguardando aprovação do Board. Não é um erro técnico —
                      o agente concluiu a parte dele, e um humano precisa aprovar antes da execução final.
                    </div>

                    {approvalComment && (
                      <div className="p-3 rounded-lg bg-black/30 border border-violet-subtle">
                        <div className="flex items-center gap-1.5 mb-1">
                          <MessageSquare className="w-3 h-3 text-beige" />
                          <span className="text-[10px] font-mono uppercase text-beige">Motivo registrado</span>
                        </div>
                        <div className="text-xs text-cream whitespace-pre-wrap leading-relaxed">
                          {approvalComment.content}
                        </div>
                        <div className="mt-2 text-[9px] text-violet-muted font-mono">
                          {new Date(approvalComment.timestamp).toLocaleString("pt-BR")} · por {approvalComment.authorName}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 p-3 rounded-lg bg-black/30 border border-violet-subtle">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Wrench className="w-3 h-3 text-beige" />
                        <span className="text-[10px] font-mono uppercase text-beige">Ação necessária</span>
                      </div>
                      <div className="text-xs text-violet-muted leading-relaxed">
                        Vá em <span className="text-cream">Approvals</span> (ou aba Confirmações) e aprove/rejeite
                        a confirmação pendente. Após aprovação, a task volta para <code className="text-cream">in_progress</code> e
                        o engine continua a execução.
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-violet-dark/30 border border-violet-subtle text-[10px] text-violet-muted">
                    <div className="font-semibold text-beige mb-1">Diferença: in_review vs blocked</div>
                    <div className="leading-relaxed">
                      <code className="text-[#ff8a3d]">in_review</code> = aguardando ação humana (aprovação do board). Não é erro.
                      <br />
                      <code className="text-red-400">blocked</code> = problema técnico (capability, integração, policy). Exige intervenção de config/engenharia.
                    </div>
                  </div>
                </div>
              ) : blockers.length === 0 ? (
                // === blocked branch, no blockers recorded (legacy or edge case) ===
                <div className="text-center py-12 text-violet-muted text-sm">
                  Nenhum blocker estruturado registrado. Esta task pode ter sido marcada
                  como bloqueada antes da implementação do sistema de blockers.
                </div>
              ) : (
                // === blocked branch with structured blockers ===
                <>
                  <div className="p-3 rounded-lg bg-[#ff8a3d]/5 border border-[#ff8a3d]/20 text-xs text-violet-muted">
                    O sistema registrou <span className="text-[#ff8a3d] font-semibold">{blockers.length} blocker(s)</span> estruturado(s).
                    Estes são os motivos reais do bloqueio — não há necessidade de o agente "chutar" diagnósticos.
                  </div>
                  {blockers.map((b, i) => {
                    const meta = BLOCKER_CODE_META[b.code];
                    return (
                      <motion.div
                        key={`${b.code}-${i}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.05, 0.3) }}
                        className={`p-4 rounded-xl border ${meta.bg} ${meta.border}`}
                      >
                        {/* code badge */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{meta.icon}</span>
                            <span className={`text-xs font-mono uppercase px-2 py-0.5 rounded ${meta.bg} ${meta.color} border ${meta.border}`}>
                              {b.code}
                            </span>
                          </div>
                          <span className="text-[9px] text-violet-muted font-mono">
                            {new Date(b.createdAt).toLocaleString("pt-BR")}
                          </span>
                        </div>

                        {/* label from meta */}
                        <div className={`text-sm font-semibold ${meta.color} mb-2`}>
                          {meta.label}
                        </div>

                        {/* message */}
                        <div className="text-xs text-cream mb-3 leading-relaxed">
                          {b.message}
                        </div>

                        {/* required action */}
                        <div className="p-3 rounded-lg bg-black/30 border border-violet-subtle">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Wrench className="w-3 h-3 text-beige" />
                            <span className="text-[10px] font-mono uppercase text-beige">Ação necessária</span>
                          </div>
                          <div className="text-xs text-violet-muted leading-relaxed">
                            {b.requiredAction}
                          </div>
                        </div>

                        {/* related entity */}
                        {b.relatedEntity && (
                          <div className="mt-2 flex items-center gap-2 text-[10px] text-violet-muted font-mono">
                            <span>Relacionado:</span>
                            <span className="px-1.5 py-0.5 rounded bg-black/30 border border-violet-subtle">
                              {b.relatedEntity.type}: {b.relatedEntity.id}
                            </span>
                          </div>
                        )}

                        {/* trace id */}
                        {b.traceId && (
                          <div className="mt-1 text-[10px] text-violet-muted/70 font-mono">
                            trace: {b.traceId}
                          </div>
                        )}

                        {/* created by */}
                        <div className="mt-2 text-[9px] text-violet-muted uppercase">
                          reportado por: <span className="text-cream">{b.createdBy}</span>
                        </div>

                        {/* === CTA: Configurar agora === */}
                        {/* For CAPABILITY_NOT_CONFIGURED blockers, show a button that navigates
                            to the Integrations tab filtered by the missing capability.
                            This reduces friction — user sees the blocker and clicks directly. */}
                        {b.code === "CAPABILITY_NOT_CONFIGURED" && onConfigureNow && (
                          <div className="mt-3 pt-3 border-t border-violet-subtle">
                            <button
                              onClick={() => {
                                // Try to extract the capability name from the blocker message
                                // The message typically contains: 'Configure a capability "email_send" em Integrações.'
                                const capMatch = b.message.match(/"([a-z_]+)"/i);
                                const capability = capMatch?.[1] ?? "email_send";
                                onConfigureNow(capability);
                                onClose();
                              }}
                              className="w-full px-3 py-2 rounded-lg text-xs font-semibold bg-beige/10 border border-beige/30 text-beige hover:bg-beige/20 flex items-center justify-center gap-1.5"
                            >
                              <Plug className="w-3.5 h-3.5" /> Configurar agora
                            </button>
                            <div className="text-[10px] text-violet-muted mt-1 text-center">
                              Abre a aba Integrações filtrada na capability faltante
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}

                  {/* hint about how blockers work */}
                  <div className="mt-4 p-3 rounded-lg bg-violet-dark/30 border border-violet-subtle text-[10px] text-violet-muted">
                    <div className="font-semibold text-beige mb-1">Como o sistema de blockers funciona</div>
                    <div className="leading-relaxed">
                      Quando o engine força uma task para status <code className="text-cream">blocked</code>, ele registra
                      pelo menos um blocker estruturado com código estável (ex.: <code className="text-cream">INTEGRATION_AUTH_FAILED</code>),
                      mensagem humana, e ação necessária. O agente deve consultar esta lista em vez de inventar diagnósticos —
                      se o blocker diz "RESEND_API_KEY inválida", é isso que está acontecendo, não "erro de autenticação genérico".
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* footer */}
            <div className="p-4 border-t border-violet-subtle flex items-center justify-between">
              <a
                href="https://resend.com/domains"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-violet-muted hover:text-beige inline-flex items-center gap-1"
              >
                Documentação <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-beige/10 border border-beige/30 text-beige hover:bg-beige/20"
              >
                Fechar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
