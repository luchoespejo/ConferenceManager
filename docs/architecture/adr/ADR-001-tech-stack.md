# ADR-001: Core Technology Stack

**Date:** 2026-04-26
**Status:** Accepted
**Authors:** Architect
**Related stories:** US-01, US-02, US-03

---

## Context

ConferenceManager is a greenfield multi-tenant SaaS product that must support concurrent congress management with distinct public-facing mini-sites, an admin panel, file storage, email notifications, QR code generation, and PDF certificate creation. The team needs a stack that balances productivity, ecosystem maturity, and long-term maintainability. All major technology decisions must be locked before development begins to avoid costly mid-project pivots.

Key constraints:
- Small, cross-functional team with existing experience in .NET and Angular.
- Multi-tenant architecture from day one (slug-based subdomain isolation).
- PDF/QR generation must run server-side.
- Object storage is required for user-uploaded materials and generated files.
- Email delivery must be reliable and developer-friendly.

---

## Considered Options

### Option 1: Node.js/Express (backend) + React SPA (admin) + MySQL (database)

A fully JavaScript stack. Express is lightweight and familiar to many frontend developers. React has the largest ecosystem for SPAs. MySQL is widely hosted and well-documented.

**Pros:**
- Single language (TypeScript) across backend and frontends.
- Vast npm ecosystem.
- MySQL is well-understood and cheap to host.

**Cons:**
- Node.js lacks first-class PDF/QR libraries at the maturity level of .NET equivalents (PdfSharp, QRCoder).
- Express requires significant boilerplate for multi-tenant API patterns, auth middleware, and structured dependency injection.
- React (without a framework like Next.js) is a pure SPA — no SSR/ISR capability without additional setup.
- MySQL does not have as strong support for advanced query patterns (e.g., JSONB, CTEs, window functions) compared to PostgreSQL.
- Team has limited production Express experience.

### Option 2: .NET Core 8 Web API + PostgreSQL + Angular + Next.js (chosen stack)

.NET Core 8 for the API layer (Windows and Linux cross-platform), PostgreSQL as the relational store, Angular 17+ for the admin SPA, and Next.js 14 for the public-facing multi-tenant mini-site.

**Pros:**
- .NET Core 8 has mature, stable libraries for PDF (PdfSharp) and QR (QRCoder) generation without external service dependencies.
- EF Core 8 + Dapper gives a productive ORM layer with escape hatch for complex queries.
- PostgreSQL supports JSONB, CTEs, and advanced indexing — well-suited to a multi-tenant schema.
- Angular 17+ with standalone components, Signals, and OnPush change detection is production-ready for complex admin UIs.
- Next.js 14 App Router supports ISR/SSR/CSR per-route — ideal for a multi-tenant public site where some pages are static and others are dynamic.
- Railway offers managed PostgreSQL and .NET hosting with minimal ops overhead.
- Vercel offers first-class Next.js hosting with wildcard DNS support.
- Team has strong .NET and Angular experience.

**Cons:**
- Two languages (C# + TypeScript) require context-switching.
- More surface area than a monolithic JS stack.
- EF Core migrations require discipline in a multi-tenant schema to avoid cross-tenant data leaks.

### Option 3: Django (backend) + Vue.js (admin) + PostgreSQL

Python/Django with its batteries-included ORM and Vue.js for the admin panel.

**Pros:**
- Django admin panel can be auto-generated for simple CRUD.
- Python ecosystem has mature PDF/QR libraries.

**Cons:**
- No team Django or Vue experience — high ramp-up cost.
- Django admin is not customizable enough for a polished multi-tenant SaaS UX.
- Vue.js is less mature than Angular for large, structured SPAs in the team's context.
- Python hosting on Railway is possible but adds operational unfamiliarity.

---

## Decision

**Chosen option: Option 2 — .NET Core 8 + PostgreSQL + Angular 17+ + Next.js 14**

The team's existing expertise in .NET and Angular is the decisive factor. The stack covers all technical requirements (PDF, QR, multi-tenant API, SSR/ISR public site) with battle-tested libraries and managed hosting on Railway and Vercel. PostgreSQL's advanced query capabilities and EF Core 8's global query filters make multi-tenant isolation clean and auditable. Next.js is the only frontend framework that natively supports the ISR/SSR/CSR per-route strategy required for the multi-tenant mini-site without additional infrastructure.

---

## Consequences

**Positive:**
- .NET Core 8 provides strongly-typed, high-performance APIs with excellent DI support.
- PDF and QR generation are native, server-side, with no external API cost.
- Angular Signals + OnPush give a predictable, performant admin panel change detection model.
- Next.js ISR allows the mini-site to serve congress program pages near-instantly while staying fresh after updates.
- PostgreSQL row-level security and global query filters in EF Core enable robust multi-tenant isolation.

**Negative / trade-offs:**
- Two runtimes (dotnet + node) in the project require separate CI/CD pipelines and different local dev setups.
- EF Core migrations must be carefully reviewed in a multi-tenant schema — a missing `CongressId` filter can cause data leaks.
- Railway managed PostgreSQL has storage and connection limits that will need monitoring at scale.

**Risks:**
- PdfSharp and QRCoder are open-source libraries with community support; breaking changes are possible on dotnet version upgrades.
- Next.js App Router is still evolving — API surface changes between minor versions could require refactoring.

---

## Review Criteria

- After Phase 1 delivery: confirm that PDF/QR generation performs under load (< 2s per certificate at 100 concurrent requests).
- After Phase 2 delivery: validate that EF Core global query filters are enforced in all DbContext queries via integration tests.
- At 6-month post-launch review: assess Railway hosting costs vs. AWS/Azure if tenant count exceeds 50 active congresses.
