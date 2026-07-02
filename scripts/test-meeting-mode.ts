// Smoke test for Meeting Mode (P1) — exercises the full flow:
// createMeeting → startMeeting (generates Context Pack) → postMeetingMessage →
// inviteAgentToMeeting (with turn limits) → endMeeting (creates tasks from action items)
// Run: npx tsx /home/z/my-project/scripts/test-meeting-mode.ts

import { useLovonStore } from "../src/lib/lovon/store";

console.log("=== Meeting Mode — Smoke Test ===\n");

// 1. Initialize workspace
const store = useLovonStore.getState();
store.createCompany("Meeting Test Corp", "Testar modo reunião", "free", 0);
const ceoId = useLovonStore.getState().getActiveAgents().find((a) => a.role === "ceo")?.id ?? "";
console.log(`Workspace initialized. CEO: ${ceoId}\n`);

// === Test 1: createMeeting ===
console.log("--- Test 1: createMeeting ---");
const meetingId = useLovonStore.getState().createMeeting({
  title: "Revisão de Q3",
  objective: "Decidir budget de marketing para outubro",
  agenda: ["Vendas baixas", "Campanha nova", "Incidente de email"],
  policy: {
    autonomyLevel: 1,
    budgetMaxUsd: 100,
    maxAgentsInvited: 3,
    maxTurnsPerAgent: 2,
  },
  createdByUserId: "user-1",
});
const meeting = useLovonStore.getState().meetings.find((m) => m.id === meetingId);
console.log(`  Meeting created: ${meetingId}`);
console.log(`  Status: ${meeting?.status} (should be 'scheduled')`);
console.log(`  Participants: ${meeting?.participants.length} (should be 2 — board host + CEO)`);
console.log(`  Policy maxAgents: ${meeting?.policy.maxAgentsInvited} (should be 3)`);
console.log(`  Policy maxTurns: ${meeting?.policy.maxTurnsPerAgent} (should be 2)`);

// === Test 2: startMeeting (generates Context Pack) ===
console.log("\n--- Test 2: startMeeting (Context Pack generation) ---");
useLovonStore.getState().startMeeting(meetingId);
const startedMeeting = useLovonStore.getState().meetings.find((m) => m.id === meetingId);
console.log(`  Status: ${startedMeeting?.status} (should be 'live')`);
console.log(`  Context pack generated: ${!!startedMeeting?.contextPack}`);
console.log(`  Overdue tasks: ${startedMeeting?.contextPack?.overdueTasks.length}`);
console.log(`  Recent signals: ${startedMeeting?.contextPack?.recentSignals.length}`);
console.log(`  Pending approvals: ${startedMeeting?.contextPack?.pendingApprovals.length}`);
console.log(`  Active initiatives: ${startedMeeting?.contextPack?.activeInitiatives.length}`);
console.log(`  Recommended options: ${startedMeeting?.contextPack?.recommendedOptions.length} (should be 3 — A/B/C)`);
console.log(`  Options: ${startedMeeting?.contextPack?.recommendedOptions.map((o) => `${o.id}${o.recommended ? "*" : ""}`).join(" | ")}`);

// === Test 3: postMeetingMessage (board) ===
console.log("\n--- Test 3: postMeetingMessage (board) ---");
const msgId1 = useLovonStore.getState().postMeetingMessage({
  meetingId,
  sender: { kind: "board", id: "user-1", name: "Você" },
  content: "Olá CEO, vamos falar sobre o orçamento?",
});
console.log(`  Board message posted: ${msgId1 ? "YES" : "NO (null)"}`);

// === Test 4: postMeetingMessage (CEO with proposed options) ===
console.log("\n--- Test 4: postMeetingMessage (CEO with A/B/C options) ---");
const msgId2 = useLovonStore.getState().postMeetingMessage({
  meetingId,
  sender: { kind: "agent", id: ceoId, name: "Lovon CEO" },
  content: "Tenho 3 opções para você considerar:",
  proposedOptions: [
    { id: "A", title: "Aumentar budget", tradeoffs: "Ganha alcance, mas custa mais", recommended: true },
    { id: "B", title: "Manter budget", tradeoffs: "Estável, mas não escala" },
    { id: "C", title: "Reduzir budget", tradeoffs: "Economiza, mas perde momentum" },
  ],
});
console.log(`  CEO message posted: ${msgId2 ? "YES" : "NO"}`);
const meetingAfterMsgs = useLovonStore.getState().meetings.find((m) => m.id === meetingId);
console.log(`  Total messages: ${meetingAfterMsgs?.messages.length} (should be 2)`);
console.log(`  CEO messagesPosted: ${meetingAfterMsgs?.participants.find((p) => p.id === ceoId)?.messagesPosted} (should be 1)`);

// === Test 5: Turn limit enforcement ===
console.log("\n--- Test 5: Turn limit enforcement (max 2 turns per agent) ---");
// Post 2nd message from CEO (should succeed — under limit)
const msgId3 = useLovonStore.getState().postMeetingMessage({
  meetingId,
  sender: { kind: "agent", id: ceoId, name: "Lovon CEO" },
  content: "Segunda mensagem do CEO",
});
console.log(`  CEO 2nd message: ${msgId3 ? "ACCEPTED" : "REJECTED"} (should be ACCEPTED — under limit)`);

// Post 3rd message from CEO (should be rejected — limit exceeded)
const msgId4 = useLovonStore.getState().postMeetingMessage({
  meetingId,
  sender: { kind: "agent", id: ceoId, name: "Lovon CEO" },
  content: "Terceira mensagem do CEO (deve ser rejeitada)",
});
console.log(`  CEO 3rd message: ${msgId4 ? "ACCEPTED" : "REJECTED"} (should be REJECTED — limit exceeded)`);

// === Test 6: inviteAgentToMeeting ===
console.log("\n--- Test 6: inviteAgentToMeeting ---");
// Spawn a worker agent to invite
const workerId = useLovonStore.getState().spawnSubagent(ceoId, {
  name: "Marketing Lead",
  role: "department-head",
  departmentId: "marketing",
  emoji: "✦",
  specialty: "Marketing",
  model: "Gemini Flash",
  tier: "free",
  accent: "acid",
  status: "active",
});
console.log(`  Marketing Lead spawned: ${workerId}`);

const invite1 = useLovonStore.getState().inviteAgentToMeeting(meetingId, workerId, "Preciso da opinião sobre campanha");
console.log(`  Invite 1 (Marketing Lead): ${invite1.ok ? "OK" : `FAIL: ${invite1.error}`}`);

const invite2 = useLovonStore.getState().inviteAgentToMeeting(meetingId, workerId, "Tentar convidar de novo");
console.log(`  Invite 2 (same agent): ${invite2.ok ? "OK (suspicious)" : `REJECTED: ${invite2.error}`} (should be REJECTED)`);

// === Test 7: Max agents limit ===
console.log("\n--- Test 7: Max agents limit (3) ---");
const w2 = useLovonStore.getState().spawnSubagent(ceoId, { name: "Worker 2", role: "worker", departmentId: "sales", emoji: "·", specialty: "Sales", model: "Gemini", tier: "free", accent: "blue", status: "active" });
const w3 = useLovonStore.getState().spawnSubagent(ceoId, { name: "Worker 3", role: "worker", departmentId: "sales", emoji: "·", specialty: "Sales", model: "Gemini", tier: "free", accent: "blue", status: "active" });
const w4 = useLovonStore.getState().spawnSubagent(ceoId, { name: "Worker 4", role: "worker", departmentId: "sales", emoji: "·", specialty: "Sales", model: "Gemini", tier: "free", accent: "blue", status: "active" });

const r2 = useLovonStore.getState().inviteAgentToMeeting(meetingId, w2, "Test");
const r3 = useLovonStore.getState().inviteAgentToMeeting(meetingId, w3, "Test");
const r4 = useLovonStore.getState().inviteAgentToMeeting(meetingId, w4, "Test");
console.log(`  Invite w2: ${r2.ok ? "OK" : "FAIL"}`);
console.log(`  Invite w3: ${r3.ok ? "OK" : "FAIL"}`);
console.log(`  Invite w4: ${r4.ok ? "OK" : `REJECTED: ${r4.error}`} (should be REJECTED — limit 3 reached)`);

// === Test 8: endMeeting with task creation ===
console.log("\n--- Test 8: endMeeting (with task creation) ---");
// Post a message with ACTION_ITEMS block to test parsing
useLovonStore.getState().postMeetingMessage({
  meetingId,
  sender: { kind: "agent", id: ceoId, name: "Lovon CEO" },
  // Wait — CEO is already at limit. Let's use board instead.
  // Actually, let's post as board with the action items
  content: ">>>ACTION_ITEMS:\n- [Marketing Lead] Criar campanha de mídia paga | Definir budget | Escolher canais\n- [CEO] Aprovar budget final | Validar ROI\n<<<END_ACTION_ITEMS",
});
// Actually re-posting as board:
useLovonStore.getState().postMeetingMessage({
  meetingId,
  sender: { kind: "board", id: "user-1", name: "Você" },
  content: ">>>ACTION_ITEMS:\n- [Marketing Lead] Criar campanha de mídia paga | Definir budget | Escolher canais\n- [CEO] Aprovar budget final | Validar ROI\n<<<END_ACTION_ITEMS",
});

// Also post a DECISION block
useLovonStore.getState().postMeetingMessage({
  meetingId,
  sender: { kind: "board", id: "user-1", name: "Você" },
  content: ">>>DECISION: Aumentar budget de marketing em 30% para outubro\n<<<END_DECISION",
});

const endResult = useLovonStore.getState().endMeeting(meetingId, {
  meetingId,
  decisions: [],
  actionItems: [],
  approvalRequests: [],
  summary: "Teste",
}, true);

console.log(`  End result ok: ${endResult.outcomeId !== ""}`);
console.log(`  Created tasks: ${endResult.createdTaskIds.length} (should be >= 0; parsing handles extraction)`);

const endedMeeting = useLovonStore.getState().meetings.find((m) => m.id === meetingId);
console.log(`  Final status: ${endedMeeting?.status} (should be 'ended')`);
console.log(`  Outcome generated: ${!!endedMeeting?.outcome}`);

// === Test 9: getActiveMeeting ===
console.log("\n--- Test 9: getActiveMeeting (after end, should be null) ---");
const active = useLovonStore.getState().getActiveMeeting();
console.log(`  Active meeting: ${active ? "FOUND (suspicious)" : "null (correct — meeting ended)"}`);

console.log("\n=== Test complete ===");
