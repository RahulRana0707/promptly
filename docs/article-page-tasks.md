# Article page - simple implementation tasks

Small, linear steps to ship the Article journey under `/studio/articles` from current placeholder or partial implementations.

Use the same conventions as Daily Plan tasks:

- explicit server/API boundaries
- no hidden magic
- clear verify commands after each phase

**Conventions:** `[ ]` todo · `[-]` doing · `[x]` done · Route family: **`/studio/articles`**.

---

## Phase 0 - Baseline + naming alignment

- [x] **0.1** Confirm article baseline and source of truth
  - **Do:** Treat `docs/article-page.md` as the reference and verify each referenced file/path exists before implementation.
  - **Verify:** add a one-line gap note in progress log (present vs missing).

- [x] **0.2** Lock naming and route conventions
  - **Do:** Keep route namespace at `/studio/articles/*` and ensure list/new/detail/edit pages align with App Router grouping used by studio.
  - **Verify:** `pnpm exec tsc --noEmit`.

---

## Phase 1 - Shared types + serialization contracts

- [x] **1.1** Add/confirm article draft types
  - **Do:** Add or validate `lib/types/article-draft.ts` for intent, outline section, wizard step, generated image prompt, and slot bundle.
  - **Verify:** no `any` leaks in article UI state or API request bodies.

- [x] **1.2** Add/confirm persisted article schema contract
  - **Do:** Add or validate `lib/types/saved-article.ts` with `SavedArticleData`, normalization helpers, and markdown export builder.
  - **Verify:** `normalizeSavedArticleData` safely handles partial or legacy payloads.

---

## Phase 2 - Database model + data helpers

- [x] **2.1** Add/confirm Prisma `Article` model
  - **Do:** Ensure schema includes `id`, `userId`, `title`, `data`, timestamps, and index on `[userId, updatedAt]`.
  - **Verify:** `pnpm db:migrate` and `pnpm db:studio`.

- [x] **2.2** Add `lib/db/articles.ts`
  - **Do:** Implement `listArticlesForUser`, `getArticleForUser`, `createArticleForUser`, `updateArticleForUser`, and title derivation from saved data.
  - **Verify:** local script/route roundtrip can create + fetch + update one article.

---

## Phase 3 - Core CRUD API routes

- [x] **3.1** Create/confirm `app/api/articles/route.ts`
  - **Do:** Implement `GET` list and `POST` create with `SavedArticleData` validation/normalization.
  - **Verify:** `curl /api/articles` and `curl -X POST /api/articles ...`.

- [x] **3.2** Create/confirm `app/api/articles/[id]/route.ts`
  - **Do:** Implement `GET` single + `PUT` update scoped by placeholder user id.
  - **Verify:** create -> update -> get reflects latest normalized data.

- [x] **3.3** Enforce DB availability guardrails
  - **Do:** Use `isDatabaseConfigured()` + `databaseUnavailableResponse()` for CRUD endpoints.
  - **Verify:** with no `DATABASE_URL`, CRUD routes return clear 503 responses.

---

## Phase 4 - Generation APIs (plan, body, image slots, image prompts)

- [x] **4.1** Add/confirm `POST /api/articles/plan`
  - **Do:** Build prompts from profile + intent and require valid JSON payload with `workingTitle`, `titleVariants`, `previewHook`, `outline`.
  - **Verify:** invalid model output returns clear 422/502.

- [x] **4.2** Add/confirm `POST /api/articles/expand`
  - **Do:** Generate markdown body from intent/card/outline with JSON-mode and retry repair path when parsing fails.
  - **Verify:** response always resolves to `{ markdown }` on happy path.

- [x] **4.3** Add/confirm `POST /api/articles/image-slots`
  - **Do:** Generate `tension`, `mood`, `metaphor`, `composition` from topic/title/hook/body.
  - **Verify:** missing required slot fields fail with actionable error.

- [x] **4.4** Add/confirm `POST /api/articles/image-prompts`
  - **Do:** Generate 3-5 cleaned prompts (`id`, `label`, `promptText`) from article content.
  - **Verify:** empty/invalid prompt arrays fail with 422.

---

## Phase 5 - Client fetch + state orchestration

- [x] **5.1** Add `lib/fetch/articles.ts` (or confirm existing wrappers)
  - **Do:** Centralize typed fetch calls for list, detail, save, and generation endpoints.
  - **Verify:** each wrapper throws normalized API errors.

- [x] **5.2** Add/confirm `hooks/use-article-page.ts`
  - **Do:** Own intent/card/body/images/save state, profile dependency, generation actions, save/hydrate/serialize lifecycle.
  - **Verify:** step transitions remain deterministic after failures/retries.

- [x] **5.3** Wire edit hydration + save routing
  - **Do:** Hydrate from `SavedArticleData` in edit mode and keep `savedArticleId` in sync across create/update flows.
  - **Verify:** editing existing article preserves previous fields and returns to detail page after save.

---

## Phase 6 - Route pages and journey UI

- [x] **6.1** Build list page and list client
  - **Do:** Implement `/studio/articles` SSR page + client list view with links to detail/new.
  - **Verify:** empty and populated states render correctly.

- [x] **6.2** Build new + edit journey wrapper
  - **Do:** Implement `/studio/articles/new` and `/studio/articles/[id]/edit` pages around shared journey client/wizard.
  - **Verify:** same wizard supports both create and edit without divergence.

- [x] **6.3** Build detail page and export UX
  - **Do:** Implement `/studio/articles/[id]` with hook preview, markdown preview, and "Copy for X".
  - **Verify:** copied content matches `buildXArticleMarkdown(...)`.

---

## Phase 7 - Image preset integration (required)

- [x] **7.1** Integrate built-in presets from `lib/prompts/article-image-preset.ts`
  - **Do:** Render preset list (id, label, description), interpolate placeholders, and support one-click copy.
  - **Verify:** copied preset prompt resolves with current slot values.

- [x] **7.2** Add aspect ratio append behavior
  - **Do:** Support selected aspect ratio line append on copy for both preset prompts and generated prompts.
  - **Verify:** copied prompt includes aspect line exactly once.

- [x] **7.3** Add backup/restore around AI slot suggestion
  - **Do:** Preserve manual slot values before AI fill and allow restore/rehydrate from last AI suggestion.
  - **Verify:** restore actions are lossless across repeated AI fills.

---

## Phase 8 - Markdown preview, reliability, and polish

- [x] **8.1** Add markdown preview renderer
  - **Do:** Use dynamic client-only markdown preview component with safe rendering and prose styling.
  - **Verify:** long article markdown renders consistently on journey + detail pages.

- [x] **8.2** Improve loading and error UX
  - **Do:** Add explicit loading/error states for each async action (plan, expand, image slots, image prompts, save).
  - **Verify:** no silent failures; CTA labels reflect in-flight state.

- [x] **8.3** Add profile-readiness hint
  - **Do:** Show profile setup prompt when niche+bio are missing before generation-heavy steps.
  - **Verify:** hint appears/disappears based on loaded profile.

---

## Phase 9 - Docs and cleanup

- [x] **9.1** Update `docs/project-brain/routes.md`
  - **Do:** Ensure all article routes and API endpoints match shipped behavior.

- [x] **9.2** Keep `docs/article-page.md` in sync with implementation
  - **Do:** adjust any path or contract drift discovered while shipping.

- [x] **9.3** Maintain progress log in this task file
  - **Do:** append one DONE line per completed phase chunk.

---

## Progress log

`YYYY-MM-DD | ArticlePage | <id> | DONE | <one line>`

- `2026-04-26 | ArticlePage | INIT | DONE | Created phased task checklist at docs/article-page-tasks.md from docs/article-page.md and aligned with the Daily Plan task structure.`
- `2026-04-26 | ArticlePage | 0.1 | DONE | Baseline gap audit: only placeholder pages exist at /studio/articles and /studio/articles/new; referenced article API/state/types/db files are not yet present in the workspace.`
- `2026-04-26 | ArticlePage | 0.2 | DONE | Route namespace is aligned to /studio/articles/* and baseline naming is locked; TypeScript check passes (pnpm exec tsc --noEmit).`
- `2026-04-26 | ArticlePage | 1.1 | DONE | Added shared article draft contracts in lib/types/article-draft.ts (intent, outline, wizard step, image slots, generated prompts).`
- `2026-04-26 | ArticlePage | 1.2 | DONE | Added lib/types/saved-article.ts with SavedArticleData normalization, legacy step mapping, title derivation, and X markdown export builder.`
- `2026-04-26 | ArticlePage | 2.1 | DONE | Confirmed prisma/schema.prisma already includes Article model with expected fields and userId+updatedAt index.`
- `2026-04-26 | ArticlePage | 2.2 | DONE | Added lib/db/articles.ts with list/get/create/update helpers plus normalized data + derived title behavior.`
- `2026-04-26 | ArticlePage | 3.1 | DONE | Added app/api/articles/route.ts with GET list + POST create using normalized SavedArticleData.`
- `2026-04-26 | ArticlePage | 3.2 | DONE | Added app/api/articles/[id]/route.ts with GET single + PUT update scoped to placeholder user id.`
- `2026-04-26 | ArticlePage | 3.3 | DONE | Added SAVE_UNAVAILABLE 503 guard behavior for article CRUD routes when DB access fails/unavailable.`
- `2026-04-26 | ArticlePage | 4.1 | DONE | Added app/api/articles/plan/route.ts plus prompt builders in lib/prompts/article-prompts.ts with strict JSON contract validation.`
- `2026-04-26 | ArticlePage | 4.2 | DONE | Added app/api/articles/expand/route.ts with markdown extraction helper and retry repair pass via buildArticleExpandRetrySystem().`
- `2026-04-26 | ArticlePage | 4.3 | DONE | Added app/api/articles/image-slots/route.ts with required-slot validation for tension/mood/metaphor/composition.`
- `2026-04-26 | ArticlePage | 4.4 | DONE | Added app/api/articles/image-prompts/route.ts returning 3-5 cleaned prompts with source=generated.`
- `2026-04-26 | ArticlePage | 5.1 | DONE | Added lib/fetch/articles.ts with typed wrappers for article CRUD and generation endpoints plus shared error parsing.`
- `2026-04-26 | ArticlePage | 5.2 | DONE | Added hooks/use-article-page.ts to centralize journey state, async action lifecycles, and serialization helpers.`
- `2026-04-26 | ArticlePage | 5.3 | DONE | Hook now supports hydrateFromSaved(), savedArticleId create/update logic, and runSave() contract for edit/create flows.`
- `2026-04-26 | ArticlePage | 6.1 | DONE | Replaced /studio/articles placeholder with SSR list page and app/articles/articles-list-client.tsx for saved article navigation.`
- `2026-04-26 | ArticlePage | 6.2 | DONE | Added shared journey UI (app/articles/articles-journey-client.tsx + wizard) and wired /studio/articles/new + /studio/articles/[id]/edit routes.`
- `2026-04-26 | ArticlePage | 6.3 | DONE | Added /studio/articles/[id] detail page and app/articles/article-detail-client.tsx with preview + copy/export + edit link flow.`
- `2026-04-26 | ArticlePage | 7.1 | DONE | Integrated built-in presets in article-journey-images-tab using IMAGE_PROMPT_PRESETS and interpolateArticleImagePrompt().`
- `2026-04-26 | ArticlePage | 7.2 | DONE | Added IMAGE_ASPECT_OPTIONS + appendAspectToImagePrompt() and applied aspect appends to both preset and generated prompt copy actions.`
- `2026-04-26 | ArticlePage | 7.3 | DONE | Wired slot backup/restore controls around AI slot suggestion via slotsBackupBeforeAi and aiSuggestedSlots in useArticlePage().`
- `2026-04-26 | ArticlePage | 8.1 | DONE | Added dynamic client markdown preview components (components/article-markdown-preview.tsx + inner) used by body step and detail page.`
- `2026-04-26 | ArticlePage | 8.2 | DONE | Added explicit loading/error UI states across wizard async actions (plan/expand/slot/prompts/save) with action-specific button labels.`
- `2026-04-26 | ArticlePage | 8.3 | DONE | Added profile-readiness hint banner in ArticlesJourneyClient when both niche and bio are empty.`
- `2026-04-26 | ArticlePage | 9.1 | DONE | Verified docs/project-brain/routes.md already reflects /studio/articles list/new/detail/edit routes and article API ownership.`
- `2026-04-26 | ArticlePage | 9.2 | DONE | Updated docs/article-page.md runtime note to call out shipped source-of-truth paths and known architecture drift sections.`
- `2026-04-26 | ArticlePage | 9.3 | DONE | Completed checklist and appended phase completion lines in progress log.`

---

## Suggested order

**0 -> 1 -> 2 -> 3** establishes contracts and persistence.  
**4 -> 5 -> 6** ships generation + journey UX.  
**7 -> 8 -> 9** integrates image preset workflow, hardens behavior, and finalizes docs.
