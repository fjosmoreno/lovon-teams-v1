---
name: Action Items Output Contract
slug: action-items-output
title: Always return decisions + structured action items (JSON) on completion
role: skill
reportsTo: null
source: packages/teams-catalog/catalog/bundled/company-defaults/core-exec-team/skills/action-items-output/AGENTS.md
version: 1.0
tools: []
---

You MUST follow this output contract whenever you complete a task.

Your goal is to ensure recommendations become executable work. Do NOT output only narrative text — narrative without action items does not count as progress.

## Hard Rules

1. **If you recommend something, you MUST create an action item for it.** Every recommendation in your narrative must have a corresponding entry in `actionItems[]`.
2. **Every action item MUST include `acceptanceCriteria`** (at least 1). Without acceptance criteria, the action item is invalid and will be rejected.
3. **Do not exceed 5 action items** unless explicitly requested by the task. More than 5 = spam.
4. **If an action requires approval** (external email, publishing, finance, destructive ops), mark `requiresApproval: true` and explain why in `approvalReason`.
5. **Always suggest an owner** via `ownerSuggestion` (agent slug) or at minimum a `department`. The engine uses this to route the subtask.
6. **Be specific.** "Melhorar marketing" is NOT a valid action item title. "Criar campanha de mídia paga para LinkedIn focada em ICP SaaS B2B" IS.

## Output Format (STRICT — JSON only, no commentary)

Return ONLY valid JSON in this exact shape:

```json
{
  "decisions": [
    {
      "title": "Decidir focar em LinkedIn ao invés de Instagram",
      "rationale": "ICP é B2B SaaS, que está mais no LinkedIn"
    }
  ],
  "actionItems": [
    {
      "title": "Criar campanha de mídia paga para LinkedIn",
      "rationale": "Gerar 50 leads qualificados no próximo mês",
      "department": "marketing",
      "ownerSuggestion": "marketing-lead",
      "priority": "high",
      "dueInDays": 7,
      "acceptanceCriteria": [
        "Budget definido e aprovado",
        "3 criativos produzidos",
        "Campanha ativa no LinkedIn Ads"
      ],
      "requiresApproval": true,
      "approvalReason": "Envolve gasto financeiro em mídia paga",
      "tags": ["linkedin", "paid-media", "leads"]
    },
    {
      "title": "Escrever 2 posts de thought leadership para LinkedIn",
      "department": "marketing",
      "ownerSuggestion": "marketing-lead",
      "priority": "medium",
      "dueInDays": 5,
      "acceptanceCriteria": [
        "2 posts escritos e revisados",
        "Aprovados pelo board"
      ],
      "requiresApproval": false,
      "tags": ["content", "linkedin"]
    }
  ],
  "unknowns": [
    "Budget exato ainda não definido — preciso confirmar com board"
  ]
}
```

## Rules for each field

- **`decisions`**: What was decided during this task (max 20). Each needs a `title` (3+ chars).
- **`actionItems`**: What needs to happen next (max 10, recommended ≤ 5). Each needs:
  - `title` (3-200 chars, specific and actionable)
  - `acceptanceCriteria` (1-10 items, each a verifiable criterion)
  - `priority`: "critical" | "high" | "medium" | "low"
  - `department`: one of marketing/sales/engineering/research/ops/email/product
  - `ownerSuggestion`: agent slug if you know who should own it (e.g., "marketing-lead")
  - `dueInDays`: 0-60 (optional, 0 = immediate)
  - `requiresApproval`: true if external action (email to customer, publish, spend money, destructive)
  - `approvalReason`: why approval is needed (if requiresApproval=true)
  - `tags`: for dedupe and search
- **`unknowns`**: Things you couldn't decide due to missing data (max 10). Be honest — these become signals for the CEO.

## Anti-patterns (will be REJECTED by the engine)

❌ Returning only narrative text without JSON
❌ Action items without `acceptanceCriteria`
❌ Vague titles like "Melhorar X" or "Trabalhar em Y"
❌ More than 10 action items (will be truncated)
❌ JSON wrapped in markdown commentary ("Here is my response: ```json ... ```")
❌ Empty `actionItems` array when your narrative mentions recommendations

## What happens after you return this JSON

1. The engine validates it with Zod
2. For each `actionItem`, the engine creates a subtask with:
   - Title from `title`
   - Description from `rationale` + acceptance criteria
   - Assigned to `ownerSuggestion` (if exists) or default agent for `department`
   - Priority from `priority`
   - Due date = now + `dueInDays`
   - If `requiresApproval=true`, the subtask is created in `in_review` status with a pending confirmation request
3. The CEO is woken (via signal) to supervise the new subtasks
4. Your task is only marked `completed` if the JSON is valid

If your JSON is invalid, your task will be marked `blocked` with blocker `WORK_PRODUCT_INVALID` and you'll be asked to retry.
