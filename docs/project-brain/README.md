# X Content Engine - Project Brain

This folder is a full handoff guide for the codebase so a new engineer can start working with minimal ramp-up.

## What This Product Does

X Content Engine is a Next.js studio for creators who publish on X (Twitter). It helps a creator:

- define and save a creator profile (voice, audience, themes)
- generate tweets from multiple workflows (compose, patterns, quote repost, daily plan)
- generate and edit long-form X Articles
- generate image prompts for article visuals
- persist profile, daily plans, and article drafts in Postgres (Prisma)

The product is built around Gemini prompts and a shared profile context that influences all generations.

## Stack and Runtime

- Frontend: Next.js App Router (`next@16`), React 19, TypeScript, Tailwind
- API: Next.js Route Handlers under `app/api`
- AI: Gemini via `@google/generative-ai`, wrapped in `lib/gemini.ts`
- Data: Prisma + PostgreSQL (`prisma/schema.prisma`)
- State: SWR for shared profile hydration in studio shell

## Core App Structure

- Marketing surface: `app/(marketing)`
- Product/studio surface: `app/(studio)` with `components/studio-shell.tsx`
- Feature clients and hooks:
  - compose: `app/compose`, `hooks/use-compose-page.ts`
  - daily plan: `app/daily-plan`, `hooks/use-daily-plan-page.ts`
  - patterns: `app/patterns`, `hooks/use-pattern-page.ts`
  - quote repost: `app/quote-repost`, `hooks/use-quote-repost-page.ts`
  - profile: `app/profile`, `hooks/use-profile-form.ts`
  - articles: `app/articles`, `hooks/use-article-page.ts`

## Data Model

From `prisma/schema.prisma`:

- `Profile` (1 row per user) -> JSON payload for creator profile
- `DailyPlanDay` (1 row per user per date) -> JSON daily-plan result
- `Article` (many rows per user) -> JSON article draft/workspace data

Current user identity is placeholder-based (`lib/constants/dev-user.ts`) and not full auth yet.

## How Features Connect

The high-level flow is:

1. User sets profile in `/studio/profile`
2. Other generators read that same profile context
3. Generated content can be refined in compose or converted into article work
4. Daily plan and articles can be persisted and reopened later

Important connections:

- Studio layout preloads profile into SWR fallback (`app/(studio)/layout.tsx` + `components/studio-swr-provider.tsx`)
- Most generators merge incoming partial profile with `defaultMikoProfile()`
- Prompt guardrails are reused from:
  - `lib/prompts/miko-rules.ts`
  - `lib/prompts/x-rules.ts`
- API routes perform AI generation; hooks/components orchestrate UX and call those endpoints

## API Surface (By Capability)

- Profile
  - `GET/PUT /api/profile`
  - `POST /api/profile/analyze`
- Compose
  - `POST /api/compose`
  - `POST /api/compose/suggest`
  - `POST /api/research`
- Pattern and quote workflows
  - `POST /api/pattern`
  - `POST /api/quote-repost`
- Daily plans
  - `GET/POST/PUT/DELETE /api/daily-plan`
- Articles
  - `GET/POST /api/articles`
  - `GET/PUT /api/articles/[id]`
  - `POST /api/articles/plan`
  - `POST /api/articles/expand`
  - `POST /api/articles/image-slots`
  - `POST /api/articles/image-prompts`
- Placeholder (not implemented)
  - `POST /api/x/post` -> returns 501

## Setup Essentials

Environment (`.env.example`):

- required: `GEMINI_API_KEY`
- optional: `GEMINI_MODEL` (defaults to `gemini-2.5-flash`)
- optional for persistence: `DATABASE_URL`
- optional: `DEV_USER_ID`

Scripts (`package.json`):

- `npm run dev` - start app
- `npm run build` - prisma generate + next build
- `npm run lint` - eslint
- `npm run db:migrate` / `npm run db:push` / `npm run db:studio`

## Read Next

- Route map and page ownership: `docs/project-brain/routes.md`
- Prompt inventory and usage map: `docs/project-brain/prompt.md`
