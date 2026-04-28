import { NextResponse } from "next/server";

import { getPlaceholderUserId } from "@/lib/constants/dev-user-id";
import {
  createShortsProjectForUser,
  listShortsForUser,
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

export async function GET() {
  try {
    const projects = await listShortsForUser(getPlaceholderUserId());
    return NextResponse.json({ projects });
  } catch {
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

  try {
    const created = await createShortsProjectForUser(getPlaceholderUserId(), data);
    return NextResponse.json(created);
  } catch {
    return dbUnavailableResponse();
  }
}
