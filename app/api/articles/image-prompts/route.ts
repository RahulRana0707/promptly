import { NextResponse } from "next/server"

import {
  GeminiRequestError,
  GeminiResponseError,
  GeminiUnavailableError,
  generateGeminiJsonText,
} from "@/lib/gemini"
import {
  buildArticleImagePromptsFromContentSystem,
  buildArticleImagePromptsFromContentUser,
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
  const workingTitle = typeof o.workingTitle === "string" ? o.workingTitle : ""
  const previewHook = typeof o.previewHook === "string" ? o.previewHook : ""
  const articleMarkdown =
    typeof o.articleMarkdown === "string" ? o.articleMarkdown : ""
  if (!workingTitle.trim() || !previewHook.trim() || !articleMarkdown.trim()) {
    return NextResponse.json(
      { error: "workingTitle, previewHook, and articleMarkdown are required" },
      { status: 400 }
    )
  }

  let rawText: string
  try {
    rawText = await generateGeminiJsonText({
      systemInstruction: buildArticleImagePromptsFromContentSystem(),
      userMessage: buildArticleImagePromptsFromContentUser({
        workingTitle,
        previewHook,
        articleMarkdown,
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
      { error: "Model did not return valid JSON", code: "PROMPTS_PARSE" },
      { status: 502 }
    )
  }

  const prompts = Array.isArray((parsed as { prompts?: unknown })?.prompts)
    ? ((parsed as { prompts: unknown[] }).prompts
        .map((row, index) => {
          if (!row || typeof row !== "object" || Array.isArray(row)) return null
          const p = row as Record<string, unknown>
          const promptText = typeof p.promptText === "string" ? p.promptText : ""
          if (!promptText.trim()) return null
          return {
            id: typeof p.id === "string" ? p.id : `generated-${index + 1}`,
            label: typeof p.label === "string" ? p.label : `Prompt ${index + 1}`,
            promptText,
          }
        })
        .filter(
          (row): row is { id: string; label: string; promptText: string } => row !== null
        ))
    : []

  if (prompts.length < 3 || prompts.length > 5) {
    return NextResponse.json(
      { error: "Model returned invalid prompt count", code: "PROMPTS_INVALID" },
      { status: 422 }
    )
  }

  return NextResponse.json({ prompts, source: "generated" as const })
}
