# ADR-002: Dynamic Subdomain Strategy — Single Next.js Deploy + Middleware + Wildcard DNS

**Date:** 2026-04-26
**Status:** Accepted
**Authors:** Architect
**Related stories:** US-07, US-08

---

## Context

ConferenceManager is a multi-tenant SaaS where each congress is identified by a unique slug (e.g., `neurology2026`, `devconf`). The public-facing mini-site for each congress must be reachable at `{slug}.tuplataforma.com`. The team must decide how to provision and serve these per-tenant subdomains without manual Vercel project creation for every new congress.

The decision has significant implications for deployment complexity, time-to-go-live for new congresses, and operational costs.

---

## Considered Options

### Option 1: One Vercel Project Per Congress

Create a new Vercel project and deploy a new Next.js instance each time an organizer creates a congress. Assign a custom subdomain per project via the Vercel API.

**Pros:**
- Complete isolation between congresses at the infrastructure level.
- Per-congress configuration (env vars, edge regions) is straightforward.

**Cons:**
- Vercel free/pro tier limits the number of projects per team — this model does not scale beyond a handful of congresses without Enterprise pricing.
- Provisioning a new congress requires a Vercel API call, a full deployment pipeline run, and DNS propagation — adds minutes to hours of latency.
- Each project has independent cold-start behaviour and ISR caches — managing cache invalidation across dozens of projects is operationally complex.
- Code updates (bug fixes, feature rollouts) must be re-deployed to every Vercel project, making rollouts slow and error-prone.

### Option 2: Single Next.js Deploy + Next.js Middleware + Vercel Wildcard DNS (chosen)

Configure a single Vercel project with a wildcard domain (`*.tuplataforma.com`). A Next.js middleware function intercepts every request, extracts the slug from the `host` header, and injects it as `x-congress-slug` for downstream Server Components and API route handlers. The slug is used to scope all data fetching to the correct congress tenant.

**Pros:**
- One deployment serves unlimited congresses — no per-congress infrastructure provisioning.
- New congress goes live instantly: create the slug in the database and it is immediately accessible via the wildcard subdomain.
- Code updates deploy once and take effect for all congresses simultaneously.
- ISR cache is managed centrally; the backend calls a single `POST /api/revalidate` endpoint with the affected paths.
- Vercel wildcard domains are supported on Pro plan with a single project.

**Cons:**
- All tenants share the same Next.js runtime — a pathological request from one congress could affect others (mitigated by Vercel's Edge Network isolation).
- Middleware runs on every request edge function — must be kept minimal and stateless.
- Local development requires a custom `hosts` file entry or a tunnel (e.g., ngrok) to simulate subdomains.

### Option 3: Reverse Proxy + Multiple Static Exports

Use a Cloudflare Worker or nginx reverse proxy to route subdomains to static HTML exports generated per congress.

**Pros:**
- Static exports are cheap to host and extremely fast.

**Cons:**
- Static exports cannot support SSR or ISR — dynamic pages (speaker portal, certificate download) require a running server.
- Re-generating and re-deploying per congress on every update is even more complex than Option 1.
- Adds a custom reverse proxy layer that the team would need to maintain.

---

## Decision

**Chosen option: Option 2 — Single Next.js Deploy + Middleware + Wildcard DNS**

The wildcard DNS + middleware approach is the canonical pattern for Next.js multi-tenant SaaS on Vercel, supported by official documentation and the Vercel platform team. It eliminates per-congress deployment overhead entirely. The middleware logic is simple (a `host` header parse + header injection, < 10 lines), poses no performance risk at the edge, and is fully testable. Local development is handled with a `.env.local` override for `CONGRESS_SLUG` when not running behind a wildcard host.

---

## Consequences

**Positive:**
- Zero-latency congress provisioning: create a DB record, the subdomain works immediately.
- Single CI/CD pipeline — one deploy reaches all tenants.
- ISR revalidation is centralised: the API calls one endpoint, passes the slug and path, Next.js invalidates the relevant cached route.
- Vercel Edge Network handles geographic distribution for all tenants transparently.

**Negative / trade-offs:**
- Middleware must remain lightweight — no DB calls, no async I/O. It is limited to header injection based on the `host` value.
- If a congress slug is deleted or renamed, the old subdomain will 404 — the API must handle slug renames gracefully (redirect from old slug or tombstone record).
- Development setup requires a documented workaround for local subdomain simulation.

**Risks:**
- Vercel Pro plan wildcard domain support is a billing dependency — downgrading would break all subdomains.
- If Next.js App Router changes how middleware headers are propagated in a future version, the tenant injection mechanism will need to be updated.

---

## Review Criteria

- Middleware response time must stay below 5ms at the edge (measurable via Vercel Analytics).
- Local dev onboarding guide must document the slug simulation method so new developers can run a congress locally without DNS configuration.
- Slug rename flow must be covered by an integration test verifying that the old URL returns a 301 redirect to the new slug.
