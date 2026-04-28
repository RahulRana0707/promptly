import type { TranscriptSegment } from "@/lib/types/shorts-draft";

type Json3Event = {
  tStartMs?: number;
  dDurationMs?: number;
  segs?: Array<{ utf8?: string }>;
};

function decodeEscapedJson(raw: string): string {
  return raw
    .replace(/\\u0026/g, "&")
    .replace(/\\\//g, "/")
    .replace(/\\"/g, '"');
}

function extractYouTubeVideoId(rawUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (host === "youtu.be") {
    const id = url.pathname.replace(/^\/+/, "").trim();
    return id || null;
  }
  if (host.endsWith("youtube.com")) {
    if (url.pathname === "/watch") {
      return url.searchParams.get("v");
    }
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts[0] === "shorts" || parts[0] === "embed") {
      return parts[1] ?? null;
    }
  }
  return null;
}

async function fetchCaptionBaseUrl(videoId: string): Promise<string | null> {
  const watchRes = await fetch(`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`, {
    cache: "no-store",
  });
  if (!watchRes.ok) return null;
  const html = await watchRes.text();
  const match = html.match(/"captionTracks":(\[[\s\S]*?\])/);
  if (!match?.[1]) return null;
  const captionTracksRaw = decodeEscapedJson(match[1]);
  let tracks: Array<{ baseUrl?: string; vssId?: string; languageCode?: string }> = [];
  try {
    tracks = JSON.parse(captionTracksRaw);
  } catch {
    return null;
  }
  if (!tracks.length) return null;
  const englishTrack =
    tracks.find((track) => track.languageCode?.startsWith("en")) ?? tracks[0];
  return englishTrack?.baseUrl ?? null;
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function eventsToSegments(events: Json3Event[]): TranscriptSegment[] {
  return events
    .map((event, index) => {
      const text = normalizeText(
        (event.segs ?? [])
          .map((seg) => seg.utf8 ?? "")
          .join("")
          .replace(/\n/g, " ")
      );
      if (!text) return null;
      const startSec = Math.max(0, Math.floor((event.tStartMs ?? 0) / 1000));
      const durationSec = Math.max(1, Math.ceil((event.dDurationMs ?? 1000) / 1000));
      const endSec = startSec + durationSec;
      return {
        id: `segment-${index + 1}`,
        startSec,
        endSec,
        speaker: "",
        text,
      } satisfies TranscriptSegment;
    })
    .filter((item): item is TranscriptSegment => item !== null);
}

export async function fetchYouTubeTranscript(rawUrl: string): Promise<{
  segments: TranscriptSegment[];
  language: string;
}> {
  const videoId = extractYouTubeVideoId(rawUrl);
  if (!videoId) {
    throw new Error("Could not parse YouTube video id from URL");
  }

  const baseUrl = await fetchCaptionBaseUrl(videoId);
  const json3Url = baseUrl
    ? `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}fmt=json3`
    : `https://www.youtube.com/api/timedtext?v=${encodeURIComponent(videoId)}&lang=en&fmt=json3`;

  const res = await fetch(json3Url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error("Could not fetch YouTube captions");
  }
  const payload = (await res.json()) as { events?: Json3Event[] };
  const events = Array.isArray(payload.events) ? payload.events : [];
  const segments = eventsToSegments(events);
  if (!segments.length) {
    throw new Error(
      "No transcript available for this video. Try a video with captions enabled."
    );
  }

  return { segments, language: "en" };
}
