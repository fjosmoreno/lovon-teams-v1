// Lovon Teams — Work Products System
// Agents produce structured work products (campaign briefs, content plans, social cards)
// instead of long text reports. The UI renders these visually (kanban/calendar).

import { z } from "zod";

// === Common Types ===

export type WorkProductType = "campaign_brief" | "content_plan" | "social_post_card" | "creative_asset";
export type WorkProductStatus = "draft" | "in_review" | "approved" | "scheduled" | "published" | "archived";
export type Channel = "instagram" | "linkedin" | "x" | "tiktok" | "youtube" | "blog" | "email" | "website" | "ads";
export type Priority = "critical" | "high" | "medium" | "low";

// === Schemas ===

const NonEmpty = z.string().min(1);

export const WorkProductMetaSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  type: z.enum(["campaign_brief", "content_plan", "social_post_card", "creative_asset"]),
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

// === Creative Asset ===

export const CreativeAssetVariationSchema = z.object({
  assetId: NonEmpty,
  mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  uri: NonEmpty,
  previewUri: z.string().optional(),
});

export const CreativeAssetSchema = z.object({
  meta: WorkProductMetaSchema.extend({
    type: z.literal("creative_asset"),
  }),
  campaignBriefId: z.string().optional(),
  socialPostCardId: z.string().optional(),
  channel: z.enum(["instagram", "linkedin", "x", "tiktok", "youtube"]),
  format: z.enum(["single_image", "carousel_cover", "carousel_slide", "short_video_cover"]).default("single_image"),
  title: NonEmpty,
  concept: NonEmpty,
  prompt: NonEmpty,
  negativePrompt: z.string().default(""),
  styleHints: z.array(z.string()).default([]),
  seed: z.number().int().optional(),
  size: z.string().optional(),
  textOverlay: z.object({
    headline: z.string().optional(),
    subhead: z.string().optional(),
    cta: z.string().optional(),
  }).default({}),
  altText: z.string().optional(),
  variations: z.array(CreativeAssetVariationSchema).min(1),
  compliance: z.object({
    claimsToVerify: z.array(NonEmpty).default([]),
    forbiddenPhrasesTriggered: z.array(NonEmpty).default([]),
    notes: z.string().default(""),
  }).default({ claimsToVerify: [], forbiddenPhrasesTriggered: [], notes: "" }),
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
  CreativeAssetSchema,
]);

// === Types ===

export type CampaignBrief = z.infer<typeof CampaignBriefSchema>;
export type ContentPlan = z.infer<typeof ContentPlanSchema>;
export type SocialPostCard = z.infer<typeof SocialPostCardSchema>;
export type CreativeAsset = z.infer<typeof CreativeAssetSchema>;
export type WorkProduct = CampaignBrief | ContentPlan | SocialPostCard | CreativeAsset;
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

// P0 — Expanded capability catalog with granular web_development split
export type CapabilityId =
  | "web_search"
  | "email_send"
  | "email_schedule"
  | "image_generate"
  | "social_publish"
  | "crm_read"
  | "crm_write"
  | "analytics_read"
  // Granular web_development capabilities (replacing the broad "web_development" umbrella)
  | "repo_read"           // read files/PRs/issues from git repos
  | "repo_write"          // create PRs/commits/branches
  | "deploy_preview"      // deploy to preview/staging environment
  | "deploy_production"   // deploy to production
  | "web_build"           // run build/test commands
  | "domain_manage"       // manage DNS/domains
  | "custom_openapi"      // generic capability for custom OpenAPI integrations
  | "http_request";       // generic HTTP request (manual endpoint templates)

export type ProviderId =
  | "brave" | "resend" | "gemini" | "buffer" | "hubspot" | "umami" | "internal"
  | "openai" | "anthropic" | "groq" | "openrouter" | "deepseek" | "nvidia" | "minimax"
  | "github" | "vercel" | "netlify" | "cloudflare" | "gitlab"
  | "custom_openapi"      // user-pasted OpenAPI spec
  | "custom_http";        // manual endpoint templates

export interface IntegrationCredentials {
  apiKey?: string;
  bearerToken?: string;
  basic?: { user: string; pass: string };
}

export interface IntegrationConfig {
  // Non-secret configuration
  baseUrl?: string;
  models?: string[];              // for AI providers: which models are allowed
  openapi?: unknown;              // for custom_openapi: the parsed OpenAPI spec
  allowedOperations?: string[];   // for custom_openapi: allowlist of operationId
  requiresApprovalForOperations?: string[]; // dangerous ops that need approval
  endpoints?: ManualEndpoint[];   // for custom_http: manual endpoint templates
  [key: string]: unknown;         // extensible
}

export interface ManualEndpoint {
  id: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;                   // path template, e.g. "/repos/{owner}/{repo}/issues"
  headers?: Record<string, string>;
  bodyTemplate?: string;          // JSON template with {{variables}}
  capabilityAction: string;       // what capability action this endpoint maps to
  description?: string;
}

export interface Integration {
  id: string;
  workspaceId: string;
  name: string;                    // "Brave Search Principal"
  providerKey: ProviderId;         // ex: "resend", "brave", "custom_openapi"
  capabilities: CapabilityId[];
  status: "active" | "disabled" | "error";
  // Non-secret config (baseUrl, models, openapi spec, endpoints, etc.)
  config: IntegrationConfig;
  // Secret reference — the actual key lives in vault, not in the store
  secretRef: string;               // vault://integration/<id>
  // What credentials type was configured (for UI display — never the value itself)
  credentialsType?: "api_key" | "bearer" | "basic" | "none";
  limits: { perRun?: number; perDay?: number; perMonth?: number };
  allowedAgentSlugs: string[];     // empty = all agents can use
  createdAt: number;
  updatedAt: number;
  lastTestedAt?: number;
  lastTestResult?: { ok: boolean; message: string; testedAt: number };
}

export interface CapabilityBinding {
  capability: CapabilityId;
  integrationId: string;           // which integration serves this capability
  updatedAt: number;
}

export const CAPABILITY_CATALOG: { id: CapabilityId; name: string; description: string; category: string }[] = [
  // Communication
  { id: "web_search", name: "Web Search", description: "Pesquisa na web e retorna links e snippets", category: "Comunicação" },
  { id: "email_send", name: "Email Send", description: "Envio de emails transacionais/campanha", category: "Comunicação" },
  { id: "email_schedule", name: "Email Schedule", description: "Agendamento de emails para envio futuro", category: "Comunicação" },
  { id: "social_publish", name: "Social Publish", description: "Publica em redes sociais (LinkedIn, X, Instagram)", category: "Comunicação" },
  // Content
  { id: "image_generate", name: "Image Generation", description: "Gera imagens a partir de prompt de texto", category: "Conteúdo" },
  // CRM
  { id: "crm_read", name: "CRM Read", description: "Leitura de contatos/deals/pipeline do CRM", category: "CRM" },
  { id: "crm_write", name: "CRM Write", description: "Criação/atualização de registros no CRM", category: "CRM" },
  // Analytics
  { id: "analytics_read", name: "Analytics Read", description: "Leitura de métricas de tráfego/conversão", category: "Analytics" },
  // Web Development (granular)
  { id: "repo_read", name: "Repo Read", description: "Ler arquivos, PRs, issues de repositórios git", category: "Web Dev" },
  { id: "repo_write", name: "Repo Write", description: "Criar PRs, commits, branches em repositórios", category: "Web Dev" },
  { id: "deploy_preview", name: "Deploy Preview", description: "Deploy para ambiente de preview/staging", category: "Web Dev" },
  { id: "deploy_production", name: "Deploy Production", description: "Deploy para produção (requer approval)", category: "Web Dev" },
  { id: "web_build", name: "Web Build", description: "Executar build/test/lint commands", category: "Web Dev" },
  { id: "domain_manage", name: "Domain Manage", description: "Gerenciar DNS e domínios", category: "Web Dev" },
  // Generic
  { id: "custom_openapi", name: "Custom OpenAPI", description: "Integração customizada via spec OpenAPI", category: "Custom" },
  { id: "http_request", name: "HTTP Request", description: "Requisição HTTP genérica (endpoint manual)", category: "Custom" },
];

export const PROVIDER_CAPABILITIES: Partial<Record<ProviderId, CapabilityId[]>> = {
  brave: ["web_search"],
  resend: ["email_send", "email_schedule"],
  gemini: ["image_generate"],
  buffer: ["social_publish"],
  hubspot: ["crm_read", "crm_write"],
  umami: ["analytics_read"],
  internal: ["web_search", "email_send", "email_schedule", "analytics_read"],
  openai: [],  // AI providers don't map to tool capabilities — they're LLM backends
  anthropic: [],
  groq: [],
  openrouter: [],
  deepseek: [],
  github: ["repo_read", "repo_write"],
  gitlab: ["repo_read", "repo_write"],
  vercel: ["deploy_preview", "deploy_production", "domain_manage"],
  netlify: ["deploy_preview", "deploy_production"],
  cloudflare: ["deploy_preview", "deploy_production", "domain_manage"],
  custom_openapi: ["custom_openapi"],
  custom_http: ["http_request"],
};

// Provider metadata for UI — presets with suggested config
export interface ProviderPreset {
  key: ProviderId;
  name: string;
  category: "AI" | "Email" | "Search" | "Web Dev" | "CRM" | "Analytics" | "Social" | "Custom";
  description: string;
  suggestedCapabilities: CapabilityId[];
  authType: "api_key" | "bearer" | "basic" | "none";
  configFields?: { key: string; label: string; placeholder?: string; required?: boolean }[];
  docsUrl?: string;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  // AI Providers
  { key: "openai", name: "OpenAI", category: "AI", description: "GPT-4, GPT-3.5, DALL-E", suggestedCapabilities: [], authType: "api_key", configFields: [{ key: "models", label: "Modelos permitidos (comma-separated)", placeholder: "gpt-4,gpt-3.5-turbo" }], docsUrl: "https://platform.openai.com/api-keys" },
  { key: "anthropic", name: "Anthropic", category: "AI", description: "Claude Opus, Sonnet, Haiku", suggestedCapabilities: [], authType: "api_key", docsUrl: "https://console.anthropic.com/" },
  { key: "groq", name: "Groq", category: "AI", description: "Llama, Mixtral (ultra-fast inference)", suggestedCapabilities: [], authType: "api_key", docsUrl: "https://console.groq.com/keys" },
  { key: "openrouter", name: "OpenRouter", category: "AI", description: "Multi-provider router (200+ models)", suggestedCapabilities: [], authType: "api_key", docsUrl: "https://openrouter.ai/keys" },
  { key: "deepseek", name: "DeepSeek", category: "AI", description: "DeepSeek V3, R1 (cost-effective)", suggestedCapabilities: [], authType: "api_key", docsUrl: "https://platform.deepseek.com/" },
  // Email
  { key: "resend", name: "Resend", category: "Email", description: "Email transacional e campanhas", suggestedCapabilities: ["email_send", "email_schedule"], authType: "api_key", docsUrl: "https://resend.com/api-keys" },
  // Search
  { key: "brave", name: "Brave Search", category: "Search", description: "Web search API", suggestedCapabilities: ["web_search"], authType: "api_key", docsUrl: "https://api.search.brave.com/" },
  // Web Dev
  { key: "github", name: "GitHub", category: "Web Dev", description: "Repos, PRs, issues, commits", suggestedCapabilities: ["repo_read", "repo_write"], authType: "bearer", configFields: [{ key: "baseUrl", label: "Base URL (opcional para Enterprise)", placeholder: "https://api.github.com" }], docsUrl: "https://github.com/settings/tokens" },
  { key: "gitlab", name: "GitLab", category: "Web Dev", description: "Repos, MRs, pipelines", suggestedCapabilities: ["repo_read", "repo_write"], authType: "bearer", docsUrl: "https://gitlab.com/-/profile/personal_access_tokens" },
  { key: "vercel", name: "Vercel", category: "Web Dev", description: "Deploy preview/production, domains", suggestedCapabilities: ["deploy_preview", "deploy_production", "domain_manage"], authType: "bearer", docsUrl: "https://vercel.com/account/tokens" },
  { key: "netlify", name: "Netlify", category: "Web Dev", description: "Deploy e sites estáticos", suggestedCapabilities: ["deploy_preview", "deploy_production"], authType: "bearer", docsUrl: "https://app.netlify.com/user/applications" },
  { key: "cloudflare", name: "Cloudflare", category: "Web Dev", description: "Pages, Workers, DNS", suggestedCapabilities: ["deploy_preview", "deploy_production", "domain_manage"], authType: "bearer", docsUrl: "https://dash.cloudflare.com/profile/api-tokens" },
  // CRM
  { key: "hubspot", name: "HubSpot", category: "CRM", description: "Contacts, deals, pipeline", suggestedCapabilities: ["crm_read", "crm_write"], authType: "api_key", docsUrl: "https://developers.hubspot.com/" },
  // Analytics
  { key: "umami", name: "Umami", category: "Analytics", description: "Privacy-first web analytics", suggestedCapabilities: ["analytics_read"], authType: "api_key", docsUrl: "https://umami.is/" },
  // Social
  { key: "buffer", name: "Buffer", category: "Social", description: "Multi-platform social publishing", suggestedCapabilities: ["social_publish"], authType: "api_key", docsUrl: "https://buffer.com/developers" },
  // Custom
  { key: "custom_openapi", name: "Custom OpenAPI", category: "Custom", description: "Cole um spec OpenAPI e gere tools automaticamente", suggestedCapabilities: ["custom_openapi"], authType: "api_key", docsUrl: "https://swagger.io/specification/" },
  { key: "custom_http", name: "Custom HTTP (manual)", category: "Custom", description: "Cadastra endpoints manualmente com templates", suggestedCapabilities: ["http_request"], authType: "api_key" },
];
