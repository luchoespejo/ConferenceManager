---
name: Project context
description: Current pipeline state, completed stories, and Phase 1 execution order
type: project
---

ConferenceManager is a multi-tenant SaaS for conference management. Phase 1 MVP is in active development as of 2026-04-28.

Completed: US-13 (ARCH baseline — C4 L1/L2/L3 + ADR-001 to ADR-005), US-1 (Auth organizadores — Done, PO Approved 2026-04-28).

In progress / Ready: US-2 (Crear y configurar congreso — Ready, FA produced 2026-04-28).

Phase 1 execution order: US-13 → US-1 → US-2 → US-3+US-4 (parallel) → US-5 → US-6 → US-7 → US-8+US-9 → US-10 → US-11+US-12.

**Why:** PO defined this order as dependency chain; US-1 is a hard prerequisite for all organizer flows.
**How to apply:** When writing stories, always verify the dependency chain against this order. Stories for US-3 through US-12 all depend on US-2 being stable.
