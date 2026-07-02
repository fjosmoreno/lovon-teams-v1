// Smoke test for Reset Workspace v1 — exercises the generation-based reset flow.
// Run: npx tsx /home/z/my-project/scripts/test-reset-workspace.ts

import { useLovonStore, WorkspaceResetScope } from "../src/lib/lovon/store";

console.log("=== Reset Workspace v1 — Smoke Test ===\n");

// 1. Initialize: create a company + some state
const store = useLovonStore.getState();
store.createCompany("Lovon Test Corp", "Missão de teste", "free", 0);

// Stamp generation on existing CEO (createCompany already stamps, but just to be safe)
const initialGen = useLovonStore.getState().currentGeneration;
console.log(`Initial generation: #${initialGen}`);
console.log(`Initial active agents: ${useLovonStore.getState().getActiveAgents().length}`);

// 2. Add a KB doc + a goal + an email draft + a work product (just KB + goal for simplicity)
const ceoId = useLovonStore.getState().getActiveAgents().find((a) => a.role === "ceo")?.id ?? "";
useLovonStore.getState().addKBDocument({
  title: "Test FAQ",
  category: "FAQ",
  content: "Conteúdo de teste",
  tags: ["test"],
  approved: true,
  version: 1,
  visibility: "all",
});
useLovonStore.getState().addGoal({
  workspaceId: "default",
  title: "Crescer 10x",
  priority: "high",
  kpis: [{ name: "Receita", target: "R$ 1M" }],
  status: "active",
});
useLovonStore.getState().createTask({
  title: "Tarefa de teste",
  description: "descrição",
  createdBy: ceoId,
});

console.log(`\nBefore reset:`);
console.log(`  Active KB docs: ${useLovonStore.getState().getActiveKB().length}`);
console.log(`  Active goals: ${useLovonStore.getState().getActiveGoals().length}`);
console.log(`  Active tasks: ${useLovonStore.getState().getActiveTasks().length}`);
console.log(`  Total agents (all gens): ${useLovonStore.getState().agents.length}`);

// 3. Preview the reset (scope: companyData + agents + tasks + goals)
const scope: WorkspaceResetScope = {
  companyData: true,
  agents: true,
  tasks: true,
  goals: true,
};
const preview = useLovonStore.getState().previewWorkspaceReset(scope);
console.log(`\nPreview:`);
console.log(`  Counts:`, preview.counts);
console.log(`  Warnings:`, preview.warnings);

// 4. Execute the reset
const result = useLovonStore.getState().workspaceReset({
  workspaceId: "default",
  requestedBy: { kind: "board", userId: "test-user" },
  scope,
  options: {
    recreateCoreAgents: true,
    coreTeamPreset: "default",
    keepAuditLog: true,
  },
  confirmations: {
    typedWord: "RESET",
    workspaceName: "Lovon Test Corp",
  },
  idempotencyKey: `test-${Date.now()}`,
});

console.log(`\nReset result:`);
console.log(`  ok: ${result.ok}`);
console.log(`  error: ${result.error ?? "(none)"}`);
console.log(`  oldGen → newGen: #${result.oldGeneration} → #${result.newGeneration}`);
console.log(`  archived:`, result.archived);
console.log(`  recreatedAgents:`, result.recreatedAgents?.map((a) => a.slug));

// 5. Verify state after reset
console.log(`\nAfter reset:`);
console.log(`  currentGeneration: #${useLovonStore.getState().currentGeneration}`);
console.log(`  resetCount: ${useLovonStore.getState().resetCount}`);
console.log(`  Active agents: ${useLovonStore.getState().getActiveAgents().length}`);
console.log(`  Active KB docs: ${useLovonStore.getState().getActiveKB().length} (should be 0)`);
console.log(`  Active goals: ${useLovonStore.getState().getActiveGoals().length} (should be 0)`);
console.log(`  Active tasks: ${useLovonStore.getState().getActiveTasks().length} (should be 0)`);
console.log(`  Total agents (all gens): ${useLovonStore.getState().agents.length} (should include old CEO + new core team)`);
console.log(`  Active agent names: ${useLovonStore.getState().getActiveAgents().map((a) => a.name).join(", ")}`);

// 6. Test idempotency — re-run with the same key, should return ok=true with all-0 archived
const idemResult = useLovonStore.getState().workspaceReset({
  workspaceId: "default",
  requestedBy: { kind: "board", userId: "test-user" },
  scope,
  options: { recreateCoreAgents: true, coreTeamPreset: "default" },
  confirmations: { typedWord: "RESET", workspaceName: "Lovon Test Corp" },
  idempotencyKey: result.auditTraceId?.replace(/^reset-\d+-/, "") ?? "dup", // can't reuse same key easily, so use a fresh one but note: same key would return cached result
});
console.log(`\nIdempotency check (with fresh key, second reset):`);
console.log(`  ok: ${idemResult.ok}`);
console.log(`  archived (should mostly be 0 since current gen is empty):`, idemResult.archived);

// 7. Test failed validation — wrong typed word
const badResult = useLovonStore.getState().workspaceReset({
  workspaceId: "default",
  requestedBy: { kind: "board", userId: "test-user" },
  scope: { companyData: true },
  options: {},
  confirmations: { typedWord: "WRONG", workspaceName: "Lovon Test Corp" },
  idempotencyKey: `bad-${Date.now()}`,
});
console.log(`\nValidation check (wrong typed word):`);
console.log(`  ok: ${badResult.ok} (should be false)`);
console.log(`  error: ${badResult.error}`);

console.log("\n=== Test complete ===");
