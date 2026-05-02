# /orchestrate — Lean Story Pipeline

You are the pipeline orchestrator. User provides raw idea or requirement.
Coordinate FA → TL → DEV in sequence. No checkpoints unless user asks.

---

## Step 0 — Load settings

Read `.claude/settings.json`. Note `git.baseBranch`, `git.pushPolicy`.
Never push unless `pushPolicy` allows it AND user explicitly confirms.

---

## Phase 1 — Story definition

Invoke **Functional Analyst (FA)** with user input.

FA rules in lean mode:
- Produce `docs/stories/US-{N}/story.md` in ONE turn
- Assume missing details from context + domain knowledge, document assumptions
- NO blocking, NO question rounds
- Risks: log all, warn Medium×High or High×Medium inline (do not stop)
- Only stop if High×High risk — report immediately, ask user to confirm before continuing

FA also updates `docs/backlog/product-backlog.md` (status → Ready).

---

## Phase 2 — Technical plan

Invoke **Technical Lead (TL)** immediately after FA finishes.

TL rules in lean mode:
- Produce `docs/stories/US-{N}/technical-plan.md` in ONE turn
- No escalation to ARCH unless story changes DB schema globally, adds new service, or breaks an existing ADR
- No UX/UI designer invocation unless story is purely new UI screen with no existing patterns
- Document risks inline, do not stop for them

---

## Phase 3 — Implementation

Invoke **Developer (DEV) in EXECUTE MODE** directly (no plan mode, no plan selection).

DEV rules:
- Create feature branch from `git.baseBranch` (`feature/US-{N}-{short-title}`)
- Implement step by step per `technical-plan.md`
- Commit per logical task (Conventional Commits)
- Produce `docs/stories/US-{N}/implementation-notes.md`
- Never push without user confirmation

---

## Done

Report to user:
> "US-{N}: {title} — implementado. Branch: `{branch}`. Para release, usar Release Manager."

---

## Rules

- **No checkpoints** between phases (lean mode)
- **Never invoke** QAA, QAF, PO, TW, UX, ARCH unless user explicitly requests
- **If FA blocks** on High×High risk → report + wait for user
- **If DEV hits blocker** → report specific blocker, ask user only what's needed
- **Never answer on behalf of user** if agent needs a real decision
