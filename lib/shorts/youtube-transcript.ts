import type { TranscriptSegment } from "@/lib/types/shorts-draft";

type Json3Event = {
  tStartMs?: number;
  dDurationMs?: number;
  segs?: Array<{ utf8?: string }>;
};

type CaptionTrack = {
  baseUrl?: string;
  languageCode?: string;
  name?: { simpleText?: string };
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

async function fetchCaptionTracks(videoId: string): Promise<CaptionTrack[]> {
  const watchRes = await fetch(`https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`, {
    cache: "no-store",
  });
  if (!watchRes.ok) return [];
  const html = await watchRes.text();
  const match = html.match(/"captionTracks":(\[[\s\S]*?\])/);
  if (!match?.[1]) return [];
  const captionTracksRaw = decodeEscapedJson(match[1]);
  try {
    const tracks = JSON.parse(captionTracksRaw) as CaptionTrack[];
    return Array.isArray(tracks) ? tracks : [];
  } catch {
    return [];
  }
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
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

function xmlToSegments(xmlText: string): TranscriptSegment[] {
  const matches = Array.from(xmlText.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g));
  return matches
    .map((match, index) => {
      const attrs = match[1] ?? "";
      const content = normalizeText(decodeHtmlEntities(match[2] ?? ""));
      if (!content) return null;

      const startMatch = attrs.match(/\bstart="([^"]+)"/);
      const durMatch = attrs.match(/\bdur="([^"]+)"/);
      const start = startMatch ? Number.parseFloat(startMatch[1]) : 0;
      const dur = durMatch ? Number.parseFloat(durMatch[1]) : 1;
      const startSec = Number.isFinite(start) ? Math.max(0, Math.floor(start)) : 0;
      const endSec = Math.max(startSec + 1, startSec + (Number.isFinite(dur) ? Math.ceil(dur) : 1));
      return {
        id: `segment-${index + 1}`,
        startSec,
        endSec,
        speaker: "",
        text: content,
      } satisfies TranscriptSegment;
    })
    .filter((item): item is TranscriptSegment => item !== null);
}

async function tryFetchJson3(url: string): Promise<TranscriptSegment[]> {
  const json3Url = `${url}${url.includes("?") ? "&" : "?"}fmt=json3`;
  const res = await fetch(json3Url, { cache: "no-store" });
  if (!res.ok) return [];
  const raw = await res.text();
  if (!raw.trim()) return [];
  try {
    const payload = JSON.parse(raw) as { events?: Json3Event[] };
    const events = Array.isArray(payload.events) ? payload.events : [];
    return eventsToSegments(events);
  } catch {
    return [];
  }
}

async function tryFetchXml(url: string): Promise<TranscriptSegment[]> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return [];
  const xmlText = await res.text();
  if (!xmlText.trim() || !xmlText.includes("<text")) return [];
  return xmlToSegments(xmlText);
}

export async function fetchYouTubeTranscript(rawUrl: string): Promise<{
  segments: TranscriptSegment[];
  language: string;
}> {
  const videoId = extractYouTubeVideoId(rawUrl);
  if (!videoId) {
    throw new Error("Could not parse YouTube video id from URL");
  }

  const tracks = await fetchCaptionTracks(videoId);
  const candidates = tracks.length
    ? tracks
        .slice()
        .sort((a, b) => {
          const aEn = a.languageCode?.startsWith("en") ? 0 : 1;
          const bEn = b.languageCode?.startsWith("en") ? 0 : 1;
          return aEn - bEn;
        })
        .map((track) => ({
          url: track.baseUrl ?? "",
          language: track.languageCode || "unknown",
        }))
        .filter((item) => item.url)
    : [
        {
          url: `https://www.youtube.com/api/timedtext?v=${encodeURIComponent(videoId)}&lang=en`,
          language: "en",
        },
      ];

  for (const candidate of candidates) {
    const jsonSegments = await tryFetchJson3(candidate.url);
    if (jsonSegments.length) {
      return { segments: jsonSegments, language: candidate.language };
    }
    const xmlSegments = await tryFetchXml(candidate.url);
    if (xmlSegments.length) {
      return { segments: xmlSegments, language: candidate.language };
    }
  }

  throw new Error("No transcript available for this video. Captions may be disabled.");
}
