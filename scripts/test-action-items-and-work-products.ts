// Smoke test for Action Items Output Contract + Work Products Write Path
// Run: npx tsx /home/z/my-project/scripts/test-action-items-and-work-products.ts

import { useLovonStore } from "../src/lib/lovon/store";
import {
  extractActionItemsJsonFromText,
  validateActionItemsOutput,
  actionItemFingerprint,
  ActionItemsOutput,
} from "../src/lib/lovon/action-items-schema";

console.log("=== Action Items + Work Products — Smoke Test ===\n");

// === Initialize workspace ===
const store = useLovonStore.getState();
store.createCompany("Action Items Test Corp", "Testar action items + work products", "free", 0);
const ceoId = useLovonStore.getState().getActiveAgents().find((a) => a.role === "ceo")?.id ?? "";

// Spawn a Marketing Lead for owner routing test
const marketingLeadId = useLovonStore.getState().spawnSubagent(ceoId, {
  name: "Marketing Lead",
  role: "department-head",
  departmentId: "marketing",
  emoji: "✦",
  specialty: "Marketing",
  model: "Gemini Flash",
  tier: "free",
  accent: "acid",
  status: "active",
  skills: ["marketing-campaign-generator", "action-items-output"],
});

// === Test 1: Schema validation ===
console.log("--- Test 1: ActionItemsOutputSchema validation ---");
const validOutput: ActionItemsOutput = {
  decisions: [{ title: "Focar em LinkedIn", rationale: "ICP é B2B" }],
  actionItems: [
    {
      title: "Criar campanha de mídia paga para LinkedIn",
      rationale: "Gerar 50 leads",
      department: "marketing",
      ownerSuggestion: "marketing-lead",
      priority: "high",
      dueInDays: 7,
      acceptanceCriteria: ["Budget definido", "3 criativos produzidos", "Campanha ativa"],
      requiresApproval: true,
      approvalReason: "Gasto financeiro",
      tags: ["linkedin", "paid-media"],
    },
    {
      title: "Escrever 2 posts de thought leadership",
      department: "marketing",
      ownerSuggestion: "marketing-lead",
      priority: "medium",
      dueInDays: 5,
      acceptanceCriteria: ["2 posts escritos", "Aprovados pelo board"],
      requiresApproval: false,
      tags: ["content"],
    },
  ],
  unknowns: ["Budget exato não definido"],
};
const validation = validateActionItemsOutput(validOutput);
console.log(`  Valid output validation: ${validation.success ? "PASS" : "FAIL"} ${!validation.success ? `(${validation.error})` : ""}`);

const invalidOutput = { actionItems: [{ title: "ab" }] }; // title too short, no acceptanceCriteria
const invalidValidation = validateActionItemsOutput(invalidOutput);
console.log(`  Invalid output rejection: ${!invalidValidation.success ? "PASS (rejected)" : "FAIL (should reject)"} `);

// === Test 2: Extract from LLM text (with markdown fences) ===
console.log("\n--- Test 2: Extract from LLM text with ```json fences ---");
const llmText = `Aqui está minha análise:

\`\`\`json
{
  "decisions": [{"title": "Aumentar budget", "rationale": "Para escalar"}],
  "actionItems": [
    {
      "title": "Revisar proposta comercial",
      "department": "sales",
      "priority": "high",
      "dueInDays": 3,
      "acceptanceCriteria": ["Proposta revisada", "Enviada ao cliente"],
      "requiresApproval": false,
      "tags": []
    }
  ],
  "unknowns": []
}
\`\`\`

Espero que isso ajude.`;
const extractResult = extractActionItemsJsonFromText(llmText);
console.log(`  Extraction success: ${extractResult.success}`);
if (extractResult.success) {
  console.log(`  Decisions: ${extractResult.data.decisions.length}`);
  console.log(`  Action items: ${extractResult.data.actionItems.length}`);
  console.log(`  First action item: ${extractResult.data.actionItems[0]?.title}`);
}

// === Test 3: Extract from pure JSON (no fences) ===
console.log("\n--- Test 3: Extract from pure JSON ---");
const pureJson = JSON.stringify(validOutput);
const pureResult = extractActionItemsJsonFromText(pureJson);
console.log(`  Pure JSON extraction: ${pureResult.success ? "PASS" : "FAIL"}`);

// === Test 4: Extract from text without JSON (should fail) ===
console.log("\n--- Test 4: Extract from narrative text (should fail) ---");
const narrative = "Recomendo que você faça X, Y, Z. Próximos passos: melhorar marketing.";
const narrativeResult = extractActionItemsJsonFromText(narrative);
console.log(`  Narrative extraction: ${!narrativeResult.success ? "PASS (correctly failed)" : "FAIL (should not extract)"}`);
console.log(`  Error: ${narrativeResult.error?.slice(0, 80)}...`);

// === Test 5: applyActionItems — creates subtasks with owner routing ===
console.log("\n--- Test 5: applyActionItems (subtask creation + owner routing) ---");
const parentTaskId = useLovonStore.getState().createTask({
  title: "Análise de marketing Q3",
  description: "Analisar e recomendar ações",
  createdBy: ceoId,
  status: "in_progress",
});

const applyResult = useLovonStore.getState().applyActionItems({
  taskId: parentTaskId,
  output: validOutput,
  traceId: `test:${parentTaskId}`,
  controls: { maxSubtasksToCreate: 5, requireBoardApprovalForExternal: true, dedupeWindowHours: 24 },
});
console.log(`  Created subtasks: ${applyResult.createdSubtaskIds.length} (should be 2)`);
console.log(`  Created confirmations: ${applyResult.createdConfirmationRequestIds.length} (should be 1 — first item requiresApproval)`);
console.log(`  Skipped duplicates: ${applyResult.skippedDuplicates} (should be 0)`);
console.log(`  Blockers added: ${applyResult.blockersAdded.length} (should be 0 — marketing-lead exists)`);

// Verify subtasks were created
const subtasks = useLovonStore.getState().tasks.filter((t) => t.parentTaskId === parentTaskId);
console.log(`  Subtask 1 status: ${subtasks[0]?.status} (should be 'in_review' — requiresApproval)`);
console.log(`  Subtask 1 assignedTo: ${subtasks[0]?.assignedTo === marketingLeadId ? "Marketing Lead ✓" : "WRONG"}`);
console.log(`  Subtask 2 status: ${subtasks[1]?.status} (should be 'pending' — no approval needed)`);
console.log(`  Subtask 2 assignedTo: ${subtasks[1]?.assignedTo === marketingLeadId ? "Marketing Lead ✓" : "WRONG"}`);

// === Test 6: Dedupe — apply same action items again ===
console.log("\n--- Test 6: Dedupe (apply same items again) ---");
const applyResult2 = useLovonStore.getState().applyActionItems({
  taskId: parentTaskId,
  output: validOutput,
  traceId: `test2:${parentTaskId}`,
  controls: { maxSubtasksToCreate: 5, requireBoardApprovalForExternal: true, dedupeWindowHours: 24 },
});
console.log(`  Created subtasks (2nd apply): ${applyResult2.createdSubtaskIds.length} (should be 0)`);
console.log(`  Skipped duplicates: ${applyResult2.skippedDuplicates} (should be 2)`);

// === Test 7: MISSING_OWNER_AGENT blocker ===
console.log("\n--- Test 7: Action item with non-existent owner ---");
const outputNoOwner: ActionItemsOutput = {
  decisions: [],
  actionItems: [
    {
      title: "Tarefa sem owner claro",
      department: "engineering", // no engineering agent exists
      priority: "medium",
      acceptanceCriteria: ["Critério 1"],
      requiresApproval: false,
      tags: [],
    },
  ],
  unknowns: [],
};
const noOwnerTaskId = useLovonStore.getState().createTask({
  title: "Test owner missing",
  description: "test",
  createdBy: ceoId,
  status: "in_progress",
});
const noOwnerResult = useLovonStore.getState().applyActionItems({
  taskId: noOwnerTaskId,
  output: outputNoOwner,
  traceId: `test:${noOwnerTaskId}`,
});
console.log(`  Created subtasks: ${noOwnerResult.createdSubtaskIds.length} (should be 1 — still created)`);
console.log(`  Blockers added: ${noOwnerResult.blockersAdded.length} (should be 1 — MISSING_OWNER_AGENT)`);
console.log(`  Blocker code: ${noOwnerResult.blockersAdded[0]?.code}`);

// === Test 8: Signal emission ===
console.log("\n--- Test 8: Signal emitted on action items applied ---");
const signals = useLovonStore.getState().signals;
const actionItemsSignals = signals.filter((s) => s.payload?.event === "action_items_applied");
console.log(`  Signals emitted: ${actionItemsSignals.length} (should be >= 2 — from Test 5 and Test 7)`);
if (actionItemsSignals.length > 0) {
  const last = actionItemsSignals[0];
  console.log(`  Last signal severity: ${last.severity}`);
  console.log(`  Last signal payload: ${JSON.stringify(last.payload).slice(0, 120)}...`);
}

// === Test 9: Work Products Hard Gate ===
console.log("\n--- Test 9: Work Products Hard Gate (expectedWorkProducts) ---");
const wpTaskId = useLovonStore.getState().createTask({
  title: "Gerar campanha completa",
  description: "Deve produzir 1 brief + 6 social cards",
  createdBy: ceoId,
  status: "in_progress",
  expectedWorkProducts: {
    campaign_brief: 1,
    social_post_card: { min: 6, max: 12 },
  },
});

// Try to complete without creating any work products — should be BLOCKED
useLovonStore.getState().completeTask(wpTaskId, "Concluí o relatório da campanha.");
const wpTask = useLovonStore.getState().tasks.find((t) => t.id === wpTaskId);
console.log(`  Status after complete without WPs: ${wpTask?.status} (should be 'blocked')`);
console.log(`  Blockers: ${wpTask?.blockers?.length} (should be >= 1)`);
console.log(`  Blocker code: ${wpTask?.blockers?.[0]?.code} (should be 'MISSING_WORK_PRODUCTS')`);
console.log(`  Blocker message preview: ${wpTask?.blockers?.[0]?.message?.slice(0, 100)}...`);

// === Test 10: countWorkProductsForTask ===
console.log("\n--- Test 10: countWorkProductsForTask (empty) ---");
const counts = useLovonStore.getState().countWorkProductsForTask(wpTaskId);
console.log(`  Counts: ${JSON.stringify(counts)} (all should be 0)`);

// === Test 11: Fingerprint stability ===
console.log("\n--- Test 11: Fingerprint stability (same title → same hash) ---");
const fp1 = actionItemFingerprint("task1", "Criar campanha de mídia paga");
const fp2 = actionItemFingerprint("task1", "Criar campanha de mídia paga");
const fp3 = actionItemFingerprint("task1", "Criar campanha de mídia paga!"); // punctuation diff
const fp4 = actionItemFingerprint("task2", "Criar campanha de mídia paga"); // different task
console.log(`  Same title+task: ${fp1 === fp2 ? "SAME ✓" : "DIFFERENT ✗"}`);
console.log(`  Punctuation diff: ${fp1 === fp3 ? "SAME (normalized) ✓" : "DIFFERENT ✗"}`);
console.log(`  Different task: ${fp1 === fp4 ? "SAME (suspicious)" : "DIFFERENT ✓"}`);

console.log("\n=== Test complete ===");
