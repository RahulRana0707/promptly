import { NextResponse } from "next/server";

import { getPlaceholderUserId } from "@/lib/constants/dev-user-id";
import {
  getShortsProjectForUser,
  updateShortsProjectForUser,
} from "@/lib/db/shorts";
import {
  consumeShortsQuota,
  isSupportedSourceUrl,
  logShortsApiEvent,
} from "@/lib/shorts/policy";
import { fetchYouTubeTranscript } from "@/lib/shorts/youtube-transcript";
import { normalizeSavedShortsData } from "@/lib/types/saved-shorts";

export const dynamic = "force-dynamic";

const LEGACY_MOCK_MARKERS = [
  "Most creators over-optimize tools instead of mastering audience psychology.",
  "The first 30 seconds decide whether viewers keep watching or skip.",
  "A simple contrarian point often outperforms generic advice.",
];

function dbUnavailableResponse() {
  return NextResponse.json(
    {
      error: "Database unavailable",
      code: "SAVE_UNAVAILABLE",
    },
    { status: 503 }
  );
}

function isLegacyMockTranscript(transcript: Array<{ text: string }>): boolean {
  if (!transcript.length) return false;
  const combined = transcript.map((item) => item.text).join(" ");
  return LEGACY_MOCK_MARKERS.every((marker) => combined.includes(marker));
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
    const project = await getShortsProjectForUser(userId, id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const data = normalizeSavedShortsData(project.data);
    if (!isSupportedSourceUrl(data.sourceUrl)) {
      return NextResponse.json(
        {
          error: "Unsupported source URL. Use a supported podcast/video host.",
          code: "SOURCE_UNSUPPORTED",
        },
        { status: 422 }
      );
    }
    const quota = consumeShortsQuota({ userId, action: "transcribe" });
    if (!quota.ok) {
      return NextResponse.json(
        {
          error: "Transcription quota exceeded. Try again later.",
          code: "QUOTA_EXCEEDED",
          retryAfterSec: quota.retryAfterSec,
        },
        { status: 429 }
      );
    }

    const shouldReuse =
      !force && data.transcript.length > 0 && !isLegacyMockTranscript(data.transcript);
    let transcript = data.transcript;
    let language = data.language || "en";
    if (!shouldReuse) {
      try {
        const fetched = await fetchYouTubeTranscript(data.sourceUrl);
        transcript = fetched.segments;
        language = fetched.language;
      } catch (e) {
        const message =
          e instanceof Error ? e.message : "Could not transcribe the provided video URL.";
        return NextResponse.json(
          { error: message, code: "TRANSCRIPT_UNAVAILABLE" },
          { status: 422 }
        );
      }
    }

    const nextData = normalizeSavedShortsData({
      ...data,
      transcript,
      language,
      projectStatus: "transcribing",
      wizardStep: "transcript",
      error: "",
    });

    const ok = await updateShortsProjectForUser(userId, id, nextData);
    if (!ok) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    logShortsApiEvent({
      route: "projects/[id]/transcribe",
      stage: "transcribe_success",
      projectId: id,
      userId,
      detail: `segments=${nextData.transcript.length}`,
    });

    return NextResponse.json({
      ok: true,
      status: "transcribing",
      transcriptSegments: nextData.transcript.length,
      transcript: nextData.transcript,
      language: nextData.language,
    });
  } catch {
    logShortsApiEvent({
      route: "projects/[id]/transcribe",
      stage: "transcribe_failed",
      projectId: id,
      userId,
      code: "SAVE_UNAVAILABLE",
    });
    return dbUnavailableResponse();
  }
}
