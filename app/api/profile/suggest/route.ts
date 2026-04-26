import { NextResponse } from "next/server";

import {
  GeminiRequestError,
  GeminiResponseError,
  GeminiUnavailableError,
  generateGeminiJsonText,
} from "@/lib/gemini";
import { STUDIO_VOICE_PREAMBLE } from "@/lib/prompts/studio-voice";
import {
  creatorProfileFromJson,
  profileAnalysisFromJson,
  profileToPromptBlock,
} from "@/lib/types/profile";

const SUGGEST_SYSTEM_SUFFIX = `You rewrite and improve a creator's saved profile for X (Twitter). Output ONLY valid JSON (no markdown, no prose) with exactly these keys:
bio, niche, techStack, currentWork, goals, targetAudience, careerStage, corePersonality, toneNotes, wordsUse, wordsAvoid

Rules:
- careerStage must be one of: beginner, intermediate, advanced, expert
- All other fields are strings. Use empty string only when truly unknown.
- Be specific and human; avoid corporate buzzwords unless the creator uses them.
- wordsUse and wordsAvoid: short comma-separated lists of words or phrases.
- If a "growth analysis" JSON object is provided, align topics and voice with it while keeping the profile coherent.
- When the current profile already has concrete facts, keep and sharpen them rather than replacing with generics.`;

function aiUnavailableResponse() {
  return NextResponse.json(
    {
      error: "AI suggestion unavailable",
      code: "AI_UNAVAILABLE",
    },
    { status: 503 }
  );
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
      { error: "Body must be an object with profile" },
      { status: 400 }
    );
  }

  const rawProfile = (body as { profile?: unknown }).profile;
  if (rawProfile === undefined) {
    return NextResponse.json(
      { error: "Missing profile in body" },
      { status: 400 }
    );
  }

  const profile = creatorProfileFromJson(rawProfile);
  const rawAnalysis = (body as { analysis?: unknown }).analysis;
  const analysis =
    rawAnalysis === undefined || rawAnalysis === null
      ? null
      : profileAnalysisFromJson(rawAnalysis);

  const systemInstruction = `${STUDIO_VOICE_PREAMBLE}\n\n${SUGGEST_SYSTEM_SUFFIX}`;
  const userMessage = `Current profile:\n\n${profileToPromptBlock(profile)}\n\nOptional growth analysis (JSON or null):\n${analysis ? JSON.stringify(analysis) : "null"}`;

  let rawText: string;
  try {
    rawText = await generateGeminiJsonText({
      systemInstruction,
      userMessage,
    });
  } catch (e) {
    if (e instanceof GeminiUnavailableError) {
      return aiUnavailableResponse();
    }
    if (e instanceof GeminiRequestError) {
      return NextResponse.json(
        {
          error: "Gemini request failed",
          code: "GEMINI_HTTP",
          detail: e.bodySnippet,
        },
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
      {
        error: "Model did not return valid JSON",
        code: "SUGGEST_PARSE",
        raw: rawText.slice(0, 1200),
      },
      { status: 502 }
    );
  }

  const suggested = creatorProfileFromJson(parsed);
  return NextResponse.json({ profile: suggested });
}
