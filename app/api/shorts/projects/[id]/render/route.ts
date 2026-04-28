import { NextResponse } from "next/server";

import { getPlaceholderUserId } from "@/lib/constants/dev-user-id";
import {
  getShortsProjectForUser,
  updateShortsProjectForUser,
} from "@/lib/db/shorts";
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

  try {
    const project = await getShortsProjectForUser(getPlaceholderUserId(), id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
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
      selectedCandidateIds: candidateIds,
      renderPreset: preset,
      renderJobs: jobs,
      projectStatus: "rendering",
      wizardStep: "render",
      error: "",
    });

    const ok = await updateShortsProjectForUser(getPlaceholderUserId(), id, nextData);
    if (!ok) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const responseJobs = jobs.map((job) => ({
      id: `${id}--${job.id}`,
      status: job.status,
    }));
    return NextResponse.json({ jobs: responseJobs });
  } catch {
    return dbUnavailableResponse();
  }
}
