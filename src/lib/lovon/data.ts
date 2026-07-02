// Lovon platform data — providers, agents, routing tiers, marketplace catalog

export type ProviderTier = "free" | "premium" | "local";

export interface Provider {
  id: string;
  name: string;
  tier: ProviderTier;
  description: string;
  badge?: string;
  speed?: "slow" | "fast" | "very-fast";
  quality?: number; // 1-5
  models: string[];
  accent: "green" | "blue" | "purple" | "acid" | "orange";
}

export const PROVIDERS: Provider[] = [
  // Free tier
  {
    id: "gemini-free",
    name: "Google Gemini (Free)",
    tier: "free",
    description: "Camada gratuita permanente do Gemini. Excelente para atendimento e pesquisas.",
    badge: "Grátis",
    speed: "very-fast",
    quality: 4,
    models: ["gemini-1.5-flash", "gemini-2.0-flash-exp"],
    accent: "blue",
  },
  {
    id: "github-models",
    name: "GitHub Models",
    tier: "free",
    description: "Acesso gratuito a GPT-4o, Llama e Phi via GitHub. Ideal para protótipos.",
    badge: "Grátis",
    speed: "fast",
    quality: 4,
    models: ["gpt-4o", "llama-3.1-70b", "phi-3"],
    accent: "green",
  },
  {
    id: "groq",
    name: "Groq",
    tier: "free",
    description: "Inferência ultra-rápida em LPU. Melhor latência do mercado.",
    badge: "Grátis",
    speed: "very-fast",
    quality: 4,
    models: ["llama-3.3-70b-versatile", "mixtral-8x7b"],
    accent: "orange",
  },
  {
    id: "cloudflare-ai",
    name: "Cloudflare Workers AI",
    tier: "free",
    description: "Inferência na edge global da Cloudflare. Baixa latência em todo o mundo.",
    badge: "Grátis",
    speed: "fast",
    quality: 3,
    models: ["llama-3-8b", "mistral-7b", "qwen-1.5-14b"],
    accent: "orange",
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    tier: "free",
    description: "Serverless Inference API com milhares de modelos open source.",
    badge: "Grátis",
    speed: "fast",
    quality: 3,
    models: ["mistral-7b", "falcon-180b", "zephyr-7b"],
    accent: "acid",
  },
  {
    id: "cohere",
    name: "Cohere",
    tier: "free",
    description: "Command R+ otimizado para RAG e uso empresarial. Trial gratuito generoso.",
    badge: "Grátis",
    speed: "fast",
    quality: 4,
    models: ["command-r-plus", "command-r"],
    accent: "purple",
  },
  {
    id: "mistral-free",
    name: "Mistral La Plateforme",
    tier: "free",
    description: "Free tier da Mistral com modelos open source e mistral-small.",
    badge: "Grátis",
    speed: "fast",
    quality: 4,
    models: ["mistral-small-latest", "open-mistral-7b"],
    accent: "blue",
  },
  {
    id: "openrouter-free",
    name: "OpenRouter (Free)",
    tier: "free",
    description: "Agrega todos os modelos gratuitos de múltiplos provedores em uma API.",
    badge: "Grátis",
    speed: "fast",
    quality: 4,
    models: ["free:llama-3.3-70b", "free:gemma-2-9b", "free:qwen-2.5-72b"],
    accent: "green",
  },

  // Premium tier
  {
    id: "openai",
    name: "OpenAI",
    tier: "premium",
    description: "GPT-4.1, GPT-4o, o3 e Codex. Padrão da indústria para tarefas complexas.",
    badge: "Premium",
    speed: "fast",
    quality: 5,
    models: ["gpt-4.1", "gpt-4o", "o3-mini", "codex-mini"],
    accent: "green",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    tier: "premium",
    description: "Claude Opus 4 e Sonnet 4. Melhor raciocínio longo do mercado.",
    badge: "Premium",
    speed: "fast",
    quality: 5,
    models: ["claude-opus-4", "claude-sonnet-4", "claude-haiku-4"],
    accent: "purple",
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    tier: "premium",
    description: "Gemini 2.5 Pro com janela de contexto de 2M tokens.",
    badge: "Premium",
    speed: "very-fast",
    quality: 5,
    models: ["gemini-2.5-pro", "gemini-2.5-flash"],
    accent: "blue",
  },
  {
    id: "openrouter-premium",
    name: "OpenRouter (Premium)",
    tier: "premium",
    description: "Acesso unificado a todos os modelos pagos. Faturamento consolidado.",
    badge: "Premium",
    speed: "fast",
    quality: 5,
    models: ["anthropic/claude-opus-4", "openai/gpt-4.1", "google/gemini-2.5-pro"],
    accent: "green",
  },
  {
    id: "xai",
    name: "xAI",
    tier: "premium",
    description: "Grok 4 com raciocínio avançado e acesso a dados em tempo real do X.",
    badge: "Premium",
    speed: "fast",
    quality: 5,
    models: ["grok-4", "grok-4-fast"],
    accent: "blue",
  },
  {
    id: "deepseek",
    name: "DeepSeek API",
    tier: "premium",
    description: "Custo-benefício imbatível. Raciocínio (R1) a preço de modelo pequeno.",
    badge: "Premium",
    speed: "fast",
    quality: 5,
    models: ["deepseek-r1", "deepseek-v3", "deepseek-coder"],
    accent: "blue",
  },
  {
    id: "mistral-ent",
    name: "Mistral Enterprise",
    tier: "premium",
    description: "Large/Medium para cargas enterprise. SLA e deploy privado disponíveis.",
    badge: "Premium",
    speed: "very-fast",
    quality: 5,
    models: ["mistral-large-latest", "mistral-medium-latest"],
    accent: "purple",
  },

  // Local tier
  {
    id: "ollama",
    name: "Ollama",
    tier: "local",
    description: "Rode Llama, Qwen, DeepSeek e mais localmente. 100% privado e gratuito.",
    badge: "Local",
    speed: "fast",
    quality: 4,
    models: ["llama3.3:70b", "qwen2.5:32b", "deepseek-r1:32b"],
    accent: "green",
  },
  {
    id: "lm-studio",
    name: "LM Studio",
    tier: "local",
    description: "GUI desktop para qualquer modelo GGUF. Compatível com API OpenAI.",
    badge: "Local",
    speed: "fast",
    quality: 4,
    models: ["any-gguf-model"],
    accent: "blue",
  },
  {
    id: "vllm",
    name: "vLLM",
    tier: "local",
    description: "Servidor de inferência otimizado para GPU. Throughput máximo.",
    badge: "Local",
    speed: "very-fast",
    quality: 5,
    models: ["any-hf-model"],
    accent: "orange",
  },
  {
    id: "localai",
    name: "LocalAI",
    tier: "local",
    description: "Drop-in replacement self-hosted para OpenAI. Funciona em CPU.",
    badge: "Local",
    speed: "slow",
    quality: 3,
    models: ["any-gguf-model"],
    accent: "purple",
  },
  {
    id: "llamacpp",
    name: "llama.cpp",
    tier: "local",
    description: "Motor C++ puro. Funciona em qualquer hardware, do Raspberry Pi ao H100.",
    badge: "Local",
    speed: "fast",
    quality: 4,
    models: ["any-gguf-model"],
    accent: "acid",
  },
];

export interface AgentProfile {
  id: string;
  name: string;
  role: string;
  specialty: string;
  status: "active" | "idle" | "thinking";
  tasksRunning: number;
  model: string;
  accent: "green" | "blue" | "purple" | "acid" | "orange";
  emoji: string;
}

export const AI_AGENTS: AgentProfile[] = [
  { id: "ceo", name: "Lovon CEO", role: "AI CEO Agent", specialty: "Strategy", status: "active", tasksRunning: 12, model: "GPT-4.1", accent: "green", emoji: "◆" },
  { id: "sales", name: "Sales Agent", role: "AI Sales Agent", specialty: "Outbound", status: "active", tasksRunning: 47, model: "Gemini Flash", accent: "blue", emoji: "▲" },
  { id: "research", name: "Research Agent", role: "AI Research Agent", specialty: "Deep Web", status: "thinking", tasksRunning: 3, model: "Claude Opus", accent: "purple", emoji: "●" },
  { id: "marketing", name: "Marketing Agent", role: "AI Marketing Agent", specialty: "Copy", status: "active", tasksRunning: 18, model: "Qwen 2.5", accent: "acid", emoji: "✦" },
  { id: "code", name: "Code Agent", role: "AI Code Agent", specialty: "TypeScript", status: "active", tasksRunning: 6, model: "Claude Sonnet", accent: "green", emoji: "◇" },
  { id: "support", name: "Support Agent", role: "AI Support Agent", specialty: "24/7 Chat", status: "active", tasksRunning: 92, model: "Groq Llama", accent: "orange", emoji: "■" },
  { id: "ops", name: "Ops Agent", role: "AI Ops Agent", specialty: "Automation", status: "active", tasksRunning: 24, model: "DeepSeek V3", accent: "blue", emoji: "◯" },
  { id: "data", name: "Data Agent", role: "AI Data Agent", specialty: "Analytics", status: "thinking", tasksRunning: 7, model: "Mistral Large", accent: "purple", emoji: "◈" },
  { id: "local", name: "Local Agent", role: "AI Local Agent", specialty: "On-Prem", status: "active", tasksRunning: 5, model: "Ollama Llama 70B", accent: "green", emoji: "◐" },
  { id: "vision", name: "Vision Agent", role: "AI Vision Agent", specialty: "OCR / Vision", status: "active", tasksRunning: 11, model: "Gemini 2.5 Pro", accent: "blue", emoji: "◉" },
];

export interface RoutingStep {
  id: string;
  label: string;
  model: string;
  cost: string;
  tier: "free" | "premium" | "local";
  status: "primary" | "fallback" | "last-resort";
  latency: string;
}

export const ROUTING_CHAIN: RoutingStep[] = [
  { id: "s1", label: "Tentativa 1", model: "Gemini Flash", cost: "R$ 0", tier: "free", status: "primary", latency: "180ms" },
  { id: "s2", label: "Tentativa 2", model: "Groq Llama 70B", cost: "R$ 0", tier: "free", status: "fallback", latency: "120ms" },
  { id: "s3", label: "Tentativa 3", model: "OpenRouter Free", cost: "R$ 0", tier: "free", status: "fallback", latency: "320ms" },
  { id: "s4", label: "Último recurso", model: "GPT-4.1", cost: "~R$ 0,02", tier: "premium", status: "last-resort", latency: "540ms" },
];

export interface AgentGoal {
  id: string;
  label: string;
  description: string;
  icon: string;
  recommendedModel: string;
  accent: "green" | "blue" | "purple" | "acid" | "orange";
}

export const AGENT_GOALS: AgentGoal[] = [
  { id: "quality", label: "Máxima qualidade", description: "Sempre o modelo mais capaz disponível no orçamento.", icon: "crown", recommendedModel: "Claude Opus 4", accent: "purple" },
  { id: "cost", label: "Menor custo", description: "Minimiza gastos usando free tier sempre que possível.", icon: "piggy-bank", recommendedModel: "DeepSeek V3", accent: "green" },
  { id: "free", label: "Totalmente gratuito", description: "Apenas provedores gratuitos e locais. Zero custo.", icon: "gift", recommendedModel: "Gemini Flash + Ollama", accent: "acid" },
  { id: "fast", label: "Mais rápido", description: "Otimiza para latência mínima. Groq e edge AI.", icon: "zap", recommendedModel: "Groq Llama 70B", accent: "orange" },
  { id: "local", label: "Rodar localmente", description: "Privacidade total. Nada sai do seu hardware.", icon: "server", recommendedModel: "Ollama Llama 70B", accent: "blue" },
  { id: "balanced", label: "Equilibrado", description: "Balanceamento inteligente entre custo, velocidade e qualidade.", icon: "scale", recommendedModel: "Auto-select", accent: "green" },
];

export interface MarketCard {
  id: string;
  name: string;
  rating: number; // 1-5
  tier: "free" | "premium" | "local";
  tag: string;
  description: string;
  accent: "green" | "blue" | "purple" | "acid" | "orange";
  connected?: boolean;
}

export const MARKET_CARDS: MarketCard[] = [
  { id: "groq", name: "Groq", rating: 5, tier: "free", tag: "Grátis · Muito rápido", description: "LPU com latência sub-200ms.", accent: "orange", connected: true },
  { id: "gemini-flash", name: "Gemini Flash", rating: 5, tier: "free", tag: "Grátis · Excelente qualidade", description: "Melhor custo-benefício do Google.", accent: "blue", connected: true },
  { id: "deepseek", name: "DeepSeek V3", rating: 4, tier: "premium", tag: "Premium · Baixo custo", description: "Raciocínio forte por fração de centavos.", accent: "blue" },
  { id: "qwen", name: "Qwen 2.5", rating: 4, tier: "free", tag: "Grátis · Open source", description: "Modelo chinês top para código e raciocínio.", accent: "acid" },
  { id: "gpt41", name: "GPT-4.1", rating: 4, tier: "premium", tag: "Premium · Versátil", description: "Padrão da indústria para agentes.", accent: "green" },
  { id: "claude-opus", name: "Claude Opus 4", rating: 5, tier: "premium", tag: "Premium · Máxima qualidade", description: "Melhor raciocínio longo disponível.", accent: "purple" },
  { id: "ollama", name: "Ollama", rating: 5, tier: "local", tag: "Local · 100% privado", description: "Llama, Qwen e DeepSeek no seu PC.", accent: "green", connected: true },
  { id: "mistral", name: "Mistral Large", rating: 4, tier: "premium", tag: "Premium · Multilíngue", description: "Excelente para PT-BR e enterprise.", accent: "purple" },
];

export interface EconomicTask {
  role: string;
  free: string;
  premium: string;
  local: string;
  recommended: string;
  reason: string;
}

export const ECONOMIC_TASKS: EconomicTask[] = [
  { role: "Atendimento", free: "Gemini Flash", premium: "GPT-4o mini", local: "Ollama Llama 8B", recommended: "Gemini Flash ou Groq", reason: "Baixo custo, alta velocidade para respostas curtas" },
  { role: "Marketing", free: "Qwen 2.5", premium: "Claude Sonnet", local: "Ollama Qwen 32B", recommended: "Qwen ou DeepSeek", reason: "Bom em copywriting PT-BR a custo baixo" },
  { role: "Programação", free: "DeepSeek Free", premium: "Claude Sonnet 4", local: "Ollama DeepSeek Coder", recommended: "GPT, Claude ou Codex", reason: "Máxima capacidade de raciocínio e código" },
  { role: "Pesquisa", free: "Gemini 2.0", premium: "Gemini 2.5 Pro", local: "Ollama Mistral", recommended: "Gemini ou Mistral", reason: "Janela de contexto grande para múltiplas fontes" },
  { role: "CEO", free: "Gemini Pro Free", premium: "Claude Opus 4", local: "Ollama Llama 70B", recommended: "Melhor modelo do orçamento", reason: "Decisões estratégicas exigem o modelo mais capaz" },
];

export interface BudgetTier {
  id: string;
  label: string;
  monthly: string;
  monthlyNum: number;
  accent: "green" | "blue" | "purple" | "orange";
  description: string;
  features: string[];
}

export const BUDGET_TIERS: BudgetTier[] = [
  {
    id: "free",
    label: "R$ 0/mês",
    monthly: "R$ 0",
    monthlyNum: 0,
    accent: "green",
    description: "Comece sem gastar nada. Use apenas provedores gratuitos e locais.",
    features: [
      "Gemini Flash gratuito (ilimitado)",
      "Groq + Cloudflare + Hugging Face",
      "OpenRouter free tier",
      "Ollama / LM Studio local",
      "Smart Routing com fallback entre grátis",
      "Até 3 agentes ativos",
    ],
  },
  {
    id: "low",
    label: "Até R$ 50/mês",
    monthly: "R$ 50",
    monthlyNum: 50,
    accent: "blue",
    description: "Combina grátis com modelos premium para tarefas críticas.",
    features: [
      "Tudo do plano gratuito",
      "DeepSeek API + Mistral Small",
      "GPT-4o mini + Claude Haiku",
      "Smart Economic Mode ativo",
      "Até 10 agentes ativos",
      "Roteamento por prioridade de tarefa",
    ],
  },
  {
    id: "mid",
    label: "Até R$ 200/mês",
    monthly: "R$ 200",
    monthlyNum: 200,
    accent: "purple",
    description: "Modelos top de linha para agentes estratégicos, grátis para o resto.",
    features: [
      "Tudo do plano anterior",
      "GPT-4.1 + Claude Sonnet 4",
      "Gemini 2.5 Pro + Grok 4",
      "Roteamento cognitivo avançado",
      "Agentes ilimitados",
      "Analytics em tempo real",
    ],
  },
  {
    id: "unlimited",
    label: "Sem limite",
    monthly: "Custom",
    monthlyNum: -1,
    accent: "orange",
    description: "Sem restrições. Claude Opus 4 e GPT-4.1 em todos os agentes.",
    features: [
      "Tudo do plano anterior",
      "Claude Opus 4 ilimitado",
      "SLA empresarial",
      "Deploy on-prem opcional",
      "Suporte dedicado 24/7",
      "White-label disponível",
    ],
  },
];

export interface OpenRouterFilter {
  id: string;
  label: string;
  description: string;
}

export const OPENROUTER_FILTERS: OpenRouterFilter[] = [
  { id: "free", label: "Mostrar somente gratuitos", description: "Apenas modelos com contexto :free" },
  { id: "oss", label: "Mostrar somente open source", description: "Apenas modelos com pesos abertos" },
  { id: "local", label: "Mostrar somente modelos locais", description: "Compatíveis com Ollama / llama.cpp" },
  { id: "code", label: "Modelos para programação", description: "Otimizados para código (Codex, DeepSeek-Coder)" },
  { id: "vision", label: "Visão computacional", description: "Suportam imagem como input" },
  { id: "multimodal", label: "Multimodal", description: "Texto, imagem, áudio e vídeo" },
];

// === Department templates for company setup ===
export interface DepartmentTemplate {
  id: string;
  name: string;
  emoji: string;
  accent: "green" | "blue" | "purple" | "acid" | "orange";
  headRole: string;
  headEmoji: string;
  headSpecialty: string;
  model: string;
  keywords: string[]; // for matching CEO mission keywords
}

export const DEPARTMENT_TEMPLATES: DepartmentTemplate[] = [
  {
    id: "executive",
    name: "Executivo",
    emoji: "◆",
    accent: "green",
    headRole: "CEO Agent",
    headEmoji: "◆",
    headSpecialty: "Strategy & Vision",
    model: "Claude Opus 4",
    keywords: ["estratégia", "empresa", "company", "negocio", "ceo", "lancar", "crescer", "expandir"],
  },
  {
    id: "sales",
    name: "Vendas",
    emoji: "▲",
    accent: "blue",
    headRole: "Sales Lead",
    headEmoji: "▲",
    headSpecialty: "Outbound & Pipeline",
    model: "Gemini Flash",
    keywords: ["venda", "receita", "cliente", "pipeline", "mrr", "lead", "prospec"],
  },
  {
    id: "marketing",
    name: "Marketing",
    emoji: "✦",
    accent: "acid",
    headRole: "Marketing Lead",
    headEmoji: "✦",
    headSpecialty: "Brand & Content",
    model: "Qwen 2.5",
    keywords: ["marketing", "marca", "campanha", "conteudo", "social", "ads", "copy"],
  },
  {
    id: "engineering",
    name: "Engenharia",
    emoji: "◇",
    accent: "green",
    headRole: "Engineering Lead",
    headEmoji: "◇",
    headSpecialty: "Code & Architecture",
    model: "Claude Sonnet 4",
    keywords: ["produto", "codigo", "tech", "dev", "api", "feature", "bug", "deploy", "infra"],
  },
  {
    id: "research",
    name: "Pesquisa",
    emoji: "●",
    accent: "purple",
    headRole: "Research Lead",
    headEmoji: "●",
    headSpecialty: "Market & Data",
    model: "Gemini 2.5 Pro",
    keywords: ["pesquisa", "analise", "dados", "mercado", "estudo", "benchmark", "concorrent"],
  },
  {
    id: "support",
    name: "Suporte",
    emoji: "■",
    accent: "orange",
    headRole: "Support Lead",
    headEmoji: "■",
    headSpecialty: "Customer Success",
    model: "Groq Llama 70B",
    keywords: ["suporte", "atendimento", "chamado", "ticket", "satisfacao", "retention"],
  },
  {
    id: "ops",
    name: "Operações",
    emoji: "◯",
    accent: "blue",
    headRole: "Ops Lead",
    headEmoji: "◯",
    headSpecialty: "Automation & Process",
    model: "DeepSeek V3",
    keywords: ["operacao", "processo", "automacao", "workflow", "eficiencia", "logistica"],
  },
];
