import type {
  MomentCandidate,
  RenderJob,
  RenderPreset,
  ShortsProjectStatus,
  ShortsSourceType,
  ShortsWizardStep,
  TranscriptSegment,
} from "@/lib/types/shorts-draft";

const SHORTS_WIZARD_STEPS: ShortsWizardStep[] = [
  "source",
  "transcript",
  "moments",
  "selection",
  "render",
  "download",
];

const SHORTS_PROJECT_STATUSES: ShortsProjectStatus[] = [
  "created",
  "ingesting",
  "transcribing",
  "analyzing",
  "ready_for_selection",
  "rendering",
  "completed",
  "failed",
];

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function asFiniteNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function asWizardStep(value: unknown): ShortsWizardStep {
  if (SHORTS_WIZARD_STEPS.includes(value as ShortsWizardStep)) {
    return value as ShortsWizardStep;
  }
  return "source";
}

function asProjectStatus(value: unknown): ShortsProjectStatus {
  if (SHORTS_PROJECT_STATUSES.includes(value as ShortsProjectStatus)) {
    return value as ShortsProjectStatus;
  }
  return "created";
}

function asSourceType(value: unknown): ShortsSourceType {
  return value === "youtube" ? "youtube" : "other";
}

function normalizeScoreBand(value: unknown): MomentCandidate["scoreBand"] {
  if (value === "breakout" || value === "strong" || value === "backup") return value;
  return "backup";
}

function normalizeTranscript(value: unknown): TranscriptSegment[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const o = item as Record<string, unknown>;
      const startSec = asFiniteNumber(o.startSec, 0);
      const endSec = Math.max(asFiniteNumber(o.endSec, startSec), startSec);
      const text = asString(o.text);
      if (!text.trim()) return null;
      return {
        id: asString(o.id) || `segment-${index + 1}`,
        startSec,
        endSec,
        speaker: asString(o.speaker),
        text,
      } satisfies TranscriptSegment;
    })
    .filter((item): item is TranscriptSegment => item !== null);
}

function normalizeCandidates(value: unknown): MomentCandidate[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const o = item as Record<string, unknown>;
      const startSec = asFiniteNumber(o.startSec, 0);
      const endSec = Math.max(asFiniteNumber(o.endSec, startSec), startSec);
      const score = Math.max(0, Math.min(100, asFiniteNumber(o.score, 0)));
      return {
        id: asString(o.id) || `candidate-${index + 1}`,
        startSec,
        endSec,
        score,
        title: asString(o.title) || `Clip ${index + 1}`,
        reason: asString(o.reason),
        tags: asStringArray(o.tags),
        scoreBand: normalizeScoreBand(o.scoreBand),
        blocked: asBoolean(o.blocked, false),
        blockedReason: asString(o.blockedReason),
      } satisfies MomentCandidate;
    })
    .filter((item): item is MomentCandidate => item !== null);
}

function normalizeRenderPreset(value: unknown): RenderPreset {
  const o =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  const captionStyle =
    o.captionStyle === "clean" || o.captionStyle === "bold_kinetic" || o.captionStyle === "minimal"
      ? o.captionStyle
      : "clean";

  return {
    aspectRatio: "9:16",
    captionStyle,
    includeBranding: asBoolean(o.includeBranding, true),
  };
}

function normalizeRenderJobs(value: unknown): RenderJob[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const o = item as Record<string, unknown>;
      const status =
        o.status === "queued" ||
        o.status === "running" ||
        o.status === "completed" ||
        o.status === "failed"
          ? o.status
          : "queued";

      return {
        id: asString(o.id) || `render-${index + 1}`,
        candidateId: asString(o.candidateId),
        status,
        outputUrl: asString(o.outputUrl),
        subtitleUrl: asString(o.subtitleUrl),
        thumbnailUrl: asString(o.thumbnailUrl),
        error: asString(o.error),
      } satisfies RenderJob;
    })
    .filter((item): item is RenderJob => item !== null);
}

export type SavedShortsData = {
  sourceUrl: string;
  sourceType: ShortsSourceType;
  sourceTitle: string;
  sourceDurationSec: number;
  language: string;
  transcript: TranscriptSegment[];
  candidates: MomentCandidate[];
  selectedCandidateIds: string[];
  renderPreset: RenderPreset;
  renderJobs: RenderJob[];
  projectStatus: ShortsProjectStatus;
  wizardStep: ShortsWizardStep;
  error: string;
};

export function normalizeSavedShortsData(data: unknown): SavedShortsData {
  const o =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};

  return {
    sourceUrl: asString(o.sourceUrl),
    sourceType: asSourceType(o.sourceType),
    sourceTitle: asString(o.sourceTitle),
    sourceDurationSec: Math.max(0, asFiniteNumber(o.sourceDurationSec, 0)),
    language: asString(o.language),
    transcript: normalizeTranscript(o.transcript),
    candidates: normalizeCandidates(o.candidates),
    selectedCandidateIds: asStringArray(o.selectedCandidateIds),
    renderPreset: normalizeRenderPreset(o.renderPreset),
    renderJobs: normalizeRenderJobs(o.renderJobs),
    projectStatus: asProjectStatus(o.projectStatus),
    wizardStep: asWizardStep(o.wizardStep),
    error: asString(o.error),
  };
}

export function deriveShortsListTitle(data: SavedShortsData): string {
  const fromTitle = data.sourceTitle.trim();
  if (fromTitle.length) return fromTitle;
  const fromUrl = data.sourceUrl.trim();
  if (fromUrl.length) return fromUrl;
  return "Untitled shorts project";
}
