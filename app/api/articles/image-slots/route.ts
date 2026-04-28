import { NextResponse } from "next/server"

import {
  GeminiRequestError,
  GeminiResponseError,
  GeminiUnavailableError,
  generateGeminiJsonText,
} from "@/lib/gemini"
import {
  buildArticleImageSlotsSystem,
  buildArticleImageSlotsUser,
} from "@/lib/prompts/article-prompts"

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

  const o = body as Record<string, unknown>
  const topic = typeof o.topic === "string" ? o.topic.trim() : ""
  if (!topic) {
    return NextResponse.json({ error: "topic is required" }, { status: 400 })
  }

  let rawText: string
  try {
    rawText = await generateGeminiJsonText({
      systemInstruction: buildArticleImageSlotsSystem(),
      userMessage: buildArticleImageSlotsUser({
        topic,
        workingTitle: typeof o.workingTitle === "string" ? o.workingTitle : "",
        previewHook: typeof o.previewHook === "string" ? o.previewHook : "",
        articleMarkdown: typeof o.articleMarkdown === "string" ? o.articleMarkdown : "",
      }),
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
      { error: "Model did not return valid JSON", code: "SLOTS_PARSE" },
      { status: 502 }
    )
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return NextResponse.json({ error: "Invalid slots payload" }, { status: 422 })
  }

  const p = parsed as Record<string, unknown>
  const tension = typeof p.tension === "string" ? p.tension : ""
  const mood = typeof p.mood === "string" ? p.mood : ""
  const metaphor = typeof p.metaphor === "string" ? p.metaphor : ""
  const composition = typeof p.composition === "string" ? p.composition : ""
  if (!tension.trim() || !mood.trim() || !metaphor.trim() || !composition.trim()) {
    return NextResponse.json(
      { error: "Missing required slot fields", code: "SLOTS_INVALID" },
      { status: 422 }
    )
  }

  return NextResponse.json({ tension, mood, metaphor, composition })
}
