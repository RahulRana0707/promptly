import { NextResponse } from "next/server";

import { getPlaceholderUserId } from "@/lib/constants/dev-user-id";
import {
  getArticleForUser,
  updateArticleForUser,
} from "@/lib/db/articles";
import { normalizeSavedArticleData } from "@/lib/types/saved-article";

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
  if (!id) {
    return NextResponse.json({ error: "Missing article id" }, { status: 400 });
  }

  try {
    const article = await getArticleForUser(getPlaceholderUserId(), id);
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    return NextResponse.json(article);
  } catch {
    return dbUnavailableResponse();
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing article id" }, { status: 400 });
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

  const data = normalizeSavedArticleData(rawData);

  try {
    const ok = await updateArticleForUser(getPlaceholderUserId(), id, data);
    if (!ok) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return dbUnavailableResponse();
  }
}
