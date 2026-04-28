import type { ArticleImageSlots, ArticleIntent, ArticleOutlineSection } from "@/lib/types/article-draft"
import type { SavedArticleData } from "@/lib/types/saved-article"

export type ArticleListItem = {
  id: string
  title: string
  updatedAt: string
}

export type ArticleRecord = {
  id: string
  userId: string
  title: string
  data: SavedArticleData
  createdAt: string
  updatedAt: string
}

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string; code?: string }
    if (typeof body.error === "string") return body.error
    if (typeof body.code === "string") return body.code
  } catch {
    // ignore
  }
  return `Request failed (${res.status})`
}

export async function fetchArticlesList(): Promise<{ articles: ArticleListItem[] }> {
  const res = await fetch("/api/articles", { cache: "no-store" })
  if (!res.ok) throw new Error(await readErrorMessage(res))
  return (await res.json()) as { articles: ArticleListItem[] }
}

export async function fetchArticleById(id: string): Promise<ArticleRecord> {
  const res = await fetch(`/api/articles/${encodeURIComponent(id)}`, {
    cache: "no-store",
  })
  if (!res.ok) throw new Error(await readErrorMessage(res))
  return (await res.json()) as ArticleRecord
}

export async function createArticle(input: {
  data: SavedArticleData
}): Promise<{ id: string }> {
  const res = await fetch("/api/articles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await readErrorMessage(res))
  return (await res.json()) as { id: string }
}

export async function updateArticle(
  id: string,
  input: { data: SavedArticleData }
): Promise<{ ok: true }> {
  const res = await fetch(`/api/articles/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await readErrorMessage(res))
  return (await res.json()) as { ok: true }
}

export async function generateArticlePlan(input: {
  intent: ArticleIntent
  profile?: unknown
}): Promise<{
  workingTitle: string
  titleVariants: string[]
  previewHook: string
  outline: ArticleOutlineSection[]
}> {
  const res = await fetch("/api/articles/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await readErrorMessage(res))
  return (await res.json()) as {
    workingTitle: string
    titleVariants: string[]
    previewHook: string
    outline: ArticleOutlineSection[]
  }
}

export async function generateArticleBody(input: {
  intent: ArticleIntent
  profile?: unknown
  workingTitle: string
  previewHook: string
  outline: ArticleOutlineSection[]
}): Promise<{ markdown: string }> {
  const res = await fetch("/api/articles/expand", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await readErrorMessage(res))
  return (await res.json()) as { markdown: string }
}

export async function generateArticleImageSlots(input: {
  topic: string
  workingTitle?: string
  previewHook?: string
  articleMarkdown?: string
}): Promise<ArticleImageSlots> {
  const res = await fetch("/api/articles/image-slots", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await readErrorMessage(res))
  return (await res.json()) as ArticleImageSlots
}

export async function generateArticleImagePrompts(input: {
  workingTitle: string
  previewHook: string
  articleMarkdown: string
}): Promise<{ prompts: Array<{ id: string; label: string; promptText: string }>; source: "generated" }> {
  const res = await fetch("/api/articles/image-prompts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await readErrorMessage(res))
  return (await res.json()) as {
    prompts: Array<{ id: string; label: string; promptText: string }>
    source: "generated"
  }
}
