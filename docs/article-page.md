# Articles page - complete reference

This document is the handoff spec for everything related to the Articles page and article-generation workflow in this repo: routes, UI, state, APIs, database, rendering, packages, and prompts (structure, templates, and a reusable list).

> Runtime note (current): Article flow is now implemented with working list/new/detail/edit routes, CRUD + generation APIs, and image preset copy workflows. Some sections below still describe earlier aspirational architecture (for example `miko-rules`/`x-rules` composition and `react-markdown` pipeline). Treat the shipped source files as truth:
> - Routes: `app/studio/articles/*`
> - Clients: `app/articles/*`
> - Hook: `hooks/use-article-page.ts`
> - Presets: `lib/prompts/article-image-preset.ts`
> - Prompt builders: `lib/prompts/article-prompts.ts`
> - Markdown preview: `components/article-markdown-preview*.tsx`

---

## 1. What “Articles” is in this product

Articles are **long-form X (Twitter) Article drafts**: a feed **card** (working title + multi-line preview hook) plus a **Markdown body**. The app also helps with **hero image prompts** (preset templates + optional Gemini-generated prompts) for use in **external** image tools.

Nothing in this flow auto-posts to X. Export is **manual copy** of assembled Markdown.

---

## 2. Routes and how pages link together

| URL | Server page file | What it does | Links to |
|-----|------------------|--------------|----------|
| `/studio/articles` | `app/(studio)/studio/articles/page.tsx` | Lists saved articles (SSR when DB configured) | Each row → `/studio/articles/[id]`; CTA → `/studio/articles/new` |
| `/studio/articles/new` | `app/(studio)/studio/articles/new/page.tsx` | New article **journey** (wizard) | After save (client) → `/studio/articles/[id]` |
| `/studio/articles/[id]` | `app/(studio)/studio/articles/[id]/page.tsx` | Read-only **detail** + preview + “Copy for X” | **Edit** → `/studio/articles/[id]/edit`; back → `/studio/articles` |
| `/studio/articles/[id]/edit` | `app/(studio)/studio/articles/[id]/edit/page.tsx` | Same wizard as new, **hydrated** from DB | Save → `/studio/articles/[id]` |

**Legacy redirect:** `/articles` → `/studio/articles` (`next.config.ts`).

**Marketing / studio:** Articles live only under `/studio/articles/*` (studio shell). Profile is linked from the wizard copy and `ProfileSetupBanner` when niche/bio empty.

---

## 3. File map (everything Articles touches)

### Routes (App Router)

- `app/(studio)/studio/articles/page.tsx` — list SSR
- `app/(studio)/studio/articles/new/page.tsx` — mounts journey client
- `app/(studio)/studio/articles/[id]/page.tsx` — detail SSR
- `app/(studio)/studio/articles/[id]/edit/page.tsx` — edit SSR + journey

### Client UI

- `app/articles/articles-list-client.tsx` — list UI, links to detail/new
- `app/articles/articles-journey-client.tsx` — wraps wizard; hydrate on edit; save → navigate
- `app/articles/_components/article-journey-wizard.tsx` — 5-tab wizard (intent → card → body → images → save)
- `app/articles/_components/article-journey-images-tab.tsx` — slots, presets, AI image prompts (code-split)
- `app/articles/article-detail-client.tsx` — saved article view, copy export

### State and types

- `hooks/use-article-page.ts` — all client state, API calls, serialize/hydrate/save
- `lib/types/article-draft.ts` — `ArticleOutlineSection`, `ArticleWizardStep`, `GeneratedImagePrompt`, `ImageSlotBundle`
- `lib/types/saved-article.ts` — `SavedArticleData`, `normalizeSavedArticleData`, `buildXArticleMarkdown`, `deriveArticleListTitle`

### API (Route Handlers)

- `app/api/articles/route.ts` — `GET` list, `POST` create
- `app/api/articles/[id]/route.ts` — `GET` one, `PUT` update
- `app/api/articles/plan/route.ts` — Gemini: plan JSON
- `app/api/articles/expand/route.ts` — Gemini: body Markdown (JSON wrapper)
- `app/api/articles/image-slots/route.ts` — Gemini: tension/mood/metaphor/composition JSON
- `app/api/articles/image-prompts/route.ts` — Gemini: 3–5 image prompts JSON

### DB

- `prisma/schema.prisma` — `Article` model
- `lib/db/articles.ts` — Prisma queries
- `lib/prisma.ts` — Prisma client singleton
- `lib/api/db-config.ts` — `isDatabaseConfigured()`, `databaseUnavailableResponse()` (503 when no `DATABASE_URL`)
- `lib/constants/dev-user.ts` — `getPlaceholderUserId()` (single-tenant placeholder user)

### AI / prompts

- `lib/prompts/article-prompts.ts` — all Gemini system/user builders for articles
- `lib/prompts/miko-rules.ts`, `lib/prompts/x-rules.ts` — prepended to article system prompts
- `lib/gemini.ts` — `generateWithGemini`, `parseJsonSafe`, API key check
- `lib/extract-article-markdown.ts` — tolerates JSON / fences / raw MD from expand

### Markdown preview

- `components/article-markdown-preview.tsx` — empty-state + dynamic inner
- `components/article-markdown-preview-inner.tsx` — `react-markdown` + plugins

### Non-Gemini image templates

- `lib/prompts/article-image-presets.ts` — 10 preset templates + aspect lines + `interpolateArticleImagePrompt`

---

## 4. User-facing features (wizard steps)

Wizard steps (`ArticleWizardStep` in `lib/types/article-draft.ts`): `"intent"` | `"card"` | `"body"` | `"images"` | `"save"`.

### Step: Intent (`article-journey-wizard.tsx` → Intent tab)

- Fields: **topic** (required for plan), optional **audience**, **tone**, **reader promise**
- Checkbox: **Allow wellness / health-style claims** → maps to `ArticleIntent.wellnessClaimsAllowed`; when `false`, plan user prompt adds a constraint string (see `buildArticlePlanUser` in `lib/prompts/article-prompts.ts`)
- Action: **Generate article plan** → `POST /api/articles/plan` via `useArticlePage.runPlan`
- Requires loaded **profile** (`useLoadedProfile`); shows `ProfileSetupBanner` if niche and bio both empty (`articles-journey-client.tsx`)

On success, wizard moves to **card**, clears body/image prompts, resets slot backups.

### Step: Card

- Editable **working title**, **preview hook** (feed card subtitle), **outline** sections (`id`, `title`, `beats`)
- Title variants from plan shown as “Use as working title”
- Add/remove outline sections client-side only
- Action: **Generate article body (Markdown)** → `POST /api/articles/expand` via `runExpand`
- On success → **body** step with `bodyMarkdown` set

### Step: Body

- **Monospace textarea** for full Markdown edit
- **Preview** pane: same `bodyMarkdown` through `ArticleMarkdownPreview`
- Mobile: toggle edit vs preview; desktop: side-by-side

### Step: Images (`article-journey-images-tab.tsx`)

- **Aspect ratio** selector (`imageAspectRatioId`, default `"5_2"`) — appended when copying prompts (`appendAspectToImagePrompt`)
- **Suggest slots with AI** → `POST /api/articles/image-slots` — fills tension, mood, metaphor, composition
- **Restore my previous values** / **Use last AI fills again** — uses `slotsBackupBeforeAi` and `aiSuggestedSlots` from hook
- **Show templates with `{{placeholders}}`** — toggles `allPresetsForDisplay(..., usePlaceholdersOnly)`
- **Built-in presets** — 10 templates from `IMAGE_PROMPT_PRESETS`; each copy appends aspect line
- **Generate prompts from article (3–5)** → `POST /api/articles/image-prompts` — Gemini; results stored in `generatedImagePrompts` with `source: "generated"`

### Step: Save

- **Save to workspace** / sticky footer **Save article** → `useArticlePage.runSave`
- First save: `POST /api/articles` with `{ data: SavedArticleData }` → returns `{ id }` → client sets `savedArticleId`
- Updates: `PUT /api/articles/:id` with `{ data }`
- `ArticlesJourneyClient.onSaveArticle` navigates to `/studio/articles/${id}`

### Detail page (`article-detail-client.tsx`)

- Shows preview hook as blockquote, body via `ArticleMarkdownPreview`
- **Copy for X** — `buildXArticleMarkdown({ workingTitle, previewHook, bodyMarkdown })` then clipboard
- **Edit article** → `/studio/articles/[id]/edit`

---

## 5. Client state machine (`hooks/use-article-page.ts`)

Single hook owns:

- Intent fields, plan outputs (`workingTitle`, `titleVariants`, `previewHook`, `outline`)
- `bodyMarkdown`
- Image slots + `imageAspectRatioId` + backups + AI suggested slots
- `generatedImagePrompts`
- `wizardStep` (persisted in `SavedArticleData`)
- `savedArticleId` (null until first successful POST save)

**Profile:** `useLoadedProfile()` — plan/expand require `profile` payload in JSON body.

**Persistence shape:** `serializeForSave()` builds `SavedArticleData` matching `lib/types/saved-article.ts`. **Edit flow:** `hydrateFromSaved({ id, data })` runs `normalizeSavedArticleData` then sets all state + `savedArticleId`.

---

## 6. How data is saved (database)

### Schema (`prisma/schema.prisma`)

```prisma
model Article {
  id        String   @id @default(cuid())
  userId    String
  title     String
  data      Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([userId, updatedAt(sort: Desc)])
}
```

- **`title`:** derived on every create/update via `deriveArticleListTitle(data)` — `workingTitle` or `topic` or `"Untitled article"` (`lib/db/articles.ts`).
- **`data`:** full `SavedArticleData` JSON (wizard snapshot).

### When DB is optional

- `lib/api/db-config.ts`: if `DATABASE_URL` is missing, article **API** routes return **503** with `SAVE_UNAVAILABLE` (from `lib/api/user-facing-errors.ts`).
- List/detail **pages** still render: list gets `initialArticles = []` and may show error from catch; detail/edit set `initialError` / `initialLoadError` to `"Database is not configured"` when no DB.

### API → DB flow

| Operation | Route | DB function |
|-----------|-------|-------------|
| List (JSON) | `GET /api/articles` | `listArticlesForUser` |
| Create | `POST /api/articles` | `createArticleForUser` — `prisma.article.create` |
| Get one | `GET /api/articles/[id]` | `getArticleForUser` — `findFirst` where `id` + `userId` |
| Update | `PUT /api/articles/[id]` | `updateArticleForUser` — `updateMany` where `id` + `userId`; updates `title` + `data` |

**User id:** always `getPlaceholderUserId()` — no real multi-user auth in this path.

**Normalization:** incoming `data` is always passed through `normalizeSavedArticleData` on POST/PUT/GET (API) so older JSON shapes stay compatible (e.g. legacy `wizardStep === "export"` mapped to `"save"`).

---

## 7. How articles are generated (AI pipeline)

All article Gemini calls go through `generateWithGemini` in `lib/gemini.ts`. Requires `GEMINI_API_KEY` (else 503 with `AI_UNAVAILABLE`).

### Plan — `POST /api/articles/plan`

- **Input:** `{ intent: ArticleIntent, profile?: Partial<MikoProfile> }`
- **Prompts:** `buildArticlePlanSystem()` + `buildArticlePlanUser(profile, intent)`
- **Output JSON shape:** `workingTitle`, `titleVariants[]`, `previewHook`, `outline[]`
- **Validation:** must have `workingTitle`, `previewHook`, non-empty `outline`; else 422

### Expand — `POST /api/articles/expand`

- **Input:** `intent`, `profile`, `workingTitle`, `previewHook`, `outline[]`
- **Prompts:** `buildArticleExpandSystem()` + `buildArticleExpandUser(...)`; `jsonMode: true`
- **Parse:** `extractMarkdownFromExpandRaw(raw)` — accepts `{ markdown }` JSON, fenced markdown, or heuristic raw MD
- **Retry:** if no markdown, second call with `buildArticleExpandRetrySystem()` + same user payload

### Image slots — `POST /api/articles/image-slots`

- **Input:** `topic`, optional `workingTitle`, `previewHook`, `articleMarkdown`
- **Prompts:** `buildArticleImageSlotsSystem()` + `buildArticleImageSlotsUser(...)` (markdown truncated at 8k in user payload)
- **Output:** `{ tension, mood, metaphor, composition }` — all four required or 422

### Image prompts from content — `POST /api/articles/image-prompts`

- **Input:** `workingTitle`, `previewHook`, `articleMarkdown`
- **Prompts:** `buildArticleImagePromptsFromContentSystem()` + `buildArticleImagePromptsFromContentUser(...)` (body truncated at 12k)
- **Output:** `{ prompts: [{ id, label, promptText }] }` cleaned; empty after filter → 422

**Note:** Image-prompts route does **not** send profile in the request body from the hook today — only title/hook/body. Slots route likewise sends topic/title/hook/body only. Plan and expand include **full profile** in the user prompt.

---

## 8. How articles are rendered (Markdown)

### Journey and detail

- `ArticleMarkdownPreview` loads `ArticleMarkdownPreviewInner` with `next/dynamic` and **`ssr: false`** so markdown libraries stay client-only.
- Empty markdown shows a short “Nothing to preview yet.” message.

### Inner renderer (`components/article-markdown-preview-inner.tsx`)

- **`react-markdown`** with:
  - **`remark-gfm`** — GitHub-flavored Markdown (tables, task lists, strikethrough, etc.)
  - **`rehype-sanitize`** with extended schema allowing `className` on `code` (for syntax class names if present)
- Styling: Tailwind **`@tailwindcss/typography`** `prose` / `prose-sm` / `dark:prose-invert` classes on a wrapper `div`

Expand prompt asks the model for `##` section headings aligned to outline order; preview reflects that as HTML via the markdown pipeline.

---

## 9. Export “Copy for X” (`lib/types/saved-article.ts`)

`buildXArticleMarkdown`:

1. `# {workingTitle}\n\n`
2. If `previewHook` non-empty: blockquote lines — each line prefixed with `> `
3. Append raw `bodyMarkdown`

That string is what users paste into X long-form / external tooling.

---

## 10. Packages used by Articles (directly or transitively)

From `package.json`, the pieces most relevant to this feature:

| Package | Role in Articles |
|---------|------------------|
| `next` | App Router pages, Route Handlers, `dynamic`, `Link`, `useRouter` |
| `react`, `react-dom` | All client components |
| `@prisma/client`, `prisma` | `Article` persistence |
| `@google/generative-ai` (via `lib/gemini.ts`) | Plan, expand, image slots, image prompts |
| `react-markdown` | Body preview rendering |
| `remark-gfm` | GFM markdown features in preview |
| `rehype-sanitize` | Safe HTML output from markdown |
| `@tailwindcss/typography` | `prose` styling for preview |
| `swr` / profile loading | Profile required for plan/expand (`useLoadedProfile`) |
| `lucide-react` | Icons in list/wizard/images |
| UI primitives (`components/ui/*`, Radix/shadcn stack) | Tabs, cards, accordion, buttons, alerts, etc. |

---

## 11. Prompt structure (template pattern)

Every article **Gemini** system prompt in `lib/prompts/article-prompts.ts` follows the same **composition**:

```text
[COMBINED_MIKO_BLOG_PREAMBLE]

[X_PLATFORM_RULES]

[Task-specific instructions + JSON schema / output rules]
```

**User** prompts follow:

```text
[profileToPromptBlock(profile)]   // plan + expand only

[Structured sections: Article intent / Card / Outline / Article excerpt]
```

Shared imports:

- `COMBINED_MIKO_BLOG_PREAMBLE` from `lib/prompts/miko-rules.ts`
- `X_PLATFORM_RULES` from `lib/prompts/x-rules.ts`
- `profileToPromptBlock` from `lib/types/profile.ts`

---

## 12. All prompts — Articles-only checklist (copy/paste list)

Use this as the master list when changing or auditing prompts.

### Shared fragments (prepended inside article system prompts)

1. **`COMBINED_MIKO_BLOG_PREAMBLE`** — `lib/prompts/miko-rules.ts`
2. **`X_PLATFORM_RULES`** — `lib/prompts/x-rules.ts`

### `lib/prompts/article-prompts.ts` (Gemini)

| # | Function | Role | Paired user builder |
|---|----------|------|----------------------|
| 3 | `buildArticlePlanSystem()` | JSON: title, variants, hook, outline | `buildArticlePlanUser(profile, intent)` |
| 4 | `buildArticleExpandSystem()` | JSON: single key `markdown` | `buildArticleExpandUser({ profile, intent, workingTitle, previewHook, outlineJson })` |
| 5 | `buildArticleExpandRetrySystem()` | Repair invalid expand JSON | *(same user as expand, second call)* |
| 6 | `buildArticleImagePromptsFromContentSystem()` | JSON: 3–5 `{id,label,promptText}` | `buildArticleImagePromptsFromContentUser({ workingTitle, previewHook, articleMarkdown })` |
| 7 | `buildArticleImageSlotsSystem()` | JSON: `tension`, `mood`, `metaphor`, `composition` | `buildArticleImageSlotsUser({ topic, workingTitle, previewHook?, articleMarkdown? })` |

### `lib/prompts/article-image-presets.ts` (not sent to Gemini; copy/paste for Midjourney etc.)

| # | ID | Label (short) |
|---|-----|----------------|
| 8 | `etching_baseline` | Etching / woodcut (baseline) |
| 9 | `split_tension` | Split tension (before/after) |
| 10 | `curiosity_gap` | Curiosity gap |
| 11 | `scale_awe` | Scale & awe |
| 12 | `cinematic_operator` | Cinematic operator |
| 13 | `contrarian_collision` | Contrarian collision |
| 14 | `signal_noise` | Signal vs noise |
| 15 | `social_energy` | Social energy |
| 16 | `urgency_motion` | Urgency & motion |
| 17 | `poster_thumb` | Poster (thumbnail legibility) |

Each preset template uses slots: `{{topic}}`, `{{tension}}`, `{{metaphor}}`, `{{mood}}`, `{{composition_hint}}` (interpolated by `interpolateArticleImagePrompt`).

### Aspect lines appended on copy (`IMAGE_ASPECT_OPTIONS`)

- `5_2`, `16_9`, `3_2`, `1_1`, `4_5`, `none` — each has a `promptLine` appended via `appendAspectToImagePrompt`.

---

## 13. JSON / API contracts (quick reference)

### `POST /api/articles/plan`

- **Body:** `{ intent: { topic, audience?, tone?, promise?, wellnessClaimsAllowed? }, profile? }`
- **200:** `{ workingTitle, titleVariants, previewHook, outline }`

### `POST /api/articles/expand`

- **Body:** `{ intent, profile?, workingTitle, previewHook, outline }`
- **200:** `{ markdown }`

### `POST /api/articles/image-slots`

- **Body:** `{ topic, workingTitle?, previewHook?, articleMarkdown? }`
- **200:** `{ tension, mood, metaphor, composition }`

### `POST /api/articles/image-prompts`

- **Body:** `{ workingTitle, previewHook, articleMarkdown }`
- **200:** `{ prompts: [...], source: "generated" }`

### `POST /api/articles` / `PUT /api/articles/[id]`

- **Body:** `{ data: SavedArticleData }`
- **POST 200:** `{ id }`
- **PUT 200:** `{ ok: true }`

### `SavedArticleData` fields (`lib/types/saved-article.ts`)

`topic`, `audience`, `tone`, `promise`, `wellnessClaimsAllowed`, `workingTitle`, `titleVariants`, `previewHook`, `outline`, `bodyMarkdown`, image slot fields, `imageAspectRatioId`, `generatedImagePrompts`, `slotsBackupBeforeAi`, `aiSuggestedSlots`, `wizardStep`.

---

## 14. Operational notes for the next engineer

1. **Profile quality** strongly affects plan/expand; image routes currently omit profile in the HTTP body (only plan/expand send it).
2. **DB off:** generation tabs can still work for in-memory drafting if you only hit Gemini routes, but **save/list/detail** need `DATABASE_URL`.
3. **Security / multi-tenant:** all rows scoped by placeholder `userId` — treat as single-user dev until real auth exists.
4. **Large markdown:** expand uses JSON string for markdown; image routes truncate input for token safety.

---

## 15. Source index (read in this order)

1. `hooks/use-article-page.ts` — behavior source of truth
2. `lib/types/saved-article.ts` — persistence contract
3. `app/articles/_components/article-journey-wizard.tsx` — UX steps
4. `app/api/articles/**/*.ts` — server contracts
5. `lib/prompts/article-prompts.ts` + `article-image-presets.ts` — all text templates
