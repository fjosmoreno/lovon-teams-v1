// Lovon Teams — Work Products System
// Agents produce structured work products (campaign briefs, content plans, social cards)
// instead of long text reports. The UI renders these visually (kanban/calendar).

import { z } from "zod";

// === Common Types ===

export type WorkProductType = "campaign_brief" | "content_plan" | "social_post_card";
export type WorkProductStatus = "draft" | "in_review" | "approved" | "scheduled" | "published" | "archived";
export type Channel = "instagram" | "linkedin" | "x" | "tiktok" | "youtube" | "blog" | "email" | "website" | "ads";
export type Priority = "critical" | "high" | "medium" | "low";

// === Schemas ===

const NonEmpty = z.string().min(1);

export const WorkProductMetaSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  type: z.enum(["campaign_brief", "content_plan", "social_post_card"]),
  version: z.string().default("1.0"),
  status: z.enum(["draft", "in_review", "approved", "scheduled", "published", "archived"]).default("draft"),
  createdAt: z.string(),
  createdBy: z.object({
    kind: z.literal("agent"),
    agentSlug: z.string().min(1),
  }),
  traceId: z.string().optional(),
  sourceTaskId: z.string().optional(),
  parentInitiativeId: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export const KPIItemSchema = z.object({
  name: NonEmpty,
  target: NonEmpty,
  measurement: z.string().optional(),
});

export const AudienceSchema = z.object({
  icpName: NonEmpty,
  painPoints: z.array(z.string()).default([]),
  objections: z.array(z.string()).default([]),
  desiredOutcome: z.string().optional(),
});

export const ValuePropSchema = z.object({
  oneLiner: NonEmpty,
  proofPoints: z.array(z.string()).default([]),
  differentiators: z.array(z.string()).default([]),
});

export const SourceCitationSchema = z.object({
  kind: z.enum(["kb", "web", "user_input"]),
  title: z.string().optional(),
  url: z.string().url().optional(),
  kbItemId: z.string().optional(),
  excerpt: z.string().max(600).optional(),
});

// === Campaign Brief ===

export const CampaignBriefSchema = z.object({
  meta: WorkProductMetaSchema.extend({
    type: z.literal("campaign_brief"),
  }),
  name: NonEmpty,
  priority: z.enum(["critical", "high", "medium", "low"]).default("medium"),
  objective: NonEmpty,
  kpis: z.array(KPIItemSchema).min(1),
  audience: AudienceSchema,
  valueProposition: ValuePropSchema,
  offer: z.object({
    primaryCTA: NonEmpty,
    landingPageUrl: z.string().url().optional(),
    pricingNotes: z.string().optional(),
  }),
  positioning: z.object({
    tone: NonEmpty,
    keyMessages: z.array(NonEmpty).min(1),
    doSay: z.array(z.string()).default([]),
    doNotSay: z.array(z.string()).default([]),
  }),
  channels: z.array(z.enum([
    "instagram", "linkedin", "x", "tiktok", "youtube", "blog", "email", "website", "ads"
  ])).min(1),
  constraints: z.array(z.string()).default([]),
  assumptions: z.array(z.string()).default([]),
  citations: z.array(SourceCitationSchema).default([]),
  approval: z.object({
    requiresBoardApproval: z.boolean().default(true),
    confirmationRequestId: z.string().optional(),
  }).default({ requiresBoardApproval: true }),
});

// === Content Plan ===

export const ContentPlanItemSchema = z.object({
  id: z.string().min(1),
  channel: z.enum(["instagram", "linkedin", "x", "tiktok", "youtube", "blog", "email", "website", "ads"]),
  theme: NonEmpty,
  hook: NonEmpty,
  cta: NonEmpty,
  targetDate: z.string().optional(),
  linkedPostCardId: z.string().optional(),
});

export const ContentPlanSchema = z.object({
  meta: WorkProductMetaSchema.extend({
    type: z.literal("content_plan"),
  }),
  campaignBriefId: z.string().min(1),
  timeframe: z.object({
    start: z.string(),
    end: z.string(),
  }),
  strategySummary: NonEmpty,
  postingCadence: z.record(z.string(), z.string()).default({}),
  items: z.array(ContentPlanItemSchema).min(1),
  citations: z.array(SourceCitationSchema).default([]),
  approval: z.object({
    requiresBoardApproval: z.boolean().default(true),
    confirmationRequestId: z.string().optional(),
  }).default({ requiresBoardApproval: true }),
});

// === Social Post Card ===

export const SocialPostCardSchema = z.object({
  meta: WorkProductMetaSchema.extend({
    type: z.literal("social_post_card"),
  }),
  campaignBriefId: z.string().min(1),
  channel: z.enum(["instagram", "linkedin", "x", "tiktok", "youtube"]),
  format: z.enum(["single_image", "carousel", "short_video", "text_only", "thread"]).default("text_only"),
  title: NonEmpty,
  hook: NonEmpty,
  body: NonEmpty,
  cta: NonEmpty,
  hashtags: z.array(z.string()).default([]),
  creative: z.object({
    visualBrief: z.string().optional(),
    imagePrompt: z.string().optional(),
    altText: z.string().optional(),
  }).default({}),
  compliance: z.object({
    claimsToVerify: z.array(z.string()).default([]),
    forbiddenPhrasesTriggered: z.array(z.string()).default([]),
  }).default({ claimsToVerify: [], forbiddenPhrasesTriggered: [] }),
  schedule: z.object({
    suggestedAt: z.string().optional(),
    scheduledAt: z.string().optional(),
    publishedAt: z.string().optional(),
  }).default({}),
  citations: z.array(SourceCitationSchema).default([]),
  approval: z.object({
    requiresBoardApproval: z.boolean().default(true),
    confirmationRequestId: z.string().optional(),
  }).default({ requiresBoardApproval: true }),
});

// === Union ===

export const WorkProductSchema = z.union([
  CampaignBriefSchema,
  ContentPlanSchema,
  SocialPostCardSchema,
]);

// === Types ===

export type CampaignBrief = z.infer<typeof CampaignBriefSchema>;
export type ContentPlan = z.infer<typeof ContentPlanSchema>;
export type SocialPostCard = z.infer<typeof SocialPostCardSchema>;
export type WorkProduct = CampaignBrief | ContentPlan | SocialPostCard;
export type KPIItem = z.infer<typeof KPIItemSchema>;

// === Helpers ===

export function validateWorkProduct(obj: unknown): { success: boolean; data?: WorkProduct; error?: string } {
  const result = WorkProductSchema.safeParse(obj);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
}

export function getWorkProductType(wp: WorkProduct): WorkProductType {
  return wp.meta.type;
}

export function getWorkProductStatus(wp: WorkProduct): WorkProductStatus {
  return wp.meta.status;
}

// === Integrations / Capabilities System ===

export type CapabilityId =
  | "web_search"
  | "email_send"
  | "email_schedule"
  | "image_generate"
  | "social_publish"
  | "crm_read"
  | "crm_write"
  | "analytics_read";

export type ProviderId = "brave" | "resend" | "gemini" | "buffer" | "hubspot" | "umami" | "internal";

export interface Integration {
  id: string;
  workspaceId: string;
  name: string;              // "Brave Search Principal"
  provider: ProviderId;
  capabilities: CapabilityId[];
  secretRef: string;         // vault reference
  limits: { perRun?: number; perDay?: number; perMonth?: number };
  allowedAgentSlugs: string[];
  status: "active" | "disabled" | "error";
  isDefault: Record<CapabilityId, boolean>; // which capabilities this is default for
  createdAt: number;
  lastTestedAt?: number;
  lastTestResult?: { ok: boolean; message: string };
}

export interface CapabilityBinding {
  capability: CapabilityId;
  integrationId: string;     // default integration for this capability
}

export const CAPABILITY_CATALOG: { id: CapabilityId; name: string; description: string }[] = [
  { id: "web_search", name: "Web Search", description: "Pesquisa na web e retorna links e snippets" },
  { id: "email_send", name: "Email Send", description: "Envio de emails" },
  { id: "email_schedule", name: "Email Schedule", description: "Agendamento de emails" },
  { id: "image_generate", name: "Image Generation", description: "Gera imagens a partir de prompt" },
  { id: "social_publish", name: "Social Publish", description: "Publica em redes sociais" },
  { id: "crm_read", name: "CRM Read", description: "Leitura de dados do CRM" },
  { id: "crm_write", name: "CRM Write", description: "Escrita no CRM" },
  { id: "analytics_read", name: "Analytics Read", description: "Leitura de métricas/analytics" },
];

export const PROVIDER_CAPABILITIES: Record<ProviderId, CapabilityId[]> = {
  brave: ["web_search"],
  resend: ["email_send", "email_schedule"],
  gemini: ["image_generate"],
  buffer: ["social_publish"],
  hubspot: ["crm_read", "crm_write"],
  umami: ["analytics_read"],
  internal: ["web_search", "email_send", "email_schedule", "analytics_read"],
};
