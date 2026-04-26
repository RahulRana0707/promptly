# Profile page — simple implementation tasks

Small, linear steps. **No SWR**, **no autosave**: the user edits the form and clicks **Save** to persist. **`getPlaceholderUserId()`** = same id as the seeded row — use **`lib/constants/dev-user-id.ts`** (`DEV_USER_ID` / `getPlaceholderUserId`) everywhere (API + seed already aligned).

Full product context stays in [`docs/profile-page.md`](./profile-page.md); this file is only the **reduced** journey.

**Conventions:** `[ ]` todo · `[-]` doing · `[x]` done · Route: **`/studio/profile`**.

---

## Phase 1 — Shared id + types (no UI, no network)

- [x] **1.1** Confirm dev user id  
  - **Do:** Use `lib/constants/dev-user-id.ts` only. Seed already imports `DEV_USER_ID`; APIs will use `getPlaceholderUserId()`.  
  - **Verify:** `pnpm db:seed` still works.

- [x] **1.2** `lib/types/profile.ts`  
  - **Do:** `CareerStage`, `CreatorProfile`, `ProfileAnalysis`, `defaultCreatorProfile()`, `profileToPromptBlock()` per profile-page.md §4.  
  - **Verify:** `pnpm exec tsc --noEmit`.

---

## Phase 2 — Database helpers

- [x] **2.1** `lib/db/profile.ts`  
  - **Do:** `getProfileForUser(userId)`, `upsertProfileForUser(userId, profile)` using `lib/prisma.ts`; merge JSON with `defaultCreatorProfile()` on read.  
  - **Verify:** Call from a one-off script or route; row updates in Prisma Studio for `getPlaceholderUserId()`.

---

## Phase 3 — Profile API (GET + PUT only)

- [x] **3.1** `GET /api/profile` — `app/api/profile/route.ts`  
  - **Do:** Use `getPlaceholderUserId()` + `getProfileForUser`; DB missing / error → clear 503 JSON if you want parity with old app, else simple error. Return `{ profile }`.  
  - **Verify:** Browser or `curl` returns full `CreatorProfile` shape.

- [x] **3.2** `PUT /api/profile` — same file  
  - **Do:** Body JSON merged with `defaultCreatorProfile()`; `upsertProfileForUser`; return `{ profile }`.  
  - **Verify:** PUT then GET shows same data.

---

## Phase 4 — Load + form UI (client, explicit Save)

- [x] **4.1** Thin fetch helpers (optional but clear) — `lib/fetch/profile.ts`  
  - **Do:** `getProfile()` → `GET /api/profile`, `saveProfile(profile)` → `PUT /api/profile` with JSON body. Plain `fetch`, no extra libraries.  
  - **Verify:** Call from DevTools or temporary button.

- [x] **4.2** Profile page: **server loads once**  
  - **Do:** In `app/studio/profile/page.tsx`, server-side call `getProfileForUser(getPlaceholderUserId())` (or internal helper that does not duplicate merge logic), pass `initialProfile` into a client component as prop.  
  - **Verify:** First paint shows DB values after seed.

- [x] **4.3** Client form — `ProfileClient` (or `components/profile/...`)  
  - **Do:** `useState<CreatorProfile>(initialProfile)`; cards: Creator identity, Voice, optional AI feedback block (hidden until analysis exists); Career `Select`.  
  - **Verify:** Edits stay local until Save.

- [x] **4.4** **Save** button  
  - **Do:** On click: `saveProfile(profile)`; loading + success/error message (e.g. `Alert` or toast); on success set state from response or `router.refresh()` + simple pattern you prefer.  
  - **Verify:** Change a field → Save → reload page → value persisted.

- [x] **4.5** **Open Compose** link  
  - **Do:** Link from profile UI to `/studio/compose` (see profile-page.md §2).  
  - **Verify:** Nav works.

---

## Phase 5 — Analyze (optional second button)

- [x] **5.1** Prompt snippet — `lib/prompts/studio-voice.ts`  
  - **Do:** `STUDIO_VOICE_PREAMBLE` (or minimal string) for analyze system prompt per profile-page.md §12.

- [x] **5.2** `lib/gemini.ts` (or small inline in route first, extract later)  
  - **Do:** Read `GEMINI_API_KEY`; one function that returns JSON text for a given prompt.

- [x] **5.3** `POST /api/profile/analyze`  
  - **Do:** Body `{ profile }`; build prompts with `profileToPromptBlock`; parse `ProfileAnalysis`; no DB write.  
  - **Verify:** POST with real key returns JSON UI can render.

- [x] **5.4** **Analyze profile (AI)** button  
  - **Do:** POST current form state; show result in AI feedback card; show errors in same place as save errors.  
  - **Verify:** Analysis appears; refresh page → analysis gone unless you later choose to persist it (out of scope).

---

## Phase 6 — Docs only (when above is done)

- [ ] **6.1** Update `docs/project-brain/routes.md` with `/studio/profile` + API paths you shipped.  
- [ ] **6.2** One short note at top of `docs/profile-page.md`: “Runtime uses Save button + server initial load; old doc describes SWR/autosave — optional follow-up.”

---

## Progress log

`YYYY-MM-DD | Profile | <id> | DONE | <one line>`

- `2026-04-26 | Profile | 1.1–1.2 | DONE | Added lib/types/profile.ts (CreatorProfile, ProfileAnalysis, defaults, profileToPromptBlock); dev user id unchanged in lib/constants/dev-user-id.ts.`
- `2026-04-26 | Profile | rename + 2.1 | DONE | Profile type is CreatorProfile + defaultCreatorProfile(); docs + schema comment updated; added lib/db/profile.ts (getProfileForUser, upsertProfileForUser).`
- `2026-04-26 | Profile | 3.1–3.2 | DONE | GET/PUT /api/profile with creatorProfileFromJson merge; 503 SAVE_UNAVAILABLE on DB errors.`
- `2026-04-26 | Profile | 4.1–4.5 | DONE | lib/fetch/profile.ts; server-loaded /studio/profile + ProfileClient; Save + alerts; Open Compose link. Added shadcn card/textarea/alert/select/label.`
- `2026-04-26 | Profile | 5.1–5.4 | DONE | STUDIO_VOICE_PREAMBLE; lib/gemini.ts (REST JSON mode); POST /api/profile/analyze; analyzeProfile + AI feedback card + shared form banner.`

---

## Suggested order

**1 → 2 → 3 → 4** gets a working profile editor with Save. **5** adds AI when you are ready. **6** is cleanup.

No parallel “global cache” work — other studio pages can later `fetch("/api/profile")` or receive props when you add real auth.
