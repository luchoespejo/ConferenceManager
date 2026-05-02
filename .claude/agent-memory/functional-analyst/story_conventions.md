---
name: Story conventions
description: Observed format rules, Gherkin style, and risk escalation thresholds used in US-1 and US-2
type: feedback
---

Story language: Description and Gherkin in English; Context, Scope, risk descriptions, and metadata labels in Spanish (following project language policy: docs in Spanish, code in English).

**Why:** CLAUDE.md specifies "Documentación de agentes: Español". US-1 used English throughout and was accepted without correction — but US-2 aligns more strictly with the stated policy for prose sections. Keep Gherkin in English (Given/When/Then keywords are universal and QA tooling expects them in English).

**How to apply:** Always write Description/Gherkin in English. Write Context, Scope bullets, risk table descriptions, Open questions, and dependency descriptions in Spanish.

Risk escalation thresholds (from role prompt):
- High × High → BLOCK
- High × Medium or Medium × High → WARN (ask PO for confirmation before finalizing)
- Any other → LOG (register and continue)

All four risks in US-2 were LOG level — no WARN or BLOCK triggered.

Minimum scenario coverage per story: 1 happy path + 1 error case + edge cases where they exist. US-2 required 15 scenarios due to the breadth of the CRUD surface.
