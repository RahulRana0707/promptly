import { NextResponse } from "next/server";

import { getPlaceholderUserId } from "@/lib/constants/dev-user-id";
import {
  getShortsProjectForUser,
  updateShortsProjectForUser,
} from "@/lib/db/shorts";
import { isSupportedSourceUrl, logShortsApiEvent } from "@/lib/shorts/policy";
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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = getPlaceholderUserId();
  if (!id) {
    return NextResponse.json({ error: "Missing project id" }, { status: 400 });
  }

  try {
    const project = await getShortsProjectForUser(userId, id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch {
    return dbUnavailableResponse();
  }
}

export async function PUT(
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
      { error: "Body must be an object with data" },
      { status: 400 }
    );
  }

  const rawData = (body as { data?: unknown }).data;
  if (rawData === undefined) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const data = normalizeSavedShortsData(rawData);
  if (!isSupportedSourceUrl(data.sourceUrl)) {
    return NextResponse.json(
      {
        error: "Unsupported source URL. Use a supported podcast/video host.",
        code: "SOURCE_UNSUPPORTED",
      },
      { status: 422 }
    );
  }

  try {
    const ok = await updateShortsProjectForUser(userId, id, data);
    if (!ok) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    logShortsApiEvent({
      route: "projects/[id]",
      stage: "update_success",
      projectId: id,
      userId,
    });
    return NextResponse.json({ ok: true });
  } catch {
    logShortsApiEvent({
      route: "projects/[id]",
      stage: "update_failed",
      projectId: id,
      userId,
      code: "SAVE_UNAVAILABLE",
    });
    return dbUnavailableResponse();
  }
}
