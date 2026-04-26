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

const ANALYSIS_SYSTEM_SUFFIX = `You analyze X creator profiles for growth alignment. Output ONLY valid JSON matching this shape (no markdown, no prose outside JSON):
{
  "alignmentScore": number (0-100),
  "topicLeverageMap": { "doubleDown": string[], "explore": string[], "drop": string[] },
  "voiceAuthorityZones": string[],
  "strategicBlindSpots": string[],
  "summary": string
}

Use short strings in arrays. "summary" should be actionable next steps (plain text, may use newlines inside the string).`;

function aiUnavailableResponse() {
  return NextResponse.json(
    {
      error: "AI analysis unavailable",
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
  const systemInstruction = `${STUDIO_VOICE_PREAMBLE}\n\n${ANALYSIS_SYSTEM_SUFFIX}`;
  const userMessage = `Profile to analyze:\n\n${profileToPromptBlock(profile)}`;

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
        code: "ANALYSIS_PARSE",
        raw: rawText.slice(0, 1200),
      },
      { status: 502 }
    );
  }

  const analysis = profileAnalysisFromJson(parsed);
  if (!analysis) {
    return NextResponse.json(
      {
        error: "Parsed JSON did not match ProfileAnalysis (check alignmentScore)",
        code: "ANALYSIS_SHAPE",
        raw: rawText.slice(0, 1200),
      },
      { status: 502 }
    );
  }

  return NextResponse.json({ analysis });
}
