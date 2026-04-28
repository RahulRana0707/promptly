import type { RenderPreset } from "@/lib/types/shorts-draft";
import type { SavedShortsData } from "@/lib/types/saved-shorts";

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

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string; code?: string };
    if (typeof body.error === "string") return body.error;
    if (typeof body.code === "string") return body.code;
  } catch {
    // ignore
  }
  return `Request failed (${res.status})`;
}

export async function fetchShortsList(): Promise<{ projects: ShortsListItem[] }> {
  const res = await fetch("/api/shorts/projects", { cache: "no-store" });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as { projects: ShortsListItem[] };
}

export async function fetchShortsProjectById(id: string): Promise<ShortsProjectRecord> {
  const res = await fetch(`/api/shorts/projects/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as ShortsProjectRecord;
}

export async function createShortsProject(input: {
  data: SavedShortsData;
}): Promise<{ id: string }> {
  const res = await fetch("/api/shorts/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as { id: string };
}

export async function updateShortsProject(
  id: string,
  input: { data: SavedShortsData }
): Promise<{ ok: true }> {
  const res = await fetch(`/api/shorts/projects/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as { ok: true };
}

export async function transcribeShortsProject(
  id: string,
  input?: { force?: boolean }
): Promise<{
  ok: true;
  status: string;
  transcriptSegments: number;
  transcript: SavedShortsData["transcript"];
  language: string;
}> {
  const res = await fetch(`/api/shorts/projects/${encodeURIComponent(id)}/transcribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input ?? {}),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as {
    ok: true;
    status: string;
    transcriptSegments: number;
    transcript: SavedShortsData["transcript"];
    language: string;
  };
}

export async function analyzeShortsProject(
  id: string,
  input?: { targetClipCount?: number; minScore?: number }
): Promise<{ candidates: SavedShortsData["candidates"] }> {
  const res = await fetch(`/api/shorts/projects/${encodeURIComponent(id)}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input ?? {}),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as { candidates: SavedShortsData["candidates"] };
}

export async function renderShortsProject(input: {
  id: string;
  candidateIds: string[];
  candidateRanges?: Record<string, { startSec: number; endSec: number }>;
  preset: RenderPreset;
}): Promise<{ jobs: Array<{ id: string; status: string }> }> {
  const res = await fetch(`/api/shorts/projects/${encodeURIComponent(input.id)}/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      candidateIds: input.candidateIds,
      candidateRanges: input.candidateRanges ?? {},
      preset: input.preset,
    }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as { jobs: Array<{ id: string; status: string }> };
}

export async function fetchRenderStatus(renderId: string): Promise<{
  id: string;
  status: string;
  outputUrl: string;
  subtitleUrl: string;
  thumbnailUrl: string;
  error: string;
}> {
  const res = await fetch(`/api/shorts/renders/${encodeURIComponent(renderId)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as {
    id: string;
    status: string;
    outputUrl: string;
    subtitleUrl: string;
    thumbnailUrl: string;
    error: string;
  };
}

export async function fetchRenderDownload(renderId: string): Promise<{
  id: string;
  downloadUrl: string;
  subtitleUrl: string;
  thumbnailUrl: string;
}> {
  const res = await fetch(
    `/api/shorts/renders/${encodeURIComponent(renderId)}/download`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(await readErrorMessage(res));
  return (await res.json()) as {
    id: string;
    downloadUrl: string;
    subtitleUrl: string;
    thumbnailUrl: string;
  };
}
