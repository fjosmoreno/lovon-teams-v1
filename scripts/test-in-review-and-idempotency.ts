// Smoke test for in_review status (P0.2) + Email idempotency (P0.8)
// Run: npx tsx /home/z/my-project/scripts/test-in-review-and-idempotency.ts

import { useLovonStore } from "../src/lib/lovon/store";
import {
  executeEmailSend,
  _clearIdempotencyCacheForTests,
  EmailSendResult,
} from "../src/lib/lovon/emailSendCapability";

console.log("=== in_review + Idempotency Smoke Test ===\n");

// === PART 1: in_review status ===
console.log("--- Part 1: in_review status separation ---\n");

// Initialize workspace
const store = useLovonStore.getState();
store.createCompany("Review Test Corp", "Testar in_review", "free", 0);
const ceoId = useLovonStore.getState().getActiveAgents().find((a) => a.role === "ceo")?.id ?? "";

// Test 1: setTaskInReview sets status to in_review (NOT blocked)
console.log("Test 1: setTaskInReview sets status to 'in_review'");
const reviewTaskId = useLovonStore.getState().createTask({
  title: "Campanha crítica para aprovação",
  description: "Campanha exige aprovação do board",
  createdBy: ceoId,
  status: "in_progress",
});
useLovonStore.getState().setTaskInReview(reviewTaskId, "conf_001", "Campanha de mídia paga com budget > R$ 10k exige aprovação do board.");

const reviewTask = useLovonStore.getState().tasks.find((t) => t.id === reviewTaskId);
console.log(`  Status: ${reviewTask?.status} (should be 'in_review')`);
console.log(`  Blockers: ${reviewTask?.blockers?.length ?? 0} (should be 0 — in_review is NOT blocked)`);
console.log(`  Latest comment type: ${reviewTask?.comments?.[reviewTask.comments.length - 1]?.type} (should be 'approval')`);
console.log(`  Latest comment content preview: ${reviewTask?.comments?.[reviewTask.comments.length - 1]?.content?.slice(0, 80)}...`);

// Test 2: blocked task has different status + blockers
console.log("\nTest 2: blocked task (technical issue) has blockers");
const blockedTaskId = useLovonStore.getState().createTask({
  title: "Enviar email (sem destinatário)",
  description: "enviar email",
  createdBy: ceoId,
  requiredCapabilities: ["email_send"],
  status: "in_progress",
});
useLovonStore.getState().completeTask(blockedTaskId, "Tentei enviar mas falhou.");

const blockedTask = useLovonStore.getState().tasks.find((t) => t.id === blockedTaskId);
console.log(`  Status: ${blockedTask?.status} (should be 'blocked' — different from in_review)`);
console.log(`  Blockers: ${blockedTask?.blockers?.length ?? 0} (should be >= 1)`);

// Test 3: stats filter counts in_review and blocked separately
console.log("\nTest 3: stats correctly distinguish in_review vs blocked");
const allTasks = useLovonStore.getState().tasks;
const inReviewCount = allTasks.filter((t) => t.status === "in_review").length;
const blockedCount = allTasks.filter((t) => t.status === "blocked").length;
console.log(`  in_review count: ${inReviewCount} (should be 1)`);
console.log(`  blocked count: ${blockedCount} (should be 1)`);

// === PART 2: Email idempotency ===
(async () => {
console.log("\n--- Part 2: Email idempotency (P0.8) ---\n");

// Clear cache before testing
_clearIdempotencyCacheForTests();

// Test 4: Two calls with the same idempotencyKey return the SAME receipt
// (only one Resend call is made). We use an INVALID recipient so we don't actually
// send an email, but the idempotency logic still applies — the cached failure
// is returned on the second call.
console.log("Test 4: Same idempotencyKey returns cached result without re-calling Resend");
const idemKey = `test-key-${Date.now()}`;

const input1 = {
  to: "test-idempotency@example.com",
  subject: "Test 1",
  html: "<p>Test</p>",
  idempotencyKey: idemKey,
};

const input2 = {
  to: "test-idempotency@example.com",
  subject: "Test 1", // same subject
  html: "<p>Test</p>",
  idempotencyKey: idemKey, // same key
};

// These will actually call Resend (and probably fail with auth/domain error),
// but the idempotency check happens BEFORE the Resend call for the second one.
const result1 = await executeEmailSend(input1);
const result2 = await executeEmailSend(input2);

console.log(`  Result 1 ok: ${result1.ok}, error: ${result1.receipt.error?.slice(0, 60) ?? "(none)"}`);
console.log(`  Result 2 ok: ${result2.ok}, error: ${result2.receipt.error?.slice(0, 60) ?? "(none)"}`);
console.log(`  Same receipt object: ${result1.receipt === result2.receipt ? "YES (cached, no second Resend call)" : "NO (made two calls)"}`);
console.log(`  Same sentAt timestamp: ${result1.receipt.sentAt === result2.receipt.sentAt ? "YES" : "NO"}`);

// Test 5: Different idempotencyKey → fresh call (no cache hit)
console.log("\nTest 5: Different idempotencyKey → fresh call");
const input3 = {
  to: "test-idempotency@example.com",
  subject: "Test 2",
  html: "<p>Test</p>",
  idempotencyKey: `different-key-${Date.now()}`,
};
const result3 = await executeEmailSend(input3);
console.log(`  Result 3 sentAt: ${result3.receipt.sentAt}`);
console.log(`  Different from result 1: ${result3.receipt.sentAt !== result1.receipt.sentAt ? "YES (fresh call)" : "NO (suspicious)"}`);

// Test 6: No idempotencyKey → always fresh call
console.log("\nTest 6: No idempotencyKey → always fresh call");
const input4 = {
  to: "test-idempotency@example.com",
  subject: "Test 3",
  html: "<p>Test</p>",
  // no idempotencyKey
};
const input5 = {
  to: "test-idempotency@example.com",
  subject: "Test 3",
  html: "<p>Test</p>",
  // no idempotencyKey
};
const result4 = await executeEmailSend(input4);
const result5 = await executeEmailSend(input5);
console.log(`  Result 4 sentAt: ${result4.receipt.sentAt}`);
console.log(`  Result 5 sentAt: ${result5.receipt.sentAt}`);
console.log(`  Same object (would be cached if a key existed): ${result4.receipt === result5.receipt ? "YES" : "NO (fresh calls, no cache)"}`);

console.log("\n=== Test complete ===");
})();
