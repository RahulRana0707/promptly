export type ShortsWizardStep =
  | "source"
  | "transcript"
  | "moments"
  | "selection"
  | "render"
  | "download";

export type ShortsProjectStatus =
  | "created"
  | "ingesting"
  | "transcribing"
  | "analyzing"
  | "ready_for_selection"
  | "rendering"
  | "completed"
  | "failed";

export type ShortsSourceType = "youtube" | "other";

export type TranscriptSegment = {
  id: string;
  startSec: number;
  endSec: number;
  speaker: string;
  text: string;
};

export type MomentScoreBand = "breakout" | "strong" | "backup";

export type MomentCandidate = {
  id: string;
  startSec: number;
  endSec: number;
  score: number;
  title: string;
  reason: string;
  tags: string[];
  scoreBand: MomentScoreBand;
  blocked: boolean;
  blockedReason: string;
};

export type CaptionStyleId = "clean" | "bold_kinetic" | "minimal";

export type RenderPreset = {
  aspectRatio: "9:16";
  captionStyle: CaptionStyleId;
  includeBranding: boolean;
};

export type RenderJobStatus = "queued" | "running" | "completed" | "failed";

export type RenderJob = {
  id: string;
  candidateId: string;
  status: RenderJobStatus;
  outputUrl: string;
  subtitleUrl: string;
  thumbnailUrl: string;
  error: string;
};
