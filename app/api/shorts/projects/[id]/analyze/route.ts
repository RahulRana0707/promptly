import { NextResponse } from "next/server";

import { getPlaceholderUserId } from "@/lib/constants/dev-user-id";
import {
  getShortsProjectForUser,
  updateShortsProjectForUser,
} from "@/lib/db/shorts";
import type { MomentCandidate, TranscriptSegment } from "@/lib/types/shorts-draft";
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

function deriveScoreBand(score: number): MomentCandidate["scoreBand"] {
  if (score >= 90) return "breakout";
  if (score >= 80) return "strong";
  return "backup";
}

function scoreWindow(segments: TranscriptSegment[]): number {
  const joined = segments.map((s) => s.text.toLowerCase()).join(" ");
  let score = 70;
  if (joined.includes("first 30 seconds")) score += 8;
  if (joined.includes("contrarian")) score += 7;
  if (joined.includes("story")) score += 5;
  if (joined.includes("actionable")) score += 6;
  if (joined.includes("payoff")) score += 5;
  return Math.min(98, score);
}

function buildCandidates(
  transcript: TranscriptSegment[],
  targetClipCount: number,
  minScore: number
): MomentCandidate[] {
  const candidates: MomentCandidate[] = [];
  for (let i = 0; i < transcript.length; i += 2) {
    const chunk = transcript.slice(i, i + 2);
    if (!chunk.length) continue;
    const startSec = chunk[0]?.startSec ?? 0;
    const endSec = chunk[chunk.length - 1]?.endSec ?? startSec;
    const score = scoreWindow(chunk);
    if (score < minScore) continue;
    const id = `candidate-${candidates.length + 1}`;
    candidates.push({
      id,
      startSec,
      endSec,
      score,
      title: `Clip ${candidates.length + 1}: ${chunk[0]?.text.slice(0, 40) ?? "Highlight"}`,
      reason: "Strong hook density with clear payoff and practical takeaway.",
      tags: ["hook", "insight"],
      scoreBand: deriveScoreBand(score),
      blocked: false,
      blockedReason: "",
    });
    if (candidates.length >= targetClipCount) break;
  }
  return candidates;
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
    // optional body
  }
  const targetClipCountRaw =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as { targetClipCount?: unknown }).targetClipCount
      : undefined;
  const minScoreRaw =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as { minScore?: unknown }).minScore
      : undefined;

  const targetClipCount =
    typeof targetClipCountRaw === "number" && Number.isFinite(targetClipCountRaw)
      ? Math.max(1, Math.min(20, Math.floor(targetClipCountRaw)))
      : 8;
  const minScore =
    typeof minScoreRaw === "number" && Number.isFinite(minScoreRaw)
      ? Math.max(0, Math.min(100, Math.floor(minScoreRaw)))
      : 80;

  try {
    const project = await getShortsProjectForUser(getPlaceholderUserId(), id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const data = normalizeSavedShortsData(project.data);
    if (!data.transcript.length) {
      return NextResponse.json(
        { error: "Transcript not ready. Run transcribe first." },
        { status: 422 }
      );
    }

    const candidates = buildCandidates(data.transcript, targetClipCount, minScore);
    if (!candidates.length) {
      return NextResponse.json(
        { error: "No candidate moments met the minimum score threshold." },
        { status: 422 }
      );
    }

    const nextData = normalizeSavedShortsData({
      ...data,
      candidates,
      selectedCandidateIds: [],
      projectStatus: "ready_for_selection",
      wizardStep: "moments",
      error: "",
    });

    const ok = await updateShortsProjectForUser(getPlaceholderUserId(), id, nextData);
    if (!ok) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ candidates: nextData.candidates });
  } catch {
    return dbUnavailableResponse();
  }
}
