// Smoke test for Dynamic Agent Hiring (Paperclip-like)
// Run: npx tsx /home/z/my-project/scripts/test-dynamic-hiring.ts

import { useLovonStore } from "../src/lib/lovon/store";

console.log("=== Dynamic Hiring — Smoke Test ===\n");

// === Initialize workspace ===
const store = useLovonStore.getState();
store.createCompany("Hiring Test Corp", "Testar contratação dinâmica", "free", 0);
const ceoId = useLovonStore.getState().getActiveAgents().find((a) => a.role === "ceo")?.id ?? "";
console.log(`Workspace initialized. CEO: ${ceoId}\n`);

// === Test 1: Default core team has 6 agents (CEO + 5 Leads/Email) ===
console.log("--- Test 1: Default workspace policy ---");
const policy = useLovonStore.getState().workspacePolicy;
console.log(`  maxAgentsTotal: ${policy.maxAgentsTotal} (should be 12)`);
console.log(`  maxWorkersPerDept: ${policy.maxWorkersPerDept} (should be 3)`);
console.log(`  maxAutoHiresPerDay: ${policy.maxAutoHiresPerDay} (should be 2)`);
console.log(`  idleWorkerArchiveDays: ${policy.idleWorkerArchiveDays} (should be 3)`);
console.log(`  autoHireEnabledDepartments: ${policy.autoHireEnabledDepartments.join(", ")}`);

// === Test 2: hireWorker — CMO hires Marketing Worker ===
console.log("\n--- Test 2: CMO hires Marketing Worker ---");
// First we need a Marketing Lead. Let's check if one exists from core team.
let marketingLead = useLovonStore.getState().agents.find((a) => a.name.includes("Marketing Lead"));
if (!marketingLead) {
  // Spawn one manually for the test
  const mlId = useLovonStore.getState().spawnSubagent(ceoId, {
    name: "Marketing Lead (CMO)",
    role: "department-head",
    departmentId: "marketing",
    emoji: "✦",
    specialty: "Content & Campaigns",
    model: "Gemini Flash",
    tier: "free",
    accent: "acid",
    status: "active",
    skills: ["marketing-campaign-generator"],
    tools: [],
  });
  marketingLead = useLovonStore.getState().agents.find((a) => a.id === mlId);
}
console.log(`  Marketing Lead: ${marketingLead?.name} (${marketingLead?.id})`);

const hire1 = useLovonStore.getState().hireWorker({
  leadAgentId: marketingLead!.id,
  departmentId: "marketing",
  reason: "Backlog de 5 posts de LinkedIn",
  isAutoHire: true,
});
console.log(`  Hire result: ok=${hire1.ok}, workerId=${hire1.workerId ?? "N/A"}, reusedWorkerId=${hire1.reusedWorkerId ?? "N/A"}`);
console.log(`  Error: ${hire1.error ?? "(none)"}`);

const hiredWorker = useLovonStore.getState().agents.find((a) => a.id === hire1.workerId);
console.log(`  Worker name: ${hiredWorker?.name}`);
console.log(`  Worker department: ${hiredWorker?.departmentId} (should be 'marketing')`);
console.log(`  Worker role: ${hiredWorker?.role} (should be 'worker')`);
console.log(`  Worker isAutoHired: ${hiredWorker?.isAutoHired} (should be true)`);
console.log(`  Worker hiredByLeadId: ${hiredWorker?.hiredByLeadId === marketingLead!.id ? "Marketing Lead ✓" : "WRONG"}`);
console.log(`  Worker skills: ${hiredWorker?.skills.join(", ")}`);

// === Test 3: Reuse — second hire should reuse the idle worker ===
console.log("\n--- Test 3: Reuse idle worker (no new hire) ---");
const hire2 = useLovonStore.getState().hireWorker({
  leadAgentId: marketingLead!.id,
  departmentId: "marketing",
  reason: "Mais um post para escrever",
  isAutoHire: true,
});
console.log(`  Hire result: ok=${hire2.ok}, workerId=${hire2.workerId ?? "N/A"}, reusedWorkerId=${hire2.reusedWorkerId ?? "N/A"}`);
console.log(`  Reused (not new hire): ${hire2.reusedWorkerId === hiredWorker?.id ? "YES ✓" : "NO ✗"}`);

// === Test 4: Cross-department hire blocked ===
console.log("\n--- Test 4: Cross-department hire blocked ---");
const crossHire = useLovonStore.getState().hireWorker({
  leadAgentId: marketingLead!.id,
  departmentId: "engineering", // Marketing Lead trying to hire Engineering Worker
  reason: "Tentativa inválida",
  isAutoHire: true,
});
console.log(`  Hire result: ok=${crossHire.ok} (should be false)`);
console.log(`  Blocker code: ${crossHire.blockerCode} (should be 'CROSS_DEPARTMENT_HIRE')`);
console.log(`  Error: ${crossHire.error?.slice(0, 80)}...`);

// === Test 5: Auto-hire daily limit (max 2 per day) ===
console.log("\n--- Test 5: Auto-hire daily limit (max 2) ---");
// We already did 1 auto-hire (hire1). hire2 was a reuse (doesn't count).
// Make the first worker busy so hire3 needs a NEW worker (2nd auto-hire)
useLovonStore.getState().setAgentStatus(hiredWorker!.id, "working", "task_fake");

const hire3 = useLovonStore.getState().hireWorker({
  leadAgentId: marketingLead!.id,
  departmentId: "marketing",
  reason: "Second worker needed (worker 1 is busy)",
  isAutoHire: true,
});
console.log(`  Hire 3 (2nd auto-hire today): ok=${hire3.ok}, workerId=${hire3.workerId ?? "N/A"}`);

// Make worker 3 busy too, so hire4 can't reuse and must try to auto-hire (3rd = blocked)
if (hire3.workerId) {
  useLovonStore.getState().setAgentStatus(hire3.workerId, "working", "task_fake2");
}

const hire4 = useLovonStore.getState().hireWorker({
  leadAgentId: marketingLead!.id,
  departmentId: "marketing",
  reason: "Third worker — should be blocked (daily limit)",
  isAutoHire: true,
});
console.log(`  Hire 4 (3rd auto-hire today): ok=${hire4.ok} (should be false)`);
console.log(`  Blocker code: ${hire4.blockerCode} (should be 'AUTO_HIRE_LIMIT_EXCEEDED')`);
console.log(`  Error: ${hire4.error?.slice(0, 80)}...`);

// === Test 6: Headcount stats ===
console.log("\n--- Test 6: Headcount stats ---");
const stats = useLovonStore.getState().getHeadcountStats();
console.log(`  Total active: ${stats.totalActive}`);
console.log(`  Total archived: ${stats.totalArchived}`);
console.log(`  Auto-hires today: ${stats.autoHiresToday} (should be 2)`);
console.log(`  By department:`);
for (const [dept, counts] of Object.entries(stats.byDepartment)) {
  console.log(`    ${dept}: active=${counts.active}, archived=${counts.archived}`);
}

// === Test 7: Auto-archive idle workers ===
console.log("\n--- Test 7: Auto-archive idle workers ---");
// Temporarily lower the idle threshold to 0 days for testing
useLovonStore.getState().updateWorkspacePolicy({ idleWorkerArchiveDays: 0 });

// Make sure workers have old lastActiveAt
const workersToArchive = useLovonStore.getState().agents.filter(
  (a) => a.role === "worker" && !a.currentTaskId && !a.isArchived && (a.generation ?? 1) === useLovonStore.getState().currentGeneration
);
console.log(`  Workers eligible for archive: ${workersToArchive.length}`);

// Manually set lastActiveAt to 5 days ago for all workers
useLovonStore.getState().agents.forEach((a) => {
  if (a.role === "worker" && !a.currentTaskId) {
    useLovonStore.getState().updateAgent(a.id, { lastActiveAt: Date.now() - 5 * 24 * 60 * 60 * 1000 });
  }
});

const archiveResult = useLovonStore.getState().autoArchiveIdleWorkers();
console.log(`  Archived: ${archiveResult.archivedCount}`);
console.log(`  Archived IDs: ${archiveResult.archivedAgentIds.join(", ").slice(0, 80)}...`);

// Verify they're archived
const afterArchive = useLovonStore.getState().agents.filter((a) => archiveResult.archivedAgentIds.includes(a.id));
console.log(`  All archived correctly: ${afterArchive.every((a) => a.isArchived) ? "YES ✓" : "NO ✗"}`);

// Reset policy
useLovonStore.getState().updateWorkspacePolicy({ idleWorkerArchiveDays: 3 });

// === Test 8: CEO can hire into any department ===
console.log("\n--- Test 8: CEO can hire into any department ---");
const ceoHire = useLovonStore.getState().hireWorker({
  leadAgentId: ceoId,
  departmentId: "engineering",
  reason: "CEO directly hiring engineering worker",
  isAutoHire: false, // manual hire by CEO doesn't count against daily limit
});
console.log(`  CEO hires engineering worker: ok=${ceoHire.ok}, workerId=${ceoHire.workerId ?? "N/A"}`);
console.log(`  Blocker: ${ceoHire.blockerCode ?? "(none)"}`);

// === Test 9: Workers per department limit ===
console.log("\n--- Test 9: Workers per department limit (max 3) ---");
// Reset daily limit by setting all hiredAt to 2 days ago
useLovonStore.getState().agents.forEach((a) => {
  if (a.isAutoHired) {
    useLovonStore.getState().updateAgent(a.id, { hiredAt: Date.now() - 2 * 24 * 60 * 60 * 1000 });
  }
});

// We need a Sales Lead to test
let salesLead = useLovonStore.getState().agents.find((a) => a.name.includes("Sales Lead"));
if (!salesLead) {
  const slId = useLovonStore.getState().spawnSubagent(ceoId, {
    name: "Sales Lead",
    role: "department-head",
    departmentId: "sales",
    emoji: "▲",
    specialty: "Outbound",
    model: "Gemini Flash",
    tier: "free",
    accent: "orange",
    status: "active",
    skills: ["sales-campaign-generator"],
    tools: [],
  });
  salesLead = useLovonStore.getState().agents.find((a) => a.id === slId);
}

// Hire 3 sales workers (the max) — each needs to be busy so the next hire doesn't reuse
const salesHire1 = useLovonStore.getState().hireWorker({ leadAgentId: salesLead!.id, departmentId: "sales", reason: "Worker 1", isAutoHire: true });
if (salesHire1.workerId) useLovonStore.getState().setAgentStatus(salesHire1.workerId, "working", "task_s1");

const salesHire2 = useLovonStore.getState().hireWorker({ leadAgentId: salesLead!.id, departmentId: "sales", reason: "Worker 2", isAutoHire: true });
if (salesHire2.workerId) useLovonStore.getState().setAgentStatus(salesHire2.workerId, "working", "task_s2");

const salesHire3 = useLovonStore.getState().hireWorker({ leadAgentId: salesLead!.id, departmentId: "sales", reason: "Worker 3", isAutoHire: true });
if (salesHire3.workerId) useLovonStore.getState().setAgentStatus(salesHire3.workerId, "working", "task_s3");

// Now all 3 sales workers are busy — 4th hire should be blocked by maxWorkersPerDept=3
const salesHire4 = useLovonStore.getState().hireWorker({ leadAgentId: salesLead!.id, departmentId: "sales", reason: "Worker 4 — should fail (dept limit)", isAutoHire: true });

console.log(`  Sales Worker 1: ok=${salesHire1.ok}`);
console.log(`  Sales Worker 2: ok=${salesHire2.ok}`);
console.log(`  Sales Worker 3: ok=${salesHire3.ok}`);
console.log(`  Sales Worker 4: ok=${salesHire4.ok} (should be false)`);
console.log(`  Blocker: ${salesHire4.blockerCode} (should be 'HEADCOUNT_LIMIT_EXCEEDED')`);

console.log("\n=== Test complete ===");
