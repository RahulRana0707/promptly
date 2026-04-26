# Prompt Inventory and AI Map

This file is the source of truth for prompt-related code in this repository: where prompts are defined, what they do, and where they are invoked.

## Prompt Count (Current Snapshot)

Counting prompt strings/templates that are actually sent to Gemini, plus reusable prompt fragments:

- `26` executable Gemini prompts (system/user/repair prompts across features)
- `4` reusable prompt-fragment constants (`miko-rules` + `x-rules`)
- `10` article image preset templates (used for external image tools, not Gemini)

## Global Prompt Building Blocks

### `lib/prompts/miko-rules.ts`

- `MIKO_SIGNAL_PHILOSOPHY`
- `MIKO_CONTENT_GUARDRAILS`
- `COMBINED_MIKO_BLOG_PREAMBLE`

Role: shared voice and signal-optimization guardrails reused by most prompt builders.

### `lib/prompts/x-rules.ts`

- `X_PLATFORM_RULES`

Role: platform-specific constraints for X output (format, style, character rules).

### `lib/prompt-contract.ts`

- Includes helper instructions such as `HOOK_REMINDER` and compose-goal text.

Role: consistency helpers used by compose/pattern/quote/daily-plan prompts.

## Prompt Builder Files

### `lib/prompts/build-messages.ts`

Used by: `POST /api/generate`

- `buildGenerateSystemPrompt()`
- `buildGenerateUserPrompt(...)`

Purpose: generic post generation from topic + profile + audience + format.

### `lib/prompts/compose-prompts.ts`

Used by: `POST /api/compose`, `POST /api/compose/suggest`

- `buildComposeSystem(...)`
- `buildComposeUserPrompt(...)`
- `buildSuggestFromPastedBodySystem(...)`
- `buildSuggestFromPastedBodyUser(...)`

Purpose: compose rewrite/improve/radar and hook/goal/signal suggestion flow.

### `lib/prompts/article-prompts.ts`

Used by:

- `POST /api/articles/plan`
- `POST /api/articles/expand`
- `POST /api/articles/image-prompts`
- `POST /api/articles/image-slots`

Functions:

- `buildArticlePlanSystem()`
- `buildArticlePlanUser(...)`
- `buildArticleExpandSystem()`
- `buildArticleExpandRetrySystem()`
- `buildArticleExpandUser(...)`
- `buildArticleImagePromptsFromContentSystem()`
- `buildArticleImagePromptsFromContentUser(...)`
- `buildArticleImageSlotsSystem()`
- `buildArticleImageSlotsUser(...)`

Purpose: article planning, expansion, retry repair, and image-prompt support.

### `lib/prompts/article-image-presets.ts` (External Image Prompt Templates)

- `IMAGE_PROMPT_PRESETS` includes 10 template styles
  - `etching_baseline`
  - `split_tension`
  - `curiosity_gap`
  - `scale_awe`
  - `cinematic_operator`
  - `contrarian_collision`
  - `signal_noise`
  - `social_energy`
  - `urgency_motion`
  - `poster_thumb`

These are copied/filled by UI for image tools; not sent to Gemini directly.

## Inline Prompts in API Routes

These routes define prompts directly in route files (instead of a prompt builder file):

### `app/api/pattern/route.ts`

- inline system prompt for one-tweet pattern generation
- inline user prompt including profile + chosen pattern + topic

### `app/api/profile/analyze/route.ts`

- inline system prompt for profile growth analysis JSON
- inline user prompt with profile block

### `app/api/quote-repost/route.ts`

- inline system prompt for exactly 4 quote options
- inline user prompt with source tweet and filters
- inline repair system prompt when parsing fails

### `app/api/daily-plan/route.ts`

- inline system prompt for daily strategy + exactly 11 tweets
- inline user prompt with profile + allowed patterns + signal rotation
- inline repair system prompt when output is invalid

### `app/api/research/route.ts`

- inline system prompt for compact research brief from URLs/topic

## Invocation Map (Frontend -> API -> Prompt Source)

- `hooks/use-compose-page.ts`
  - `/api/compose` -> `lib/prompts/compose-prompts.ts`
  - `/api/compose/suggest` -> `lib/prompts/compose-prompts.ts`
- `components/studio/compose-research-rail.tsx`
  - `/api/research` -> inline prompt in `app/api/research/route.ts`
- `hooks/use-pattern-page.ts`
  - `/api/pattern` -> inline prompts in `app/api/pattern/route.ts`
- `hooks/use-quote-repost-page.ts`
  - `/api/quote-repost` -> inline prompts in `app/api/quote-repost/route.ts`
- `hooks/use-profile-form.ts`
  - `/api/profile/analyze` -> inline prompts in `app/api/profile/analyze/route.ts`
- `hooks/use-daily-plan-page.ts`
  - `/api/daily-plan` -> inline prompts in `app/api/daily-plan/route.ts`
- `hooks/use-article-page.ts`
  - `/api/articles/plan` -> `lib/prompts/article-prompts.ts`
  - `/api/articles/expand` -> `lib/prompts/article-prompts.ts`
  - `/api/articles/image-prompts` -> `lib/prompts/article-prompts.ts`
  - `/api/articles/image-slots` -> `lib/prompts/article-prompts.ts`

## Model and Client Layer

- Gemini client wrapper: `lib/gemini.ts`
- Current default model: `gemini-2.5-flash` (unless `GEMINI_MODEL` overrides)
- Most structured routes call Gemini in JSON mode and parse with `parseJsonSafe(...)`

## Maintenance Rules for Future Prompt Changes

- Prefer updating prompt-builder files under `lib/prompts` over adding large inline prompt strings in routes.
- Keep profile context usage consistent (`profileToPromptBlock(...)`) so behavior matches across features.
- If adding new prompt-heavy endpoints, add them to this file with:
  - endpoint
  - source prompt file/function
  - input/output contract
