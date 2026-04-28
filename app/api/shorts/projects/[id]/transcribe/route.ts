import { NextResponse } from "next/server";

import { getPlaceholderUserId } from "@/lib/constants/dev-user-id";
import {
  getShortsProjectForUser,
  updateShortsProjectForUser,
} from "@/lib/db/shorts";
import type { TranscriptSegment } from "@/lib/types/shorts-draft";
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

function buildMockTranscript(seedText: string): TranscriptSegment[] {
  const base = seedText.trim() || "Podcast conversation about practical growth strategies.";
  const lines = [
    "Most creators over-optimize tools instead of mastering audience psychology.",
    "The first 30 seconds decide whether viewers keep watching or skip.",
    "A simple contrarian point often outperforms generic advice.",
    "Stories with clear tension and payoff drive stronger completion rates.",
    "Actionable one-step takeaways usually produce higher shares and saves.",
    "Consistency beats intensity when you are compounding distribution over time.",
  ];

  return lines.map((line, index) => {
    const startSec = index * 35;
    const endSec = startSec + 30;
    return {
      id: `segment-${index + 1}`,
      startSec,
      endSec,
      speaker: index % 2 === 0 ? "Host" : "Guest",
      text: `${line} ${index === 0 ? base : ""}`.trim(),
    };
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing project id" }, { status: 400 });
  }

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // optional body; ignore parse errors and continue with defaults
  }

  const force =
    body && typeof body === "object" && !Array.isArray(body)
      ? Boolean((body as { force?: unknown }).force)
      : false;

  try {
    const project = await getShortsProjectForUser(getPlaceholderUserId(), id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const data = normalizeSavedShortsData(project.data);
    const shouldReuse = !force && data.transcript.length > 0;
    const transcript = shouldReuse
      ? data.transcript
      : buildMockTranscript(data.sourceTitle || data.sourceUrl);

    const nextData = normalizeSavedShortsData({
      ...data,
      transcript,
      language: data.language || "en",
      projectStatus: "transcribing",
      wizardStep: "transcript",
      error: "",
    });

    const ok = await updateShortsProjectForUser(getPlaceholderUserId(), id, nextData);
    if (!ok) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      status: "transcribing",
      transcriptSegments: nextData.transcript.length,
    });
  } catch {
    return dbUnavailableResponse();
  }
}
