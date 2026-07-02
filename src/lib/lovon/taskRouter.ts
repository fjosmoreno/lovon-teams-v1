// Lovon Teams — Task Router
// Roteamento automático de tasks baseado em requiredCapabilities.
// Se uma task exige "email_send", é roteada para o Email Agent automaticamente.

import { Agent, Task } from "./store";

// Heurística: detecta se uma task envolve email baseado no texto
const EMAIL_HINTS = [
  /enviar\s+e-?mail/i,
  /assunto\s*:/i,
  /subject\s*:/i,
  /@\w+\.\w{2,}/, // email pattern
  /resend/i,
  /enviar\s+por\s+email/i,
  /enviar\s+por\s+e-?mail/i,
  /notificar\s+por\s+email/i,
];

export function detectEmailRequirement(title: string, description: string): boolean {
  const text = `${title}\n${description}`;
  return EMAIL_HINTS.some((r) => r.test(text));
}

export function enrichTaskCapabilities(task: Partial<Task> & { title: string }): string[] {
  const caps = new Set(task.requiredCapabilities ?? []);
  
  // Detect email requirement
  if (detectEmailRequirement(task.title, task.description ?? "")) {
    caps.add("email_send");
  }
  
  return Array.from(caps);
}

// Find the best agent for a task based on required capabilities
export function routeTask(
  task: Task,
  agents: Agent[]
): { agentId: string | null; reason: string } {
  // 1) If already assigned, respect (unless policy violation)
  if (task.assignedTo) {
    const assigned = agents.find((a) => a.id === task.assignedTo);
    if (assigned) {
      // Check if agent has the required capabilities
      if (task.requiredCapabilities?.includes("email_send")) {
        const hasEmailSkill = (assigned.skills ?? []).some((s) => 
          s === "email-resend" || s === "email-send"
        );
        if (!hasEmailSkill) {
          // Agent doesn't have email capability — find Email Agent
          const emailAgent = findAgentWithCapability(agents, "email_send");
          if (emailAgent) {
            return { agentId: emailAgent.id, reason: `Reatribuído para ${emailAgent.name}: task exige email_send, agente atual não tem capability.` };
          }
        }
      }
      return { agentId: task.assignedTo, reason: "Já atribuído." };
    }
  }

  // 2) Route by required capabilities
  if (task.requiredCapabilities?.includes("email_send") || 
      task.requiredCapabilities?.includes("email_schedule")) {
    const emailAgent = findAgentWithCapability(agents, "email_send");
    if (emailAgent) {
      return { agentId: emailAgent.id, reason: `Roteado para ${emailAgent.name}: task exige email_send.` };
    }
    return { agentId: null, reason: "Nenhum agente com capability email_send encontrado. Crie um Email Agent." };
  }

  // 3) Fallback by department
  if (task.departmentId) {
    const deptAgent = agents.find((a) => a.departmentId === task.departmentId && a.role !== "ceo");
    if (deptAgent) {
      return { agentId: deptAgent.id, reason: `Roteado por departamento: ${task.departmentId}.` };
    }
  }

  // 4) Fallback to CEO
  const ceo = agents.find((a) => a.role === "ceo");
  return { agentId: ceo?.id ?? null, reason: "Sem capability específica — roteado para CEO." };
}

function findAgentWithCapability(agents: Agent[], capability: string): Agent | null {
  // Check by skills that map to capabilities
  const skillCapabilityMap: Record<string, string[]> = {
    "email-resend": ["email_send", "email_schedule"],
    "email-send": ["email_send", "email_schedule"],
    "web-research-brave": ["web_search"],
    "web-research": ["web_search"],
    "image-generation": ["image_generate"],
  };

  for (const agent of agents) {
    const skills = agent.skills ?? [];
    for (const skill of skills) {
      const caps = skillCapabilityMap[skill];
      if (caps?.includes(capability)) {
        return agent;
      }
    }
    
    // Also check agent.tools for direct tool mapping
    const tools = agent.tools ?? [];
    const toolCapabilityMap: Record<string, string[]> = {
      "resend_send_email": ["email_send"],
      "resend_schedule_email": ["email_schedule"],
      "brave_web_search": ["web_search"],
    };
    for (const tool of tools) {
      const caps = toolCapabilityMap[tool];
      if (caps?.includes(capability)) {
        return agent;
      }
    }
  }
  
  return null;
}

// Check if an agent has a specific capability
export function agentHasCapability(agent: Agent, capability: string): boolean {
  const found = findAgentWithCapability([agent], capability);
  return found !== null;
}

// Ensure Email Agent exists in the workspace
export function ensureEmailAgent(
  agents: Agent[],
  ceoId: string,
  spawnSubagent: (parentId: string, partial: Partial<Agent> & { name: string; role: import("./store").AgentRole }) => string
): string | null {
  // Check if email agent already exists
  const existing = agents.find((a) => 
    (a.skills ?? []).some((s) => s === "email-resend" || s === "email-send") ||
    (a.tools ?? []).some((t) => t === "resend_send_email")
  );
  
  if (existing) {
    return existing.id;
  }

  // Create Email Agent
  const emailAgentId = spawnSubagent(ceoId, {
    name: "Email Agent",
    role: "worker",
    departmentId: "ops",
    emoji: "✉",
    specialty: "Email Operations",
    model: "Gemini Flash",
    tier: "free",
    accent: "blue",
    status: "active",
    skills: ["email-resend"],
    tools: ["resend_send_email", "resend_schedule_email", "resend_cancel_email"],
  });

  return emailAgentId;
}
