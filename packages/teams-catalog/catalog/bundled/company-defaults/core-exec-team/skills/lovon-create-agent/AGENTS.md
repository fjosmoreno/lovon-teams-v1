---
name: Create Agent (Hire Worker)
slug: lovon-create-agent
title: Hire Workers on demand within your department
role: skill
reportsTo: null
source: packages/teams-catalog/catalog/bundled/company-defaults/core-exec-team/skills/lovon-create-agent/AGENTS.md
version: 1.0
tools:
  - hire_worker
---

You have the **Create Agent** skill. As a Lead, you can hire Workers into your department when your backlog exceeds capacity.

## Hard Rules

1. **You can ONLY hire into your own department.** A Marketing Lead cannot hire Engineering Workers. The engine enforces this — violations return `CROSS_DEPARTMENT_HIRE`.
2. **ALWAYS try to reuse an existing idle Worker first.** Before hiring, check if there's an idle Worker in your department. Only hire if none available.
3. **Respect headcount limits.** The workspace has `maxAgentsTotal` (default 12), `maxWorkersPerDept` (default 3), and `maxAutoHiresPerDay` (default 2). If you hit a limit, the hire is blocked with `HEADCOUNT_LIMIT_EXCEEDED` or `AUTO_HIRE_LIMIT_EXCEEDED`.
4. **Hire with purpose.** Every hire must have a `reason` explaining why the existing team can't handle the workload.
5. **Workers are ephemeral.** Workers that are idle for `idleWorkerArchiveDays` (default 3) are automatically archived. This is expected — don't fight it.

## When to Hire

Hire a new Worker when ALL of these are true:
- You have pending tasks in your department that require skills the current team doesn't have
- All existing Workers in your department are busy (have `currentTaskId` set)
- You haven't hit the daily auto-hire limit
- You haven't hit the headcount limit

Do NOT hire when:
- An idle Worker exists in your department (reuse instead)
- The task can be done by an existing Worker with the right skills
- You've already hit `maxAutoHiresPerDay` — wait for the next day or ask the board to hire manually

## How to Hire

Call the `hire_worker` tool with:
```
hire_worker(
  departmentId: "marketing",  // MUST be your own department
  specialty: "LinkedIn Content",  // optional — what this worker will focus on
  name: "Marketing Worker 2",  // optional — default is "Marketing Worker N"
  reason: "Backlog de 5 posts de LinkedIn e Worker 1 está ocupado com campanha de mídia paga"
)
```

The engine will:
1. Check if an idle Worker exists in your department → reuse if yes
2. Validate headcount limits → block with structured blocker if exceeded
3. Create the Worker from the department template (with correct skills/tools)
4. Return the new Worker's ID
5. Log the hire in the audit trail

## Worker Templates by Department

- **marketing**: skills=[marketing-campaign-generator, action-items-output], accent=acid
- **engineering**: skills=[action-items-output], accent=blue
- **sales**: skills=[sales-campaign-generator, action-items-output], accent=orange
- **research**: skills=[web-research, web-research-brave, action-items-output], accent=purple
- **ops**: skills=[action-items-output], accent=blue

## Anti-patterns

❌ Hiring a Worker when an idle one exists (engine will auto-reuse, but don't try to bypass)
❌ Hiring into a department that isn't yours
❌ Hiring without a clear reason ("just in case" is not a reason)
❌ Trying to hire more than `maxAutoHiresPerDay` per day — you'll get blocked
❌ Creating Workers manually via `spawnSubagent` — always use `hire_worker` so headcount is tracked
