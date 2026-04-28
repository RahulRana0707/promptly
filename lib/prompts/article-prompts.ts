import { profileToPromptBlock, type CreatorProfile } from "@/lib/types/profile"

import { STUDIO_VOICE_PREAMBLE } from "@/lib/prompts/studio-voice"
import type { ArticleIntent, ArticleOutlineSection } from "@/lib/types/article-draft"

function safeLine(value: string, fallback = "(empty)"): string {
  const v = value.trim()
  return v.length ? v : fallback
}

export function buildArticlePlanSystem(): string {
  return `${STUDIO_VOICE_PREAMBLE}

You generate an X long-form article card plan.
Return strict JSON only with this shape:
{
  "workingTitle": string,
  "titleVariants": string[],
  "previewHook": string,
  "outline": Array<{ "id": string, "title": string, "beats": string[] }>
}

Rules:
- Keep title punchy and specific.
- previewHook should be 2-4 short lines suitable for a feed card.
- Provide 4-8 outline sections.
- id must be stable slug-like (e.g. "sec-1", "sec-2").
- No markdown, no commentary, JSON only.`
}

export function buildArticlePlanUser(input: {
  profile: CreatorProfile
  intent: ArticleIntent
}): string {
  const i = input.intent
  return `Creator profile:
${profileToPromptBlock(input.profile)}

Article intent:
- Topic: ${safeLine(i.topic)}
- Audience: ${safeLine(i.audience)}
- Tone: ${safeLine(i.tone)}
- Promise: ${safeLine(i.promise)}
- Wellness claims allowed: ${i.wellnessClaimsAllowed ? "yes" : "no"}

Return JSON only.`
}

export function buildArticleExpandSystem(): string {
  return `${STUDIO_VOICE_PREAMBLE}

Expand a long-form X article draft from card + outline.
Return strict JSON only with:
{
  "markdown": string
}

Rules:
- Produce markdown with clear section headings (##).
- Keep section order aligned with provided outline.
- Keep writing concrete, practical, and readable.
- No prose outside JSON.`
}

export function buildArticleExpandRetrySystem(): string {
  return "Fix the response into strict JSON with one key: markdown (string). JSON only."
}

export function buildArticleExpandUser(input: {
  profile: CreatorProfile
  intent: ArticleIntent
  workingTitle: string
  previewHook: string
  outline: ArticleOutlineSection[]
}): string {
  return `Creator profile:
${profileToPromptBlock(input.profile)}

Intent:
- Topic: ${safeLine(input.intent.topic)}
- Audience: ${safeLine(input.intent.audience)}
- Tone: ${safeLine(input.intent.tone)}
- Promise: ${safeLine(input.intent.promise)}

Card:
- Working title: ${safeLine(input.workingTitle)}
- Preview hook:
${safeLine(input.previewHook)}

Outline JSON:
${JSON.stringify(input.outline, null, 2)}

Return JSON only with markdown.`
}

export function buildArticleImageSlotsSystem(): string {
  return `${STUDIO_VOICE_PREAMBLE}

Infer image-slot values for article visuals.
Return strict JSON only:
{
  "tension": string,
  "mood": string,
  "metaphor": string,
  "composition": string
}

Keep each field concise and generative-model friendly.`
}

export function buildArticleImageSlotsUser(input: {
  topic: string
  workingTitle?: string
  previewHook?: string
  articleMarkdown?: string
}): string {
  return `Topic: ${safeLine(input.topic)}
Working title: ${safeLine(input.workingTitle ?? "")}
Preview hook: ${safeLine(input.previewHook ?? "")}
Article excerpt:
${safeLine((input.articleMarkdown ?? "").slice(0, 8000))}

Return JSON only.`
}

export function buildArticleImagePromptsFromContentSystem(): string {
  return `${STUDIO_VOICE_PREAMBLE}

Generate 3-5 high quality image prompts from the article.
Return strict JSON only:
{
  "prompts": Array<{ "id": string, "label": string, "promptText": string }>
}

Rules:
- 3 to 5 prompts exactly.
- Prompt text should be copy-paste ready.
- No markdown, JSON only.`
}

export function buildArticleImagePromptsFromContentUser(input: {
  workingTitle: string
  previewHook: string
  articleMarkdown: string
}): string {
  return `Working title: ${safeLine(input.workingTitle)}
Preview hook:
${safeLine(input.previewHook)}

Article markdown excerpt:
${safeLine(input.articleMarkdown.slice(0, 12000))}

Return JSON only.`
}
