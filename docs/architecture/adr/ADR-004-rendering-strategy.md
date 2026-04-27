# ADR-004: Mini-Site Rendering Strategy — Mixed ISR/SSR/CSR per Route

**Date:** 2026-04-26
**Status:** Accepted
**Authors:** Architect
**Related stories:** US-09, US-10, US-11

---

## Context

The ConferenceManager mini-site is a public-facing Next.js 14 application (App Router) served under `{slug}.tuplataforma.com`. It displays a mix of content with very different volatility and personalization characteristics:

- **Congress landing page** — branding, description, dates. Changes rarely (organizer edits branding a few times total).
- **Program / schedule** — sessions, tracks, speakers per session. Changes moderately (organizer adds/edits sessions during setup; rarely changes once congress begins).
- **Speaker portal** — personalized view per speaker (magic-token-gated). Shows logistics, upload form. Fully dynamic and user-specific.
- **Certificate download** — participant submits email, receives PDF. Fully dynamic, server-side generated on demand.
- **Session detail** — speaker bio, abstract, materials download, survey link. Changes occasionally.

Choosing a single rendering strategy for all routes would either sacrifice performance (full SSR on static content) or correctness (static generation for dynamic content).

---

## Considered Options

### Option 1: Full SSR (Server-Side Rendering) for All Routes

Every page is rendered on the server for each request, fetching fresh data from the API.

**Pros:**
- Always shows the latest data.
- No cache invalidation logic required.
- Simple mental model.

**Cons:**
- Landing pages and program pages that change infrequently incur unnecessary DB hits and API latency on every request.
- Under high load (e.g., day-of-congress traffic spike when all participants check the schedule simultaneously), SSR creates a thundering herd on the API and database.
- TTFB (time to first byte) is directly coupled to API response time — no buffering from a cache layer.

### Option 2: Full SSG (Static Site Generation) — Generate All Pages at Build Time

All pages are pre-rendered at deploy time. A new deploy is triggered when content changes.

**Pros:**
- Maximum performance — all pages served from CDN edge.
- Zero API load at runtime.

**Cons:**
- Requires a new deployment for every content change — unacceptable for a SaaS where organizers edit their congress in real time.
- Speaker portal and certificate download cannot be statically generated — they require live authentication and on-demand PDF generation.
- Build times grow linearly with the number of congresses × routes — unsustainable at scale.

### Option 3: Mixed ISR / SSR / CSR per Route Based on Data Volatility (chosen)

Apply the rendering strategy that matches the volatility and personalization of each route:

| Route | Strategy | Rationale |
|---|---|---|
| `/` (landing) | ISR (long TTL + on-demand revalidation) | Rarely changes; serve from cache; invalidate via API webhook on edit |
| `/programa` (schedule) | ISR (short TTL + on-demand revalidation) | Changes during setup, stable during congress; cache with invalidation |
| `/sesion/[id]` (session detail) | ISR + on-demand revalidation | Changes when organizer edits session |
| `/expositores/[token]` (speaker portal) | SSR | Personalized by magic token; must always be fresh; cannot be cached |
| `/certificado` (certificate download) | SSR + API call | Participant-specific; PDF generated on demand; no caching |
| `/qr/[code]` (QR landing) | SSR | Attendance registration is a mutation; must be server-side |

On-demand ISR revalidation: when the organizer saves changes in the admin panel, the .NET API sends `POST /api/revalidate` to Next.js with the affected path(s) and a shared secret. Next.js calls `revalidatePath()` to purge the CDN cache for those routes.

**Pros:**
- Landing and program pages are served from Vercel's edge CDN — sub-100ms TTFB globally.
- Dynamic/personalized routes are always fresh via SSR.
- ISR revalidation means content changes reach the public site within seconds of the organizer saving — without a full redeploy.
- CSR is reserved for interactive UI elements (e.g., session filter UI) that do not affect SEO.

**Cons:**
- Three rendering paradigms in one codebase require developers to reason about caching per route.
- ISR revalidation adds a dependency between the .NET API and the Next.js deployment (the API must know the Next.js revalidation URL and secret).
- Stale ISR content can be served for a brief window if the revalidation webhook fails — requires monitoring and fallback TTL.

---

## Decision

**Chosen option: Option 3 — Mixed ISR / SSR / CSR per route**

The Next.js 14 App Router is purpose-built for this pattern. The `fetch` cache, `revalidatePath`, and `dynamic = 'force-dynamic'` directives make per-route rendering strategy a first-class, declarative choice. The mixed strategy ensures that the high-traffic static pages (landing, schedule) benefit from CDN caching while the personalized and mutation-sensitive routes remain correct by always hitting the origin. This directly addresses the day-of-congress traffic spike risk identified in Option 1.

---

## Consequences

**Positive:**
- Congress landing and program pages serve from Vercel edge CDN — fast for all participants globally.
- Organizer edits are reflected on the public site within seconds via on-demand ISR revalidation.
- Speaker portal and certificate routes are always fresh — no risk of serving stale session or participant data.
- SEO-sensitive pages (landing, program, session detail) are pre-rendered HTML — fully crawlable.

**Negative / trade-offs:**
- Developers must understand and correctly apply `export const dynamic`, `revalidate`, and `revalidatePath` per route — incorrect configuration can cause stale or un-cached pages.
- The `POST /api/revalidate` webhook requires a shared secret configured in both the .NET API and the Next.js deployment — a secret rotation requires coordinated config update.
- Monitoring ISR revalidation failures requires instrumentation (e.g., log failed webhook calls in the API, alert if revalidation success rate drops).

**Risks:**
- If the .NET API fails to call the revalidation webhook after a mutation (e.g., network timeout), ISR pages will remain stale until the fallback TTL expires (configured per route, e.g., 5 minutes for program pages).
- Next.js App Router cache behaviour has changed between minor versions — route caching semantics must be re-validated on framework upgrades.

---

## Review Criteria

- Each route's rendering strategy must be documented in a `docs/rendering-map.md` file and kept in sync with code.
- ISR revalidation webhook must be covered by an end-to-end test: update a session via the API, assert the Next.js cache is purged within 2 seconds.
- Speaker portal routes must have `export const dynamic = 'force-dynamic'` confirmed in code review — a missing directive would cache personalized content and expose data cross-tenant.
- Load test scenario: 500 concurrent participants loading the program page — target P95 TTFB < 200ms (CDN-cached ISR response).
