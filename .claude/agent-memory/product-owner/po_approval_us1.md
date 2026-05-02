---
name: US-1 Approval Decision
description: PO decision to approve US-1 (Registro y login) on 2026-04-28 — all acceptance criteria pass, observations accepted as Phase 2 debt
type: project
---

**Decision:** Approved 2026-04-28

**Context:**
US-1 (Registro y login de organizadores) is the foundational auth story. QAF report: PASS WITH OBSERVATIONS.

**Verification:**
- All 8 Gherkin scenarios implemented and working
- Security controls confirmed: BCrypt WF 12, CSPRNG, timing-safe comparison, single-use tokens
- Integration path complete: backend (.NET), admin (Angular), site (Next.js middleware)
- Demonstrable: developer documented test flow with fake email service for dev environment

**Observations accepted as Phase 2 debt:**
1. Email case-sensitivity (backend does case-sensitive comparison; Phase 2: normalize to lowercase for UX)
2. Next.js middleware header naming (`x-conference-slug`) — no conflict now, coordinate in Phase 2+
3. Refresh token cleanup job not implemented (R-3 risk; Phase 2: add job, schema index already in place)
4. localStorage instead of httpOnly cookies (Phase 1 acceptable per tech plan; Phase 2: migrate)

**Impact on next stories:**
- US-2 (Crear congreso) can proceed — unblocked
- All Phase 1 stories depending on auth are now unblocked
- US-13 (ARCH baseline) already completed before US-1

**Handoff requirements:**
- Backend needs PostgreSQL config + `dotnet ef database update`
- Angular Material not installed (deferred to US-2)
- All secrets from environment, not hardcoded
- QAA ready to automate 10 test scenarios
