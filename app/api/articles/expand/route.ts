import { NextResponse } from "next/server"

import { extractMarkdownFromExpandRaw } from "@/lib/extract-article-markdown"
import {
  GeminiRequestError,
  GeminiResponseError,
  GeminiUnavailableError,
  generateGeminiJsonText,
} from "@/lib/gemini"
import {
  buildArticleExpandRetrySystem,
  buildArticleExpandSystem,
  buildArticleExpandUser,
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
  const intent = o.intent
  if (!intent || typeof intent !== "object" || Array.isArray(intent)) {
    return NextResponse.json({ error: "Missing intent object" }, { status: 400 })
  }
  const i = intent as Record<string, unknown>
  const topic = typeof i.topic === "string" ? i.topic.trim() : ""
  if (!topic) {
    return NextResponse.json({ error: "intent.topic is required" }, { status: 400 })
  }
  const workingTitle = typeof o.workingTitle === "string" ? o.workingTitle : ""
  const previewHook = typeof o.previewHook === "string" ? o.previewHook : ""
  const outline = Array.isArray(o.outline) ? o.outline : []
  if (!workingTitle.trim() || !previewHook.trim() || outline.length === 0) {
    return NextResponse.json(
      { error: "workingTitle, previewHook, and outline are required" },
      { status: 400 }
    )
  }

  const planIntent = {
    topic,
    audience: typeof i.audience === "string" ? i.audience : "",
    tone: typeof i.tone === "string" ? i.tone : "",
    promise: typeof i.promise === "string" ? i.promise : "",
    wellnessClaimsAllowed:
      typeof i.wellnessClaimsAllowed === "boolean" ? i.wellnessClaimsAllowed : false,
  }
  const profile = creatorProfileFromJson(o.profile)

  let rawText: string
  try {
    rawText = await generateGeminiJsonText({
      systemInstruction: buildArticleExpandSystem(),
      userMessage: buildArticleExpandUser({
        profile,
        intent: planIntent,
        workingTitle,
        previewHook,
        outline: outline as never[],
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

  let markdown = extractMarkdownFromExpandRaw(rawText)
  if (!markdown.trim()) {
    try {
      const repaired = await generateGeminiJsonText({
        systemInstruction: buildArticleExpandRetrySystem(),
        userMessage: rawText.slice(0, 12000),
      })
      markdown = extractMarkdownFromExpandRaw(repaired)
    } catch {
      // handled below
    }
  }

  if (!markdown.trim()) {
    return NextResponse.json(
      { error: "Could not extract markdown from model output", code: "EXPAND_INVALID" },
      { status: 422 }
    )
  }

  return NextResponse.json({ markdown })
}
