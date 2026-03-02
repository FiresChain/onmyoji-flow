# AGENTS.md

## 1. Project Baseline

- Project: `onmyoji-flow`
- Package: `@rookie4show/onmyoji-flow`
- Type: standalone app + embeddable Vue component library
- Current branch baseline: `develop` (do not assume release branch without checking)
- Primary workflow: `.github/workflows/build-pages.yml`
- Core docs:
  - Management: `/docs/1management/plan.md`
  - Workflow: `/docs/1management/workflow.md`
  - Refactor design: `/docs/2design/Refactory.md`
  - Data model: `/docs/2design/DataModel.md`

## 2. Session Initialization (Required)

At the start of each new task:

1. Read this `AGENTS.md`.
2. Read relevant docs before changing code:
   - `plan.md` for status and priorities
   - design docs in `docs/2design/`
3. Check current scripts and quality gates in `package.json`.
4. Confirm whether task affects docs, data model, API contract, or CI.
5. For Refactory work, also read:
   - `/docs/2design/Refactory.md`
   - `/docs/1management/refactory-session-log.md` (latest entries only)

## 3. Documentation Lookup

When documentation lookup is required:

- Use Context7 as primary source of truth.
- Do not rely on assumptions if docs can be retrieved through Context7.
- If Context7 is unavailable, explicitly state fallback source and uncertainty.

## 4. Execution Workflow

Default workflow for feature/fix/refactor tasks:

1. Understand scope and impacted modules.
2. Locate implementation symbols/files before editing.
3. Implement minimal, focused changes.
4. Run relevant checks.
5. Summarize findings and risks.
6. Update docs if required by section 7.

For reviews:

- Findings first, ordered by severity.
- Include exact file references.
- Call out missing tests and behavioral risks.

## 5. Code Change Rules

1. Do not edit unrelated files.
2. Prefer small, reviewable commits.
3. Avoid introducing new global singletons unless required.
4. Keep runtime behavior backward-compatible unless task explicitly allows breaking change.
5. For refactor tasks, preserve existing behavior first; optimize second.

## 6. Quality Gates

Before marking a coding task as complete, run what is applicable:

1. `npm test`
2. `npm run lint`
3. `npm run typecheck` (if present; add when task includes tooling improvement)
4. `npx prettier --check "src/**/*.{js,ts,vue}"`
5. `npm run build:lib` for library-facing changes

If any gate cannot run or fails due repo baseline issues, report it explicitly with reason and impact.

## 7. Documentation Synchronization Rules

Update docs whenever behavior/contract changes:

1. `docs/2design/DataModel.md`:
   - RootDocument/schema changes
   - migration or persistence behavior changes
2. `docs/2design/ComponentArchitecture.md`:
   - embed API, mode behavior, state isolation changes
3. `docs/3build/*`:
   - package name, usage import path, build artifacts, integration steps
4. `docs/1management/plan.md`:
   - only after explicit user confirmation that task is completed

Also keep naming consistent:

- use `onmyoji-flow` and `@rookie4show/onmyoji-flow` as canonical identifiers
- remove stale `yys-editor` naming unless documenting historical context

## 8. Progress Update Rules

Project progress is tracked in:

- `/docs/1management/plan.md`

When user explicitly states a task or step is completed (for example: "当前任务完成", "这一步做完了", "可以更新进度了"):

The agent MUST:

1. Identify corresponding step/module in `plan.md`.
2. Update completion status or percentage for that specific step.
3. Recalculate and update overall progress accordingly.
4. Keep all unrelated progress entries unchanged.

The agent MUST NOT:

- Update progress proactively without explicit user confirmation.
- Guess completion status from implicit signals.
- Modify unrelated sections in `plan.md`.

If mapping is ambiguous:

- Ask for clarification before updating progress.

## 9. Safety and Git Constraints

1. Never use destructive commands such as `git reset --hard` unless user explicitly asks.
2. Never revert user changes unrelated to current task.
3. If unexpected workspace changes are detected during task execution, stop and ask user how to proceed.
4. Use non-interactive git commands.

## 10. Definition of Done (DoD)

A task is done only when all are true:

1. Requested code/doc changes are implemented.
2. Relevant tests/checks were run (or inability is reported).
3. Risks/regressions are documented.
4. Required documentation is updated.
5. Output includes clear file references and next-step suggestions when appropriate.

## 11. Codex Cross-Session Consistency Protocol (Refactory Mandatory)

This section is mandatory when the user asks to execute refactor work based on `docs/2design/Refactory.md`.

### 11.1 Start-of-Session Contract

In the first working response, the agent MUST explicitly state:

1. `Refactory Scope`: `Phase` + concrete task (from Refactory document wording).
2. `In Scope Files`: exact files expected to change.
3. `Out of Scope`: what will NOT be touched in this session.
4. `Validation Plan`: which checks will be run before completion.

If scope is unclear, the agent should choose a minimal safe scope and proceed.

### 11.2 One Session, One Atomic Refactor Unit

1. One session should focus on one atomic refactor unit.
2. Do not silently bundle unrelated cleanup.
3. If user asks for broad work, split into sequenced units and execute the first unit fully.

### 11.3 Style Consistency Rules

1. Prefer existing local patterns over introducing new abstractions.
2. Do not mix competing styles in the same module (naming, state management, error handling).
3. Keep terminology consistent with project baseline:
   - product name: `onmyoji-flow`
   - package name: `@rookie4show/onmyoji-flow`
4. Avoid adding ad-hoc debug logs in production paths.

### 11.4 Mandatory Handoff Log Update

For every Refactory session, the agent MUST append one entry to:

- `/docs/1management/refactory-session-log.md`

Entry must include:

1. Date (YYYY-MM-DD)
2. Session goal
3. In-scope files changed
4. Decisions made
5. Checks executed and results
6. Remaining risks / next recommended unit

If no file changes were made, record why.

### 11.5 Completion Contract for Refactory Session

A Refactory session is complete only if all are true:

1. The scoped unit is finished or explicitly blocked.
2. Relevant checks are run (or blocker clearly stated).
3. `refactory-session-log.md` is updated.
4. Final response contains:
   - changed files
   - what was intentionally not changed
   - exact next unit recommendation
