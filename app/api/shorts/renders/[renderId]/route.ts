import { NextResponse } from "next/server";

import { getPlaceholderUserId } from "@/lib/constants/dev-user-id";
import {
  getShortsProjectForUser,
  updateShortsProjectForUser,
} from "@/lib/db/shorts";
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

function parseRenderId(renderId: string): { projectId: string; jobId: string } | null {
  const divider = renderId.indexOf("--");
  if (divider <= 0 || divider >= renderId.length - 2) return null;
  return {
    projectId: renderId.slice(0, divider),
    jobId: renderId.slice(divider + 2),
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ renderId: string }> }
) {
  const { renderId } = await params;
  const parsed = parseRenderId(renderId);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid render id" }, { status: 400 });
  }

  try {
    const project = await getShortsProjectForUser(
      getPlaceholderUserId(),
      parsed.projectId
    );
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const data = normalizeSavedShortsData(project.data);
    const targetIndex = data.renderJobs.findIndex((item) => item.id === parsed.jobId);
    if (targetIndex === -1) {
      return NextResponse.json({ error: "Render job not found" }, { status: 404 });
    }

    const job = data.renderJobs[targetIndex];
    // Placeholder worker behavior: first poll completes queued job.
    if (job.status === "queued") {
      data.renderJobs[targetIndex] = {
        ...job,
        status: "completed",
        outputUrl: `https://example.com/shorts/${renderId}.mp4`,
        subtitleUrl: `https://example.com/shorts/${renderId}.srt`,
        thumbnailUrl: `https://example.com/shorts/${renderId}.jpg`,
      };

      const allCompleted = data.renderJobs.every((item, idx) =>
        idx === targetIndex ? true : item.status === "completed"
      );
      data.projectStatus = allCompleted ? "completed" : "rendering";
      data.wizardStep = allCompleted ? "download" : "render";

      await updateShortsProjectForUser(getPlaceholderUserId(), parsed.projectId, data);
    }

    const latest = normalizeSavedShortsData(data).renderJobs.find(
      (item) => item.id === parsed.jobId
    );
    if (!latest) {
      return NextResponse.json({ error: "Render job not found" }, { status: 404 });
    }
    return NextResponse.json({
      id: renderId,
      status: latest.status,
      outputUrl: latest.outputUrl,
      subtitleUrl: latest.subtitleUrl,
      thumbnailUrl: latest.thumbnailUrl,
      error: latest.error,
    });
  } catch {
    return dbUnavailableResponse();
  }
}
