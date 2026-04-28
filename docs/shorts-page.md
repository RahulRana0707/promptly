# Shorts/Reels maker - complete reference

This document is the source-of-truth spec for a new Shorts/Reels workflow in Promptly: ingest long-form podcast/video links, detect high-reach clip moments, render short videos, and deliver downloadable exports.

---

## 1. What “Shorts” is in this product

Shorts is a studio workflow that turns long-form podcast/video content into vertical short-form clips.

Core value:

- User pastes a source link (for example YouTube podcast URL)
- System transcribes with timestamps and speaker turns
- AI ranks highlight moments by likely reach/shareability
- User selects candidate clips
- System renders final short videos (captions + framing + export)

Non-goals (MVP):

- No direct upload/posting to social platforms in v1
- No auto-publish scheduling in v1
- No fully automatic end-to-end run without user selection in v1

---

## 2. Route family and page ownership

All routes should live under studio namespace:

| URL | Server page file | Purpose |
|-----|------------------|---------|
| `/studio/shorts` | `app/(studio)/studio/shorts/page.tsx` | List Shorts projects + create CTA |
| `/studio/shorts/new` | `app/(studio)/studio/shorts/new/page.tsx` | New shorts journey (URL input + processing) |
| `/studio/shorts/[id]` | `app/(studio)/studio/shorts/[id]/page.tsx` | Project detail: transcript, candidates, renders |
| `/studio/shorts/[id]/edit` | `app/(studio)/studio/shorts/[id]/edit/page.tsx` | Resume selection and render setup |

Suggested legacy redirect:

- `/shorts` -> `/studio/shorts`

---

## 3. End-to-end user journey (wizard)

Wizard steps (`ShortsWizardStep`) for deterministic state transitions:

1. `source` - paste URL and validate support
2. `transcript` - ingest + transcription status and preview
3. `moments` - ranked candidate clips (score, reason, preview)
4. `selection` - choose clips and style presets
5. `render` - start rendering + progress/status
6. `download` - download final mp4 files and optional subtitle files

Recommended UX behavior:

- Keep step navigation linear for first-time flow
- Allow revisit to prior steps after first successful run
- Keep clear async state labels: ingesting, transcribing, analyzing, rendering

---

## 4. Feature architecture (frontend + backend)

### Frontend app structure

- `app/shorts/shorts-list-client.tsx` - list and create entry point
- `app/shorts/shorts-journey-client.tsx` - wrapper for create/edit state hydration
- `app/shorts/_components/shorts-journey-wizard.tsx` - step UI and actions
- `app/shorts/shorts-detail-client.tsx` - project detail with candidates/renders
- `hooks/use-shorts-page.ts` - source of truth for journey state and async actions
- `lib/fetch/shorts.ts` - typed fetch wrappers and normalized API error parsing

### Backend app structure

- `app/api/shorts/projects/route.ts` - `GET` list, `POST` create
- `app/api/shorts/projects/[id]/route.ts` - `GET` project, `PUT` update metadata
- `app/api/shorts/projects/[id]/transcribe/route.ts` - enqueue ingest+transcription
- `app/api/shorts/projects/[id]/analyze/route.ts` - generate ranked moments
- `app/api/shorts/projects/[id]/render/route.ts` - render selected clips
- `app/api/shorts/renders/[renderId]/route.ts` - read render status
- `app/api/shorts/renders/[renderId]/download/route.ts` - secure download token/url

---

## 5. Data model and persistence contracts

MVP should follow existing article strategy: JSON-centric snapshots with normalization helpers, then normalize later when workload increases.

### Prisma model proposal

```prisma
model ShortsProject {
  id             String   @id @default(cuid())
  userId         String
  sourceUrl      String
  sourceType     String
  sourceTitle    String?
  sourceDuration Int?
  status         String
  data           Json
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  @@index([userId, updatedAt(sort: Desc)])
}
```

`data` stores normalized object payload:

- `transcript`: language, utterances, timestamps
- `analysis`: ranked candidates with score + reasons
- `selectedCandidateIds`: user picks
- `renderJobs`: status, outputs, metadata
- `wizardStep`: current journey step

### Type contracts

- `lib/types/shorts-draft.ts`
  - `ShortsWizardStep`
  - `TranscriptSegment`
  - `MomentCandidate`
  - `RenderPreset`
  - `RenderJob`
- `lib/types/saved-shorts.ts`
  - `SavedShortsData`
  - `normalizeSavedShortsData`
  - list title derivation helpers

---

## 6. API contracts

### `POST /api/shorts/projects`

Body:

```json
{
  "sourceUrl": "https://www.youtube.com/watch?v=...",
  "sourceType": "youtube"
}
```

Response:

```json
{ "id": "proj_123" }
```

### `POST /api/shorts/projects/[id]/transcribe`

Body:

```json
{ "force": false }
```

Response:

```json
{
  "ok": true,
  "status": "transcribing"
}
```

### `POST /api/shorts/projects/[id]/analyze`

Body:

```json
{
  "targetClipCount": 8,
  "minScore": 80
}
```

Response:

```json
{
  "candidates": [
    {
      "id": "c_1",
      "startSec": 381,
      "endSec": 428,
      "score": 91,
      "title": "The contrarian insight",
      "reason": "Strong hook + clear payoff + emotional turn",
      "tags": ["hook", "insight"]
    }
  ]
}
```

### `POST /api/shorts/projects/[id]/render`

Body:

```json
{
  "candidateIds": ["c_1", "c_2"],
  "preset": {
    "aspectRatio": "9:16",
    "captionStyle": "bold_kinetic",
    "includeBranding": true
  }
}
```

Response:

```json
{
  "jobs": [
    { "id": "r_1", "status": "queued" },
    { "id": "r_2", "status": "queued" }
  ]
}
```

---

## 7. Processing pipeline design

Use asynchronous worker jobs; do not keep heavy processing inside route handlers.

### Stage A: Source ingest

- Validate URL/domain support
- Fetch metadata (`title`, `duration`, `thumbnail`)
- Fetch or extract audio stream

### Stage B: Transcription

- Timestamped segments (`startSec`, `endSec`, `text`)
- Speaker diarization when available
- Store raw transcript + compact view

### Stage C: Moment detection/scoring

- Segment transcript into candidate windows (for example 20-90 seconds)
- Compute features:
  - hook density
  - novelty
  - emotional signal
  - clarity/shareability
  - trend relevance
- LLM evaluates windows and returns reasons + recommended title
- Deduplicate overlaps and keep top N by score

### Stage D: Rendering

- Clip extraction with FFmpeg
- Optional speaker-aware smart crop to vertical frame
- Burn subtitles from transcript slice
- Encode output mp4 (`h264`, social-safe bitrate profile)
- Save output to object storage and persist URLs

---

## 8. Scoring model for “high reach (80+)”

Use a hybrid score instead of raw LLM confidence:

`finalScore = 0.35 * hookStrength + 0.25 * emotionalArc + 0.20 * clarity + 0.20 * shareability`

Rules for “High reach” badge:

- score >= 80
- clip length in target bounds (for example 25-60s)
- no policy or safety violation flag
- not substantially overlapping with higher-ranked clip

UI buckets:

- `90-100`: breakout candidate
- `80-89`: strong candidate
- `70-79`: backup candidate

---

## 9. Job, queue, and status model

Project-level status:

- `created`
- `ingesting`
- `transcribing`
- `analyzing`
- `ready_for_selection`
- `rendering`
- `completed`
- `failed`

Render job status:

- `queued`
- `running`
- `completed`
- `failed`

Retry policy:

- retry transient failures (network/provider timeout) up to 2-3 attempts
- mark permanent failures with actionable message for user

---

## 10. Infrastructure decisions

### Required components

- Object storage for source assets and outputs
- Queue worker runtime for transcription/analysis/render jobs
- FFmpeg runtime for clip processing
- Polling endpoint for render status (websocket optional later)

### Runtime split

- Route handlers: request validation, enqueue work, return status
- Workers: heavy tasks, external APIs, media processing

---

## 11. Safety, legal, and abuse prevention

Must-have checks:

- User confirms rights/permission for processing source content
- URL/domain allowlist for supported providers
- Basic moderation for abusive/disallowed generated outputs
- Rate limits and per-user quotas for expensive operations
- Structured error codes for blocked or unsupported sources

---

## 12. Delivery phases

### Phase 1 (MVP)

- Source URL input
- Transcript generation
- Top candidate moments with score + reason
- User selection
- Render and download mp4 clips

### Phase 2

- Better scoring calibration
- Caption style presets
- Smarter overlap pruning
- Thumbnails and clip titles

### Phase 3

- Batch render templates
- Multi-format export packs
- Feedback loop from selected vs ignored moments

---

## 13. Success metrics

Primary:

- Time from paste URL to first downloadable clip
- Percentage of projects reaching `completed`
- Average selected clips per project

Quality:

- User acceptance rate of top-3 suggested clips
- Re-render rate (lower is better if first render quality is high)
- Manual trim edits before render

---

## 14. Source index for implementation

Implement in this order:

1. `lib/types/shorts-draft.ts`
2. `lib/types/saved-shorts.ts`
3. `lib/db/shorts.ts`
4. `app/api/shorts/projects/**/*.ts`
5. `lib/fetch/shorts.ts`
6. `hooks/use-shorts-page.ts`
7. `app/shorts/_components/shorts-journey-wizard.tsx`
8. `app/studio/shorts/*`
