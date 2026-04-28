# Shorts page - simple implementation tasks

Linear, reviewable phases to ship Shorts/Reels under `/studio/shorts`.

Conventions: `[ ]` todo · `[-]` doing · `[x]` done · Route family: `/studio/shorts`.

---

## Phase 0 - Scope lock and architecture baseline

- [x] **0.1** Confirm scope and success criteria
  - **Do:** Lock MVP as URL -> transcript -> moment ranking -> user selection -> render -> download.
  - **Verify:** write one-sentence acceptance criteria in progress log.

- [x] **0.2** Lock route and ownership map
  - **Do:** Reserve `/studio/shorts`, `/studio/shorts/new`, `/studio/shorts/[id]`, `/studio/shorts/[id]/edit`.
  - **Verify:** `docs/project-brain/routes.md` includes all new routes.

---

## Phase 1 - Shared type contracts

- [x] **1.1** Add shorts draft contracts
  - **Do:** Create `lib/types/shorts-draft.ts` for transcript segments, moment candidates, render presets/jobs, wizard step.
  - **Verify:** no `any` in UI state or API payloads.

- [x] **1.2** Add persisted shorts contract
  - **Do:** Create `lib/types/saved-shorts.ts` with `SavedShortsData` and normalization helpers.
  - **Verify:** normalization handles partial/legacy payloads safely.

---

## Phase 2 - Database model and helpers

- [x] **2.1** Add Prisma `ShortsProject` model
  - **Do:** include id/userId/source/status/data/timestamps and userId+updatedAt index.
  - **Verify:** `pnpm exec prisma validate`.

- [x] **2.2** Add `lib/db/shorts.ts`
  - **Do:** implement `listShortsForUser`, `getShortsProjectForUser`, `createShortsProjectForUser`, `updateShortsProjectForUser`.
  - **Verify:** create -> get -> update roundtrip.

---

## Phase 3 - Core CRUD API routes

- [x] **3.1** Add `app/api/shorts/projects/route.ts`
  - **Do:** implement `GET` list and `POST` create with validation.
  - **Verify:** list works with empty and non-empty states.

- [x] **3.2** Add `app/api/shorts/projects/[id]/route.ts`
  - **Do:** implement `GET` project and `PUT` update metadata/state.
  - **Verify:** project update is scoped by placeholder user id.

- [x] **3.3** Add DB availability guardrails
  - **Do:** follow same pattern as articles for DB unavailable response behavior.
  - **Verify:** with missing DB config, routes return actionable 503.

---

## Phase 4 - Processing APIs (transcribe, analyze, render)

- [x] **4.1** Add `POST /api/shorts/projects/[id]/transcribe`
  - **Do:** validate input, enqueue ingest+transcribe, return project status.
  - **Verify:** status transitions to transcribing.

- [x] **4.2** Add `POST /api/shorts/projects/[id]/analyze`
  - **Do:** compute and persist ranked moment candidates with reasons and scores.
  - **Verify:** returns non-empty candidates for valid transcripts.

- [x] **4.3** Add `POST /api/shorts/projects/[id]/render`
  - **Do:** validate selected candidate ids and enqueue render jobs.
  - **Verify:** returns job ids + queued statuses.

- [x] **4.4** Add render status + download APIs
  - **Do:** implement `/api/shorts/renders/[renderId]` and `/download`.
  - **Verify:** completed jobs return downloadable output links.

---

## Phase 5 - Fetch wrappers and state orchestration

- [x] **5.1** Add `lib/fetch/shorts.ts`
  - **Do:** typed wrappers for shorts list/detail/create/transcribe/analyze/render/status/download.
  - **Verify:** wrappers throw normalized errors from API responses.

- [x] **5.2** Add `hooks/use-shorts-page.ts`
  - **Do:** own source/transcript/moments/selection/render states and async lifecycle actions.
  - **Verify:** step transitions remain deterministic after retries.

- [x] **5.3** Add hydration and save/update continuity
  - **Do:** support edit mode hydration and keep `savedProjectId` synchronized.
  - **Verify:** refresh/edit resumes previous journey state.

---

## Phase 6 - Studio pages and wizard UI

- [x] **6.1** Build list page + list client
  - **Do:** implement `/studio/shorts` SSR list with create CTA.
  - **Verify:** empty state and recent project list both render correctly.

- [x] **6.2** Build new/edit journey wrappers
  - **Do:** implement `/studio/shorts/new` and `/studio/shorts/[id]/edit` around shared journey client.
  - **Verify:** shared UI works for both create and edit mode.

- [x] **6.3** Build detail page
  - **Do:** implement `/studio/shorts/[id]` with transcript preview, candidates, and render results.
  - **Verify:** deep-linking to project detail works from list and save flow.

---

## Phase 7 - Moment analysis UX and quality controls

- [x] **7.1** Add ranked candidates table/cards
  - **Do:** show score, reason, start/end, duration, and tags.
  - **Verify:** high-reach (80+) badge and sorting work.

- [x] **7.2** Add overlap pruning and selection constraints
  - **Do:** prevent near-duplicate windows from being selected blindly.
  - **Verify:** conflicting selections surface clear UI guidance.

- [x] **7.3** Add manual trim override
  - **Do:** allow small start/end adjustments before rendering.
  - **Verify:** trims persist and are used in render payload.

---

## Phase 8 - Render UX, reliability, and error states

- [x] **8.1** Add render progress panel
  - **Do:** show queued/running/completed/failed state per selected clip.
  - **Verify:** polling updates status without page refresh.

- [x] **8.2** Add explicit empty/loading/error handling
  - **Do:** cover each async stage with visible actionable UI states.
  - **Verify:** no silent failures.

- [x] **8.3** Add downloadable outputs section
  - **Do:** provide mp4 links and optional subtitle downloads when available.
  - **Verify:** downloaded outputs open correctly.

---

## Phase 9 - Ops hardening and policy guardrails

- [x] **9.1** Add source validation and quota checks
  - **Do:** enforce supported sources and rate limits for expensive jobs.
  - **Verify:** blocked requests return explicit error codes/messages.

- [x] **9.2** Add structured telemetry and job audit logs
  - **Do:** log stage timings and failure reasons for ingest/transcribe/analyze/render.
  - **Verify:** failed jobs are diagnosable from logs.

- [x] **9.3** Add docs and progress updates
  - **Do:** keep `docs/shorts-page.md` and `docs/project-brain/routes.md` in sync.
  - **Verify:** append one DONE line per completed phase chunk.

---

## Progress log

`YYYY-MM-DD | ShortsPage | <id> | DONE | <one line>`

- `2026-04-28 | ShortsPage | INIT | DONE | Created full journey reference and phased task checklist for /studio/shorts rollout.`
- `2026-04-28 | ShortsPage | 0.1 | DONE | Locked MVP scope and acceptance criteria in docs/shorts-page.md as URL to downloadable clips flow.`
- `2026-04-28 | ShortsPage | 0.2 | DONE | Added /studio/shorts route ownership and legacy /shorts redirect mapping to docs/project-brain/routes.md.`
- `2026-04-28 | ShortsPage | 1.1 | DONE | Added lib/types/shorts-draft.ts with strongly typed wizard, transcript, candidates, presets, and render job contracts.`
- `2026-04-28 | ShortsPage | 1.2 | DONE | Added lib/types/saved-shorts.ts with normalization helpers and deriveShortsListTitle() for persistence safety.`
- `2026-04-28 | ShortsPage | 2.1 | DONE | Added ShortsProject Prisma model (title/status/source fields + JSON data + userId updatedAt index) and validated schema.`
- `2026-04-28 | ShortsPage | 2.2 | DONE | Added lib/db/shorts.ts with list/get/create/update helpers including normalized SavedShortsData persistence.`
- `2026-04-28 | ShortsPage | 3.1 | DONE | Added app/api/shorts/projects/route.ts with GET list and POST create using normalized data payloads.`
- `2026-04-28 | ShortsPage | 3.2 | DONE | Added app/api/shorts/projects/[id]/route.ts with GET single project and PUT update scoped by placeholder user.`
- `2026-04-28 | ShortsPage | 3.3 | DONE | Added SAVE_UNAVAILABLE 503 DB guard behavior for shorts CRUD routes, matching existing article API style.`
- `2026-04-28 | ShortsPage | 4.1 | DONE | Added POST /api/shorts/projects/[id]/transcribe with persisted transcript payload and transcribing status transition.`
- `2026-04-28 | ShortsPage | 4.2 | DONE | Added POST /api/shorts/projects/[id]/analyze with ranked candidate generation, score filtering, and ready_for_selection state update.`
- `2026-04-28 | ShortsPage | 4.3 | DONE | Added POST /api/shorts/projects/[id]/render with candidate validation, render preset persistence, and queued render jobs.`
- `2026-04-28 | ShortsPage | 4.4 | DONE | Added render polling and download endpoints under /api/shorts/renders/[renderId] and /download with completion gating.`
- `2026-04-28 | ShortsPage | 5.1 | DONE | Added lib/fetch/shorts.ts with typed wrappers for shorts CRUD, transcribe, analyze, render, status, and download endpoints.`
- `2026-04-28 | ShortsPage | 5.2 | DONE | Added hooks/use-shorts-page.ts to centralize shorts journey state and async action lifecycle handlers.`
- `2026-04-28 | ShortsPage | 5.3 | DONE | Added hydrateFromSaved() and runSave() create/update continuity flow with savedProjectId synchronization.`
- `2026-04-28 | ShortsPage | 6.1 | DONE | Added /studio/shorts SSR list page and app/shorts/shorts-list-client.tsx for project listing and creation entry.`
- `2026-04-28 | ShortsPage | 6.2 | DONE | Added shared shorts journey UI (wizard + client wrapper) and wired /studio/shorts/new and /studio/shorts/[id]/edit routes.`
- `2026-04-28 | ShortsPage | 6.3 | DONE | Added /studio/shorts/[id] detail page and app/shorts/shorts-detail-client.tsx with source and candidate summaries.`
- `2026-04-28 | ShortsPage | 7.1 | DONE | Added candidate score-band badges in moments and selection views to highlight high-reach clips.`
- `2026-04-28 | ShortsPage | 7.2 | DONE | Added overlap guardrail in selection flow to prevent conflicting clip windows from being selected together.`
- `2026-04-28 | ShortsPage | 7.3 | DONE | Added manual trim controls for selected clips and passed candidate range overrides through render requests.`
- `2026-04-28 | ShortsPage | 8.1 | DONE | Added render status refresh controls, per-job polling action, and in-card status visibility for queued/running/completed jobs.`
- `2026-04-28 | ShortsPage | 8.2 | DONE | Added explicit refresh/loading/error handling in render workflow and surfaced per-job failures in UI.`
- `2026-04-28 | ShortsPage | 8.3 | DONE | Added download-link resolution action per render job and wired download URLs into the download step UI.`
- `2026-04-28 | ShortsPage | 9.1 | DONE | Added source host allowlist validation and per-user in-memory quotas for transcribe/analyze/render endpoints with QUOTA_EXCEEDED responses.`
- `2026-04-28 | ShortsPage | 9.2 | DONE | Added structured shorts API telemetry logs for list/create/update/transcribe/analyze/render success and failure stages.`
- `2026-04-28 | ShortsPage | 9.3 | DONE | Updated phase checklist and progress log through final hardening phase completion.`
