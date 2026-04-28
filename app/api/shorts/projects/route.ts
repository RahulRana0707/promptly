import { NextResponse } from "next/server";

import { getPlaceholderUserId } from "@/lib/constants/dev-user-id";
import {
  createShortsProjectForUser,
  listShortsForUser,
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

export async function GET() {
  const userId = getPlaceholderUserId();
  try {
    const projects = await listShortsForUser(userId);
    logShortsApiEvent({
      route: "projects",
      stage: "list_success",
      userId,
      detail: `count=${projects.length}`,
    });
    return NextResponse.json({ projects });
  } catch {
    logShortsApiEvent({
      route: "projects",
      stage: "list_failed",
      userId,
      code: "SAVE_UNAVAILABLE",
    });
    return dbUnavailableResponse();
  }
}

export async function POST(request: Request) {
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
  const userId = getPlaceholderUserId();
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
    const created = await createShortsProjectForUser(userId, data);
    logShortsApiEvent({
      route: "projects",
      stage: "create_success",
      projectId: created.id,
      userId,
    });
    return NextResponse.json(created);
  } catch {
    logShortsApiEvent({
      route: "projects",
      stage: "create_failed",
      userId,
      code: "SAVE_UNAVAILABLE",
    });
    return dbUnavailableResponse();
  }
}
