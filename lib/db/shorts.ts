import { prisma } from "@/lib/prisma";
import {
  deriveShortsListTitle,
  normalizeSavedShortsData,
  type SavedShortsData,
} from "@/lib/types/saved-shorts";

export type ShortsListItem = {
  id: string;
  title: string;
  status: string;
  sourceUrl: string;
  sourceType: string;
  updatedAt: string;
};

export type ShortsProjectRecord = {
  id: string;
  userId: string;
  title: string;
  status: string;
  sourceUrl: string;
  sourceType: string;
  data: SavedShortsData;
  createdAt: string;
  updatedAt: string;
};

function toRecord(row: {
  id: string;
  userId: string;
  title: string;
  status: string;
  sourceUrl: string;
  sourceType: string;
  data: unknown;
  createdAt: Date;
  updatedAt: Date;
}): ShortsProjectRecord {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    status: row.status,
    sourceUrl: row.sourceUrl,
    sourceType: row.sourceType,
    data: normalizeSavedShortsData(row.data),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listShortsForUser(userId: string): Promise<ShortsListItem[]> {
  const rows = await prisma.shortsProject.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      sourceUrl: true,
      sourceType: true,
      updatedAt: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    sourceUrl: row.sourceUrl,
    sourceType: row.sourceType,
    updatedAt: row.updatedAt.toISOString(),
  }));
}

export async function getShortsProjectForUser(
  userId: string,
  id: string
): Promise<ShortsProjectRecord | null> {
  const row = await prisma.shortsProject.findFirst({
    where: { id, userId },
    select: {
      id: true,
      userId: true,
      title: true,
      status: true,
      sourceUrl: true,
      sourceType: true,
      data: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!row) return null;
  return toRecord(row);
}

export async function createShortsProjectForUser(
  userId: string,
  input: SavedShortsData
): Promise<{ id: string }> {
  const data = normalizeSavedShortsData(input);
  const row = await prisma.shortsProject.create({
    data: {
      userId,
      title: deriveShortsListTitle(data),
      status: data.projectStatus,
      sourceUrl: data.sourceUrl,
      sourceType: data.sourceType,
      data,
    },
    select: { id: true },
  });
  return { id: row.id };
}

export async function updateShortsProjectForUser(
  userId: string,
  id: string,
  input: SavedShortsData
): Promise<boolean> {
  const data = normalizeSavedShortsData(input);
  const result = await prisma.shortsProject.updateMany({
    where: { id, userId },
    data: {
      title: deriveShortsListTitle(data),
      status: data.projectStatus,
      sourceUrl: data.sourceUrl,
      sourceType: data.sourceType,
      data,
    },
  });
  return result.count > 0;
}
