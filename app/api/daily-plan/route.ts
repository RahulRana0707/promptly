import { NextResponse } from "next/server";

import { getPlaceholderUserId } from "@/lib/constants/dev-user-id";
import {
  deleteDailyPlanForUserDate,
  getDailyPlanForUserDate,
  listDailyPlanDaysForUser,
  parsePlanDateKey,
  upsertDailyPlanForUserDate,
} from "@/lib/db/daily-plan";
import {
  GeminiRequestError,
  GeminiResponseError,
  GeminiUnavailableError,
  generateGeminiJsonText,
} from "@/lib/gemini";
import { ALL_PATTERN_IDS, PATTERN_CATALOG } from "@/lib/patterns";
import { STUDIO_VOICE_PREAMBLE } from "@/lib/prompts/studio-voice";
import {
  dailyPlanFromJson,
  isSignalTarget,
  isToneRisk,
} from "@/lib/types/daily-plan";
import { creatorProfileFromJson, profileToPromptBlock } from "@/lib/types/profile";

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

function aiUnavailableResponse() {
  return NextResponse.json(
    {
      error: "AI generation unavailable",
      code: "AI_UNAVAILABLE",
    },
    { status: 503 }
  );
}

function dailyPlanSystemPrompt() {
  return `${STUDIO_VOICE_PREAMBLE}

You generate one daily X content plan as strict JSON.

Output JSON shape:
{
  "engagementPlan": {
    "summary": string,
    "goal": string,
    "keyMetric": string
  },
  "tweets": Array<{
    "content": string,
    "viralScore": number,
    "patternName": string,
    "gifSuggestion": string,
    "reasoning": string,
    "signalTarget": "replies" | "reposts" | "bookmarks"
  }>
}

Rules:
- JSON only. No markdown.
- Tweets array MUST have length exactly 11.
- Keep tweets varied in angle and structure.
- No hashtags.
- Avoid saying "Here's the thing:".
- Keep content practical, clear, and post-ready.
- Write in a human voice (specific moments, real tradeoffs, plain language).
- Prefer short, conversational posts that feel lived-in, not corporate.
- Include relatable details creators/builders commonly face.
- Optimize for replies, reposts, and bookmarks through concrete value.`;
}

function normalizePatternIds(value: unknown): string[] {
  if (!Array.isArray(value)) return ALL_PATTERN_IDS;
  const ids = value
    .filter((x): x is string => typeof x === "string")
    .filter((id) => ALL_PATTERN_IDS.includes(id));
  return ids.length ? ids : ALL_PATTERN_IDS;
}

function normalizeSignals(value: unknown): Array<"replies" | "reposts" | "bookmarks"> {
  if (!Array.isArray(value)) return ["replies", "reposts", "bookmarks"];
  const xs = value.filter(isSignalTarget);
  return xs.length ? xs : ["replies", "reposts", "bookmarks"];
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const planDate = url.searchParams.get("date");

  if (!planDate) {
    try {
      const dates = await listDailyPlanDaysForUser(getPlaceholderUserId());
      return NextResponse.json({ dates });
    } catch {
      return dbUnavailableResponse();
    }
  }

  try {
    parsePlanDateKey(planDate);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid date" },
      { status: 400 }
    );
  }

  try {
    const [dates, plan] = await Promise.all([
      listDailyPlanDaysForUser(getPlaceholderUserId()),
      getDailyPlanForUserDate(getPlaceholderUserId(), planDate),
    ]);
    return NextResponse.json({ dates, plan, planDate });
  } catch {
    return dbUnavailableResponse();
  }
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Body must be an object with planDate and plan" },
      { status: 400 }
    );
  }

  const planDate = (body as { planDate?: unknown }).planDate;
  const rawPlan = (body as { plan?: unknown }).plan;
  if (typeof planDate !== "string") {
    return NextResponse.json({ error: "Missing planDate" }, { status: 400 });
  }
  if (rawPlan === undefined) {
    return NextResponse.json({ error: "Missing plan" }, { status: 400 });
  }

  try {
    parsePlanDateKey(planDate);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid planDate" },
      { status: 400 }
    );
  }

  const plan = dailyPlanFromJson(rawPlan);
  if (!plan || !plan.tweets.length) {
    return NextResponse.json(
      { error: "Invalid plan payload" },
      { status: 400 }
    );
  }

  try {
    const saved = await upsertDailyPlanForUserDate(
      getPlaceholderUserId(),
      planDate,
      plan
    );
    return NextResponse.json({ plan: saved, planDate });
  } catch {
    return dbUnavailableResponse();
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const planDate = url.searchParams.get("date");
  if (!planDate) {
    return NextResponse.json({ error: "Missing date" }, { status: 400 });
  }

  try {
    parsePlanDateKey(planDate);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid date" },
      { status: 400 }
    );
  }

  try {
    const deleted = await deleteDailyPlanForUserDate(
      getPlaceholderUserId(),
      planDate
    );
    return NextResponse.json({ ok: true, deleted });
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
      { error: "Body must be an object" },
      { status: 400 }
    );
  }

  const planDate = (body as { planDate?: unknown }).planDate;
  if (typeof planDate !== "string") {
    return NextResponse.json({ error: "Missing planDate" }, { status: 400 });
  }
  try {
    parsePlanDateKey(planDate);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid planDate" },
      { status: 400 }
    );
  }

  const rawProfile = (body as { profile?: unknown }).profile;
  const profile = creatorProfileFromJson(rawProfile);
  const patternIds = normalizePatternIds((body as { patternIds?: unknown }).patternIds);
  const signalTargets = normalizeSignals(
    (body as { signalTargets?: unknown }).signalTargets
  );
  const toneRiskRaw = (body as { toneRisk?: unknown }).toneRisk;
  const toneRisk = isToneRisk(toneRiskRaw) ? toneRiskRaw : "balanced";
  const selectedPatterns = PATTERN_CATALOG.filter((p) =>
    patternIds.includes(p.id)
  )
    .map((p) => `- ${p.name} (${p.id}): ${p.triggers}`)
    .join("\n");

  const userMessage = `Date: ${planDate}
Tone/risk: ${toneRisk}
Signal targets to rotate: ${signalTargets.join(", ")}
Allowed pattern IDs for this run:
${selectedPatterns}

Signal target intent:
- replies = ask for opinions, stories, or decisions that invite conversation
- reposts = clear takeaway people want to share with their audience
- bookmarks = practical checklists/frameworks worth saving

Creator profile:
${profileToPromptBlock(profile)}

Return strict JSON only. tweets length MUST be 11.`;

  let rawText: string;
  try {
    rawText = await generateGeminiJsonText({
      systemInstruction: dailyPlanSystemPrompt(),
      userMessage,
    });
  } catch (e) {
    if (e instanceof GeminiUnavailableError) return aiUnavailableResponse();
    if (e instanceof GeminiRequestError) {
      return NextResponse.json(
        { error: "Gemini request failed", code: "GEMINI_HTTP", detail: e.bodySnippet },
        { status: 502 }
      );
    }
    if (e instanceof GeminiResponseError) {
      return NextResponse.json(
        { error: e.message, code: "GEMINI_RESPONSE" },
        { status: 502 }
      );
    }
    throw e;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText) as unknown;
  } catch {
    return NextResponse.json(
      { error: "Model did not return valid JSON", code: "PLAN_PARSE" },
      { status: 502 }
    );
  }

  let plan = dailyPlanFromJson(parsed);

  if (!plan || plan.tweets.length !== 11) {
    const repairUser = `Fix this into valid DailyPlanResult JSON.
tweets length must be exactly 11.
JSON only.

Bad output:
${rawText.slice(0, 12000)}`;
    try {
      const repaired = await generateGeminiJsonText({
        systemInstruction: "Fix JSON only. DailyPlanResult shape. Tweets length 11.",
        userMessage: repairUser,
      });
      const repairedParsed = JSON.parse(repaired) as unknown;
      plan = dailyPlanFromJson(repairedParsed);
    } catch {
      // ignore, handled below
    }
  }

  if (!plan || plan.tweets.length !== 11) {
    return NextResponse.json(
      {
        error: "Could not produce a valid daily plan with exactly 11 tweets",
        code: "PLAN_INVALID",
      },
      { status: 502 }
    );
  }

  try {
    await upsertDailyPlanForUserDate(getPlaceholderUserId(), planDate, plan);
  } catch {
    // generation should still succeed without persistence
  }

  return NextResponse.json({ plan, planDate });
}
