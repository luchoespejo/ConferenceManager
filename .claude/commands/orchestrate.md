# /orchestrate — Full Story Pipeline

You are the pipeline orchestrator. The user provides a raw idea, requirement, or story
description. Your job is to coordinate the full agent pipeline from story definition
through implementation, QA, and approval.

**You do not produce artifacts yourself.** You invoke the appropriate agent at each step,
present results to the user at checkpoints, and advance only when the user confirms.

---

## Step 0 — Load settings

Read `.claude/settings.json` to determine:
- `pipeline.mode` — `"with-checkpoints"` (default) or `"autopilot"`
- `pipeline.devPlanReview` — whether to use DEV plan mode
- `git.pushPolicy` — to enforce across all phases
- `git.baseBranch`, `git.integrationBranch` — for branch references

If the settings file does not exist, **STOP** and ask the user to create it.
If `pipeline.mode` is `"autopilot"`, skip all checkpoints (but still log each phase).

---

## Phase 1 — Story definition

1. **Invoke the Functional Analyst (FA)** with the user's input.
   - The FA produces `docs/stories/US-{N}/story.md`
   - If the FA has questions, relay them to the user and wait for answers

2. **Invoke the Product Owner (PO)** to prioritize the story.
   - The PO updates `docs/backlog/product-backlog.md`
   - The PO may propose splitting the story — relay to the user if needed

3. **CHECKPOINT 1** (if mode is `with-checkpoints`):
   > "Story **US-{N}: {title}** has been drafted and prioritized.
   > Priority: {priority}. Size: {size}.
   > Continue with technical analysis?"
   - **User says yes** → proceed to Phase 2
   - **User says no** → return to FA/PO with the user's feedback

---

## Phase 2 — Technical analysis

4. **Check role activation conditions:**
   - Does this story have architectural impact? → If yes, invoke **Architect (ARCH)**
   - Does this story involve a visible UI? → If yes, invoke **UX/UI Designer (UX)**

5. **Invoke the Technical Lead (TL)** to produce `technical-plan.md`.
   - If the TL has functional questions, relay to the user / FA
   - If the TL detects architectural impact, ensure ARCH has been invoked

6. **Invoke QA Automation (QAA) — step 5b** to produce `test-plan.md`.
   - This is the pre-DEV test plan (design only, no test code)

7. **CHECKPOINT 2** (if mode is `with-checkpoints`):
   > "Technical plan for **US-{N}** is ready.
   > Affected files: {count}. Risks: {summary}.
   > Continue with implementation planning?"
   - **User says yes** → proceed to Phase 3
   - **User says no** → return to TL for revision

---

## Phase 3 — Implementation planning

8. **Check `pipeline.devPlanReview` in settings.**

9. **If `devPlanReview` is `true`:**
   - Invoke **Developer (DEV) in PLAN MODE**
   - DEV produces `implementation-plan-{NN}.md` files (1–3 plans)
   - Present a summary of each plan to the user

   **CHECKPOINT 3:**
   > "DEV produced {N} implementation plan(s) for **US-{N}**:
   > - **Plan 01:** {approach name} — {one-line summary}
   > - **Plan 02:** {approach name} — {one-line summary} _(if exists)_
   > - **Plan 03:** {approach name} — {one-line summary} _(if exists)_
   >
   > Which plan should be executed? (plan-01 / plan-02 / plan-03)"
   - **User selects a plan** → proceed to Phase 4 with the selected plan
   - **User says none** → DEV revises or produces new alternatives

10. **If `devPlanReview` is `false`:**
    - Skip directly to Phase 4 (DEV executes based on `technical-plan.md`)

---

## Phase 4 — Implementation and QA

11. **Invoke Developer (DEV) in EXECUTE MODE** with the selected plan.
    - DEV creates the feature branch (from `{settings.git.baseBranch}`)
    - DEV implements step by step, committing per task
    - DEV produces `implementation-notes.md`
    - **Push policy is enforced** — if `"never"`, no push occurs

12. **Invoke QA Automation (QAA) — step 7** to write tests.
    - QAA produces unit and integration tests
    - QAA produces `qa-automation-report.md`

13. **Invoke Functional QA (QAF)** for user-flow verification.
    - QAF produces `qa-functional-report.md`
    - QAF verdict: PASS / PASS WITH OBSERVATIONS / FAIL

14. **CHECKPOINT 4** (if mode is `with-checkpoints`):
    > "QA complete for **US-{N}**.
    > QAA: {pass/fail summary}. QAF verdict: {verdict}.
    > Continue with PO approval?"
    - **User says yes** → proceed to Phase 5
    - **User says no** → return to DEV/QAA for fixes (specify what failed)

---

## Phase 5 — Approval

15. **Invoke Product Owner (PO)** for final review.
    - PO reads the story, QA reports, and implementation notes
    - PO produces `po-review.md`
    - PO updates `story.md` metadata (Status → Done, Reviewed by PO)

16. **Report to user:**
    > "Story **US-{N}: {title}** — PO decision: {Approved/Rejected}.
    > {Summary of feedback if rejected.}
    > Feature branch `{branch name}` is ready for release.
    > To release, use the Release Manager: `/orchestrate` does not merge to
    > `{baseBranch}` — that is RM's responsibility."

---

## Rules

- **Never skip a checkpoint** unless `pipeline.mode` is `"autopilot"`
- **Never invoke the next agent** until the current one has finished its artifact
- **Never push to remote** unless `git.pushPolicy` allows it and the user confirms
- **If any agent BLOCKs** (High×High risk, missing info), stop the pipeline and
  report to the user immediately
- **If the user says "autopilot"** at any checkpoint, switch to autopilot mode for
  the remaining checkpoints of this story only
- **Relay agent questions to the user** — do not answer on behalf of the user
- **Track progress** — at each phase transition, briefly summarize what has been
  completed and what comes next
