import { NextRequest, NextResponse } from "next/server";
import { executeEmailSend, EmailSendInput } from "@/lib/lovon/emailSendCapability";

export const runtime = "nodejs";
export const maxDuration = 30;

interface SendEmailRequest {
  to: string;
  subject: string;
  html: string;
  from?: string;
  fromName?: string;
  traceId?: string;
  requestedByAgentSlug?: string;
  taskId?: string;
  workspaceId?: string;
  // P0.8 — Idempotency-Key. If the same key is sent twice within 24h, the second
  // request returns the cached receipt without re-calling Resend.
  idempotencyKey?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SendEmailRequest;

    // Auto-generate an idempotency key from the request if none was provided.
    // We use the taskId + recipient + subject hash so that retries of the SAME
    // logical send (same task, same recipient, same subject) collapse to one email.
    // If the caller wants to force a NEW send (e.g. after editing the body), they
    // can pass a fresh idempotencyKey explicitly.
    const idempotencyKey =
      body.idempotencyKey ??
      (body.taskId
        ? `auto:${body.taskId}:${body.to}:${body.subject}`.slice(0, 200)
        : undefined);

    const input: EmailSendInput = {
      to: body.to,
      subject: body.subject,
      html: body.html,
      from: body.from,
      fromName: body.fromName,
      traceId: body.traceId,
      requestedByAgentSlug: body.requestedByAgentSlug,
      taskId: body.taskId,
      workspaceId: body.workspaceId,
      idempotencyKey,
    };

    const { ok, receipt } = await executeEmailSend(input);

    return NextResponse.json({
      success: ok,
      receipt,
      idempotencyKey: idempotencyKey ?? null,
      // legacy convenience fields (so older callers don't break)
      messageId: receipt.providerMessageId,
      sentAt: receipt.sentAt,
      error: ok ? undefined : receipt.error,
    }, { status: ok ? 200 : 400 });
  } catch (err) {
    console.error("[/api/lovon/send-email] error:", err);
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json(
      {
        success: false,
        error: message,
        receipt: {
          provider: "resend",
          providerMessageId: null,
          to: "",
          subject: "",
          from: "",
          sentAt: new Date().toISOString(),
          status: "failed" as const,
          error: message,
        },
      },
      { status: 500 }
    );
  }
}
