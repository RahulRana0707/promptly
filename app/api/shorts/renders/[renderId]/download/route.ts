import { NextResponse } from "next/server";

import { getPlaceholderUserId } from "@/lib/constants/dev-user-id";
import { getShortsProjectForUser } from "@/lib/db/shorts";
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
    const job = data.renderJobs.find((item) => item.id === parsed.jobId);
    if (!job) {
      return NextResponse.json({ error: "Render job not found" }, { status: 404 });
    }

    if (job.status !== "completed" || !job.outputUrl.trim()) {
      return NextResponse.json(
        { error: "Render is not ready for download yet" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      id: renderId,
      downloadUrl: job.outputUrl,
      subtitleUrl: job.subtitleUrl,
      thumbnailUrl: job.thumbnailUrl,
    });
  } catch {
    return dbUnavailableResponse();
  }
}
