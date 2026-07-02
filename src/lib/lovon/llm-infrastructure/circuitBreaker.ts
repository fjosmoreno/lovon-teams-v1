// Lovon Teams — Circuit Breaker (shared, framework-agnostic)
//
// Tracks per-provider:model failure state. When failures exceed threshold
// within a window, the circuit "opens" and blocks calls for a cooldown
// period to avoid hammering a broken provider.
//
// IMPORTANT: This module has NO dependencies (no z-ai, no fetch) so it can
// be safely imported from both client AND server code without bundling
// server-only modules into the client.

interface CircuitBreakerState {
  failures: number;
  lastFailureAt: number;
  openUntil: number; // timestamp when circuit closes
}

const CB_FAILURE_THRESHOLD = 5; // 5 failures
const CB_WINDOW_MS = 2 * 60 * 1000; // in 2 minutes
const CB_COOLDOWN_MS = 60 * 1000; // pause for 60s

const circuitBreakers = new Map<string, CircuitBreakerState>();

export function getCircuitBreakerKey(provider: string, model: string): string {
  return `${provider}:${model}`;
}

export function isCircuitOpen(key: string): boolean {
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

export function recordCircuitFailure(key: string): void {
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
    // eslint-disable-next-line no-console
    console.warn(`[CircuitBreaker] OPEN for ${key} — pausing for ${CB_COOLDOWN_MS / 1000}s (${cb.failures} failures in window)`);
  }
}

export function recordCircuitSuccess(key: string): void {
  const cb = circuitBreakers.get(key);
  if (cb) {
    cb.failures = 0;
    cb.openUntil = 0;
  }
}

export function getCircuitOpenUntil(key: string): number {
  return circuitBreakers.get(key)?.openUntil ?? 0;
}

// P0: Public function to clear ALL circuit breaker state.
// Must be called on auth transitions (signup/login/logout) because circuit
// breakers are in-memory module state that persists across user changes
// in the same browser session.
export function clearAllCircuitBreakers(): void {
  circuitBreakers.clear();
}

export interface CircuitBreakerStatus {
  key: string;
  failures: number;
  open: boolean;
  openUntil?: number;
}

export function getCircuitBreakerStatus(): CircuitBreakerStatus[] {
  const status: CircuitBreakerStatus[] = [];
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