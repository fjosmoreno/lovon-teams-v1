"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, X, Sparkles, Copy, Link2, Calendar, Tag, Download } from "lucide-react";
import { CreativeAsset } from "@/lib/lovon/work-products";
import { StatusChip, PriorityChip } from "../design-system";

interface AssetGalleryProps {
  assets: CreativeAsset[];
  onLinkToPostCard?: (assetId: string) => void;
}

export function AssetGallery({ assets, onLinkToPostCard }: AssetGalleryProps) {
  const [selected, setSelected] = useState<CreativeAsset | null>(null);

  if (assets.length === 0) {
    return (
      <div className="text-center py-16">
        <Image className="w-12 h-12 mx-auto text-violet-muted/30 mb-3" />
        <p className="text-sm text-violet-muted">Nenhum creative asset ainda.</p>
        <p className="text-xs text-violet-muted/70 mt-1">
          Gere um via Marketing Lead + skill image-generation.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {assets.map((asset, i) => (
          <motion.div
            key={asset.meta.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(i * 0.04, 0.4) }}
            onClick={() => setSelected(asset)}
            className="work-product-card group p-3 cursor-pointer"
          >
            {/* Thumbnail */}
            <div className="aspect-square rounded-lg overflow-hidden bg-violet-bg/40 mb-3 relative">
              {asset.variations[0]?.uri ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={asset.variations[0].uri}
                  alt={asset.altText ?? asset.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="w-8 h-8 text-violet-muted/40" />
                </div>
              )}
              {/* Channel badge */}
              <div className="absolute top-1.5 left-1.5">
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-black/60 text-cream backdrop-blur-sm">
                  {asset.channel}
                </span>
              </div>
              {/* Variations count */}
              {asset.variations.length > 1 && (
                <div className="absolute top-1.5 right-1.5">
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-beige backdrop-blur-sm">
                    +{asset.variations.length - 1}
                  </span>
                </div>
              )}
            </div>

            {/* Title + status */}
            <div className="text-sm font-semibold text-cream truncate mb-1">{asset.title}</div>
            <div className="text-[10px] text-violet-muted line-clamp-1 mb-2">{asset.concept}</div>
            <StatusChip status={asset.meta.status} />
          </motion.div>
        ))}
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <AssetDetailModal
            asset={selected}
            onClose={() => setSelected(null)}
            onLinkToPostCard={onLinkToPostCard}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function AssetDetailModal({
  asset,
  onClose,
  onLinkToPostCard,
}: {
  asset: CreativeAsset;
  onClose: () => void;
  onLinkToPostCard?: (assetId: string) => void;
}) {
  const [activeVariation, setActiveVariation] = useState(0);
  const variation = asset.variations[activeVariation];

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
        className="relative w-full max-w-4xl max-h-[88vh] flex flex-col rounded-2xl glass-strong border border-violet-subtle overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-violet-subtle">
          <div>
            <h3 className="text-lg font-semibold text-cream font-serif-display">{asset.title}</h3>
            <p className="text-xs text-violet-muted mt-0.5">{asset.concept}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-violet-muted hover:text-cream"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body — split view: image left, metadata right */}
        <div className="flex-1 overflow-y-auto no-scrollbar grid md:grid-cols-2 gap-0">
          {/* Image side */}
          <div className="p-5 bg-violet-bg/30">
            {/* Main image */}
            <div className="aspect-square rounded-xl overflow-hidden bg-violet-bg/40 mb-3 relative">
              {variation?.uri ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={variation.uri} alt={asset.altText ?? asset.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Image className="w-12 h-12 text-violet-muted/40" />
                </div>
              )}
            </div>

            {/* Variation thumbnails */}
            {asset.variations.length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {asset.variations.map((v, i) => (
                  <button
                    key={v.assetId}
                    onClick={() => setActiveVariation(i)}
                    className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      i === activeVariation ? "border-beige" : "border-violet-subtle hover:border-violet-border-strong"
                    }`}
                  >
                    {v.uri && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.uri} alt="" className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-4 flex items-center gap-2">
              {onLinkToPostCard && (
                <button
                  onClick={() => onLinkToPostCard(asset.meta.id)}
                  className="btn-pill btn-primary-neon text-xs flex-1"
                >
                  <Link2 className="w-3.5 h-3.5" /> Vincular ao post card
                </button>
              )}
              {variation?.uri && (
                <a
                  href={variation.uri}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-lg text-xs bg-white/5 border border-violet-subtle text-violet-muted hover:text-cream flex items-center gap-1.5"
                >
                  <Download className="w-3 h-3" /> Baixar
                </a>
              )}
            </div>
          </div>

          {/* Metadata side */}
          <div className="p-5 space-y-4 overflow-y-auto no-scrollbar">
            {/* Status + priority */}
            <div className="flex items-center gap-2 flex-wrap">
              <StatusChip status={asset.meta.status} />
              <span className="text-[10px] text-violet-muted font-mono">
                v{asset.meta.version}
              </span>
            </div>

            {/* Channel + format */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-violet-bg/40 border border-violet-subtle">
                <div className="text-[9px] font-mono uppercase text-violet-muted mb-1">Canal</div>
                <div className="text-sm text-cream capitalize">{asset.channel}</div>
              </div>
              <div className="p-3 rounded-lg bg-violet-bg/40 border border-violet-subtle">
                <div className="text-[9px] font-mono uppercase text-violet-muted mb-1">Formato</div>
                <div className="text-sm text-cream">{asset.format.replace(/_/g, " ")}</div>
              </div>
            </div>

            {/* Prompt */}
            <div>
              <div className="text-[10px] font-mono uppercase text-beige mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Prompt
              </div>
              <div className="p-3 rounded-lg bg-black/30 border border-violet-subtle text-xs text-cream leading-relaxed font-mono">
                {asset.prompt}
              </div>
            </div>

            {/* Negative prompt */}
            {asset.negativePrompt && (
              <div>
                <div className="text-[10px] font-mono uppercase text-violet-muted mb-1.5">
                  Negative prompt
                </div>
                <div className="p-2 rounded-lg bg-black/20 border border-violet-subtle text-[11px] text-violet-muted leading-relaxed font-mono">
                  {asset.negativePrompt}
                </div>
              </div>
            )}

            {/* Style hints */}
            {asset.styleHints.length > 0 && (
              <div>
                <div className="text-[10px] font-mono uppercase text-violet-muted mb-1.5 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Style hints
                </div>
                <div className="flex flex-wrap gap-1">
                  {asset.styleHints.map((s, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-beige/10 text-beige border border-beige/20">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Text overlay */}
            {(asset.textOverlay.headline || asset.textOverlay.subhead || asset.textOverlay.cta) && (
              <div>
                <div className="text-[10px] font-mono uppercase text-beige mb-1.5">
                  Text overlay
                </div>
                <div className="p-3 rounded-lg bg-beige/5 border border-beige/20 space-y-1">
                  {asset.textOverlay.headline && (
                    <div className="text-sm font-bold text-cream">{asset.textOverlay.headline}</div>
                  )}
                  {asset.textOverlay.subhead && (
                    <div className="text-xs text-violet-muted">{asset.textOverlay.subhead}</div>
                  )}
                  {asset.textOverlay.cta && (
                    <div className="text-xs text-beige font-semibold">→ {asset.textOverlay.cta}</div>
                  )}
                </div>
              </div>
            )}

            {/* Variation metadata */}
            {variation && (
              <div>
                <div className="text-[10px] font-mono uppercase text-violet-muted mb-1.5">
                  Variação #{activeVariation + 1}
                </div>
                <div className="p-3 rounded-lg bg-black/20 border border-violet-subtle text-[10px] text-violet-muted font-mono space-y-0.5">
                  <div>ID: <span className="text-cream">{variation.assetId}</span></div>
                  <div>Dimensions: <span className="text-cream">{variation.width}×{variation.height}</span></div>
                  <div>MIME: <span className="text-cream">{variation.mimeType}</span></div>
                  {asset.seed && <div>Seed: <span className="text-cream">{asset.seed}</span></div>}
                </div>
              </div>
            )}

            {/* Compliance */}
            {(asset.compliance.claimsToVerify.length > 0 || asset.compliance.forbiddenPhrasesTriggered.length > 0 || asset.compliance.notes) && (
              <div className="p-3 rounded-lg bg-[#ff8a3d]/5 border border-[#ff8a3d]/20">
                <div className="text-[10px] font-mono uppercase text-[#ff8a3d] mb-1.5">Compliance</div>
                {asset.compliance.claimsToVerify.length > 0 && (
                  <div className="text-[11px] text-violet-muted mb-1">
                    <span className="text-cream">Claims a verificar:</span> {asset.compliance.claimsToVerify.join(", ")}
                  </div>
                )}
                {asset.compliance.forbiddenPhrasesTriggered.length > 0 && (
                  <div className="text-[11px] text-red-400 mb-1">
                    <span className="text-cream">Frases proibidas:</span> {asset.compliance.forbiddenPhrasesTriggered.join(", ")}
                  </div>
                )}
                {asset.compliance.notes && (
                  <div className="text-[11px] text-violet-muted">{asset.compliance.notes}</div>
                )}
              </div>
            )}

            {/* Source task */}
            {asset.meta.sourceTaskId && (
              <div className="text-[10px] text-violet-muted font-mono flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5" />
                Origem: task {asset.meta.sourceTaskId}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
