import { NextResponse } from "next/server";

import { getPlaceholderUserId } from "@/lib/constants/dev-user-id";
import {
  getShortsProjectForUser,
  updateShortsProjectForUser,
} from "@/lib/db/shorts";
import { consumeShortsQuota, logShortsApiEvent } from "@/lib/shorts/policy";
import type { CaptionStyleId, RenderJob, RenderPreset } from "@/lib/types/shorts-draft";
import { normalizeSavedShortsData } from "@/lib/types/saved-shorts";

export const dynamic = "force-dynamic";

function dbUnavailableResponse() {
  return NextResponse.json(
    {
      error: "Database unavailable",
      code: "SAVE_UNAVAILABLE",
    },
    { status: 503 }
  );
}

function normalizePreset(value: unknown): RenderPreset {
  const o =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  const captionStyle: CaptionStyleId =
    o.captionStyle === "bold_kinetic" || o.captionStyle === "minimal" ? o.captionStyle : "clean";

  return {
    aspectRatio: "9:16",
    captionStyle,
    includeBranding: typeof o.includeBranding === "boolean" ? o.includeBranding : true,
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = getPlaceholderUserId();
  if (!id) {
    return NextResponse.json({ error: "Missing project id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Body must be an object with candidateIds and preset" },
      { status: 400 }
    );
  }

  const candidateIds = Array.isArray((body as { candidateIds?: unknown }).candidateIds)
    ? (body as { candidateIds: unknown[] }).candidateIds.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0
      )
    : [];
  if (!candidateIds.length) {
    return NextResponse.json({ error: "Missing candidateIds" }, { status: 400 });
  }
  if (candidateIds.length > 10) {
    return NextResponse.json(
      {
        error: "Render request exceeds clip limit (max 10 per run).",
        code: "QUOTA_EXCEEDED",
      },
      { status: 429 }
    );
  }
  const candidateRangesRaw =
    (body as { candidateRanges?: unknown }).candidateRanges &&
    typeof (body as { candidateRanges?: unknown }).candidateRanges === "object" &&
    !Array.isArray((body as { candidateRanges?: unknown }).candidateRanges)
      ? ((body as { candidateRanges: Record<string, unknown> }).candidateRanges ?? {})
      : {};

  try {
    const project = await getShortsProjectForUser(userId, id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const quota = consumeShortsQuota({ userId, action: "render" });
    if (!quota.ok) {
      return NextResponse.json(
        {
          error: "Render quota exceeded. Try again later.",
          code: "QUOTA_EXCEEDED",
          retryAfterSec: quota.retryAfterSec,
        },
        { status: 429 }
      );
    }

    const data = normalizeSavedShortsData(project.data);
    const existingIds = new Set(data.candidates.map((item) => item.id));
    const invalid = candidateIds.find((candidateId) => !existingIds.has(candidateId));
    if (invalid) {
      return NextResponse.json(
        { error: `Unknown candidate id: ${invalid}` },
        { status: 422 }
      );
    }

    const preset = normalizePreset((body as { preset?: unknown }).preset);
    const candidateRanges = new Map<string, { startSec: number; endSec: number }>();
    for (const candidateId of candidateIds) {
      const rangeRaw = candidateRangesRaw[candidateId];
      if (!rangeRaw || typeof rangeRaw !== "object" || Array.isArray(rangeRaw)) continue;
      const o = rangeRaw as { startSec?: unknown; endSec?: unknown };
      const startSec =
        typeof o.startSec === "number" && Number.isFinite(o.startSec)
          ? Math.max(0, Math.floor(o.startSec))
          : null;
      const endSec =
        typeof o.endSec === "number" && Number.isFinite(o.endSec)
          ? Math.max(0, Math.floor(o.endSec))
          : null;
      if (startSec === null || endSec === null || endSec <= startSec) continue;
      candidateRanges.set(candidateId, { startSec, endSec });
    }

    const nextCandidates = data.candidates.map((candidate) => {
      const range = candidateRanges.get(candidate.id);
      if (!range) return candidate;
      return { ...candidate, startSec: range.startSec, endSec: range.endSec };
    });

    const jobs: RenderJob[] = candidateIds.map((candidateId, index) => ({
      id: `job-${Date.now()}-${index + 1}`,
      candidateId,
      status: "queued",
      outputUrl: "",
      subtitleUrl: "",
      thumbnailUrl: "",
      error: "",
    }));

    const nextData = normalizeSavedShortsData({
      ...data,
      candidates: nextCandidates,
      selectedCandidateIds: candidateIds,
      renderPreset: preset,
      renderJobs: jobs,
      projectStatus: "rendering",
      wizardStep: "render",
      error: "",
    });

    const ok = await updateShortsProjectForUser(userId, id, nextData);
    if (!ok) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    logShortsApiEvent({
      route: "projects/[id]/render",
      stage: "render_queued",
      projectId: id,
      userId,
      detail: `jobs=${jobs.length}`,
    });

    const responseJobs = jobs.map((job) => ({
      id: `${id}--${job.id}`,
      status: job.status,
    }));
    return NextResponse.json({ jobs: responseJobs });
  } catch {
    logShortsApiEvent({
      route: "projects/[id]/render",
      stage: "render_failed",
      projectId: id,
      userId,
      code: "SAVE_UNAVAILABLE",
    });
    return dbUnavailableResponse();
  }
}
