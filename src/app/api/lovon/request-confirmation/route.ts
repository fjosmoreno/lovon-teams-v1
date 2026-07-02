import { NextRequest, NextResponse } from "next/server";
import {
  RequestConfirmationInputSchema,
  checkIdempotency,
  storeIdempotency,
  appendAuditEvent,
  storeConfirmationRequest,
} from "@/lib/lovon/agent-engine/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parseResult = RequestConfirmationInputSchema.safeParse(body);
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

    // === Create confirmation request ===
    const confirmationId = `confirm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const confirmation = {
      id: confirmationId,
      workspaceId: input.workspaceId,
      traceId: input.traceId,
      target: input.target,
      title: input.request.title,
      description: input.request.description,
      importance: input.request.importance,
      options: input.request.options,
      status: "pending" as const,
      createdAt: now,
      expiresAt: input.request.expiresAt,
      createdBy: input.requestedBy,
    };

    // Store in in-memory confirmation store
    storeConfirmationRequest(confirmation);

    // === Audit log: CONFIRMATION_REQUESTED ===
    appendAuditEvent({
      workspaceId: input.workspaceId,
      type: "CONFIRMATION_REQUESTED",
      actor: { kind: "agent", id: input.requestedBy.agentSlug },
      traceId: input.traceId,
      payload: {
        confirmationId,
        target: input.target,
        title: input.request.title,
        importance: input.request.importance,
      },
    });

    // === Side effects ===
    // Default: commentOnTarget = true, setTargetStatusTo = "in_review" for task/plan
    const commentOnTarget = input.sideEffects?.commentOnTarget ?? true;
    const setTargetStatus = input.sideEffects?.setTargetStatusTo
      ?? (input.target.type === "task" || input.target.type === "plan" ? "in_review" : undefined);

    const sideEffectsResult: { commented?: boolean; statusChanged?: string } = {};

    if (commentOnTarget) {
      // In a full implementation, this would add a comment to the target task/plan
      // For now, we record it in the audit log
      appendAuditEvent({
        workspaceId: input.workspaceId,
        type: "TASK_COMMENT_ADDED",
        actor: { kind: "agent", id: input.requestedBy.agentSlug },
        traceId: input.traceId,
        payload: {
          targetId: input.target.id,
          targetType: input.target.type,
          comment: `Confirmation requested: ${input.request.title}\n\n${input.request.description}\n\nOptions: ${input.request.options.map((o) => o.label).join(" / ")}`,
        },
      });
      sideEffectsResult.commented = true;
    }

    if (setTargetStatus) {
      appendAuditEvent({
        workspaceId: input.workspaceId,
        type: "TASK_STATUS_CHANGED",
        actor: { kind: "agent", id: input.requestedBy.agentSlug },
        traceId: input.traceId,
        payload: {
          targetId: input.target.id,
          from: "previous_status",
          to: setTargetStatus,
        },
      });
      sideEffectsResult.statusChanged = setTargetStatus;
    }

    // Store idempotency
    storeIdempotency(input.workspaceId, input.idempotencyKey, confirmation);

    return NextResponse.json({
      success: true,
      result: confirmation,
      sideEffects: sideEffectsResult,
    });
  } catch (err) {
    console.error("[/api/lovon/request-confirmation] error:", err);
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ success: false, error: "INTERNAL_ERROR", message }, { status: 500 });
  }
}
