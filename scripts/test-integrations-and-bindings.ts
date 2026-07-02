// Smoke test for Integrations + Capability Binding + Invoke Enforcement
// Run: npx tsx /home/z/my-project/scripts/test-integrations-and-bindings.ts

import { useLovonStore } from "../src/lib/lovon/store";
import { CapabilityId, ProviderId, PROVIDER_PRESETS, CAPABILITY_CATALOG } from "../src/lib/lovon/work-products";

console.log("=== Integrations + Bindings + Invoke — Smoke Test ===\n");

// === Initialize workspace ===
const store = useLovonStore.getState();
store.createCompany("Integrations Test Corp", "Testar integrações", "free", 0);
const ceoId = useLovonStore.getState().getActiveAgents().find((a) => a.role === "ceo")?.id ?? "";
console.log(`Workspace initialized. CEO: ${ceoId}\n`);

// === Test 1: CAPABILITY_CATALOG has 16 capabilities ===
console.log("--- Test 1: Capability catalog ---");
console.log(`  Total capabilities: ${CAPABILITY_CATALOG.length} (should be 16)`);
const categories = [...new Set(CAPABILITY_CATALOG.map((c) => c.category))];
console.log(`  Categories: ${categories.join(", ")}`);
const webDevCaps = CAPABILITY_CATALOG.filter((c) => c.category === "Web Dev");
console.log(`  Web Dev capabilities: ${webDevCaps.map((c) => c.id).join(", ")}`);

// === Test 2: PROVIDER_PRESETS has 17 providers ===
console.log("\n--- Test 2: Provider presets ---");
console.log(`  Total providers: ${PROVIDER_PRESETS.length}`);
const aiProviders = PROVIDER_PRESETS.filter((p) => p.category === "AI");
console.log(`  AI providers: ${aiProviders.map((p) => p.key).join(", ")}`);
const webDevProviders = PROVIDER_PRESETS.filter((p) => p.category === "Web Dev");
console.log(`  Web Dev providers: ${webDevProviders.map((p) => p.key).join(", ")}`);
const customProviders = PROVIDER_PRESETS.filter((p) => p.category === "Custom");
console.log(`  Custom providers: ${customProviders.map((p) => p.key).join(", ")}`);

// === Test 3: Create integration (Resend for email) ===
console.log("\n--- Test 3: Create Resend integration ---");
const resendId = useLovonStore.getState().createIntegration({
  providerKey: "resend",
  name: "Resend – Produção",
  capabilities: ["email_send", "email_schedule"],
  credentialsType: "api_key",
  config: {},
  limits: { perDay: 100, perMonth: 1000 },
  allowedAgentSlugs: [],
});
const resend = useLovonStore.getState().integrations.find((i) => i.id === resendId);
console.log(`  Integration created: ${resendId}`);
console.log(`  Name: ${resend?.name}`);
console.log(`  Provider: ${resend?.providerKey} (should be 'resend')`);
console.log(`  Capabilities: ${resend?.capabilities.join(", ")}`);
console.log(`  Secret ref: ${resend?.secretRef} (should start with vault://)`);
console.log(`  Credentials type: ${resend?.credentialsType} (should be 'api_key')`);

// === Test 4: Create custom OpenAPI integration ===
console.log("\n--- Test 4: Create Custom OpenAPI integration ---");
const openApiSpec = {
  openapi: "3.0.0",
  info: { title: "My API", version: "1.0" },
  paths: {
    "/users": {
      get: { operationId: "listUsers", summary: "List all users" },
      post: { operationId: "createUser", summary: "Create a user" },
    },
    "/users/{id}": {
      delete: { operationId: "deleteUser", summary: "Delete a user" },
    },
  },
};
const customId = useLovonStore.getState().createIntegration({
  providerKey: "custom_openapi",
  name: "Internal API",
  capabilities: ["custom_openapi"],
  credentialsType: "bearer",
  config: {
    openapi: openApiSpec,
    allowedOperations: ["listUsers", "createUser"],
    requiresApprovalForOperations: ["deleteUser"],
    baseUrl: "https://api.mycompany.com",
  },
  limits: { perRun: 10 },
  allowedAgentSlugs: [],
});
const custom = useLovonStore.getState().integrations.find((i) => i.id === customId);
console.log(`  Integration created: ${customId}`);
console.log(`  Provider: ${custom?.providerKey} (should be 'custom_openapi')`);
console.log(`  OpenAPI spec present: ${!!custom?.config.openapi}`);
console.log(`  Allowed operations: ${custom?.config.allowedOperations?.join(", ")}`);
console.log(`  Approval-required ops: ${custom?.config.requiresApprovalForOperations?.join(", ")}`);

// === Test 5: Bind capability ===
console.log("\n--- Test 5: Bind email_send → Resend ---");
useLovonStore.getState().bindCapability("email_send", resendId);
const binding = useLovonStore.getState().getCapabilityBinding("email_send");
console.log(`  Binding: capability=${binding?.capability}, integrationId=${binding?.integrationId === resendId ? "Resend ✓" : "WRONG"}`);

// === Test 6: Invoke capability WITH binding → should succeed ===
console.log("\n--- Test 6: Invoke email_send (with binding) ---");
const invoke1 = useLovonStore.getState().invokeCapability({
  capability: "email_send",
  requestedByAgentId: ceoId,
  args: { to: "test@example.com", subject: "Test", body: "Hello" },
  traceId: "test-invoke-1",
});
console.log(`  Result: ok=${invoke1.ok} (should be true)`);
console.log(`  Integration: ${invoke1.integrationId === resendId ? "Resend ✓" : "WRONG"}`);
console.log(`  Result status: ${(invoke1.result as { status?: string })?.status}`);

// === Test 7: Invoke capability WITHOUT binding → should fail with CAPABILITY_NOT_CONFIGURED ===
console.log("\n--- Test 7: Invoke web_search (no binding) ---");
const invoke2 = useLovonStore.getState().invokeCapability({
  capability: "web_search",
  requestedByAgentId: ceoId,
  args: { query: "test" },
  traceId: "test-invoke-2",
});
console.log(`  Result: ok=${invoke2.ok} (should be false)`);
console.log(`  Blocker: ${invoke2.blockerCode} (should be 'CAPABILITY_NOT_CONFIGURED')`);
console.log(`  Error: ${invoke2.error?.slice(0, 80)}...`);

// === Test 8: Agent permission check ===
console.log("\n--- Test 8: Agent permission (allowedAgentSlugs) ---");
// Create an integration that only allows "marketing-lead"
const restrictedId = useLovonStore.getState().createIntegration({
  providerKey: "brave",
  name: "Brave (Marketing only)",
  capabilities: ["web_search"],
  credentialsType: "api_key",
  config: {},
  allowedAgentSlugs: ["marketing-lead"],
});
useLovonStore.getState().bindCapability("web_search", restrictedId);

// CEO tries to invoke → should be blocked
const invoke3 = useLovonStore.getState().invokeCapability({
  capability: "web_search",
  requestedByAgentId: ceoId,
  args: { query: "test" },
  traceId: "test-invoke-3",
});
console.log(`  CEO invoke web_search (restricted to marketing-lead): ok=${invoke3.ok} (should be false)`);
console.log(`  Blocker: ${invoke3.blockerCode} (should be 'POLICY_BLOCKED')`);

// Spawn a Marketing Lead and try again
const mlId = useLovonStore.getState().spawnSubagent(ceoId, {
  name: "Marketing Lead",
  role: "department-head",
  departmentId: "marketing",
  emoji: "✦",
  specialty: "Marketing",
  model: "Gemini Flash",
  tier: "free",
  accent: "acid",
  status: "active",
  skills: [],
  tools: [],
});
const invoke4 = useLovonStore.getState().invokeCapability({
  capability: "web_search",
  requestedByAgentId: mlId,
  args: { query: "test" },
  traceId: "test-invoke-4",
});
console.log(`  Marketing Lead invoke web_search: ok=${invoke4.ok} (should be true)`);

// === Test 9: Unbind capability ===
console.log("\n--- Test 9: Unbind capability ---");
useLovonStore.getState().unbindCapability("email_send");
const bindingAfterUnbind = useLovonStore.getState().getCapabilityBinding("email_send");
console.log(`  Binding after unbind: ${bindingAfterUnbind === null ? "null ✓" : "still exists ✗"}`);

// Invoke should now fail
const invoke5 = useLovonStore.getState().invokeCapability({
  capability: "email_send",
  requestedByAgentId: ceoId,
  args: { to: "test@example.com" },
  traceId: "test-invoke-5",
});
console.log(`  Invoke after unbind: ok=${invoke5.ok} (should be false)`);
console.log(`  Blocker: ${invoke5.blockerCode} (should be 'CAPABILITY_NOT_CONFIGURED')`);

// === Test 10: testIntegrationReal ===
console.log("\n--- Test 10: testIntegrationReal ---");
useLovonStore.getState().testIntegrationReal(resendId).then((testResult) => {
  console.log(`  Resend test: ok=${testResult.ok}, message="${testResult.message}"`);
  const updatedResend = useLovonStore.getState().integrations.find((i) => i.id === resendId);
  console.log(`  lastTestResult stored: ok=${updatedResend?.lastTestResult?.ok}`);

  // === Test 11: Capability bindings list ===
  console.log("\n--- Test 11: Capability bindings list ---");
  const allBindings = useLovonStore.getState().capabilityBindings;
  console.log(`  Total bindings: ${allBindings.length}`);
  for (const b of allBindings) {
    const intg = useLovonStore.getState().integrations.find((i) => i.id === b.integrationId);
    console.log(`    ${b.capability} → ${intg?.name ?? "(orphan)"}`);
  }

  console.log("\n=== Test complete ===");
});
