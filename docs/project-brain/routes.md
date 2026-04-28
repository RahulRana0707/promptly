# Routes and Page Ownership

This file maps all app routes, what each page renders, and which features they trigger.

## Public and Studio Routes

### `/`

- File: `app/(marketing)/page.tsx`
- Layout chain: `app/layout.tsx` -> `app/(marketing)/layout.tsx` -> page
- Purpose: marketing landing page and entry into studio workflows

### `/studio`

- File: `app/(studio)/studio/page.tsx`
- Behavior: redirects to `/studio/compose`

### `/studio/compose`

- File: `app/(studio)/studio/compose/page.tsx`
- Main render: compose workspace (`app/compose/compose-client.tsx`)
- Core feature: rewrite/improve/radar for a draft, optional research support
- API used: `/api/compose`, `/api/compose/suggest`, `/api/research`
- Notes: accepts `?draft=...` prefill from other features

### `/studio/daily-plan`

- File: `app/(studio)/studio/daily-plan/page.tsx`
- Main render: daily planning UX (`app/daily-plan/daily-plan-client.tsx`)
- Core feature: generate 11-post daily plan + strategy summary
- API used: `/api/daily-plan` (generate, load, save, delete)
- Notes: generated tweets can be pushed into compose prefill

### `/studio/patterns`

- File: `app/(studio)/studio/patterns/page.tsx`
- Main render: pattern-driven tweet generator (`app/patterns/patterns-client.tsx`)
- Core feature: one-tweet generation based on pattern catalog
- API used: `/api/pattern`

### `/studio/profile`

- File: `app/(studio)/studio/profile/page.tsx`
- Main render: profile editor (`app/profile/profile-client.tsx`)
- Core feature: define creator voice, audience, niche, constraints
- API used: `/api/profile`, `/api/profile/analyze`, `/api/profile/suggest`
- Notes: profile is foundational context for all generators

### `/studio/quote-repost`

- File: `app/(studio)/studio/quote-repost/page.tsx`
- Main render: quote-repost generator (`app/quote-repost/quote-repost-client.tsx`)
- Core feature: generate 4 quote options from source tweet + desired signal
- API used: `/api/quote-repost`

### `/studio/articles`

- File: `app/(studio)/studio/articles/page.tsx`
- Main render: article list and workspace entry
- API/data: reads article list server-side (DB-aware)

### `/studio/articles/new`

- File: `app/(studio)/studio/articles/new/page.tsx`
- Main render: article creation journey wizard
- Core feature: plan -> expand -> image slots/prompts -> save
- APIs used: `/api/articles/plan`, `/api/articles/expand`, `/api/articles/image-slots`, `/api/articles/image-prompts`, `/api/articles`

### `/studio/articles/[id]`

- File: `app/(studio)/studio/articles/[id]/page.tsx`
- Main render: article detail view for a saved article
- APIs/data: server load for article by id

### `/studio/articles/[id]/edit`

- File: `app/(studio)/studio/articles/[id]/edit/page.tsx`
- Main render: article edit journey with preloaded data
- APIs used: same generation APIs as article new flow + `PUT /api/articles/[id]`

### `/studio/shorts`

- File: `app/(studio)/studio/shorts/page.tsx`
- Main render: shorts/reels project list and new project entry
- APIs/data: reads shorts projects server-side (DB-aware)

### `/studio/shorts/new`

- File: `app/(studio)/studio/shorts/new/page.tsx`
- Main render: shorts creation journey
- Core feature: source -> transcript -> moments -> selection -> render -> download
- APIs used: `/api/shorts/projects`, `/api/shorts/projects/[id]/transcribe`, `/api/shorts/projects/[id]/analyze`, `/api/shorts/projects/[id]/render`, `/api/shorts/renders/[renderId]`

### `/studio/shorts/[id]`

- File: `app/(studio)/studio/shorts/[id]/page.tsx`
- Main render: shorts project detail for transcript, clip candidates, and render results
- APIs/data: server load for shorts project by id

### `/studio/shorts/[id]/edit`

- File: `app/(studio)/studio/shorts/[id]/edit/page.tsx`
- Main render: shorts journey in edit/resume mode with preloaded project data
- APIs used: same processing APIs as shorts new flow + `PUT /api/shorts/projects/[id]`

## Route Group and Layout Notes

- `(marketing)` and `(studio)` are Next.js route groups; they do not appear in URL paths.
- Global layout: `app/layout.tsx`
- Studio layout: `app/(studio)/layout.tsx` (also preloads profile into SWR)

## Redirects (Legacy/Convenience Paths)

From `next.config.ts`:

- `/compose` -> `/studio/compose`
- `/daily-plan` -> `/studio/daily-plan`
- `/patterns` -> `/studio/patterns`
- `/quote-repost` -> `/studio/quote-repost`
- `/profile` -> `/studio/profile`
- `/workspace` -> `/studio/compose`
- `/articles` -> `/studio/articles`
- `/shorts` -> `/studio/shorts`
