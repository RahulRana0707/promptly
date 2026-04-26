# Promptly Implementation Phases

This folder is the execution journey for building Promptly in small, verifiable chunks.

Use this file as the single source of truth for:
- what we are building now,
- what is done,
- what is next,
- and what must be reviewed before each task.

## Working Rules (Must Follow Every Time)

Before starting any task, review:
1. `docs/project-brain/README.md`
2. `docs/project-brain/routes.md`
3. `docs/project-brain/prompt.md`
4. `AGENTS.md`
5. Relevant skill docs under `.agents/skills/` (at minimum `nextjs` and `shadcn`, plus any feature-specific skill)

Execution rules:
- Keep tasks small (single-purpose and testable).
- Complete one task at a time; do not parallelize unfinished product-critical tasks.
- After each task, write what changed, what worked, and what to improve.
- Prefer extending existing structure over introducing new patterns too early.
- If a task fails, document blocker + fallback plan before moving ahead.

## How to Use This File

For each task:
1. Mark task as `IN PROGRESS`.
2. Implement and verify.
3. Mark task as `DONE`.
4. Add a short update in the Progress Log.

Task status format:
- `[ ]` Not started
- `[-]` In progress
- `[x]` Done

---

## Phase 1 - Foundation and Shared Context

Goal: Establish the base architecture and shared profile context that all generators depend on.

- [ ] Task 1.1: Confirm route/group structure for marketing vs studio shells.
- [ ] Task 1.2: Define/validate shared profile schema for Promptly.
- [ ] Task 1.3: Build profile read/write flow (UI + API contract).
- [ ] Task 1.4: Add shared profile hydration pattern in studio layout.
- [ ] Task 1.5: Add baseline validation and error-handling states.

Exit criteria:
- Profile can be created/updated/retrieved reliably.
- Studio surface can consume shared profile context.

## Phase 2 - Compose Core Workflow

Goal: Ship the primary compose experience with profile-grounded generation.

- [ ] Task 2.1: Finalize compose page UX states (input, loading, result, retry).
- [ ] Task 2.2: Implement compose generation endpoint contract.
- [ ] Task 2.3: Implement improve/rewrite/suggest actions.
- [ ] Task 2.4: Add optional research support flow.
- [ ] Task 2.5: Add guardrails for output format and fallback handling.

Exit criteria:
- User can generate and refine posts consistently from compose.

## Phase 3 - Pattern and Quote Workflows

Goal: Deliver fast idea generation paths beyond compose.

- [ ] Task 3.1: Build pattern-based single post generation flow.
- [ ] Task 3.2: Build quote-repost flow with 4 option output contract.
- [ ] Task 3.3: Ensure profile context and tone rules are applied.
- [ ] Task 3.4: Add copy-to-compose/transfer flow between tools.

Exit criteria:
- Patterns and quote workflows produce stable outputs and plug into compose.

## Phase 4 - Daily Plan Workflow

Goal: Generate and manage a daily content plan with reusable outputs.

- [ ] Task 4.1: Define daily plan output contract and validation.
- [ ] Task 4.2: Implement generate/load/save/delete flow.
- [ ] Task 4.3: Add strategy summary + plan rendering UX.
- [ ] Task 4.4: Add push-to-compose action from planned posts.

Exit criteria:
- User can generate, save, reopen, and use daily plans in compose.

## Phase 5 - Article Workflow

Goal: Deliver long-form article journey from planning to editable draft.

- [ ] Task 5.1: Build article plan step.
- [ ] Task 5.2: Build article expand step with retry/repair handling.
- [ ] Task 5.3: Build image slots and image prompt generation helpers.
- [ ] Task 5.4: Build save/list/view/edit article lifecycle.

Exit criteria:
- User can create and iterate on article drafts end-to-end.

## Phase 6 - Hardening, Quality, and Launch Readiness

Goal: Stabilize product behavior and reduce regression risk.

- [ ] Task 6.1: Standardize prompt locations and reduce large inline prompts.
- [ ] Task 6.2: Improve API error surfaces and user-facing feedback.
- [ ] Task 6.3: Add test checklist for all core journeys.
- [ ] Task 6.4: Performance pass (rendering, payload, and request timing).
- [ ] Task 6.5: Release checklist and launch-ready signoff.

Exit criteria:
- Core journeys are stable, observable, and launch-ready.

---

## Global Preset Checklist (Run Before Any Task)

- [ ] Re-read relevant `docs/project-brain/*` sections for this task.
- [ ] Re-check `AGENTS.md` constraints.
- [ ] Re-check relevant `.agents/skills/*` docs.
- [ ] Confirm task scope is small and measurable.
- [ ] Define "done" and verification steps before coding.

## Progress Log

Use this format:
- `YYYY-MM-DD | Phase X | Task Y.Z | Status | Notes`

Examples:
- `2026-04-26 | Phase 1 | Task 1.1 | DONE | Studio and marketing route ownership confirmed.`
- `2026-04-26 | Phase 1 | Task 1.2 | IN PROGRESS | Profile schema being aligned with compose requirements.`

