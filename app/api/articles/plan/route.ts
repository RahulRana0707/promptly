import { NextResponse } from "next/server"

import {
  GeminiRequestError,
  GeminiResponseError,
  GeminiUnavailableError,
  generateGeminiJsonText,
} from "@/lib/gemini"
import {
  buildArticlePlanSystem,
  buildArticlePlanUser,
} from "@/lib/prompts/article-prompts"
import { creatorProfileFromJson } from "@/lib/types/profile"

export const dynamic = "force-dynamic"

function aiUnavailableResponse() {
  return NextResponse.json(
    {
      error: "AI generation unavailable",
      code: "AI_UNAVAILABLE",
    },
    { status: 503 }
  )
}

function parsePlanResult(raw: unknown) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const o = raw as Record<string, unknown>
  const workingTitle = typeof o.workingTitle === "string" ? o.workingTitle : ""
  const previewHook = typeof o.previewHook === "string" ? o.previewHook : ""
  const titleVariants = Array.isArray(o.titleVariants)
    ? o.titleVariants.filter((x): x is string => typeof x === "string")
    : []
  const outline = Array.isArray(o.outline)
    ? o.outline
        .map((x, i) => {
          if (!x || typeof x !== "object" || Array.isArray(x)) return null
          const row = x as Record<string, unknown>
          const beats = Array.isArray(row.beats)
            ? row.beats.filter((b): b is string => typeof b === "string")
            : []
          return {
            id: typeof row.id === "string" ? row.id : `sec-${i + 1}`,
            title: typeof row.title === "string" ? row.title : "",
            beats,
          }
        })
        .filter((x): x is { id: string; title: string; beats: string[] } => x !== null)
    : []

  if (!workingTitle.trim() || !previewHook.trim() || outline.length === 0) return null
  return { workingTitle, titleVariants, previewHook, outline }
}

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Body must be an object" }, { status: 400 })
  }

  const intent = (body as { intent?: unknown }).intent
  if (!intent || typeof intent !== "object" || Array.isArray(intent)) {
    return NextResponse.json({ error: "Missing intent object" }, { status: 400 })
  }

  const i = intent as Record<string, unknown>
  const topic = typeof i.topic === "string" ? i.topic.trim() : ""
  if (!topic) {
    return NextResponse.json({ error: "intent.topic is required" }, { status: 400 })
  }

  const planIntent = {
    topic,
    audience: typeof i.audience === "string" ? i.audience : "",
    tone: typeof i.tone === "string" ? i.tone : "",
    promise: typeof i.promise === "string" ? i.promise : "",
    wellnessClaimsAllowed:
      typeof i.wellnessClaimsAllowed === "boolean" ? i.wellnessClaimsAllowed : false,
  }
  const profile = creatorProfileFromJson((body as { profile?: unknown }).profile)

  let rawText: string
  try {
    rawText = await generateGeminiJsonText({
      systemInstruction: buildArticlePlanSystem(),
      userMessage: buildArticlePlanUser({ profile, intent: planIntent }),
    })
  } catch (e) {
    if (e instanceof GeminiUnavailableError) return aiUnavailableResponse()
    if (e instanceof GeminiRequestError) {
      return NextResponse.json(
        { error: "Gemini request failed", code: "GEMINI_HTTP", detail: e.bodySnippet },
        { status: 502 }
      )
    }
    if (e instanceof GeminiResponseError) {
      return NextResponse.json(
        { error: e.message, code: "GEMINI_RESPONSE" },
        { status: 502 }
      )
    }
    throw e
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawText) as unknown
  } catch {
    return NextResponse.json(
      { error: "Model did not return valid JSON", code: "PLAN_PARSE" },
      { status: 502 }
    )
  }

  const result = parsePlanResult(parsed)
  if (!result) {
    return NextResponse.json(
      { error: "Model output missing required plan fields", code: "PLAN_INVALID" },
      { status: 422 }
    )
  }

  return NextResponse.json(result)
}
