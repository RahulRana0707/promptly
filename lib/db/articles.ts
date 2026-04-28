import { prisma } from "@/lib/prisma"
import {
  deriveArticleListTitle,
  normalizeSavedArticleData,
  type SavedArticleData,
} from "@/lib/types/saved-article"

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

function toRecord(row: {
  id: string
  userId: string
  title: string
  data: unknown
  createdAt: Date
  updatedAt: Date
}): ArticleRecord {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    data: normalizeSavedArticleData(row.data),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function listArticlesForUser(userId: string): Promise<ArticleListItem[]> {
  const rows = await prisma.article.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, updatedAt: true },
  })

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    updatedAt: row.updatedAt.toISOString(),
  }))
}

export async function getArticleForUser(
  userId: string,
  id: string
): Promise<ArticleRecord | null> {
  const row = await prisma.article.findFirst({
    where: { id, userId },
    select: {
      id: true,
      userId: true,
      title: true,
      data: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  if (!row) return null
  return toRecord(row)
}

export async function createArticleForUser(
  userId: string,
  input: SavedArticleData
): Promise<{ id: string }> {
  const data = normalizeSavedArticleData(input)
  const row = await prisma.article.create({
    data: {
      userId,
      title: deriveArticleListTitle(data),
      data,
    },
    select: { id: true },
  })
  return { id: row.id }
}

export async function updateArticleForUser(
  userId: string,
  id: string,
  input: SavedArticleData
): Promise<boolean> {
  const data = normalizeSavedArticleData(input)
  const result = await prisma.article.updateMany({
    where: { id, userId },
    data: {
      title: deriveArticleListTitle(data),
      data,
    },
  })
  return result.count > 0
}
