# ADR-005: Survey Strategy — External URL Integration (No Proprietary Form Builder)

**Date:** 2026-04-26
**Status:** Accepted
**Authors:** Architect
**Related stories:** US-12, US-13

---

## Context

Organizers want to collect feedback from participants after individual sessions (e.g., "Rate this talk", "Was the speaker clear?"). The platform must provide a way to associate a survey with each session and surface it to participants on the mini-site. The team must decide whether to build a proprietary form/survey builder or integrate with existing external survey tools.

Organizers commonly already use Google Forms, Typeform, SurveyMonkey, or institutional survey platforms — these tools handle response collection, aggregation, and export, and are well-known to academic conference organizers.

---

## Considered Options

### Option 1: Proprietary Survey / Form Builder

Build a custom form builder within ConferenceManager: organizer creates questions (multiple choice, rating scale, open text), responses are stored in PostgreSQL, organizer downloads results as CSV.

**Pros:**
- All data stays within the platform — no third-party dependency.
- Could enable future features (aggregate analytics, response-triggered automations).
- Unified UX within the platform.

**Cons:**
- Building a robust form builder is a significant scope addition: question types, response storage schema, CSV export, anti-spam, conditional logic, mobile-responsive form UI.
- Form builders are a well-solved commodity problem — reimplementing one adds no differentiation.
- Increases the database schema complexity and backend surface area.
- Delays Phase 1 delivery significantly.
- Organizers may still prefer their institutional survey tools for data governance reasons (e.g., university policy requires responses to stay in Google Workspace).

### Option 2: External URL Integration — Organizer Pastes Survey Link per Session (chosen)

Organizers paste an external survey URL (Google Forms, Typeform, etc.) on a per-session basis in the admin panel. The mini-site conditionally renders a "Go to survey" button on the session detail page only when a URL is configured. No responses are collected by ConferenceManager.

**Pros:**
- Zero implementation cost for survey logic — the platform is a link holder.
- Organizers use the tools they already know and trust.
- No data storage concern — responses live in the organizer's survey tool of choice.
- No GDPR/data retention complexity for survey responses.
- "Go to survey" button is a conditional UI element — simple to implement and test.
- Scales to any survey tool without platform changes.

**Cons:**
- ConferenceManager has no visibility into survey responses — cannot provide aggregate analytics.
- If the external URL expires or changes, the button becomes a dead link — organizer is responsible for maintenance.
- No in-platform UX continuity — participant is redirected to an external site.

### Option 3: Embedded Survey (iframe)

Embed the external survey tool via an iframe in the session detail page.

**Pros:**
- Keeps the participant within the mini-site visually.

**Cons:**
- Many survey tools (Google Forms, Typeform) actively block iframe embedding via `X-Frame-Options: SAMEORIGIN`.
- Iframe embedding creates a mixed-trust context — the platform cannot guarantee the embedded content's behaviour.
- Not reliably implementable across all tools the organizer might use.

---

## Decision

**Chosen option: Option 2 — External URL per session, "Go to survey" button on mini-site**

Survey functionality is not a core differentiator for ConferenceManager in Phase 1 and 2. The organizer already has a preferred survey tool in most cases. Building a proprietary form builder would consume 3–5 weeks of development time that is better invested in core features (certificate generation, QR check-in, speaker portal). The external URL approach delivers 100% of the organizer's need (survey results on their platform of choice) with a single `varchar` column in the `Session` table and one conditional button component in the mini-site.

This decision is explicitly scoped to Phase 1 and 2. If response analytics become a validated product requirement in Phase 3, the proprietary builder option can be revisited with market evidence.

---

## Consequences

**Positive:**
- No additional backend endpoints, DB tables, or form rendering logic required.
- Organizers retain full control of their survey data and tooling.
- Implementation is a `surveyUrl` nullable column in the `sessions` table + conditional `<a>` element in Next.js.
- No GDPR obligations for survey response data — out of scope for ConferenceManager's data processing agreement.
- Time-to-market for Phase 1 is unaffected by survey scope.

**Negative / trade-offs:**
- ConferenceManager cannot report on survey participation rates or aggregate results.
- Participant UX is interrupted when redirected to an external domain — no in-app continuity.
- Dead links (expired survey URLs) are invisible to the platform — organizer must maintain their own URLs.

**Risks:**
- If a high-value customer requests built-in survey analytics as a condition of adoption, this decision may need to be revisited urgently — mitigate by surfacing this limitation clearly in sales conversations.
- External survey tools may change their URL structures, breaking pasted links — organizers should be advised to use permanent link formats (e.g., Google Forms "published" links, not preview links).

---

## Review Criteria

- `surveyUrl` field must accept any valid HTTPS URL up to 2048 characters — validated by API model validation.
- The mini-site "Go to survey" button must be conditionally rendered only when `surveyUrl` is non-null and non-empty — covered by a UI component unit test.
- The button must open the survey URL in a new tab (`target="_blank"` with `rel="noopener noreferrer"`) — reviewed in code review checklist.
- If the Phase 2 retrospective reveals that 3 or more organizers have independently requested built-in survey analytics, reopen this ADR and evaluate Option 1 with full scope estimate.
