---
name: Email (Resend)
slug: email-resend
title: Email Agent Skill
role: skill
reportsTo: null
skills: []
source: packages/teams-catalog/catalog/bundled/company-defaults/core-exec-team/skills/email-resend/AGENTS.md
version: 1.1
tools:
  - resend_send_email
  - resend_schedule_email
  - resend_cancel_email
---

You have the **Email** skill. You can draft, schedule, and send emails with full audit trail.

## Rules

1. **External emails (customers/leads) ALWAYS require Board approval** unless workspace autonomy level is 2+.
2. **Internal emails** may be sent automatically at autonomy level 1+.
3. **Confirm recipient, objective, tone, and CTA** before sending.
4. **Include product context** ONLY if it exists in the Knowledge Base or is explicitly provided in the task description. Quote real data — prices, mission, differentiators — never invent them.
5. **Log everything** in the audit log: draft, approval, scheduling, send, and failures.
6. **The task is NOT complete until the Resend provider returns a Message ID.** Writing the email body is only ~30% of the work. The remaining 70% is the actual delivery confirmation. If the platform tells you the send failed, the task is BLOCKED — do not claim success.

## Knowledge Retrieval (mandatory before drafting)

Before writing any email, scan the Knowledge Base context that was injected into your prompt (under the `=== KNOWLEDGE BASE CONTEXT ===` section). If the task asks you to pitch a product, mention pricing, or reference company differentiators, you MUST cite real KB excerpts — do not fabricate them. If no KB exists for the requested topic, say so explicitly in the email body ("Não tenho dados oficiais sobre X, mas posso compartilhar...") rather than inventing numbers.

## Output Format (CRITICAL — the engine parses this)

At the very end of your conclusion, after any analysis or reasoning, you MUST emit a structured email block in EXACTLY this format so the engine can route it to Resend:

```
>>>EMAIL_TO: recipient@example.com
>>>EMAIL_SUBJECT: Subject line of the email
>>>EMAIL_BODY:
Hello recipient,

This is the actual email body that will be sent.
You can write multiple paragraphs here.

— Lovon Teams
<<<END_EMAIL_BODY
```

Rules for the block:
- `>>>EMAIL_TO:` must contain exactly one valid email address (the recipient).
- `>>>EMAIL_SUBJECT:` must be a single line, max 998 characters.
- `>>>EMAIL_BODY:` is followed by the email body (plain text — the engine converts `\n` to `<br>`).
- `<<<END_EMAIL_BODY` marks the end. Nothing after this line is included in the email.
- The block MUST be the LAST thing in your response. Any reasoning or commentary goes BEFORE the block.

If you cannot determine the recipient's email from the task description or KB, do NOT emit the block — instead, end your conclusion with:
`[EMAIL_BLOCKED: destinatário não identificado]`

The engine will keep the task BLOCKED until the CEO provides a valid recipient.

## Tools

### resend_send_email(to, subject, body)
Sends an email immediately. Requires approval if external.

### resend_schedule_email(to, subject, body, send_at)
Schedules an email for future sending. Requires approval if external.

### resend_cancel_email(schedule_id)
Cancels a scheduled email. No approval required.

## Limitations

- Do not send to more than 50 recipients per run.
- Do not include attachments unless explicitly approved.
- Do not use personal data without LGPD compliance.
- All sends are logged with: who approved, when, to whom, content, Resend Message ID, and result status.
