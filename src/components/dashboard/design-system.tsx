"use client";

// Lovon Teams — Design System
// Componentes visuais reutilizáveis para dar "cara de produto" à plataforma.
// Substituem os textos pequenos e monótonos por cards, badges, avatares e métricas grandes.

import { motion } from "framer-motion";
import { ReactNode } from "react";
import { AlertTriangle, Clock, CheckCircle2, XCircle, Loader2, Ban } from "lucide-react";
import { Accent, AgentStatus } from "@/lib/lovon/store";

// === Color mapping for accents (department/agent colors) ===
export const ACCENT_COLORS: Record<Accent, { bg: string; text: string; border: string; dot: string; gradient: string }> = {
  green: { bg: "bg-neon-green/15", text: "text-neon-green", border: "border-neon-green/40", dot: "bg-neon-green", gradient: "from-neon-green/20 to-neon-green/5" },
  blue: { bg: "bg-neon-blue/15", text: "text-neon-blue", border: "border-neon-blue/40", dot: "bg-neon-blue", gradient: "from-neon-blue/20 to-neon-blue/5" },
  purple: { bg: "bg-neon-purple/15", text: "text-neon-purple", border: "border-neon-purple/40", dot: "bg-neon-purple", gradient: "from-neon-purple/20 to-neon-purple/5" },
  acid: { bg: "bg-[#b6ff3d]/15", text: "text-[#b6ff3d]", border: "border-[#b6ff3d]/40", dot: "bg-[#b6ff3d]", gradient: "from-[#b6ff3d]/20 to-[#b6ff3d]/5" },
  orange: { bg: "bg-[#ff8a3d]/15", text: "text-[#ff8a3d]", border: "border-[#ff8a3d]/40", dot: "bg-[#ff8a3d]", gradient: "from-[#ff8a3d]/20 to-[#ff8a3d]/5" },
};

// === BigMetricCard — número grande + label, para Executive Dashboard ===
export function BigMetricCard({
  label,
  value,
  accent = "cream",
  icon,
  delta,
  onClick,
  warning,
}: {
  label: string;
  value: string | number;
  accent?: "cream" | "green" | "orange" | "red" | "blue";
  icon?: ReactNode;
  delta?: { value: string; positive: boolean };
  onClick?: () => void;
  warning?: string;
}) {
  const valueColor = {
    cream: "text-cream",
    green: "text-neon-green",
    orange: "text-[#ff8a3d]",
    red: "text-red-400",
    blue: "text-neon-blue",
  }[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onClick ? { y: -2 } : undefined}
      onClick={onClick}
      className={`metric-card ${onClick ? "cursor-pointer" : ""} ${warning ? "border-[#ff8a3d]/40" : ""}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="text-[11px] uppercase tracking-wider text-violet-muted font-mono">{label}</div>
        {icon && <div className={`${valueColor} opacity-70`}>{icon}</div>}
      </div>
      <div className={`metric-card-value ${valueColor}`}>{value}</div>
      {delta && (
        <div className={`text-[10px] mt-1 font-mono ${delta.positive ? "text-neon-green" : "text-[#ff8a3d]"}`}>
          {delta.positive ? "↑" : "↓"} {delta.value}
        </div>
      )}
      {warning && (
        <div className="text-[10px] text-[#ff8a3d] mt-2 flex items-center gap-1">
          <AlertTriangle className="w-2.5 h-2.5" /> {warning}
        </div>
      )}
    </motion.div>
  );
}

// === AgentAvatar — iniciais + cor por departamento, com status indicator ===
export function AgentAvatar({
  name,
  accent,
  status,
  size = "md",
  emoji,
}: {
  name: string;
  accent: Accent;
  status?: AgentStatus;
  size?: "sm" | "md" | "lg";
  emoji?: string;
}) {
  const colors = ACCENT_COLORS[accent];
  const sizeClass = {
    sm: "agent-avatar-sm",
    md: "agent-avatar",
    lg: "agent-avatar-lg",
  }[size];

  // Status indicator dot
  const statusDot = {
    active: { color: "bg-neon-green", title: "Ativo" },
    thinking: { color: "bg-[#b6ff3d]", title: "Pensando" },
    working: { color: "bg-[#ff8a3d]", title: "Trabalhando" },
    idle: { color: "bg-violet-muted", title: "Inativo" },
  }[status ?? "idle"];

  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className={`${sizeClass} ${colors.bg} ${colors.border} border`} title={name}>
      {emoji ? <span className="text-lg">{emoji}</span> : <span className={colors.text}>{initials}</span>}
      {status && (
        <span
          className={`agent-status-dot ${statusDot.color}`}
          title={statusDot.title}
        />
      )}
    </div>
  );
}

// === StatusChip — for tasks, work products, anything ===
type ChipStatus =
  | "pending" | "in_progress" | "delegated" | "in_review"
  | "completed" | "failed" | "partial_success" | "blocked"
  | "draft" | "approved" | "scheduled" | "published" | "archived";

export function StatusChip({ status, label }: { status: ChipStatus | string; label?: string }) {
  const meta = STATUS_VISUALS[status as ChipStatus] ?? STATUS_VISUALS.pending;
  const Icon = meta.icon;
  return (
    <span className={`status-chip ${meta.bg} ${meta.color} ${meta.border}`}>
      <Icon className="w-2.5 h-2.5" />
      {label ?? meta.label}
    </span>
  );
}

export const STATUS_VISUALS: Record<ChipStatus, { label: string; color: string; bg: string; border: string; icon: typeof Clock }> = {
  pending: { label: "Pendente", color: "text-violet-muted", bg: "bg-white/5", border: "border-white/10", icon: Clock },
  in_progress: { label: "Em execução", color: "text-[#b6ff3d]", bg: "bg-[#b6ff3d]/10", border: "border-[#b6ff3d]/30", icon: Loader2 },
  delegated: { label: "Delegada", color: "text-neon-blue", bg: "bg-neon-blue/10", border: "border-neon-blue/30", icon: Clock },
  in_review: { label: "Aguardando aprovação", color: "text-[#ff8a3d]", bg: "bg-[#ff8a3d]/10", border: "border-[#ff8a3d]/30", icon: Clock },
  completed: { label: "Concluída", color: "text-neon-green", bg: "bg-neon-green/10", border: "border-neon-green/30", icon: CheckCircle2 },
  failed: { label: "Falhou", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30", icon: XCircle },
  partial_success: { label: "Concluída Parcialmente", color: "text-[#ff8a3d]", bg: "bg-[#ff8a3d]/10", border: "border-[#ff8a3d]/30", icon: AlertTriangle },
  blocked: { label: "Bloqueada", color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/30", icon: Ban },
  draft: { label: "Rascunho", color: "text-violet-muted", bg: "bg-white/5", border: "border-white/10", icon: Clock },
  approved: { label: "Aprovado", color: "text-beige", bg: "bg-beige/10", border: "border-beige/30", icon: CheckCircle2 },
  scheduled: { label: "Agendado", color: "text-neon-blue", bg: "bg-neon-blue/10", border: "border-neon-blue/30", icon: Clock },
  published: { label: "Publicado", color: "text-neon-green", bg: "bg-neon-green/10", border: "border-neon-green/30", icon: CheckCircle2 },
  archived: { label: "Arquivado", color: "text-violet-muted", bg: "bg-white/5", border: "border-white/10", icon: Ban },
};

// === PriorityChip — for task priority ===
export function PriorityChip({ priority }: { priority: "low" | "medium" | "high" | "critical" }) {
  const meta = {
    low: { label: "Baixa", color: "text-violet-muted", bg: "bg-white/5", border: "border-white/10" },
    medium: { label: "Média", color: "text-neon-blue", bg: "bg-neon-blue/10", border: "border-neon-blue/30" },
    high: { label: "Alta", color: "text-[#ff8a3d]", bg: "bg-[#ff8a3d]/10", border: "border-[#ff8a3d]/30" },
    critical: { label: "Crítica", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30" },
  }[priority];
  return (
    <span className={`status-chip ${meta.bg} ${meta.color} ${meta.border}`}>{meta.label}</span>
  );
}

// === SectionTitle — consistent heading style ===
export function SectionTitle({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-start gap-3">
        {icon && <div className="text-beige mt-1">{icon}</div>}
        <div>
          <h2 className="font-serif-display text-cream">{title}</h2>
          {subtitle && <p className="text-sm text-violet-muted mt-1">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
