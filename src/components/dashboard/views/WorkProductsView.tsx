"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone,
  Calendar,
  CreditCard,
  X,
  Check,
  Clock,
  Send,
  Archive,
  Trash2,
  Image,
  Plus,
  AlertCircle,
} from "lucide-react";
import { useLovonStore } from "@/lib/lovon/store";
import { WorkProduct, WorkProductStatus, CampaignBrief, ContentPlan, SocialPostCard, CreativeAsset } from "@/lib/lovon/work-products";

const STATUS_COLUMNS: { id: WorkProductStatus; label: string; color: string }[] = [
  { id: "draft", label: "Rascunho", color: "text-violet-muted" },
  { id: "in_review", label: "Em Revisão", color: "text-[#ff8a3d]" },
  { id: "approved", label: "Aprovado", color: "text-beige" },
  { id: "scheduled", label: "Agendado", color: "text-neon-blue" },
  { id: "published", label: "Publicado", color: "text-neon-green" },
];

const TYPE_ICONS = {
  campaign_brief: Megaphone,
  content_plan: Calendar,
  social_post_card: CreditCard,
  creative_asset: Image,
};

const TYPE_LABELS = {
  campaign_brief: "Campaign Brief",
  content_plan: "Content Plan",
  social_post_card: "Social Card",
  creative_asset: "Creative Asset",
};

export function WorkProductsView() {
  const workProducts = useLovonStore((s) => s.workProducts);
  const updateWorkProductStatus = useLovonStore((s) => s.updateWorkProductStatus);
  const deleteWorkProduct = useLovonStore((s) => s.deleteWorkProduct);

  const [filterType, setFilterType] = useState<"all" | "campaign_brief" | "content_plan" | "social_post_card" | "creative_asset">("all");
  const [selectedWp, setSelectedWp] = useState<WorkProduct | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "calendar">("kanban");

  const filtered = workProducts.filter((wp) => {
    if (filterType !== "all" && wp.meta.type !== filterType) return false;
    return true;
  });

  // Calendar items from content plans
  const calendarItems = workProducts
    .filter((wp) => wp.meta.type === "content_plan")
    .flatMap((wp) => {
      const plan = wp as ContentPlan;
      return plan.items.map((item) => ({
        ...item,
        planTitle: plan.meta.id,
        planStatus: plan.meta.status,
      }));
    })
    .filter((item) => item.targetDate);

  const stats = {
    total: workProducts.length,
    briefs: workProducts.filter((w) => w.meta.type === "campaign_brief").length,
    plans: workProducts.filter((w) => w.meta.type === "content_plan").length,
    cards: workProducts.filter((w) => w.meta.type === "social_post_card").length,
    assets: workProducts.filter((w) => w.meta.type === "creative_asset").length,
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Megaphone className="w-5 h-5 text-beige" />
          <h1 className="text-2xl sm:text-3xl font-bold text-cream font-serif-display">Work Products</h1>
        </div>
        <p className="text-sm text-violet-muted max-w-2xl">
          Agentes produzem artefatos estruturados (campaign briefs, content plans, social cards) em vez de textão. A UI renderiza visualmente em kanban.
        </p>
      </div>

      {/* stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total, icon: Megaphone, color: "text-cream" },
          { label: "Briefs", value: stats.briefs, icon: Megaphone, color: "text-neon-blue" },
          { label: "Plans", value: stats.plans, icon: Calendar, color: "text-beige" },
          { label: "Cards", value: stats.cards, icon: CreditCard, color: "text-neon-purple" },
          { label: "Assets", value: stats.assets, icon: Image, color: "text-neon-green" },
        ].map((s) => (
          <div key={s.label} className="p-3 rounded-xl glass border border-violet-subtle text-center">
            <s.icon className={`w-4 h-4 ${s.color} mb-1 mx-auto`} />
            <div className="text-lg font-bold text-cream">{s.value}</div>
            <div className="text-[9px] text-violet-muted uppercase">{s.label}</div>
          </div>
        ))}
      </div>

      {/* filter + view toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-violet-bg/40 border border-violet-subtle w-fit">
          {(["all", "campaign_brief", "content_plan", "social_post_card", "creative_asset"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filterType === t ? "bg-beige/15 text-beige" : "text-violet-muted hover:text-cream"
              }`}
            >
              {t === "all" ? "Todos" : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-violet-bg/40 border border-violet-subtle">
          <button
            onClick={() => setViewMode("kanban")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === "kanban" ? "bg-beige/15 text-beige" : "text-violet-muted"}`}
          >
            Kanban
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === "calendar" ? "bg-beige/15 text-beige" : "text-violet-muted"}`}
          >
            Calendário
          </button>
        </div>
      </div>

      {/* calendar view */}
      {viewMode === "calendar" && (
        <div className="space-y-3">
          {calendarItems.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-10 h-10 mx-auto text-violet-muted/30 mb-3" />
              <p className="text-sm text-violet-muted">Nenhum item de content plan com data encontrada.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {calendarItems
                .sort((a, b) => (a.targetDate || "").localeCompare(b.targetDate || ""))
                .map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    className="p-3 rounded-lg glass border border-violet-subtle"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-beige/10 text-beige border border-beige/20">
                        {item.channel}
                      </span>
                      {item.targetDate && (
                        <span className="text-[9px] font-mono text-violet-muted">{item.targetDate}</span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-cream mb-1">{item.theme}</div>
                    <div className="text-[10px] text-violet-muted">Hook: {item.hook}</div>
                    <div className="text-[10px] text-violet-muted">CTA: {item.cta}</div>
                  </motion.div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* kanban board */}
      {viewMode === "kanban" && (
        <>
          {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Megaphone className="w-12 h-12 mx-auto text-violet-muted/30 mb-3" />
          <p className="text-sm text-violet-muted">
            Nenhum work product ainda. Atribua a skill "Marketing Campaign Generator" a um agente e execute uma missão.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {STATUS_COLUMNS.map((col) => {
            const colItems = filtered.filter((wp) => wp.meta.status === col.id);
            return (
              <div key={col.id} className="space-y-2">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className={`text-xs font-semibold ${col.color}`}>{col.label}</span>
                  <span className="text-[10px] font-mono text-violet-muted">{colItems.length}</span>
                </div>
                {colItems.map((wp) => {
                  const Icon = TYPE_ICONS[wp.meta.type];
                  return (
                    <motion.div
                      key={wp.meta.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg glass border border-violet-subtle group cursor-pointer hover:border-violet-strong"
                      onClick={() => setSelectedWp(wp)}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <Icon className={`w-3.5 h-3.5 ${col.color} shrink-0`} />
                        <span className="text-[8px] font-mono uppercase text-violet-muted">
                          {TYPE_LABELS[wp.meta.type]}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-cream line-clamp-2">
                        {wp.meta.type === "campaign_brief" ? (wp as CampaignBrief).name : wp.meta.type === "content_plan" ? "Content Plan" : (wp as SocialPostCard).title}
                      </div>
                      {wp.meta.type === "social_post_card" && (
                        <div className="text-[9px] text-violet-muted mt-1">
                          {(wp as SocialPostCard).channel} · {(wp as SocialPostCard).format}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
                {colItems.length === 0 && (
                  <div className="text-[10px] text-violet-muted/30 text-center py-4">—</div>
                )}
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* detail modal */}
      <AnimatePresence>
        {selectedWp && (
          <WorkProductDetail
            wp={selectedWp}
            onClose={() => setSelectedWp(null)}
            onStatusChange={(status) => {
              updateWorkProductStatus(selectedWp.meta.id, status);
              setSelectedWp({ ...selectedWp, meta: { ...selectedWp.meta, status } });
            }}
            onApprove={() => {
              // Approve flow: cria confirmation request + muda status para approved
              updateWorkProductStatus(selectedWp.meta.id, "approved");
              setSelectedWp({ ...selectedWp, meta: { ...selectedWp.meta, status: "approved" } });
            }}
            onDelete={() => {
              deleteWorkProduct(selectedWp.meta.id);
              setSelectedWp(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function WorkProductDetail({
  wp,
  onClose,
  onStatusChange,
  onApprove,
  onDelete,
}: {
  wp: WorkProduct;
  onClose: () => void;
  onStatusChange: (status: WorkProductStatus) => void;
  onApprove: () => void;
  onDelete: () => void;
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
        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl glass-strong border border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-start justify-between p-5 border-b border-violet-subtle">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-beige/10 text-beige border border-beige/20">
                {TYPE_LABELS[wp.meta.type]}
              </span>
              <span className="text-[10px] font-mono text-violet-muted">
                v{wp.meta.version} · {wp.meta.status}
              </span>
            </div>
            <h3 className="text-base font-semibold text-cream font-serif-display">
              {wp.meta.type === "campaign_brief" ? (wp as CampaignBrief).name : wp.meta.type === "content_plan" ? "Content Plan" : (wp as SocialPostCard).title}
            </h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-violet-muted hover:text-cream shrink-0 ml-3">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto p-5 no-scrollbar space-y-4">
          {wp.meta.type === "campaign_brief" && <CampaignBriefDetail wp={wp as CampaignBrief} />}
          {wp.meta.type === "content_plan" && <ContentPlanDetail wp={wp as ContentPlan} />}
          {wp.meta.type === "social_post_card" && <SocialPostCardDetail wp={wp as SocialPostCard} />}
          {wp.meta.type === "creative_asset" && <CreativeAssetDetail wp={wp as CreativeAsset} />}
        </div>

        {/* footer with status actions */}
        <div className="p-4 border-t border-violet-subtle flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_COLUMNS.map((col) => (
              <button
                key={col.id}
                onClick={() => onStatusChange(col.id)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-medium border transition-all ${
                  wp.meta.status === col.id
                    ? `${col.color} border-current/30 bg-current/10`
                    : "text-violet-muted border-violet-subtle hover:text-cream"
                }`}
              >
                {col.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {wp.meta.status !== "approved" && wp.meta.status !== "published" && (
              <button
                onClick={onApprove}
                className="px-3 py-1 rounded-md text-[10px] font-semibold bg-neon-green/10 border border-neon-green/30 text-neon-green hover:bg-neon-green/20 flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Aprovar
              </button>
            )}
            <button
              onClick={onDelete}
              className="px-2.5 py-1 rounded-md text-[10px] bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CampaignBriefDetail({ wp }: { wp: CampaignBrief }) {
  return (
    <>
      <DetailField label="Objetivo" value={wp.objective} />
      <DetailField label="Prioridade" value={wp.priority} />
      <div>
        <div className="text-xs font-mono uppercase text-violet-muted mb-2">KPIs</div>
        <div className="space-y-1">
          {wp.kpis.map((kpi, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-violet-bg/30 border border-violet-subtle">
              <span className="text-xs text-cream">{kpi.name}</span>
              <span className="text-xs font-mono text-beige">{kpi.target}</span>
            </div>
          ))}
        </div>
      </div>
      <DetailField label="ICP" value={wp.audience.icpName} />
      {wp.audience.painPoints.length > 0 && (
        <DetailField label="Pain Points" value={wp.audience.painPoints.join(", ")} />
      )}
      <DetailField label="Proposta de Valor" value={wp.valueProposition.oneLiner} />
      <div>
        <div className="text-xs font-mono uppercase text-violet-muted mb-2">Key Messages</div>
        <ul className="space-y-1">
          {wp.positioning.keyMessages.map((msg, i) => (
            <li key={i} className="text-xs text-cream/90 flex items-start gap-2">
              <span className="text-beige">→</span> {msg}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <div className="text-xs font-mono uppercase text-violet-muted mb-2">Canais</div>
        <div className="flex flex-wrap gap-1.5">
          {wp.channels.map((ch) => (
            <span key={ch} className="text-[10px] font-mono px-2 py-0.5 rounded bg-beige/10 text-beige border border-beige/20">{ch}</span>
          ))}
        </div>
      </div>
      {wp.constraints.length > 0 && <DetailField label="Restrições" value={wp.constraints.join("; ")} />}
      {wp.assumptions.length > 0 && (
        <div>
          <div className="text-xs font-mono uppercase text-[#ff8a3d] mb-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Assunções (UNCONFIRMED)
          </div>
          <ul className="space-y-1">
            {wp.assumptions.map((a, i) => (
              <li key={i} className="text-xs text-[#ff8a3d]/80 flex items-start gap-2">
                <span>?</span> {a}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function ContentPlanDetail({ wp }: { wp: ContentPlan }) {
  return (
    <>
      <DetailField label="Período" value={`${wp.timeframe.start} → ${wp.timeframe.end}`} />
      <DetailField label="Estratégia" value={wp.strategySummary} />
      <div>
        <div className="text-xs font-mono uppercase text-violet-muted mb-2">Itens do Plano ({wp.items.length})</div>
        <div className="space-y-2">
          {wp.items.map((item, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-violet-bg/30 border border-violet-subtle">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-beige/10 text-beige border border-beige/20">{item.channel}</span>
                {item.targetDate && <span className="text-[9px] text-violet-muted">{item.targetDate}</span>}
              </div>
              <div className="text-xs text-cream">{item.theme}</div>
              <div className="text-[10px] text-violet-muted mt-0.5">Hook: {item.hook}</div>
              <div className="text-[10px] text-violet-muted">CTA: {item.cta}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function SocialPostCardDetail({ wp }: { wp: SocialPostCard }) {
  return (
    <>
      <DetailField label="Canal" value={wp.channel} />
      <DetailField label="Formato" value={wp.format} />
      <DetailField label="Hook" value={wp.hook} />
      <DetailField label="Body" value={wp.body} multiline />
      <DetailField label="CTA" value={wp.cta} />
      {wp.hashtags.length > 0 && (
        <div>
          <div className="text-xs font-mono uppercase text-violet-muted mb-2">Hashtags</div>
          <div className="flex flex-wrap gap-1">
            {wp.hashtags.map((h) => (
              <span key={h} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-violet-dark/40 text-violet-muted border border-violet-subtle">{h}</span>
            ))}
          </div>
        </div>
      )}
      {wp.creative.visualBrief && <DetailField label="Visual Brief" value={wp.creative.visualBrief} />}
      {wp.compliance.claimsToVerify.length > 0 && (
        <div>
          <div className="text-xs font-mono uppercase text-[#ff8a3d] mb-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Claims para Verificar
          </div>
          <ul className="space-y-1">
            {wp.compliance.claimsToVerify.map((c, i) => (
              <li key={i} className="text-xs text-[#ff8a3d]/80 flex items-start gap-2">
                <span>!</span> {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function DetailField({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <div className="text-xs font-mono uppercase text-violet-muted mb-1">{label}</div>
      <div className={`text-sm text-cream/90 ${multiline ? "whitespace-pre-wrap" : ""}`}>{value}</div>
    </div>
  );
}

function CreativeAssetDetail({ wp }: { wp: CreativeAsset }) {
  return (
    <>
      <DetailField label="Canal" value={wp.channel} />
      <DetailField label="Formato" value={wp.format} />
      <DetailField label="Conceito" value={wp.concept} />
      <DetailField label="Prompt" value={wp.prompt} multiline />
      {wp.negativePrompt && <DetailField label="Negative Prompt" value={wp.negativePrompt} />}
      {wp.textOverlay.headline && <DetailField label="Headline" value={wp.textOverlay.headline} />}
      {wp.textOverlay.subhead && <DetailField label="Subhead" value={wp.textOverlay.subhead} />}
      {wp.textOverlay.cta && <DetailField label="CTA" value={wp.textOverlay.cta} />}
      {wp.altText && <DetailField label="Alt Text" value={wp.altText} />}
      <div>
        <div className="text-xs font-mono uppercase text-violet-muted mb-2">Variações ({wp.variations.length})</div>
        <div className="grid grid-cols-2 gap-2">
          {wp.variations.map((v, i) => (
            <div key={i} className="p-2 rounded-lg bg-violet-bg/30 border border-violet-subtle">
              <div className="text-[10px] text-cream">{v.assetId}</div>
              <div className="text-[9px] text-violet-muted">{v.mimeType} · {v.width}×{v.height}</div>
              <div className="text-[9px] text-violet-muted font-mono truncate">{v.uri}</div>
            </div>
          ))}
        </div>
      </div>
      {wp.compliance.claimsToVerify.length > 0 && (
        <div>
          <div className="text-xs font-mono uppercase text-[#ff8a3d] mb-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Claims para Verificar
          </div>
          <ul className="space-y-1">
            {wp.compliance.claimsToVerify.map((c, i) => (
              <li key={i} className="text-xs text-[#ff8a3d]/80 flex items-start gap-2">
                <span>!</span> {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
