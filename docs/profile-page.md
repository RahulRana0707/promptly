# Profile page — complete reference

This document covers the **Profile / voice system** end-to-end: routes, UI, client state, SWR cache, server load, APIs, database, types, AI analysis prompt, and how profile data flows into the rest of the studio.

---

## 1. What the profile is for

The profile is the **shared strategy layer** for generators: Compose, Daily Plan, Patterns, Quote Radar, and Articles all merge `Partial<CreatorProfile>` with `defaultCreatorProfile()` on the server (or send the full loaded profile from the client). The UI copy on the profile page states this explicitly (`app/profile/profile-client.tsx`).

**Quality bar:** niche + bio are used elsewhere as a weak-profile signal (`ProfileSetupBanner` on articles journey and list when both are empty).

---

## 2. Routes and navigation

| URL | File | Purpose |
|-----|------|---------|
| `/studio/profile` | `app/(studio)/studio/profile/page.tsx` | Canonical profile page |
| `/profile` | redirect → `/studio/profile` | `next.config.ts` |

**Sidebar:** `components/app-sidebar.tsx` includes nav item `url: "/studio/profile"`.

**Cross-links:**

- Profile page → “Open Compose” → `/studio/compose`
- `ProfileSetupBanner` → `/studio/profile` (used on articles list/journey when niche and bio are empty)

---

## 3. File map

| Layer | Path | Role |
|-------|------|------|
| Route | `app/(studio)/studio/profile/page.tsx` | Renders `ProfileClient`; metadata title `"Profile"` |
| UI | `app/profile/profile-client.tsx` | Form + AI analysis results |
| State | `hooks/use-profile-form.ts` | Local profile state, debounced PUT, analyze POST |
| Global profile read | `hooks/use-loaded-profile.ts` | SWR over `GET /api/profile` |
| SWR key | `lib/constants/profile-swr.ts` | `PROFILE_SWR_KEY = "/api/profile"` |
| Fetch helpers | `lib/fetch/profile.ts` | `fetchProfileApi`, `putProfileApi` |
| Types | `lib/types/profile.ts` | `CreatorProfile`, `CareerStage`, `ProfileAnalysis`, `defaultCreatorProfile`, `profileToPromptBlock` |
| DB | `lib/db/profile.ts` | `getProfileForUser`, `upsertProfileForUser` |
| Schema | `prisma/schema.prisma` | `Profile` model |
| API | `app/api/profile/route.ts` | `GET`, `PUT` |
| API | `app/api/profile/analyze/route.ts` | `POST` — Gemini growth analysis |
| Studio bootstrap | `app/(studio)/layout.tsx` | Wraps children in `StudioSWRProvider` |
| SSR initial profile | `lib/server/studio-profile.ts` | `getStudioInitialProfile()` for SWR fallback |
| SWR provider | `components/studio-swr-provider.tsx` | `fallback: { [PROFILE_SWR_KEY]: initialProfile }` |
| Shell | `components/studio-shell.tsx` | `ProfileSetupBanner` component |

---

## 4. Data model (`CreatorProfile`)

Defined in `lib/types/profile.ts`.

### Fields

| Field | Type | UI section | Notes |
|-------|------|------------|--------|
| `bio` | string | Creator identity | |
| `niche` | string | Creator identity | Empty niche triggers banner hints elsewhere |
| `techStack` | string | Creator identity | |
| `currentWork` | string | Creator identity | |
| `goals` | string | Creator identity | “Goals on X” |
| `targetAudience` | string | Creator identity | |
| `careerStage` | `CareerStage` | Creator identity | Select: `beginner` \| `intermediate` \| `advanced` \| `expert` |
| `corePersonality` | string | Voice | Default text is opinionated “builder who teaches…” |
| `toneNotes` | string | Voice | Labelled “Tone notes” |
| `wordsUse` | string | Voice | |
| `wordsAvoid` | string | Voice | |

### Defaults (`defaultCreatorProfile()`)

All string identity fields start empty except voice defaults (`corePersonality`, `toneNotes`, `wordsUse`, `wordsAvoid`) which seed usable generator behavior before the user types anything.

`careerStage` defaults to `"intermediate"`.

### Prompt serialization (`profileToPromptBlock(p)`)

Used by **every** generator that needs a human-readable profile block in the LLM user message. Format:

```text
Bio: …
Niche: …
Tech stack: …
Current work: …
Goals on X: …
Target audience: …
Career stage: …
Core personality: …
Tone: …
Words to use: …
Words to avoid: …
```

Empty strings render as `(empty)` for that line.

---

## 5. UI behavior (`ProfileClient`)

Renders inside `StudioPage` with eyebrow **“Voice system”**, title **“Profile”**, and metrics describing one shared profile across generators.

### Loading and errors

- **`loadError`:** destructive `Alert` (“Could not load profile”) from SWR/`fetchProfileApi` failure.
- **`loadingInitial`:** spinner + “Loading profile…” while SWR `isLoading` and no `loadError`.

### Form visibility (`useProfileForm.canShowForm`)

`canShowForm = !loading || loadError !== null`

- After successful load (`loading` false), form shows.
- If load errors, form still shows so the user is not stuck on a blank screen (note: local state may still match defaults until `data` arrives; see hook section).

### Card: Creator identity

Textareas (via helper `field()`): `bio`, `niche`, `techStack`, `currentWork`, `goals`, `targetAudience`.

**Career stage:** `Select` bound to `p.careerStage`, updates via `update({ careerStage })`.

### Card: Voice

Textareas: `corePersonality`, `toneNotes`, `wordsUse`, `wordsAvoid`.

**Button:** “Analyze profile (AI)” → `analyze()` → `POST /api/profile/analyze` with current profile (`profileRef.current` in the hook so the latest edits are sent even mid-typing).

Errors: `analyzeError` or `saveError` in one destructive `Alert` under the Voice card.

### Card: AI feedback (conditional)

Shown when `analysis` is non-null after a successful analyze. Displays:

- `alignmentScore` as badge `X/100`
- `summary` paragraph
- `topicLeverageMap.doubleDown`, `.explore`, `.drop` as bullet lists
- `voiceAuthorityZones`
- `strategicBlindSpots`

**Type:** `ProfileAnalysis` in `lib/types/profile.ts` (must match what `/api/profile/analyze` returns).

---

## 6. Client logic (`useProfileForm`)

### Hydration from SWR

`useLoadedProfile()` provides `{ data, loading, error: loadError, mutate }`.

When `data !== undefined`, `useEffect` sets local `profile` state to `data` (merged path: server always returns full `CreatorProfile` from GET).

### Updates (`update(patch)`)

Merges `Partial<CreatorProfile>` into local state. Each update bumps `saveRequestedVersionRef` to coordinate debounced saves.

### Autosave (debounced 700 ms)

`useEffect` depends on `[mutate, profile]`.

- If `saveRequestedVersionRef !== saveCompletedVersionRef`, schedules `setTimeout(..., 700)`.
- On fire: `putProfileApi(profile)` → `PUT /api/profile` with full JSON body (entire `CreatorProfile`, not a patch).
- Success: updates `saveCompletedVersionRef`, clears `saveError`, calls `mutate(profile, { revalidate: false })` so SWR cache matches local edits without refetching.
- Failure: sets `saveError` message.

Cleanup clears the timeout on dependency change (standard debounce reset).

### Analyze

- `analyzeFn` POSTs `{ profile: profileRef.current }` — **ref** ensures the latest profile is analyzed even if React state batching lags.
- Uses `useAsyncAction`; exposes `analyzing`, `analyzeError`, `analysis` (last successful result data).

**Note:** Analysis result is **only in client memory** until the user edits something that triggers autosave; it is **not** a separate persisted entity. If you need persisted “last analysis,” that would be a new feature.

---

## 7. Global profile loading (`useLoadedProfile` + studio bootstrap)

### SWR key

`PROFILE_SWR_KEY` is the string `"/api/profile"` — same URL the fetcher calls. This matches `StudioSWRProvider` fallback key exactly.

### Fetcher

`fetchProfileApi` → `GET /api/profile` → expects `{ profile: CreatorProfile }`.

### Studio layout (`app/(studio)/layout.tsx`)

1. Server: `initialProfile = await getStudioInitialProfile()` (`lib/server/studio-profile.ts`).
2. Client: `<StudioSWRProvider initialProfile={initialProfile}>` wraps `StudioShell`.

`getStudioInitialProfile()`:

- If **no** `DATABASE_URL`: returns `defaultCreatorProfile()`.
- Else: `getProfileForUser(getPlaceholderUserId())`; on error returns `defaultCreatorProfile()`.

`StudioSWRProvider` sets SWR `dedupingInterval: 60_000`, `revalidateOnFocus: false`, and **`fallback[PROFILE_SWR_KEY] = initialProfile`** so the first client render has data without a duplicate GET (SWR will still reconcile with the fetcher as configured).

### `useLoadedProfile` options

`revalidateOnFocus: false` — avoids refetching profile on every tab focus.

---

## 8. API routes

### `GET /api/profile` — `app/api/profile/route.ts`

- If DB unavailable (`databaseUnavailableResponse()`): **503** + `SAVE_UNAVAILABLE`-style payload from shared helper.
- Else: `getProfileForUser(getPlaceholderUserId())` → `{ profile }` (always a full `CreatorProfile`, merged with defaults in DB layer).

### `PUT /api/profile` — same file

- If DB unavailable: **503**.
- Body: parsed as JSON object merged into **`defaultCreatorProfile()`** (same as other routes — unknown keys are dropped by spread typing, missing keys filled from defaults).
- `upsertProfileForUser(userId, merged)` → returns `{ profile: merged }`.

**Important:** PUT expects the **entire** profile object shape; the client sends the full `CreatorProfile` from `putProfileApi(profile)`.

### `POST /api/profile/analyze` — `app/api/profile/analyze/route.ts`

- No DB required — only needs **`GEMINI_API_KEY`** (else 503 `AI_UNAVAILABLE`).
- Body: `{ profile: CreatorProfile }` — must be a real object.
- **System prompt** (inline in route):

```text
${STUDIO_VOICE_PREAMBLE}

You analyze X creator profiles for growth alignment. Output ONLY valid JSON matching this shape:
{
  "alignmentScore": number (0-100),
  "topicLeverageMap": { "doubleDown": string[], "explore": string[], "drop": string[] },
  "voiceAuthorityZones": string[],
  "strategicBlindSpots": string[],
  "summary": string (actionable next steps, short paragraphs ok in string)
}
```

- **User prompt:** `Profile to analyze:\n\n${profileToPromptBlock(profile)}`
- `jsonMode: true`, `parseJsonSafe<ProfileAnalysis>`
- If `alignmentScore` not a number: **502** with truncated raw response for debugging.

**Shared prompt fragment:** only `STUDIO_VOICE_PREAMBLE` from `lib/prompts/studio-voice.ts` — **not** `X_PLATFORM_RULES` (analysis is meta JSON, not tweet text).

---

## 9. Database (`Profile` model)

From `prisma/schema.prisma`:

```prisma
model Profile {
  userId    String   @id
  data      Json
  updatedAt DateTime @updatedAt
}
```

- One row per **`userId`** (placeholder dev user from `getPlaceholderUserId()`).
- `data` stores the full **`CreatorProfile`** JSON.

### `lib/db/profile.ts`

| Function | Behavior |
|----------|----------|
| `getProfileForUser(userId)` | `findUnique`; if missing or no `data`, return `defaultCreatorProfile()`; else merge defaults with stored partial |
| `upsertProfileForUser(userId, profile)` | `upsert` create/update `data` as JSON object |

---

## 10. Operational edge cases

| Scenario | Behavior |
|----------|----------|
| No `DATABASE_URL` | `GET/PUT /api/profile` return **503**. SSR initial profile is **defaults**. `fetchProfileApi` throws → SWR `loadError`. Form can still show after load attempt; saves keep failing until DB exists. |
| No `GEMINI_API_KEY` | Analyze returns **503** `AI_UNAVAILABLE`. |
| First visit, empty DB | GET returns merged defaults; user sees empty identity fields but non-empty voice defaults. |
| Multi-user | Not implemented — single placeholder user id everywhere. |

---

## 11. Packages / libraries involved

| Package / area | Usage on profile |
|----------------|------------------|
| `swr` | `useLoadedProfile`, `mutate` after save |
| `next` | App Router page, layout, server `getStudioInitialProfile` |
| `react` | Client components, hooks |
| `@prisma/client` | Profile persistence |
| `@google/generative-ai` (via `lib/gemini.ts`) | Analyze route only |
| UI (`components/ui/*`) | Alerts, cards, fields, select, spinner, button, separator, badge |
| `lucide-react` | (indirect via Spinner/icons if any in shared components) |

---

## 12. Prompt checklist (profile-specific)

| # | Name | Location | Sent to Gemini? |
|---|------|----------|-------------------|
| 1 | `STUDIO_VOICE_PREAMBLE` | `lib/prompts/studio-voice.ts` | Yes — prepended to analyze **system** |
| 2 | Growth analysis system instructions + JSON schema | Inline `app/api/profile/analyze/route.ts` | Yes |
| 3 | `profileToPromptBlock(profile)` | `lib/types/profile.ts` | Yes — analyze **user** prompt body |

There is **no** separate `lib/prompts/profile-prompts.ts`; analyze prompts live entirely in the route file.

---

## 13. How other features consume profile (summary)

- **Client:** `useLoadedProfile()` anywhere in studio under `StudioSWRProvider`.
- **Server API routes:** Request body often includes `profile?: Partial<CreatorProfile>` merged with `defaultCreatorProfile()`.
- **Prompt text:** `profileToPromptBlock(profile)` in user prompts for compose, articles, etc.

Changing `CreatorProfile` shape requires:

1. `lib/types/profile.ts` + `defaultCreatorProfile` + `profileToPromptBlock`
2. `ProfileClient` fields
3. Any API Zod/manual validation if added later
4. Prisma JSON compatibility (existing rows may need migration scripts in production)

---

## 14. Read order for new engineers

1. `lib/types/profile.ts` — data contract + prompt block
2. `hooks/use-loaded-profile.ts` + `lib/constants/profile-swr.ts` + `components/studio-swr-provider.tsx`
3. `hooks/use-profile-form.ts` — autosave + analyze
4. `app/profile/profile-client.tsx` — UX
5. `app/api/profile/route.ts` + `app/api/profile/analyze/route.ts`
6. `lib/db/profile.ts` + `prisma/schema.prisma`
