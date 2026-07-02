// Lovon Teams — Email Send Capability (Resend)
//
// This is the SINGLE entry point for sending emails in the platform.
// Both the manual /api/lovon/send-email route (used by the EmailAgent UI)
// and the /api/lovon/capabilities-invoke route (used by agents at runtime)
// call this function. That way the "Done" gate (EmailSendReceipt) is enforced
// in exactly one place.
//
// CRITICAL RULE (P1 — Trava de conclusão):
//   An email-bearing task is only allowed to be marked "completed" if this
//   function returns { ok: true, receipt } with a non-empty providerMessageId.
//   If ok === false, the caller MUST NOT mark the task done — it should be
//   left as "blocked" or "failed" with the error message.

import { Resend } from "resend";

export interface EmailSendInput {
  to: string;
  subject: string;
  html: string;
  from?: string; // override default sender (rarely needed)
  fromName?: string;
  // tracking / audit fields (optional)
  traceId?: string;
  requestedByAgentSlug?: string;
  taskId?: string;
  workspaceId?: string;
  // P0.8 — Idempotency-Key: if two requests arrive with the same key within 24h,
  // the second one returns the cached receipt instead of re-sending the email.
  // This prevents "Retry send" from accidentally firing two emails.
  idempotencyKey?: string;
}

export interface EmailSendReceipt {
  provider: "resend";
  providerMessageId: string | null; // null = sent but no id returned (still counts as sent IF ok)
  to: string;
  subject: string;
  from: string;
  sentAt: string; // ISO
  status: "sent" | "failed";
  error?: string;
}

export interface EmailSendResult {
  ok: boolean;
  receipt: EmailSendReceipt;
}

// Lazily-initialized Resend client. Throws only when actually called without a key.
let _client: Resend | null = null;
function getResendClient(): Resend {
  if (_client) return _client;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY não configurada. Adicione no arquivo .env (veja EMAIL_SETUP.md)."
    );
  }
  _client = new Resend(apiKey);
  return _client;
}

function defaultFrom(): string {
  const email = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
  const name = process.env.RESEND_FROM_NAME?.trim();
  return name ? `${name} <${email}>` : email;
}

// RFC 5322 simplified email regex — good enough for routing decisions
const EMAIL_RE = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;

// === Idempotency cache (P0.8) ===
// In-memory LRU keyed by idempotencyKey. Pruned after 24h.
// Prevents "Retry send" from accidentally firing two emails when the caller
// retries the same logical send (e.g. after a network blip).
interface IdempotencyCacheEntry {
  result: EmailSendResult;
  insertedAt: number;
}
const IDEMPOTENCY_CACHE = new Map<string, IdempotencyCacheEntry>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24h

function pruneIdempotencyCache(): void {
  const now = Date.now();
  for (const [key, entry] of IDEMPOTENCY_CACHE) {
    if (now - entry.insertedAt > IDEMPOTENCY_TTL_MS) {
      IDEMPOTENCY_CACHE.delete(key);
    }
  }
}

export function validateEmailInput(input: EmailSendInput): string | null {
  if (!input.to || !EMAIL_RE.test(input.to)) {
    return `Destinatário inválido: "${input.to ?? ""}"`;
  }
  if (!input.subject || input.subject.trim().length === 0) {
    return "Assunto não pode ser vazio.";
  }
  if (!input.html || input.html.trim().length === 0) {
    return "Corpo do email não pode ser vazio.";
  }
  if (input.subject.length > 998) {
    return "Assunto muito longo (máx 998 caracteres).";
  }
  return null;
}

export async function executeEmailSend(input: EmailSendInput): Promise<EmailSendResult> {
  // === Idempotency check (P0.8) ===
  // If the caller passed an idempotencyKey AND we have a cached result for it,
  // return the cached result without re-calling Resend. This makes "Retry send"
  // safe: even if the user clicks retry 10 times, only ONE email goes out.
  if (input.idempotencyKey) {
    pruneIdempotencyCache();
    const cached = IDEMPOTENCY_CACHE.get(input.idempotencyKey);
    if (cached) {
      console.log(`[emailSendCapability] idempotency hit for key ${input.idempotencyKey} — returning cached receipt without re-sending`);
      return cached.result;
    }
  }

  const validationError = validateEmailInput(input);
  if (validationError) {
    const failedResult: EmailSendResult = {
      ok: false,
      receipt: {
        provider: "resend",
        providerMessageId: null,
        to: input.to,
        subject: input.subject,
        from: input.from ?? defaultFrom(),
        sentAt: new Date().toISOString(),
        status: "failed",
        error: validationError,
      },
    };
    // Cache even failures so the same key returns the same failure (avoids retry spam)
    if (input.idempotencyKey) {
      IDEMPOTENCY_CACHE.set(input.idempotencyKey, { result: failedResult, insertedAt: Date.now() });
    }
    return failedResult;
  }

  const from = input.from ?? defaultFrom();

  try {
    const client = getResendClient();
    const { data, error } = await client.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
    });

    let result: EmailSendResult;
    if (error) {
      console.error("[emailSendCapability] Resend error:", error);
      result = {
        ok: false,
        receipt: {
          provider: "resend",
          providerMessageId: null,
          to: input.to,
          subject: input.subject,
          from,
          sentAt: new Date().toISOString(),
          status: "failed",
          error: error.message ?? JSON.stringify(error),
        },
      };
    } else {
      result = {
        ok: true,
        receipt: {
          provider: "resend",
          providerMessageId: data?.id ?? null,
          to: input.to,
          subject: input.subject,
          from,
          sentAt: new Date().toISOString(),
          status: "sent",
        },
      };
    }

    // Cache the result (success OR failure) if an idempotency key was provided
    if (input.idempotencyKey) {
      IDEMPOTENCY_CACHE.set(input.idempotencyKey, { result, insertedAt: Date.now() });
    }

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[emailSendCapability] exception:", message);
    const errorResult: EmailSendResult = {
      ok: false,
      receipt: {
        provider: "resend",
        providerMessageId: null,
        to: input.to,
        subject: input.subject,
        from,
        sentAt: new Date().toISOString(),
        status: "failed",
        error: message,
      },
    };
    if (input.idempotencyKey) {
      IDEMPOTENCY_CACHE.set(input.idempotencyKey, { result: errorResult, insertedAt: Date.now() });
    }
    return errorResult;
  }
}

// Test helper — clears the idempotency cache (used by smoke tests)
export function _clearIdempotencyCacheForTests(): void {
  IDEMPOTENCY_CACHE.clear();
}
