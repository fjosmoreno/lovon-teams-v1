import { NextRequest, NextResponse } from "next/server";
import { appendAuditEvent } from "@/lib/lovon/agent-engine/types";
import { CapabilityId } from "@/lib/lovon/work-products";
import { executeEmailSend } from "@/lib/lovon/emailSendCapability";

export const runtime = "nodejs";
export const maxDuration = 30;

interface InvokeInput {
  workspaceId: string;
  requestedBy: { kind: "agent"; agentSlug: string };
  traceId: string;
  capability: CapabilityId;
  args: Record<string, unknown>;
  idempotencyKey: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as InvokeInput;
    const { workspaceId, requestedBy, traceId, capability, args, idempotencyKey } = body;

    if (!workspaceId || !capability || !idempotencyKey || !requestedBy?.agentSlug) {
      return NextResponse.json(
        { success: false, error: "workspaceId, capability, idempotencyKey e requestedBy.agentSlug são obrigatórios" },
        { status: 400 }
      );
    }

    // Audit: CAPABILITY_INVOKED
    appendAuditEvent({
      workspaceId,
      type: "TASK_CREATED" as never, // reuse until CAPABILITY_INVOKED is added to enum
      actor: { kind: "agent", id: requestedBy.agentSlug },
      traceId,
      payload: { capability, args: JSON.stringify(args).slice(0, 500), idempotencyKey },
    });

    // === Route to provider based on capability ===
    if (capability === "email_send" || capability === "email_schedule") {
      return await handleEmailCapability({
        workspaceId,
        requestedBy,
        traceId,
        capability,
        args,
        idempotencyKey,
      });
    }

    // For capabilities not yet implemented, return structured "not implemented"
    return NextResponse.json({
      success: false,
      capability,
      error: `Capability "${capability}" ainda não tem provider implementado.`,
      result: null,
      auditTraceId: traceId,
    }, { status: 501 });
  } catch (err) {
    console.error("[/api/lovon/capabilities-invoke] error:", err);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

async function handleEmailCapability(input: InvokeInput) {
  const { workspaceId, requestedBy, traceId, capability, args, idempotencyKey } = input;

  // Validate args shape
  const to = typeof args.to === "string" ? args.to : "";
  const subject = typeof args.subject === "string" ? args.subject : "";
  const body = typeof args.body === "string" ? args.body : (typeof args.html === "string" ? args.html : "");
  const from = typeof args.from === "string" ? args.from : undefined;
  const fromName = typeof args.fromName === "string" ? args.fromName : undefined;

  if (!to || !subject || !body) {
    return NextResponse.json({
      success: false,
      capability,
      error: "Args obrigatórios ausentes para email_send: { to, subject, body|html }.",
      args,
      auditTraceId: traceId,
    }, { status: 400 });
  }

  // Convert plain text body to HTML if html not provided
  const html = args.html ? body : body.replace(/\n/g, "<br>");

  const { ok, receipt } = await executeEmailSend({
    to,
    subject,
    html,
    from,
    fromName,
    traceId,
    requestedByAgentSlug: requestedBy.agentSlug,
    workspaceId,
    taskId: typeof args.taskId === "string" ? args.taskId : undefined,
  });

  // Audit result
  appendAuditEvent({
    workspaceId,
    type: "TASK_CREATED" as never,
    actor: { kind: "agent", id: requestedBy.agentSlug },
    traceId,
    payload: {
      capability,
      idempotencyKey,
      result: ok ? "sent" : "failed",
      providerMessageId: receipt.providerMessageId,
      error: receipt.error,
      to: receipt.to,
      subject: receipt.subject.slice(0, 80),
    },
  });

  return NextResponse.json({
    success: ok,
    capability,
    receipt,
    result: ok
      ? { status: "sent", messageId: receipt.providerMessageId, sentAt: receipt.sentAt }
      : { status: "failed", error: receipt.error },
    auditTraceId: traceId,
  }, { status: ok ? 200 : 400 });
}
