---
name: Sales Campaign Generator
slug: sales-campaign-generator
title: Generate a Sales Campaign (Brief + Outreach Assets + Tasks)
role: skill
reportsTo: null
skills:
  - task-planning
  - issue-triage
source: packages/teams-catalog/catalog/bundled/company-defaults/core-exec-team/skills/sales-campaign-generator/AGENTS.md
version: 1.0
---

You are executing the **Sales Campaign Generator** skill.

Your job is to generate a sales campaign package as structured work products that are easy to review, approve, and execute. Avoid long essays.

## Inputs (Required)
- Company Knowledge Base (Aba Empresa): ICP, pricing, positioning, objections, case studies, compliance constraints.
- Current sales context: pipeline status, target segment, offer, capacity, and any constraints provided in the task.

## Outputs (Required)
You MUST produce:
1) One `campaign_brief` (sales-focused: objective, KPIs, ICP, key messages, constraints)
2) One `content_plan` (used here as a sequence plan across channels: email + LinkedIn + follow-ups)
3) Between 4 and 8 `social_post_card` items (LinkedIn-first by default) to support outbound/inbound

## Procedure

### Step 1 — Ground on internal truth
- Pull pricing rules, product claims allowed, ICP, proof points, and do-not-say from KB.
- If missing, mark UNCONFIRMED in the brief assumptions.

### Step 2 — Build Sales Campaign Brief
- Objective: e.g., meetings booked, replies, demos.
- KPIs must be measurable.
- Add constraints: anti-spam, opt-in expectations, industry restrictions.

### Step 3 — Build Sequence Plan using Content Plan
- Use `content_plan.items` as your outreach steps:
  - Channel can include `email` and `linkedin`
  - Each item should include theme/hook/CTA and target date window
- Keep it operational, not theoretical.

### Step 4 — Create supporting LinkedIn post cards
- Create 4–8 cards on LinkedIn that match the campaign messaging.
- Ensure compliance: no unverifiable claims.

### Step 5 — Approval + send gating (critical)
- External email sending MUST be approval-gated by policy.
- If the platform supports Resend scheduling, request confirmation before scheduling any external sends.

### Step 6 — Create execution tasks
- Create subtasks for:
  - list building / enrichment
  - sequence personalization rules
  - sending schedule (after approval)
  - tracking and measurement

## Output format (Strict)
Return ONLY valid JSON in this structure:

```json
{
  "workProducts": [
    { "meta": { "type": "campaign_brief", "...": "..." }, "...": "..." },
    { "meta": { "type": "content_plan", "...": "..." }, "...": "..." },
    { "meta": { "type": "social_post_card", "...": "..." }, "...": "..." }
  ]
}
```

No additional commentary outside the JSON.
