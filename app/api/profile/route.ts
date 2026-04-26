import { NextResponse } from "next/server";

import { getPlaceholderUserId } from "@/lib/constants/dev-user-id";
import { getProfileForUser, upsertProfileForUser } from "@/lib/db/profile";
import { creatorProfileFromJson } from "@/lib/types/profile";

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
    const profile = await getProfileForUser(getPlaceholderUserId());
    return NextResponse.json({ profile });
  } catch {
    return dbUnavailableResponse();
  }
}

export async function PUT(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const raw =
      body &&
      typeof body === "object" &&
      !Array.isArray(body) &&
      "profile" in body &&
      (body as { profile: unknown }).profile !== undefined
        ? (body as { profile: unknown }).profile
        : body;

    const merged = creatorProfileFromJson(raw);
    const profile = await upsertProfileForUser(
      getPlaceholderUserId(),
      merged
    );
    return NextResponse.json({ profile });
  } catch {
    return dbUnavailableResponse();
  }
}
