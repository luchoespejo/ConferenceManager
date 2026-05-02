---
name: US-2 PO Review & Scope Decisions
description: PO approval of US-2 with binding decisions on slug immutability, cascade delete, and slug monopoly risk acceptance
type: project
---

## Decision Summary

**Date:** 2026-04-28  
**Story:** US-2 — Crear y configurar un congreso  
**Decision:** Approved ✅

## Business Decisions

### 1. Slug Immutability Post-Publication (RISK-02-02)
**Decision:** NO slug changes after publication in Phase 1.

**Why:** Changing the slug after a conference is public breaks all distributed URLs (subdomains already shared with participants). This is a business-level decision to protect the integrity of the distributed mini-site URLs.

**How to apply:** 
- UI must allow slug editing only when conference state is `borrador`
- When transitioning to `publicado` (US-6), show explicit warning that slug becomes permanent
- Backend must reject slug edits on `publicado` or `finalizado` conferences with HTTP 422 and clear message
- Support team briefed that slug change requests require creating a new conference

### 2. Cascade Delete on Draft Conferences (RISK-02-04)
**Decision:** YES — deleting a draft conference cascades to ALL child entities (rooms, sessions, speakers, etc.).

**Why:** A conference in draft state is a workspace in progress. Allowing orphaned rooms/speakers/sessions would complicate the data model and confuse the organizer.

**How to apply:**
- Client MUST show a modal warning before deletion, listing what will be deleted (e.g., "5 rooms, 12 sessions, 8 speakers")
- Backend cascades the delete at the DB level via EF Core (OnDelete(DeleteBehavior.Cascade))
- Deletion is only allowed on conferences in `borrador` state (already in acceptance criteria)

### 3. Slug Monopoly Risk (RISK-02-03)
**Decision:** Accept as business risk; no recovery mechanism in Phase 1.

**Why:** Implementing slug expiration, reclamation, or reservation would add complexity. Early-stage SaaS typically accepts this risk until commercial traction justifies the overhead.

**How to apply:**
- Support team trained on the scenario: "An organizer registered 'congreso-2026' but never published it. Another organizer now wants that slug but cannot have it."
- Monitor slugs registered but never published during Phase 1 beta
- Phase 2 can introduce slug expiration or admin reclamation tools if needed
- No code changes required in Phase 1

## Verification Checklist
✅ All acceptance criteria are clear and implementable  
✅ No conflicting requirements with US-1 (auth) dependency  
✅ Size (L) is appropriate for the scope  
✅ Functional risks identified and dispositioned  
✅ Story ready for TL technical planning
