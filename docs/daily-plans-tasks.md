# Daily Plan page - simple implementation tasks

Small, linear steps to ship Daily Plan at `/studio/daily-plan` from the current placeholder.

Use the same conventions as profile tasks:

- explicit server/API boundaries
- no hidden magic
- clear verify commands after each phase

**Conventions:** `[ ]` todo · `[-]` doing · `[x]` done · Route: **`/studio/daily-plan`**.

---

## Phase 0 - Baseline + naming alignment

- [x] **0.1** Confirm current state and source of truth
  - **Do:** Treat `docs/daily-plans.md` as reference, but validate each referenced file exists before implementing.
  - **Verify:** Add a short gap note in this file's progress log (what exists vs what must be created).

- [x] **0.2** Replace legacy naming in Daily Plan context
  - **Do:** Use `CreatorProfile` + `defaultCreatorProfile()` and `getPlaceholderUserId()` from `lib/constants/dev-user-id.ts` (no `Miko*` names in new code).
  - **Verify:** `pnpm exec tsc --noEmit`.

---

## Phase 1 - Shared types + date utilities

- [x] **1.1** Add `lib/types/daily-plan.ts`
  - **Do:** Define:
    - `ToneRisk = "safe" | "balanced" | "aggressive"`
    - `SignalTarget = "replies" | "reposts" | "bookmarks"`
    - `PlannedTweet`
    - `DailyPlanResult` with `engagementPlan` + `tweets`
  - **Verify:** `pnpm exec tsc --noEmit`.

- [x] **1.2** Add date helpers for day keys
  - **Do:** Add `lib/date/local-ymd.ts` with:
    - `localDateYmd()`
    - optional small formatter for display labels
  - **Verify:** page can initialize selected date from local today.

---

## Phase 2 - DB model + helpers

- [x] **2.1** Extend Prisma schema with `DailyPlanDay`
  - **Do:** Add model:
    - `userId`
    - `planDate` (`DateTime @db.Date`)
    - `data` (`Json`)
    - timestamps
    - unique key on `[userId, planDate]`
  - **Verify:** `pnpm db:migrate` and inspect with `pnpm db:studio`.

- [x] **2.2** Add `lib/db/daily-plan.ts`
  - **Do:** Implement:
    - strict `parsePlanDateKey(ymd)`
    - `listDailyPlanDaysForUser(userId)`
    - `getDailyPlanForUserDate(userId, ymd)`
    - `upsertDailyPlanForUserDate(userId, ymd, plan)`
    - `deleteDailyPlanForUserDate(userId, ymd)`
  - **Verify:** one-off route/script can create/read/delete a row.

---

## Phase 3 - API read/write (no generation yet)

- [x] **3.1** Create `app/api/daily-plan/route.ts` with `GET`
  - **Do:** Return:
    - without date: `{ dates }`
    - with `?date=YYYY-MM-DD`: `{ dates, plan, planDate }`
  - **Verify:** `curl /api/daily-plan` and `curl /api/daily-plan?date=...`.

- [x] **3.2** Add `PUT` save route
  - **Do:** Validate `planDate` + minimum plan shape; upsert by user/day.
  - **Verify:** PUT then GET returns same plan for that date.

- [x] **3.3** Add `DELETE` route
  - **Do:** `DELETE /api/daily-plan?date=YYYY-MM-DD`.
  - **Verify:** delete returns `{ ok, deleted }`; next GET has `plan: null`.

---

## Phase 4 - Page scaffolding with real state/load

- [x] **4.1** Add client fetch wrappers `lib/fetch/daily-plan.ts`
  - **Do:** `fetchDailyPlanState`, `fetchDailyPlanDatesOnly`, `saveDailyPlanForDateApi`, `deleteDailyPlanForDateApi`.
  - **Verify:** functions work from temporary button or console.

- [x] **4.2** Add `hooks/use-daily-plan-page.ts`
  - **Do:** Manage:
    - `selectedDate`
    - `dates`
    - `plan`
    - `loading`/`error`
  - **Verify:** switching date reloads saved plan correctly.

- [x] **4.3** Replace placeholder UI in `app/studio/daily-plan/page.tsx`
  - **Do:** Render full client view with:
    - day selector
    - saved day picker
    - empty state / plan state
  - **Verify:** selected day state and empty-state copy behave correctly.

---

## Phase 5 - Filters + generation endpoint

- [x] **5.1** Add prompt/runtime pieces needed for generation
  - **Do:** Use existing prompt blocks safely; ensure Daily Plan prompt asks JSON output and strict tweet count.
  - **Verify:** raw model output parses in happy path.

- [x] **5.2** Add `POST /api/daily-plan`
  - **Do:** Body accepts:
    - `planDate`
    - `profile` (merged with `defaultCreatorProfile()`)
    - `patternIds` (optional)
    - `signalTargets` (optional)
    - `toneRisk` (optional)
  - **Do:** Return `{ plan, planDate }`; persist when DB is configured.
  - **Verify:** POST returns valid `DailyPlanResult` with 11 tweets.

- [x] **5.3** Wire generate action into the page
  - **Do:** Add filters card and generate CTA:
    - pattern selection
    - signal targets
    - tone/risk
  - **Verify:** generate updates UI and day list; reload preserves generated day.

---

## Phase 6 - Plan output UX + compose integration

- [x] **6.1** Engagement plan card + tweet cards
  - **Do:** Show summary/goal/keyMetric and per-tweet details.
  - **Verify:** 11 cards render without layout break.

- [x] **6.2** Add card actions
  - **Do:** `Open in Compose` to `/studio/compose?draft=...` and `Copy tweet`.
  - **Verify:** compose prefill + clipboard both work.

- [x] **6.3** Add delete CTA for selected day
  - **Do:** "Remove this day's plan" only when plan exists.
  - **Verify:** delete clears current day plan and updates saved day list.

---

## Phase 7 - Reliability + polish

- [x] **7.1** Guard rails on server responses
  - **Do:** If generation output is malformed/short, repair once and/or return clear 502 error.
  - **Verify:** forced malformed response path returns actionable error.

- [x] **7.2** User-visible errors and loading states
  - **Do:** Ensure clear CTA states:
    - loading
    - saving
    - deleting
    - generation failure
  - **Verify:** no silent failure paths in UI.

- [x] **7.3** Profile readiness hint
  - **Do:** show profile setup hint/banner when profile has weak identity (`bio` + `niche` empty).
  - **Verify:** banner appears/disappears based on profile.

---

## Phase 8 - Docs and cleanup

- [x] **8.1** Update `docs/project-brain/routes.md`
  - **Do:** ensure `/studio/daily-plan` route + APIs reflect exactly what shipped.

- [x] **8.2** Update `docs/daily-plans.md` with runtime note
  - **Do:** add short top note distinguishing shipped behavior from any aspirational sections.

- [x] **8.3** Append progress log
  - **Do:** add one-line DONE entries per completed phase chunk.

---

## Progress log

`YYYY-MM-DD | DailyPlan | <id> | DONE | <one line>`

- `2026-04-26 | DailyPlan | INIT | DONE | Created phased task checklist at docs/daily-plans-tasks.md from docs/daily-plans.md and current placeholder route (app/studio/daily-plan/page.tsx).`
- `2026-04-26 | DailyPlan | 0.1 | DONE | Baseline gap audit: only app/studio/daily-plan/page.tsx exists; docs mention future files not yet created (api/db/hooks/fetch/types for daily-plan).`
- `2026-04-26 | DailyPlan | 0.2 | DONE | Daily Plan reference updated to CreatorProfile naming and dev user path (defaultCreatorProfile + lib/constants/dev-user-id.ts).`
- `2026-04-26 | DailyPlan | 1.1 | DONE | Added lib/types/daily-plan.ts (ToneRisk, SignalTarget, PlannedTweet, DailyPlanEngagementPlan, DailyPlanResult).`
- `2026-04-26 | DailyPlan | 1.2 | DONE | Added lib/date/local-ymd.ts with localDateYmd() and formatYmdForUi() for day key defaults/display labels.`
- `2026-04-26 | DailyPlan | 2.1 | DONE | DailyPlanDay Prisma model already present in prisma/schema.prisma with userId+planDate unique key and date index.`
- `2026-04-26 | DailyPlan | 2.2 | DONE | Added lib/db/daily-plan.ts with strict YYYY-MM-DD parser and day-level list/get/upsert/delete helpers using Prisma composite key.`
- `2026-04-26 | DailyPlan | 3.1 | DONE | Added app/api/daily-plan/route.ts GET: dates-only or dates+plan for selected date with strict date validation.`
- `2026-04-26 | DailyPlan | 3.2 | DONE | Added PUT /api/daily-plan with planDate + plan validation via dailyPlanFromJson and upsert by user/date.`
- `2026-04-26 | DailyPlan | 3.3 | DONE | Added DELETE /api/daily-plan?date=... with strict validation and deleted status response.`
- `2026-04-26 | DailyPlan | 4.1 | DONE | Added lib/fetch/daily-plan.ts wrappers for state load, dates-only load, save, and delete with shared error parsing.`
- `2026-04-26 | DailyPlan | 4.2 | DONE | Added hooks/use-daily-plan-page.ts with selectedDate-based load cycle, dates/plan state, loading/error handling, and refreshSelectedDay().`
- `2026-04-26 | DailyPlan | 4.3 | DONE | Added app/daily-plan/daily-plan-client.tsx and wired app/studio/daily-plan/page.tsx to render real day selector + saved-day picker + empty/plan state view.`
- `2026-04-26 | DailyPlan | 5.1 | DONE | Added pattern catalog (lib/patterns.ts) and generation prompt constraints for strict JSON + tweet-count requirements in POST /api/daily-plan.`
- `2026-04-26 | DailyPlan | 5.2 | DONE | Added POST /api/daily-plan generation flow with profile merge, defaults for patterns/signals/tone, one repair pass, and best-effort persistence.`
- `2026-04-26 | DailyPlan | 5.3 | DONE | Wired filters + generate CTA into hook and daily-plan client (patterns, signals, tone, loading/error states, replace vs generate labels).`
- `2026-04-26 | DailyPlan | 6.1 | DONE | Upgraded plan output to render detailed tweet cards (content, score, pattern, signal target, reasoning, gif suggestion).`
- `2026-04-26 | DailyPlan | 6.2 | DONE | Added per-tweet actions: Open in Compose with draft prefill and Copy tweet with temporary copied state.`
- `2026-04-26 | DailyPlan | 6.3 | DONE | Added deleteSelectedDayPlan flow in hook and "Remove this day's plan" CTA shown only when a plan exists.`
- `2026-04-26 | DailyPlan | 7.1 | DONE | Tightened POST /api/daily-plan guardrail to require exactly 11 tweets after one repair pass; otherwise clear PLAN_INVALID 502 error.`
- `2026-04-26 | DailyPlan | 7.2 | DONE | Improved runtime UX states by loading profile in hook, surfacing profile-warning alerts, and using real profile data for generation (fallback to defaults on failure).`
- `2026-04-26 | DailyPlan | 7.3 | DONE | Added profile-readiness hint alert on Daily Plan page when bio+niche are both empty, with direct link to /studio/profile.`
- `2026-04-26 | DailyPlan | 8.1 | DONE | Verified docs/project-brain/routes.md already reflects shipped /studio/daily-plan route ownership and /api/daily-plan usage.`
- `2026-04-26 | DailyPlan | 8.2 | DONE | Added top runtime note in docs/daily-plans.md clarifying current shipped flow and that some sections are historical/reference context.`
- `2026-04-26 | DailyPlan | 8.3 | DONE | Closed Phase 8 checklist and appended completion entries in progress log.`

---

## Suggested order

**0 -> 1 -> 2 -> 3 -> 4** gets stable CRUD day plans first.  
**5 -> 6** adds AI generation and full UX.  
**7 -> 8** hardens and documents behavior.
