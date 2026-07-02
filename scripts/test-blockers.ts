// Smoke test for TaskBlocker system — verifies that:
// 1. completeTask() populates blockers when forcing "blocked" status
// 2. setTaskBlockers() correctly sets status + blockers
// 3. getTaskBlockers() returns the blockers
// 4. clearTaskBlockers() removes them
// 5. blockerClassifier helpers produce correct codes
// Run: npx tsx /home/z/my-project/scripts/test-blockers.ts

import { useLovonStore } from "../src/lib/lovon/store";
import {
  makeBlocker,
  blockerConfirmationRequired,
  blockerCapabilityNotConfigured,
  blockerLLMFailed,
  blockerMissingRequiredArtifact,
  classifyError,
  BLOCKER_CODE_META,
} from "../src/lib/lovon/blockerClassifier";

console.log("=== TaskBlocker System — Smoke Test ===\n");

// 1. Initialize workspace
const store = useLovonStore.getState();
store.createCompany("Blocker Test Corp", "Testar blockers", "free", 0);
const ceoId = useLovonStore.getState().getActiveAgents().find((a) => a.role === "ceo")?.id ?? "";

// 2. Test 1: Task with email_send requirement but no receipt → should auto-block with MISSING_REQUIRED_ARTIFACT
console.log("--- Test 1: Email task without receipt ---");
const emailTaskId = useLovonStore.getState().createTask({
  title: "Enviar email para cliente",
  description: "enviar email para cliente@exemplo.com",
  createdBy: ceoId,
  requiredCapabilities: ["email_send"],
  status: "in_progress",
});
useLovonStore.getState().completeTask(emailTaskId, "Email redigido mas não enviado.");

const emailTask = useLovonStore.getState().tasks.find((t) => t.id === emailTaskId);
console.log(`  Status: ${emailTask?.status} (should be 'blocked')`);
console.log(`  Blockers: ${emailTask?.blockers?.length ?? 0} (should be >= 1)`);
console.log(`  First blocker code: ${emailTask?.blockers?.[0]?.code}`);
console.log(`  First blocker message: ${emailTask?.blockers?.[0]?.message?.slice(0, 80)}...`);
console.log(`  Required action: ${emailTask?.blockers?.[0]?.requiredAction?.slice(0, 80)}...`);

// 3. Test 2: setTaskBlockers directly
console.log("\n--- Test 2: setTaskBlockers with CONFIRMATION_REQUIRED ---");
const approvalTaskId = useLovonStore.getState().createTask({
  title: "Aprovar campanha crítica",
  description: "Campanha exige aprovação do board",
  createdBy: ceoId,
  status: "in_progress",
});
const confBlocker = blockerConfirmationRequired("conf_abc123", "Aprovar campanha crítica");
useLovonStore.getState().setTaskBlockers(approvalTaskId, [confBlocker]);
const approvalTask = useLovonStore.getState().tasks.find((t) => t.id === approvalTaskId);
console.log(`  Status: ${approvalTask?.status} (should be 'blocked')`);
console.log(`  Blockers: ${approvalTask?.blockers?.length} (should be 1)`);
console.log(`  Code: ${approvalTask?.blockers?.[0]?.code} (should be CONFIRMATION_REQUIRED)`);
console.log(`  Related entity:`, approvalTask?.blockers?.[0]?.relatedEntity);

// 4. Test 3: getTaskBlockers
console.log("\n--- Test 3: getTaskBlockers ---");
const fetched = useLovonStore.getState().getTaskBlockers(approvalTaskId);
console.log(`  Fetched ${fetched.length} blocker(s)`);
console.log(`  First: code=${fetched[0]?.code}, message=${fetched[0]?.message?.slice(0, 60)}...`);

// 5. Test 4: clearTaskBlockers (but status stays blocked — caller must explicitly unblock)
console.log("\n--- Test 4: clearTaskBlockers ---");
useLovonStore.getState().clearTaskBlockers(approvalTaskId);
const afterClear = useLovonStore.getState().tasks.find((t) => t.id === approvalTaskId);
console.log(`  Blockers after clear: ${afterClear?.blockers?.length} (should be 0)`);
console.log(`  Status after clear: ${afterClear?.status} (still 'blocked' — caller must change status)`);

// 6. Test 5: classifyError heuristic
console.log("\n--- Test 5: classifyError ---");
const testCases = [
  { status: 401, message: "Unauthorized", expected: "INTEGRATION_AUTH_FAILED" },
  { status: 403, message: "Forbidden", expected: "INTEGRATION_AUTH_FAILED" },
  { status: 429, message: "Too Many Requests", expected: "INTEGRATION_RATE_LIMITED" },
  { status: 502, message: "Bad Gateway", expected: "LLM_FAILED" },
  { message: "circuit breaker is open", expected: "LLM_FAILED" },
  { message: "budget exceeded for agent", expected: "BUDGET_EXCEEDED" },
  { message: "policy blocked tool resend_send_email", expected: "POLICY_BLOCKED" },
  { message: "no route available for agent", expected: "NO_ROUTE_AVAILABLE" },
  { message: "Zod validation failed: missing field 'to'", expected: "WORK_PRODUCT_INVALID" },
  { message: "some weird unknown error", expected: "UNKNOWN" },
];
for (const tc of testCases) {
  const code = classifyError(tc);
  const ok = code === tc.expected ? "✓" : "✗";
  console.log(`  ${ok} input(${tc.status ?? "-"}, "${tc.message?.slice(0, 40)}") → ${code} (expected ${tc.expected})`);
}

// 7. Test 6: BLOCKER_CODE_META has labels for all codes
console.log("\n--- Test 6: BLOCKER_CODE_META coverage ---");
const allCodes = Object.keys(BLOCKER_CODE_META);
console.log(`  ${allCodes.length} codes have metadata:`);
for (const code of allCodes) {
  const meta = BLOCKER_CODE_META[code as keyof typeof BLOCKER_CODE_META];
  console.log(`    ${meta.icon} ${code} → "${meta.label}"`);
}

// 8. Test 7: Complete a non-blocked task — should have 0 blockers
console.log("\n--- Test 7: Non-blocked task has no blockers ---");
const simpleTaskId = useLovonStore.getState().createTask({
  title: "Tarefa simples",
  description: "Sem capabilities especiais",
  createdBy: ceoId,
  status: "in_progress",
});
useLovonStore.getState().completeTask(simpleTaskId, "Concluída com sucesso.");
const simpleTask = useLovonStore.getState().tasks.find((t) => t.id === simpleTaskId);
console.log(`  Status: ${simpleTask?.status} (should be 'completed')`);
console.log(`  Blockers: ${simpleTask?.blockers?.length ?? 0} (should be 0)`);

console.log("\n=== Test complete ===");
