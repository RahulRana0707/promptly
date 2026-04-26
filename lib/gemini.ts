import {
  GoogleGenerativeAI,
  GoogleGenerativeAIFetchError,
  GoogleGenerativeAIResponseError,
} from "@google/generative-ai";

const DEFAULT_MODEL = "gemini-2.5-flash";

export class GeminiUnavailableError extends Error {
  constructor(message = "GEMINI_API_KEY is not set") {
    super(message);
    this.name = "GeminiUnavailableError";
  }
}

export class GeminiRequestError extends Error {
  readonly status: number;
  readonly bodySnippet: string;

  constructor(status: number, bodySnippet: string) {
    super(`Gemini request failed (${status})`);
    this.name = "GeminiRequestError";
    this.status = status;
    this.bodySnippet = bodySnippet;
  }
}

export class GeminiResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiResponseError";
  }
}

function stripJsonFences(text: string): string {
  const t = text.trim();
  if (!t.startsWith("```")) return t;
  const withoutOpen = t.replace(/^```(?:json)?\s*/i, "");
  const lastFence = withoutOpen.lastIndexOf("```");
  if (lastFence === -1) return withoutOpen.trim();
  return withoutOpen.slice(0, lastFence).trim();
}

function mapUnknownSdkError(e: unknown): never {
  if (e instanceof GoogleGenerativeAIFetchError) {
    const detail = [e.message, e.statusText].filter(Boolean).join(" ");
    throw new GeminiRequestError(e.status ?? 502, detail.slice(0, 500));
  }
  if (e instanceof GoogleGenerativeAIResponseError) {
    throw new GeminiResponseError(e.message || "Model returned an error response");
  }
  if (e instanceof Error) {
    throw new GeminiResponseError(e.message);
  }
  throw new GeminiResponseError("Unknown Gemini error");
}

/**
 * Calls Gemini with JSON output via `@google/generative-ai`.
 * Uses `GEMINI_API_KEY`; optional `GEMINI_MODEL` overrides the default model id.
 */
export async function generateGeminiJsonText(input: {
  systemInstruction: string;
  userMessage: string;
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new GeminiUnavailableError();
  }

  const modelId =
    process.env.GEMINI_MODEL?.trim().replace(/^models\//, "") ||
    DEFAULT_MODEL;

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelId,
    systemInstruction: input.systemInstruction,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.35,
    },
  });

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: input.userMessage }],
        },
      ],
    });

    const text = result.response.text();
    if (!text?.trim()) {
      throw new GeminiResponseError("Empty response text from model");
    }

    return stripJsonFences(text);
  } catch (e) {
    if (e instanceof GeminiUnavailableError) throw e;
    if (e instanceof GeminiRequestError) throw e;
    if (e instanceof GeminiResponseError) throw e;
    mapUnknownSdkError(e);
  }
}
