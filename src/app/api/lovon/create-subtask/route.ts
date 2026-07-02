import { NextRequest, NextResponse } from "next/server";
import {
  CreateSubtaskInputSchema,
  checkIdempotency,
  storeIdempotency,
  appendAuditEvent,
} from "@/lib/lovon/agent-engine/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parseResult = CreateSubtaskInputSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "INVALID_INPUT", detail: parseResult.error.issues },
        { status: 400 }
      );
    }
    const input = parseResult.data;

    // === Idempotency ===
    const existing = checkIdempotency<unknown>(input.workspaceId, input.idempotencyKey);
    if (existing) {
      return NextResponse.json({ success: true, result: existing, idempotent: true });
    }

    // === Validation (MUST) ===
    const validationErrors: string[] = [];

    // parentId exists — in production, query DB
    // For now, accept if parentId is non-empty (validated by Zod)

    // acceptanceCriteria MUST be non-empty (validated by Zod .min(1))

    // assignedTo.agentSlug must exist OR caller must hire first
    // In production, check if agent exists in workspace
    // For now, we accept and record — if agent doesn't exist, the platform MAY auto-block

    // title, objective, description must be non-empty (validated by Zod)

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_FAILED", errors: validationErrors },
        { status: 400 }
      );
    }

    // === Create subtask ===
    const taskId = `task_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const task = {
      id: taskId,
      workspaceId: input.workspaceId,
      parentId: input.parentId,
      title: input.subtask.title,
      description: input.subtask.description,
      status: "todo" as const,
      assignedTo: input.subtask.assignedTo,
      objective: input.subtask.objective,
      acceptanceCriteria: input.subtask.acceptanceCriteria,
      nextAction: input.subtask.nextAction,
      createdAt: now,
      createdBy: input.createdBy,
      metadata: {
        ...input.subtask.metadata,
        labels: input.subtask.labels,
        dueAt: input.subtask.dueAt,
        estimatedCostUsd: input.subtask.estimatedCostUsd,
      },
    };

    // === Audit log: SUBTASK_CREATED ===
    appendAuditEvent({
      workspaceId: input.workspaceId,
      type: "SUBTASK_CREATED",
      actor: { kind: "agent", id: input.createdBy.agentSlug },
      traceId: input.traceId,
      payload: {
        taskId,
        parentId: input.parentId,
        title: input.subtask.title,
        assignedTo: input.subtask.assignedTo.agentSlug,
        acceptanceCriteria: input.subtask.acceptanceCriteria,
      },
    });

    // === Side effects ===
    const commentOnParent = input.sideEffects?.commentOnParent ?? true;
    const setParentStatus = input.sideEffects?.setParentStatusTo;

    const sideEffectsResult: { commented?: boolean; parentStatusChanged?: string } = {};

    if (commentOnParent) {
      // Add comment to parent task
      appendAuditEvent({
        workspaceId: input.workspaceId,
        type: "TASK_COMMENT_ADDED",
        actor: { kind: "agent", id: input.createdBy.agentSlug },
        traceId: input.traceId,
        payload: {
          targetId: input.parentId,
          comment: `Subtask delegated to ${input.subtask.assignedTo.agentSlug}:\n- Objective: ${input.subtask.objective}\n- Acceptance Criteria:\n${input.subtask.acceptanceCriteria.map((c) => `  • ${c}`).join("\n")}\n${input.subtask.nextAction ? `- Next Action: ${input.subtask.nextAction}` : ""}\n- Subtask ID: ${taskId}`,
        },
      });
      sideEffectsResult.commented = true;
    }

    if (setParentStatus) {
      appendAuditEvent({
        workspaceId: input.workspaceId,
        type: "TASK_STATUS_CHANGED",
        actor: { kind: "agent", id: input.createdBy.agentSlug },
        traceId: input.traceId,
        payload: {
          targetId: input.parentId,
          from: "previous",
          to: setParentStatus,
        },
      });
      sideEffectsResult.parentStatusChanged = setParentStatus;
    }

    // Store idempotency
    storeIdempotency(input.workspaceId, input.idempotencyKey, task);

    return NextResponse.json({
      success: true,
      result: task,
      sideEffects: sideEffectsResult,
    });
  } catch (err) {
    console.error("[/api/lovon/create-subtask] error:", err);
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ success: false, error: "INTERNAL_ERROR", message }, { status: 500 });
  }
}
