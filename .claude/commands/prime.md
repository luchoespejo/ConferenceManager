# /prime — Project Context Boot

You are joining a development session. Your job is to read the project context,
understand what exists, and produce a status summary.
Do not write code or modify any file during this process.

---

## Step 0 — Detect project state

Check if this is a **new project** (no `docs/` folder, no stories) or an
**existing project** (docs, stories, and architecture already exist).

- Run `git branch --show-current` and `git log --oneline -1` to check git state.
- Check if `docs/backlog/product-backlog.md` exists.
- Check if `README.md` exists.

If this is a **new project** (no docs, no backlog), skip Steps 2-4 and report
"New project — no stories, architecture, or backlog yet" in the summary.

---

## Step 1 — Team workflow and conventions

Read these files completely. They define the rules you must follow in every future action:

1. `CLAUDE.md` — agent workflow, language policy, artifact structure, KDFlow branch naming, commit format, and critical rules.
2. `.claude/settings.json` — project configuration (git branches, push policy, pipeline mode, dev plan review).
3. `docs/onboarding/dev-guide.md` — module map, data flow, code conventions, test strategy, and git workflow. _(Skip if file does not exist.)_

---

## Step 2 — Current project state (skip if new project)

Read these files to understand what has been built and what remains:

4. `docs/backlog/product-backlog.md` — full story list with priorities and current status.
5. `README.md` — project overview and quick-start commands.

For each story that shows status **Done** or **In Progress**, read:
- `docs/stories/{US-N}/story.md` — acceptance criteria
- `docs/stories/{US-N}/implementation-notes.md` — what was built and any deviations
- `docs/stories/{US-N}/po-review.md` — PO approval decision

> Tip: check which story directories exist under `docs/stories/` with a Glob before reading.

---

## Step 3 — Architecture (skip if new project)

Read these files to understand structural decisions:

6. `docs/architecture/c4-context.md` — system boundary and external dependencies
7. `docs/architecture/c4-container.md` — container breakdown and deployment artifacts
8. `docs/architecture/c4-component.md` — component graph and dependency rules
9. All files under `docs/architecture/adr/` — immutable technology decisions

---

## Step 4 — Design system (only if the next task involves UI)

10. `docs/design/design-baseline.md` — color palette, typography, spacing rules.

Read this only if the upcoming story touches the visual layer.

---

## Step 5 — Deliver the status summary

After reading all relevant files, produce a concise status report in this exact format:

```
## Project Status — {Project name from README or folder name}

### Project type
- [New project / Existing project with N stories]

### What is built
- [one line per completed story: US-N — title — key implementation facts]
- [or "Nothing yet — new project" if no stories exist]

### What is in progress
- [story ID and current state if any story is partially done]

### What is pending
- [remaining stories from the backlog with their priority order]

### Active branch
- Current branch: [result of `git branch --show-current`]
- Last commit: [result of `git log --oneline -1`]

### Project Settings
- Base branch: [from settings.git.baseBranch]
- Integration branch: [from settings.git.integrationBranch]
- Push policy: [from settings.git.pushPolicy]
- Dev plan review: [from settings.pipeline.devPlanReview]
- Pipeline mode: [from settings.pipeline.mode]

### Key constraints to keep in mind
- [3–5 bullet points from CLAUDE.md and the ADRs that most affect day-to-day decisions]

### Next recommended action
- [one sentence: what the team should do next based on backlog priority]
- [or "Start by describing what you want to build. Use /orchestrate to run the full pipeline." if new project]
```

Run `git branch --show-current` and `git log --oneline -1` to fill the "Active branch" section.

---

Once the summary is delivered, you are ready to receive task instructions.
Ask the user: **"¿Con qué historia o tarea continuamos?"**
