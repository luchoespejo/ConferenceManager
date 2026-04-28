# US-1: Registro y login de organizadores

## Description
As an organizer (conference manager),
I want to register an account with my email and password and then log in to the platform,
so that I can access my administration panel and start managing my conferences securely.

## Context
ConferenceManager is a multi-tenant SaaS platform where each organizer manages their own conferences in isolation. To guarantee that tenant data is never mixed, every organizer must have a verified, unique identity before gaining access to any resource.

Email verification is the primary trust mechanism at registration time. Until an organizer confirms ownership of their email address, the system treats the account as unverified and blocks all access. This prevents account squatting on someone else's email and gives the platform a reliable communication channel for future notifications.

Once verified, the organizer authenticates via a short-lived JWT (15 minutes) complemented by a refresh token valid for 7 days. This sliding-window scheme keeps sessions practical for day-long work sessions while limiting the blast radius of a stolen token. All subsequent calls to `/api/dashboard/...` carry the JWT in the `Authorization` header; the API rejects requests with missing or expired tokens.

In Phase 1 there is a single implicit role: organizer. Every verified organizer has full access to the conferences they own. No super-admin panel, no delegated access, and no social login are included in this scope.

## Scope

**Includes:**
- Registration form accepting: email, password, full name, organization name
- Server-side validation of all registration fields (format, required, uniqueness)
- Sending a confirmation email with a time-limited verification link upon successful registration
- Email verification endpoint that activates the account
- Login endpoint accepting email + password, returning JWT access token + refresh token on success
- Explicit error when login is attempted with an unconfirmed email
- Explicit error when login is attempted with wrong credentials
- JWT used as Bearer token in all `/api/dashboard/...` calls
- Refresh token endpoint to obtain a new access token without re-authenticating

**Does not include (explicitly out of scope):**
- Password recovery / forgot-password flow (Phase 2)
- OAuth / social login (not planned for organizers)
- Magic link authentication
- Multiple roles or permission levels within an organization
- Admin impersonation or super-admin panel
- Two-factor authentication
- Account deletion or deactivation self-service

## Acceptance criteria

### Scenario 1: Successful registration
```gherkin
Given I am an unregistered user on the registration page
When I submit valid values for email, password, full name, and organization name
Then the system creates my account in an unverified state
  And the system sends a confirmation email to the provided address
  And the UI displays a message asking me to check my email to confirm my account
  And I cannot log in until I confirm my email
```

### Scenario 2: Email confirmation activates the account
```gherkin
Given I have a pending (unverified) account
  And I have received a confirmation email with a verification link
When I click the verification link before it expires
Then my account is marked as verified
  And the UI redirects me to the login page with a success message
  And I can now log in with my credentials
```

### Scenario 3: Successful login
```gherkin
Given I have a verified organizer account
When I submit my correct email and password on the login page
Then the system returns a JWT access token (valid for 15 minutes) and a refresh token (valid for 7 days)
  And the Angular admin panel stores the tokens securely
  And subsequent calls to /api/dashboard/... are accepted when the JWT is included in the Authorization header
```

### Scenario 4: Login rejected — email not confirmed
```gherkin
Given I have registered but have not yet confirmed my email
When I attempt to log in with my correct email and password
Then the system returns HTTP 403
  And the response message clearly states that the email address has not been confirmed
  And the UI shows the same message to the user with a prompt to check their inbox
```

### Scenario 5: Login rejected — wrong credentials
```gherkin
Given I have a verified organizer account
When I attempt to log in with an incorrect password (or a non-existent email)
Then the system returns HTTP 401
  And the response message states that the credentials are invalid
  And no information is disclosed about whether the email exists in the system
```

### Scenario 6: Registration rejected — duplicate email
```gherkin
Given an organizer account already exists for "existing@example.com"
When I attempt to register with the email "existing@example.com"
Then the system returns HTTP 409
  And the response message states that the email is already registered
  And no new account is created
```

### Scenario 7: Registration rejected — invalid or missing fields
```gherkin
Given I am on the registration page
When I submit the form with one or more invalid fields (e.g., malformed email, password shorter than minimum length, blank required field)
Then the system returns HTTP 400
  And the response includes field-level validation messages
  And no account is created and no confirmation email is sent
```

### Scenario 8: Access to dashboard rejected — missing or expired JWT
```gherkin
Given I am attempting to call any /api/dashboard/... endpoint
When the request has no Authorization header, or the JWT is expired and no valid refresh has been performed
Then the system returns HTTP 401
  And the Angular admin panel redirects me to the login page
```

## Dependencies
- None — this is the foundational authentication story; all other stories depend on it.

## Open questions

> All questions resolved by PO on 2026-04-26.

- **What is the expiry time for the email verification link?**
  Decision: 24 hours. The link expires 24 hours after it is generated.

- **Should the verification link be single-use or time-bound only?**
  Decision: Single-use. The link is invalidated immediately after the first successful click, regardless of whether the 24-hour window has elapsed.

- **What password policy applies?**
  Decision: Minimum 8 characters, at least 1 number. No additional complexity rules for Phase 1.

- **Should the confirmation email be resendable from the UI?**
  Decision: In scope for this story. The user can request a new verification email from the "Confirm your email" screen. The new link replaces (invalidates) any previously issued link.

## Identified functional risks

| ID | Description | Probability | Impact |
|----|-------------|-------------|--------|
| FR-1 | Confirmation emails land in spam, preventing organizer activation and causing support load | Medium | High |
| FR-2 | Verification link expiry too short causes friction during onboarding if the organizer delays clicking | Medium | Medium |
| FR-3 | Generic "invalid credentials" message may confuse legitimate users who mistype their email and get no hint that the address is not registered | Low | Medium |
| FR-4 | Refresh token not invalidated on password change (Phase 2) could allow stale sessions; contract between US-1 and future stories must be defined now | Low | High |

## Metadata
- **ID:** US-1
- **Epic:** E1 — Autenticación y gestión de organizadores
- **Estimate:** M
- **Status:** Ready
- **Author:** Functional Analyst
- **Date:** 2026-04-26
- **Reviewed by PO:** 2026-04-26
