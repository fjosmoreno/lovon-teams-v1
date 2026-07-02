// Lovon Teams — Action Items Output Contract
//
// Every agent that completes a task MUST return structured JSON conforming to
// ActionItemsOutputSchema. The engine parses this, validates with Zod, and
// auto-creates subtasks from actionItems[] (with dedupe + owner routing +
// approval gates).
//
// This eliminates "recomendo..." text-only conclusions — recommendations
// only count if they become executable action items with owners + acceptance
// criteria.

import { z } from "zod";

export const PrioritySchema = z.enum(["critical", "high", "medium", "low"]);

export const ActionItemDepartmentSchema = z.enum([
  "marketing",
  "sales",
  "engineering",
  "research",
  "ops",
  "email",
  "product",
]);

export const ActionItemSchema = z.object({
  title: z
    .string()
    .min(3, "Título deve ter pelo menos 3 caracteres")
    .max(200, "Título deve ter no máximo 200 caracteres"),
  rationale: z.string().min(1).max(500).optional(),

  // Agent slug sugerido (ex: "marketing-lead"). Engine tenta atribuir a este agente.
  ownerSuggestion: z.string().min(1).max(100).optional(),

  // Departamento fallback se ownerSuggestion não resolver
  department: ActionItemDepartmentSchema.optional(),

  priority: PrioritySchema.default("medium"),

  // Prazo em dias a partir de agora (0 = imediato, 60 = 2 meses)
  dueInDays: z.number().int().min(0).max(60).optional(),

  // OBRIGATÓRIO — sem acceptance criteria, o action item é rejeitado
  acceptanceCriteria: z
    .array(z.string().min(1))
    .min(1, "Pelo menos 1 critério de aceite é obrigatório")
    .max(10, "Máximo 10 critérios de aceite"),

  // Para governança: se precisa de approval pra executar
  // (email externo, publicação, financeiro, destructive ops)
  requiresApproval: z.boolean().default(false),
  approvalReason: z.string().max(300).optional(),

  // Dedupe/trace
  tags: z.array(z.string()).default([]),
});

export const DecisionSchema = z.object({
  title: z
    .string()
    .min(3, "Título da decisão deve ter pelo menos 3 caracteres")
    .max(200),
  rationale: z.string().min(1).max(500).optional(),
});

export const ActionItemsOutputSchema = z.object({
  decisions: z.array(DecisionSchema).max(20).default([]),

  // Máx 10 action items por conclusão — evita spam
  actionItems: z.array(ActionItemSchema).max(10).default([]),

  // Pontos que faltam dados para decidir
  unknowns: z.array(z.string().min(1)).max(10).default([]),
});

export type ActionItem = z.infer<typeof ActionItemSchema>;
export type Decision = z.infer<typeof DecisionSchema>;
export type ActionItemsOutput = z.infer<typeof ActionItemsOutputSchema>;

// === Helper: validate parsed JSON against the schema ===
export function validateActionItemsOutput(
  raw: unknown
): { success: true; data: ActionItemsOutput } | { success: false; error: string } {
  const result = ActionItemsOutputSchema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMsg = result.error.issues
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join("; ");
  return { success: false, error: errorMsg };
}

// === Helper: extract JSON from LLM text output ===
// LLMs often wrap JSON in ```json ... ``` fences or add commentary before/after.
// This helper finds the first valid JSON object that matches the schema.
export function extractActionItemsJsonFromText(
  text: string
): { success: true; data: ActionItemsOutput } | { success: false; error: string; raw?: unknown } {
  // Strategy 1: try to parse the whole text as JSON
  try {
    const parsed = JSON.parse(text.trim());
    const validation = validateActionItemsOutput(parsed);
    if (validation.success) return validation;
    return { success: false, error: validation.error, raw: parsed };
  } catch {
    // not pure JSON, continue
  }

  // Strategy 2: extract from ```json ... ``` fences
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    try {
      const parsed = JSON.parse(fenceMatch[1].trim());
      const validation = validateActionItemsOutput(parsed);
      if (validation.success) return validation;
      return { success: false, error: validation.error, raw: parsed };
    } catch {
      // not valid JSON in fence, continue
    }
  }

  // Strategy 3: find the first { ... } block that looks like our schema
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    try {
      const parsed = JSON.parse(braceMatch[0]);
      const validation = validateActionItemsOutput(parsed);
      if (validation.success) return validation;
      return { success: false, error: validation.error, raw: parsed };
    } catch {
      // not valid JSON
    }
  }

  return {
    success: false,
    error: "Nenhum JSON válido encontrado no texto. O agente deve retornar APENAS JSON conforme o contrato action-items-output.",
  };
}

// === Dedupe fingerprint ===
// Generates a stable hash from taskId + normalized title for dedupe.
// Two action items with the same title on the same task are considered duplicates.
export function actionItemFingerprint(taskId: string, title: string): string {
  const normalized = title
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9\s]/g, "") // remove pontuação
    .replace(/\s+/g, " ")
    .slice(0, 100);
  // Simple hash (not cryptographic — just for dedupe within a workspace)
  let hash = 0;
  const str = `${taskId}:${normalized}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `ai_${Math.abs(hash).toString(36)}`;
}
