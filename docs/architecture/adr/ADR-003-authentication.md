# ADR-003: Authentication Strategy — JWT for Organizers, Magic Tokens for Speakers

**Date:** 2026-04-26
**Status:** Accepted
**Authors:** Architect
**Related stories:** US-04, US-05, US-06

---

## Context

ConferenceManager has three types of authenticated actors:

1. **Organizer** — creates and manages a congress via the Angular Admin Panel. Needs persistent, session-aware access with role-based permissions. Performs sensitive mutations (publish/unpublish, billing config in future phases).
2. **Speaker / Exhibitor** — receives an invitation from an organizer, accesses a personalized portal to view their logistics and upload presentation materials. May be technically non-savvy. Access is scoped to a single congress.
3. **Participant** — public actor; no account. Accesses public schedule, QR check-in, certificate download by submitting their registered email.

The authentication mechanism must be appropriate for each actor's threat model, UX expectation, and technical context.

---

## Considered Options

### Option 1: Traditional JWT Login for All Actors

All actors (organizers, speakers, participants) register an account with email + password and log in to receive a JWT.

**Pros:**
- Uniform authentication mechanism, single implementation.
- Standard and well-understood.

**Cons:**
- Speakers are invited externally — requiring them to create and remember a password adds friction and increases drop-off. Many speakers only access the platform once per congress.
- Password management for speakers introduces a support burden (password resets, account confusion if invited to multiple congresses).
- Participants are public — forcing account creation for certificate download is a significant UX degradation.
- The platform's value proposition is frictionless access for non-admin actors.

### Option 2: Magic Tokens for All Actors (no passwords anywhere)

Generate time-limited, single-use or reusable magic link tokens for every actor including organizers.

**Pros:**
- No passwords anywhere — simpler auth infrastructure.
- Works well for infrequent access patterns.

**Cons:**
- Organizers access the admin panel frequently (daily or more). Magic links become cumbersome — email round-trip on every session expiry.
- If an organizer's email is compromised, a magic link grants full admin access — more dangerous than a password + session expiry combo.
- Magic link delivery depends on Resend; if email is delayed, the organizer is locked out of their own admin panel.

### Option 3: OAuth / Social Login (Google, Microsoft) for All Actors

Delegate authentication to an OAuth provider.

**Pros:**
- No password management.
- High trust signals from established providers.

**Cons:**
- Requires every speaker to have a Google/Microsoft account (not guaranteed in all academic/professional contexts, especially international congresses).
- OAuth integration adds implementation complexity and a third-party dependency for the core auth flow.
- Does not solve the participant case (public access).
- Significant overkill for a platform where most actors interact infrequently.

### Option 4: JWT for Organizers + Magic Tokens for Speakers + Public for Participants (chosen)

Organizers authenticate via email + password, receiving a JWT (short-lived access token + refresh token). Speakers receive a time-limited magic token embedded in an invitation URL — no account creation required. Participants access public routes without authentication; certificate download uses email verification (email submitted → API checks registration flag → name input → PDF generated).

**Pros:**
- Auth mechanism matches the access pattern and threat model of each actor.
- Organizers get a persistent, revocable session appropriate for an admin panel.
- Speakers experience zero-friction onboarding: click link, access portal.
- Participants have zero account creation friction.
- Magic tokens are scoped to a specific congress and speaker — if leaked, the blast radius is limited.

**Cons:**
- Two auth mechanisms require two middleware/guard implementations in the API.
- Magic token storage and expiry management adds a small amount of DB schema complexity.

---

## Decision

**Chosen option: Option 4 — JWT for Organizers, Magic Tokens for Speakers, Public for Participants**

This is the architecture that best fits the product's UX contract. Organizers are power users who need a reliable, persistent admin session — JWT with refresh tokens is the right tool. Speakers are invited users who interact once or twice per congress — a magic link removes all friction and eliminates the password-reset support vector. Participants are anonymous — certificate download via email lookup (not auth) is appropriate and standard in conference software.

Magic tokens are generated as HMAC-signed, time-limited strings (e.g., 7-day expiry) stored in the `SpeakerInvitation` table. They can be revoked by the organizer at any time.

---

## Consequences

**Positive:**
- Speaker onboarding is a single email click — maximum conversion rate.
- Organizer sessions are revocable (refresh token rotation) and auditable.
- No OAuth dependency — the platform owns the full auth flow.
- Participant certificate flow avoids account creation entirely — just email + name input.
- Magic tokens are scoped to `(speakerId, congressId)` — leaked tokens cannot escalate privilege.

**Negative / trade-offs:**
- Two auth guard implementations in the .NET API (`[Authorize]` for JWT, `[MagicTokenAuth]` custom attribute for magic tokens).
- Magic token emails depend on Resend delivery — a delayed email blocks speaker access temporarily.
- JWT refresh token rotation requires a Redis or DB-backed token store to prevent replay attacks (considered for Phase 2 hardening).

**Risks:**
- Magic token expiry of 7 days means a speaker who waits 8 days must request a new link from the organizer (UX friction edge case — mitigated by organizer-triggered resend flow in admin panel).
- If an organizer's email account is compromised, an attacker can receive magic links for speakers they invite — standard email account security applies.

---

## Review Criteria

- Magic token generation must produce cryptographically random bytes (CSPRNG), not sequential or predictable IDs — validated in security review before Phase 1 release.
- JWT access token expiry set to 15 minutes; refresh token to 7 days with rotation — reviewed in Phase 1 auth implementation PR.
- Speaker portal must display a clear "Request new access link" CTA when the token is expired, routing the request through the organizer's panel.
- Integration tests must cover: valid token access, expired token rejection (401), token for wrong congress (403), revoked token (401).
