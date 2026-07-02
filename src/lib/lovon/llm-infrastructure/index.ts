// Lovon Teams — LLM Infrastructure
// Retry + backoff, concurrency queue, circuit breaker, fallback, structured logging.
// Resolve 502/503/504/429 sem perder 80% das execuções.
//
// Provider resolution priority (per call):
//   1. `providerConfig` passed by the caller (per-user integration from Zustand store)
//   2. OpenAI-compatible env vars (LOVON_LLM_BASE_URL + LOVON_LLM_API_KEY + LOVON_LLM_MODEL)
//   3. z-ai-web-dev-sdk (ZAI.create()) — local dev only

import ZAI from "z-ai-web-dev-sdk";

interface LLMProviderConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

function resolveProviderConfig(override?: { baseUrl?: string; apiKey?: string; model?: string } | null): LLMProviderConfig | null {
  // 1) Caller override (per-user integration)
  if (override?.baseUrl && override?.apiKey) {
    return {
      baseUrl: override.baseUrl.replace(/\/+$/, ""),
      apiKey: override.apiKey,
      model: override.model ?? "gpt-4o-mini",
    };
  }
  // 2) Env vars (serverless-friendly: Render, Vercel, Fly, etc.)
  const baseUrl = process.env.LOVON_LLM_BASE_URL;
  const apiKey = process.env.LOVON_LLM_API_KEY;
  const model = process.env.LOVON_LLM_MODEL ?? "gpt-4o-mini";
  if (baseUrl && apiKey) {
    return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey, model };
  }
  return null;
}

// === Types ===

export interface LLMCallParams {
  systemPrompt: string;
  userPrompt: string;
  correlationId: string;
  provider?: string;    // informational
  model?: string;       // informational
  maxOutputTokens?: number;
}

export interface LLMCallResult {
  success: boolean;
  content: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  attempts: number;
  error?: string;
  errorCode?: string;
  fallbackUsed?: boolean;
  originalError?: string;
}

export interface LLMLogEntry {
  correlationId: string;
  timestamp: string;
  provider: string;
  model: string;
  latencyMs: number;
  tokensIn: number;
  tokensOut: number;
  requestSizeBytes: number;
  attempts: number;
  success: boolean;
  errorCode?: string;
  fallbackUsed?: boolean;
}

// === Structured Log ===

const llmLogs: LLMLogEntry[] = [];

export function logLLMCall(entry: LLMLogEntry): void {
  llmLogs.unshift(entry);
  if (llmLogs.length > 200) llmLogs.length = 200;

  // Console log for debugging
  console.log(`[LLM] ${entry.correlationId} | ${entry.success ? "OK" : "FAIL"} | ${entry.provider}/${entry.model} | ${entry.latencyMs}ms | ${entry.tokensOut} tokens | attempts=${entry.attempts}${entry.fallbackUsed ? " | FALLBACK" : ""}${entry.errorCode ? ` | ${entry.errorCode}` : ""}`);
}

export function getLLMLogs(limit = 50): LLMLogEntry[] {
  return llmLogs.slice(0, limit);
}

// === Retry Configuration ===

const RETRYABLE_STATUS_CODES = new Set([502, 503, 504, 429]);
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000; // 1s
const MAX_DELAY_MS = 30000; // 30s cap

function calculateBackoff(attempt: number): number {
  const exponential = Math.min(BASE_DELAY_MS * Math.pow(2, attempt), MAX_DELAY_MS);
  const jitter = Math.random() * 0.3 * exponential; // 0-30% jitter
  return Math.round(exponential + jitter);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// === Circuit Breaker ===

interface CircuitBreakerState {
  failures: number;
  lastFailureAt: number;
  openUntil: number; // timestamp when circuit closes
}

const circuitBreakers = new Map<string, CircuitBreakerState>();
const CB_FAILURE_THRESHOLD = 5;     // 5 failures
const CB_WINDOW_MS = 2 * 60 * 1000; // in 2 minutes
const CB_COOLDOWN_MS = 60 * 1000;   // pause for 60s

function getCircuitBreakerKey(provider: string, model: string): string {
  return `${provider}:${model}`;
}

function isCircuitOpen(key: string): boolean {
  const cb = circuitBreakers.get(key);
  if (!cb) return false;
  if (cb.openUntil > Date.now()) return true;
  // Reset if cooldown passed
  if (cb.openUntil > 0 && cb.openUntil <= Date.now()) {
    cb.openUntil = 0;
    cb.failures = 0;
  }
  return false;
}

function recordCircuitFailure(key: string): void {
  const now = Date.now();
  let cb = circuitBreakers.get(key);
  if (!cb) {
    cb = { failures: 0, lastFailureAt: now, openUntil: 0 };
    circuitBreakers.set(key, cb);
  }
  // Reset window if last failure was > 2 min ago
  if (now - cb.lastFailureAt > CB_WINDOW_MS) {
    cb.failures = 0;
  }
  cb.failures++;
  cb.lastFailureAt = now;
  if (cb.failures >= CB_FAILURE_THRESHOLD) {
    cb.openUntil = now + CB_COOLDOWN_MS;
    console.warn(`[CircuitBreaker] OPEN for ${key} — pausing for ${CB_COOLDOWN_MS / 1000}s (${cb.failures} failures in window)`);
  }
}

function recordCircuitSuccess(key: string): void {
  const cb = circuitBreakers.get(key);
  if (cb) {
    cb.failures = 0;
    cb.openUntil = 0;
  }
}

// === Concurrency Queue ===

interface QueueItem {
  fn: () => Promise<LLMCallResult>;
  resolve: (value: LLMCallResult) => void;
  reject: (reason: unknown) => void;
}

const MAX_GLOBAL_CONCURRENCY = 4;     // max 4 concurrent LLM calls globally
let activeCount = 0;
const queue: QueueItem[] = [];

async function enqueue<T extends LLMCallResult>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    queue.push({ fn, resolve: resolve as (v: LLMCallResult) => void, reject });
    processQueue();
  });
}

async function processQueue(): Promise<void> {
  if (activeCount >= MAX_GLOBAL_CONCURRENCY) return;
  const item = queue.shift();
  if (!item) return;
  activeCount++;

  try {
    const result = await item.fn();
    item.resolve(result);
  } catch (err) {
    item.reject(err);
  } finally {
    activeCount--;
    if (queue.length > 0) {
      processQueue();
    }
  }
}

// === Fallback Models ===

const FALLBACK_CHAIN: { provider: string; model: string }[] = [
  { provider: "z-ai", model: "default" },         // primary
  { provider: "z-ai", model: "default" },         // retry same (different attempt)
  // If z-ai fails completely, we can't fallback to another provider
  // since we only have z-ai-web-dev-sdk. But the retry + circuit breaker
  // handles transient failures.
];

// === Core: executeLLMWithRetry ===

async function executeSingleLLMCall(
  systemPrompt: string,
  userPrompt: string,
  providerOverride?: { baseUrl?: string; apiKey?: string; model?: string } | null
): Promise<{ content: string; tokensIn: number; tokensOut: number }> {
  const cfg = resolveProviderConfig(providerOverride);

  // Path A: OpenAI-compatible via env vars OR caller override (preferred for serverless deploys)
  if (cfg) {
    const url = `${cfg.baseUrl}/chat/completions`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`LLM HTTP ${res.status}: ${errText.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? "";
    if (!content.trim()) {
      throw new Error("LLM returned empty response");
    }
    return {
      content,
      tokensIn: systemPrompt.length + userPrompt.length,
      tokensOut: content.length,
    };
  }

  // Path B: Fallback to z-ai-web-dev-sdk (local dev with .z-ai-config)
  const zai = await ZAI.create();
  const completion = await zai.chat.completions.create({
    messages: [
      { role: "assistant", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    thinking: { type: "disabled" },
  });

  const content = completion.choices[0]?.message?.content ?? "";
  if (!content.trim()) {
    throw new Error("LLM returned empty response");
  }

  return {
    content,
    tokensIn: systemPrompt.length + userPrompt.length,
    tokensOut: content.length,
  };
}

/**
 * Execute LLM call with full infrastructure:
 * - Retry with exponential backoff + jitter (for 502/503/504/429)
 * - Circuit breaker per provider:model
 * - Concurrency queue (max 4 global)
 * - Structured logging
 * - Fallback chain
 */
export async function executeLLMWithInfra(
  params: LLMCallParams,
  providerOverride?: { baseUrl?: string; apiKey?: string; model?: string } | null
): Promise<LLMCallResult> {
  const startTime = Date.now();
  const provider = params.provider ?? "openai-compatible";
  const model = params.model ?? providerOverride?.model ?? "default";
  const cbKey = getCircuitBreakerKey(provider, model);
  const requestSizeBytes = params.systemPrompt.length + params.userPrompt.length;

  // Check circuit breaker
  if (isCircuitOpen(cbKey)) {
    const error = `Circuit breaker OPEN for ${cbKey} — pausing requests`;
    console.warn(`[LLM] ${params.correlationId} | BLOCKED by circuit breaker`);
    return {
      success: false,
      content: "",
      tokensIn: 0,
      tokensOut: 0,
      latencyMs: 0,
      attempts: 0,
      error,
      errorCode: "CIRCUIT_OPEN",
    };
  }

  // Enqueue with concurrency control
  const result = await enqueue(async (): Promise<LLMCallResult> => {
    let lastError: string | undefined;
    let lastErrorCode: string | undefined;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const callResult = await executeSingleLLMCall(params.systemPrompt, params.userPrompt, providerOverride);
        const latencyMs = Date.now() - startTime;

        // Success — record circuit success
        recordCircuitSuccess(cbKey);

        const logEntry: LLMLogEntry = {
          correlationId: params.correlationId,
          timestamp: new Date().toISOString(),
          provider,
          model,
          latencyMs,
          tokensIn: callResult.tokensIn,
          tokensOut: callResult.tokensOut,
          requestSizeBytes,
          attempts: attempt + 1,
          success: true,
        };
        logLLMCall(logEntry);

        return {
          success: true,
          content: callResult.content,
          tokensIn: callResult.tokensIn,
          tokensOut: callResult.tokensOut,
          latencyMs,
          attempts: attempt + 1,
        };
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        lastError = errMsg;

        // Determine error code from message
        if (errMsg.includes("502") || errMsg.includes("Bad Gateway")) lastErrorCode = "502";
        else if (errMsg.includes("503")) lastErrorCode = "503";
        else if (errMsg.includes("504") || errMsg.includes("timeout") || errMsg.includes("Timeout")) lastErrorCode = "504";
        else if (errMsg.includes("429") || errMsg.includes("rate")) lastErrorCode = "429";
        else if (errMsg.includes("403") || errMsg.includes("Forbidden")) lastErrorCode = "403";
        else if (errMsg.includes("401") || errMsg.includes("Unauthorized")) lastErrorCode = "401";
        else if (errMsg.includes("400") || errMsg.includes("Bad Request")) lastErrorCode = "400";
        else lastErrorCode = "UNKNOWN";

        const isRetryable = RETRYABLE_STATUS_CODES.has(Number(lastErrorCode)) ||
                           lastErrorCode === "UNKNOWN" ||
           errMsg.includes("fetch failed") ||
           errMsg.includes("network") ||
           errMsg.includes("ECONNRESET") ||
           errMsg.includes("ETIMEDOUT");

        console.warn(`[LLM] ${params.correlationId} | attempt ${attempt + 1}/${MAX_RETRIES} | FAIL ${lastErrorCode}: ${errMsg.slice(0, 100)}`);

        if (!isRetryable) {
          // Non-retryable error — fail immediately
          break;
        }

        // Record circuit failure
        recordCircuitFailure(cbKey);

        // Check if circuit just opened
        if (isCircuitOpen(cbKey)) {
          lastError = `Circuit breaker opened after ${attempt + 1} failures`;
          lastErrorCode = "CIRCUIT_OPEN";
          break;
        }

        // Backoff before next retry
        if (attempt < MAX_RETRIES - 1) {
          const delay = calculateBackoff(attempt);
          console.log(`[LLM] ${params.correlationId} | retrying in ${delay}ms...`);
          await sleep(delay);
        }
      }
    }

    const latencyMs = Date.now() - startTime;

    const logEntry: LLMLogEntry = {
      correlationId: params.correlationId,
      timestamp: new Date().toISOString(),
      provider,
      model,
      latencyMs,
      tokensIn: 0,
      tokensOut: 0,
      requestSizeBytes,
      attempts: MAX_RETRIES,
      success: false,
      errorCode: lastErrorCode,
    };
    logLLMCall(logEntry);

    return {
      success: false,
      content: "",
      tokensIn: 0,
      tokensOut: 0,
      latencyMs,
      attempts: MAX_RETRIES,
      error: lastError ?? "Unknown error after all retries",
      errorCode: lastErrorCode ?? "UNKNOWN",
    };
  });

  return result;
}

// === Queue status (for monitoring) ===

export function getQueueStatus(): {
  activeCount: number;
  queuedCount: number;
  maxConcurrency: number;
} {
  return {
    activeCount,
    queuedCount: queue.length,
    maxConcurrency: MAX_GLOBAL_CONCURRENCY,
  };
}

// === Circuit breaker status ===

export function getCircuitBreakerStatus(): Array<{ key: string; failures: number; open: boolean; openUntil?: number }> {
  const status: Array<{ key: string; failures: number; open: boolean; openUntil?: number }> = [];
  for (const [key, cb] of circuitBreakers.entries()) {
    status.push({
      key,
      failures: cb.failures,
      open: cb.openUntil > Date.now(),
      openUntil: cb.openUntil > Date.now() ? cb.openUntil : undefined,
    });
  }
  return status;
}
