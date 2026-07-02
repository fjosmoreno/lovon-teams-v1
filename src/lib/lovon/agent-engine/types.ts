// Lovon Teams — Internal Agent Engine API Types (Spec v1)
// All operations append to an immutable audit log and are traceable to an AgentRun.

import { z } from "zod";

// === Common Concepts ===

export const ActorSchema = z.object({
  kind: z.enum(["agent", "board"]),
  id: z.string().min(1),
});
export type Actor = z.infer<typeof ActorSchema>;

export const TaskStatusSchema = z.enum([
  "todo",
  "in_progress",
  "blocked",
  "in_review",
  "done",
  "archived",
]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const AutonomyLevelSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);
export type AutonomyLevel = z.infer<typeof AutonomyLevelSchema>;

// === Audit Events ===

export const AuditEventTypeSchema = z.enum([
  "AGENT_RUN_STARTED",
  "AGENT_RUN_FINISHED",
  "AGENT_RUN_FAILED",
  "TASK_CREATED",
  "TASK_STATUS_CHANGED",
  "TASK_COMMENT_ADDED",
  "SUBTASK_CREATED",
  "CONFIRMATION_REQUESTED",
  "CONFIRMATION_RESOLVED",
  "AGENT_HIRED",
  "BUDGET_EXCEEDED",
  "POLICY_BLOCKED",
  "HEARTBEAT_STARTED",
  "HEARTBEAT_COMPLETED",
  "WORKSPACE_RESET_REQUESTED",
  "WORKSPACE_RESET_COMPLETED",
  "WORKSPACE_RESET_FAILED",
]);
export type AuditEventType = z.infer<typeof AuditEventTypeSchema>;

export const AuditEventSchema = z.object({
  id: z.string(),
  workspaceId: z.string().uuid().or(z.string().min(1)),
  ts: z.string(), // ISO
  type: AuditEventTypeSchema,
  actor: ActorSchema,
  traceId: z.string().min(1),
  payload: z.record(z.any()),
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

// === 1) wake_agent() ===

export const WakeAgentInputSchema = z.object({
  workspaceId: z.string().min(1),
  agentSlug: z.string().min(1),

  trigger: z.object({
    type: z.enum(["heartbeat", "manual", "event", "webhook"]),
    id: z.string().optional(),
    runKey: z.string().optional(),
  }),

  context: z
    .object({
      taskId: z.string().optional(),
      goalId: z.string().optional(),
      planId: z.string().optional(),
      budgetSnapshot: z.record(z.any()).optional(),
      knowledgeScope: z
        .object({
          tags: z.array(z.string()).optional(),
          sources: z.array(z.string()).optional(),
        })
        .optional(),
    })
    .passthrough()
    .optional(),

  controls: z
    .object({
      dryRun: z.boolean().optional(),
      maxCostUsd: z.number().optional(),
      maxTokens: z.number().optional(),
      maxWallTimeMs: z.number().optional(),
      autonomyLevel: AutonomyLevelSchema.optional(),
    })
    .optional(),

  inject: z
    .object({
      forceSkills: z.array(z.string()).optional(),
    })
    .optional(),

  idempotencyKey: z.string().min(1),
});
export type WakeAgentInput = z.infer<typeof WakeAgentInputSchema>;

export const AgentRunResultSchema = z.object({
  runId: z.string(),
  workspaceId: z.string(),
  agentSlug: z.string(),
  traceId: z.string(),

  status: z.enum(["success", "failed", "timed_out", "budget_exceeded", "cancelled"]),
  startedAt: z.string(),
  finishedAt: z.string(),

  usage: z.object({
    tokensIn: z.number(),
    tokensOut: z.number(),
    costUsd: z.number(),
  }),

  outputs: z.object({
    createdTaskIds: z.array(z.string()).optional(),
    createdSubtaskIds: z.array(z.string()).optional(),
    createdConfirmationRequestIds: z.array(z.string()).optional(),
    commentsAdded: z
      .array(z.object({ taskId: z.string(), commentId: z.string() }))
      .optional(),
    artifacts: z.record(z.any()).optional(),
  }),

  error: z
    .object({
      code: z.string(),
      message: z.string(),
      detail: z.any().optional(),
    })
    .optional(),
});
export type AgentRunResult = z.infer<typeof AgentRunResultSchema>;

export const AGENT_RUN_ERROR_CODES = [
  "WORKSPACE_NOT_FOUND",
  "AGENT_NOT_FOUND",
  "IDEMPOTENCY_CONFLICT",
  "POLICY_BLOCKED",
  "BUDGET_EXCEEDED",
  "TIMEOUT",
  "INTERNAL_ERROR",
] as const;
export type AgentRunErrorCode = (typeof AGENT_RUN_ERROR_CODES)[number];

// === 2) request_confirmation() ===

export const ConfirmationTargetSchema = z.object({
  type: z.enum(["plan", "task", "action", "agent_hire", "budget_change"]),
  id: z.string().min(1),
  revision: z.string().optional(),
});

export const RequestConfirmationInputSchema = z.object({
  workspaceId: z.string().min(1),

  requestedBy: z.object({
    kind: z.literal("agent"),
    agentSlug: z.string().min(1),
  }),
  traceId: z.string().min(1),

  target: ConfirmationTargetSchema,

  request: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    importance: z.enum(["low", "medium", "high", "critical"]),
    options: z.array(
      z.object({
        label: z.string(),
        value: z.enum(["approve", "reject", "request_changes"]),
      })
    ),
    expiresAt: z.string().optional(),
  }),

  sideEffects: z
    .object({
      setTargetStatusTo: z.literal("in_review").optional(),
      commentOnTarget: z.boolean().optional(),
    })
    .optional(),

  idempotencyKey: z.string().min(1),
});
export type RequestConfirmationInput = z.infer<typeof RequestConfirmationInputSchema>;

export const ConfirmationRequestSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  traceId: z.string(),

  target: ConfirmationTargetSchema,
  title: z.string(),
  description: z.string(),
  importance: z.string(),
  options: z.array(z.object({ label: z.string(), value: z.string() })),

  status: z.enum([
    "pending",
    "approved",
    "rejected",
    "changes_requested",
    "expired",
  ]),
  createdAt: z.string(),
  expiresAt: z.string().optional(),

  createdBy: z.object({ kind: z.literal("agent"), agentSlug: z.string() }),
});
export type ConfirmationRequest = z.infer<typeof ConfirmationRequestSchema>;

// === 3) create_subtask() ===

export const CreateSubtaskInputSchema = z.object({
  workspaceId: z.string().min(1),

  createdBy: z.object({
    kind: z.literal("agent"),
    agentSlug: z.string().min(1),
  }),
  traceId: z.string().min(1),

  parentId: z.string().min(1),

  subtask: z.object({
    title: z.string().min(1),
    description: z.string().min(1),

    objective: z.string().min(1),
    acceptanceCriteria: z.array(z.string().min(1)).min(1), // MUST be non-empty
    nextAction: z.string().optional(),

    assignedTo: z.object({
      kind: z.literal("agent"),
      agentSlug: z.string().min(1),
    }),
    dueAt: z.string().optional(),
    estimatedCostUsd: z.number().optional(),

    labels: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
  }),

  sideEffects: z
    .object({
      commentOnParent: z.boolean().optional(),
      setParentStatusTo: z.enum(["in_progress", "in_review"]).optional(),
    })
    .optional(),

  idempotencyKey: z.string().min(1),
});
export type CreateSubtaskInput = z.infer<typeof CreateSubtaskInputSchema>;

export const TaskSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),

  parentId: z.string().optional(),
  title: z.string(),
  description: z.string(),

  status: TaskStatusSchema,

  assignedTo: z
    .object({ kind: z.literal("agent"), agentSlug: z.string() })
    .optional(),

  objective: z.string().optional(),
  acceptanceCriteria: z.array(z.string()).optional(),
  nextAction: z.string().optional(),

  createdAt: z.string(),
  createdBy: z.object({ kind: z.literal("agent"), agentSlug: z.string() }),

  metadata: z.record(z.any()).optional(),
});
export type Task = z.infer<typeof TaskSchema>;

// === Idempotency Store (in-memory, per workspace) ===
// In production, this would be a DB table with unique constraint on (workspaceId, idempotencyKey).

const idempotencyStore = new Map<string, { result: unknown; ts: number }>();

export function checkIdempotency<T>(
  workspaceId: string,
  idempotencyKey: string
): T | null {
  const key = `${workspaceId}:${idempotencyKey}`;
  const entry = idempotencyStore.get(key);
  if (entry) {
    return entry.result as T;
  }
  return null;
}

export function storeIdempotency<T>(
  workspaceId: string,
  idempotencyKey: string,
  result: T
): void {
  const key = `${workspaceId}:${idempotencyKey}`;
  idempotencyStore.set(key, { result, ts: Date.now() });
}

// === Audit Log (in-memory, append-only) ===

const auditLog: AuditEvent[] = [];

export function appendAuditEvent(event: Omit<AuditEvent, "id" | "ts">): AuditEvent {
  const fullEvent: AuditEvent = {
    ...event,
    id: `audit_${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36).slice(-4)}`,
    ts: new Date().toISOString(),
  };
  auditLog.unshift(fullEvent);
  if (auditLog.length > 500) auditLog.length = 500; // cap at 500
  return fullEvent;
}

export function getAuditLog(workspaceId: string, limit = 50): AuditEvent[] {
  return auditLog.filter((e) => e.workspaceId === workspaceId).slice(0, limit);
}

// === Confirmation Requests Store (in-memory) ===

const confirmationRequests: ConfirmationRequest[] = [];

export function storeConfirmationRequest(req: ConfirmationRequest): void {
  confirmationRequests.unshift(req);
  if (confirmationRequests.length > 200) confirmationRequests.length = 200;
}

export function getConfirmationRequests(
  workspaceId: string,
  filter?: { status?: string; targetId?: string }
): ConfirmationRequest[] {
  return confirmationRequests.filter((r) => {
    if (r.workspaceId !== workspaceId) return false;
    if (filter?.status && r.status !== filter.status) return false;
    if (filter?.targetId && r.target.id !== filter.targetId) return false;
    return true;
  });
}

export function resolveConfirmationRequest(
  id: string,
  resolution: "approved" | "rejected" | "changes_requested",
  resolvedBy: Actor
): ConfirmationRequest | null {
  const req = confirmationRequests.find((r) => r.id === id);
  if (!req) return null;
  req.status = resolution;
  appendAuditEvent({
    workspaceId: req.workspaceId,
    type: "CONFIRMATION_RESOLVED",
    actor: resolvedBy,
    traceId: req.traceId,
    payload: { confirmationId: id, resolution, target: req.target },
  });
  return req;
}
