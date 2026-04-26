# Daily Plan page - complete reference

> Runtime note (current): Daily Plan is now shipped with explicit day-based load, generate, and delete flows at `/studio/daily-plan` using `app/api/daily-plan/route.ts`. Some path examples in this reference may use older route-group notation or earlier architecture wording; treat those as historical context.

This document captures everything for the Daily Plan feature: route/UI behavior, state management, API contracts, prompt structure, DB persistence, and how it links to the rest of the product.

---

## 1) What Daily Plan does

Daily Plan generates a day-specific batch of X post ideas and stores that batch by calendar date.

- Output per generation: 1 `engagementPlan` + 11 tweet drafts
- Scope: one selected day (`YYYY-MM-DD`)
- Persistence model: one row per user per day (`DailyPlanDay`)
- Consumption: users can copy tweets or open any tweet in Compose

The feature is a planning workflow, not a posting workflow.

---

## 2) Route and navigation

### Canonical route

- `/studio/daily-plan` -> `app/(studio)/studio/daily-plan/page.tsx`
- Page renders `DailyPlanClient`

### Redirect route

- `/daily-plan` -> `/studio/daily-plan` (from `next.config.ts`)

### Cross-feature links

- Daily Plan page links to `/studio/profile` in the page description
- Each generated tweet can route to `/studio/compose?draft=...` via "Open in Compose"

---

## 3) File map (Daily Plan)

### Route + UI

- `app/(studio)/studio/daily-plan/page.tsx` - route page, metadata title
- `app/daily-plan/daily-plan-client.tsx` - full Daily Plan UI

### State + fetching

- `hooks/use-daily-plan-page.ts` - feature state and actions
- `lib/fetch/daily-plan.ts` - client API wrappers for load/delete
- `hooks/use-loaded-profile.ts` - shared profile context dependency

### API + DB

- `app/api/daily-plan/route.ts` - GET/POST/PUT/DELETE
- `lib/db/daily-plan.ts` - DB helpers, date parsing, upsert/delete/list/get
- `prisma/schema.prisma` - `DailyPlanDay` model
- `lib/constants/dev-user-id.ts` - placeholder user id source
- `lib/api/db-config.ts` - DB availability guard

### Prompt and AI dependencies

- `lib/prompts/miko-rules.ts` - preamble
- `lib/prompts/x-rules.ts` - X platform guardrails
- `lib/prompt-contract.ts` - `HOOK_REMINDER`
- `lib/gemini.ts` - Gemini call + JSON parse helper
- `lib/patterns.ts` - allowed pattern catalog and IDs

### Date helpers

- `lib/date/local-ymd.ts` - `localDateYmd()` and date formatting used in UI

---

## 4) UI behavior (`DailyPlanClient`)

Source: `app/daily-plan/daily-plan-client.tsx`

### Main sections

1. Day selector card
2. Filters card (patterns, signals, tone)
3. Plan output section (engagement strategy + tweet cards)

### Day selector features

- Input type `date` bound to `selectedDate`
- Quick action: "Today"
- Dropdown of saved days (`dates`) for fast jumping
- UI copy clarifies day-level overwrite scope

### Filters

- Pattern multiselect from `PATTERN_CATALOG`
- Signal target multiselect from fixed list:
  - `replies`
  - `reposts`
  - `bookmarks`
- Tone/risk single select:
  - `safe`
  - `balanced`
  - `aggressive`

### Generate + remove actions

- Generate button text changes by state:
  - idle no plan: "Generate plan for this day"
  - idle existing plan: "Replace plan for this day"
  - loading: "Generating..."
- Remove button appears only when a plan exists:
  - "Remove this day's plan"

### Plan output rendering

When a plan exists:

- "Engagement plan" card with:
  - summary
  - goal
  - keyMetric
- One card per tweet with:
  - badges: `patternName`, `signalTarget`
  - `viralScore`
  - `content`
  - `reasoning`
  - `gifSuggestion`
  - actions:
    - "Open in Compose" (prefills draft)
    - "Copy tweet" (clipboard)

When no plan for selected day:

- Empty-state card: asks to generate or switch to another saved day

### Profile hint

- Shows `ProfileSetupBanner` when profile exists but `niche` and `bio` are both empty.

---

## 5) Hook/state flow (`useDailyPlanPage`)

Source: `hooks/use-daily-plan-page.ts`

### Core state

- `selectedDate` (defaults to `localDateYmd()`)
- `dates` (saved day list)
- `plan` (`DailyPlanResult | null`)
- loading/error states:
  - `loadingDay`, `loadError`
  - generate action states
  - delete action states
- filters:
  - `selectedPatterns` defaults to all catalog IDs
  - `signals` defaults to all 3 signal targets
  - `tone` defaults to `balanced`

### Initial and date-change loading

- `refreshSelectedDay(selectedDate)` calls `fetchDailyPlanState(dateYmd)`
- Triggered by `useEffect` on `selectedDate`
- Updates both:
  - `dates`
  - `plan` for current date

### Generate flow

- Requires loaded `profile`
- POST body sent to `/api/daily-plan`:
  - `planDate`
  - `profile`
  - `patternIds`
  - `signalTargets`
  - `toneRisk`
- On success:
  - updates local `plan`
  - refreshes selected day from server

### Delete flow

- Calls `DELETE /api/daily-plan?date=...`
- On success:
  - sets `plan` to `null`
  - refreshes selected day from server

### Combined error strategy

- Returned `loadError` is `loadError ?? profileError` so profile loading failures surface on the page.

---

## 6) API contract and server behavior

Source: `app/api/daily-plan/route.ts`

`export const dynamic = "force-dynamic";`

### GET `/api/daily-plan`

- With `?date=YYYY-MM-DD`:
  - validates date format
  - returns `{ dates, plan, planDate }`
- Without `date`:
  - returns `{ dates }`

### PUT `/api/daily-plan`

- Purpose: save a client-built plan for a day
- Requires:
  - `planDate`
  - `plan.engagementPlan`
  - non-empty `plan.tweets`
- Upserts for selected user+date
- Returns `{ plan, planDate }`

### DELETE `/api/daily-plan?date=YYYY-MM-DD`

- Validates date
- Deletes only that date's plan
- Returns `{ ok, deleted }`

### POST `/api/daily-plan`

- Requires `GEMINI_API_KEY`
- Requires valid `planDate`
- Merges incoming `profile` with `defaultCreatorProfile()`
- Defaults:
  - `patternIds`: all patterns if omitted
  - `signalTargets`: replies/reposts/bookmarks if omitted
  - `toneRisk`: `balanced` if omitted
- Runs Gemini prompt
- Attempts parse
- If weak/invalid output (`tweets` missing or length < 8):
  - runs repair prompt
- If DB configured:
  - saves generated plan automatically
- Returns `{ plan, planDate }`

### DB availability behavior

- GET/PUT/DELETE use `databaseUnavailableResponse()` guard and return 503 when DB is not configured.
- POST generation can still run without DB, but only persists if `isDatabaseConfigured()` is true.

---

## 7) Prompt details (Daily Plan specific)

Source: `app/api/daily-plan/route.ts`

### Prompt composition

System prompt is built from:

1. `COMBINED_MIKO_BLOG_PREAMBLE`
2. `X_PLATFORM_RULES`
3. `HOOK_REMINDER`
4. Daily-plan task rules

### System prompt rules (key requirements)

- Output JSON only
- Include `engagementPlan` with summary/goal/keyMetric
- `tweets` must be exactly 11
- Each tweet should have unique topic angle
- At least 3 tweets should be clearly funny
- Style constraints:
  - casual tone
  - no hashtags
  - no "Here's the thing:"
  - no thread emoji
- Per-tweet fields include:
  - `content`
  - `viralScore` (1-100)
  - `patternName`
  - `gifSuggestion`
  - `reasoning`
  - `signalTarget` (`replies|reposts|bookmarks`)

### User prompt payload sections

- `profileToPromptBlock(profile)`
- allowed pattern labels for this run
- signal targets to rotate
- tone/risk value
- strict JSON shape reminder
- explicit line: tweets array MUST have length 11

### Repair prompt

Used when initial parsed result looks invalid:

- system instruction:
  - "Fix the following into valid JSON matching DailyPlanResult. tweets length must be 11. JSON only."
- user prompt:
  - serialized bad output, truncated to 12,000 chars

---

## 8) Data types

Source: `lib/types/daily-plan.ts`

### `ToneRisk`

- `"safe" | "balanced" | "aggressive"`

### `SignalTarget`

- `"replies" | "reposts" | "bookmarks"`

### `PlannedTweet`

- `content: string`
- `viralScore: number`
- `patternName: string`
- `gifSuggestion: string`
- `reasoning: string`
- `signalTarget: string`

### `DailyPlanResult`

- `engagementPlan`:
  - `summary`
  - `goal`
  - `keyMetric`
- `tweets: PlannedTweet[]`

---

## 9) Database persistence details

Schema source: `prisma/schema.prisma`

### Model

`DailyPlanDay` stores one day per user:

- `id` (cuid)
- `userId`
- `planDate` (`@db.Date`)
- `data` (JSON matching `DailyPlanResult`)
- timestamps

Constraints:

- `@@unique([userId, planDate])`
- descending index on `[userId, planDate]`

### DB helper behavior (`lib/db/daily-plan.ts`)

- `parsePlanDateKey(ymd)`:
  - validates strict `YYYY-MM-DD`
  - stores as UTC midnight `Date` for postgres `DATE`
- `listDailyPlanDaysForUser(userId)`:
  - returns list of `{ planDate, updatedAt }`
- `getDailyPlanForUserDate(userId, ymd)`:
  - unique lookup by user+date
- `upsertDailyPlanForUserDate(userId, ymd, plan)`:
  - create or update `data`
- `deleteDailyPlanForUserDate(userId, ymd)`:
  - delete many by user+date, returns boolean

### User identity

All rows are keyed by placeholder user until auth is added:

- `getPlaceholderUserId()` from `lib/constants/dev-user-id.ts`

---

## 10) Client fetch wrappers

Source: `lib/fetch/daily-plan.ts`

- `fetchDailyPlanState(dateYmd)` -> GET `/api/daily-plan?date=...`
- `fetchDailyPlanDatesOnly()` -> GET `/api/daily-plan`
- `deleteDailyPlanForDateApi(dateYmd)` -> DELETE `/api/daily-plan?date=...`

All wrappers throw `Error` with API `error` message if response is not OK.

---

## 11) Patterns used in Daily Plan

Source: `lib/patterns.ts`

Current catalog IDs:

- `POV_REALIZATION`
- `FORCED_CHOICE`
- `HOT_TAKE`
- `BUILDER_LOG`
- `CONTRARIAN_INSIGHT`
- `MEME_FORMAT`

Each catalog entry includes:

- display `name`
- `triggers` hint
- `example`

In Daily Plan:

- UI multiselect uses these IDs
- API filters allowed `patternName` instruction set for the LLM

---

## 12) Operational notes / edge cases

- If DB is not configured:
  - GET/PUT/DELETE daily-plan endpoints return 503
  - POST can still generate response, but won't persist
- If Gemini key is missing:
  - POST returns 503 (`AI_UNAVAILABLE`)
- Selected date is always client-controlled; switching date reloads plan/dates
- Generate overwrites only one day due to user+date upsert key
- Delete affects only one day
- Clipboard and compose-navigation are client-side actions only

---

## 13) Packages and runtime dependencies (feature-level)

Directly used by Daily Plan page/flow:

- `next` / `react` / `typescript`
- UI stack (shadcn-based components in `components/ui/*`)
- `swr` (via `useLoadedProfile`)
- Prisma (`@prisma/client`, `prisma`)
- Gemini SDK (`@google/generative-ai`) through `lib/gemini.ts`

Supporting shared modules:

- date helpers (`lib/date/local-ymd.ts`)
- profile prompt block (`lib/types/profile.ts`)
- prompt fragments (`lib/prompts/miko-rules.ts`, `lib/prompts/x-rules.ts`, `lib/prompt-contract.ts`)

---

## 14) Quick read order for handoff

1. `app/daily-plan/daily-plan-client.tsx`
2. `hooks/use-daily-plan-page.ts`
3. `app/api/daily-plan/route.ts`
4. `lib/db/daily-plan.ts`
5. `lib/types/daily-plan.ts`
6. `lib/fetch/daily-plan.ts`
7. `prisma/schema.prisma`

