export type CareerStage = "beginner" | "intermediate" | "advanced" | "expert";

export type CreatorProfile = {
  bio: string;
  niche: string;
  techStack: string;
  currentWork: string;
  goals: string;
  targetAudience: string;
  careerStage: CareerStage;
  corePersonality: string;
  toneNotes: string;
  wordsUse: string;
  wordsAvoid: string;
};

export type ProfileAnalysis = {
  alignmentScore: number;
  topicLeverageMap: {
    doubleDown: string[];
    explore: string[];
    drop: string[];
  };
  voiceAuthorityZones: string[];
  strategicBlindSpots: string[];
  summary: string;
};

export function defaultCreatorProfile(): CreatorProfile {
  return {
    bio: "",
    niche: "",
    techStack: "",
    currentWork: "",
    goals: "",
    targetAudience: "",
    careerStage: "intermediate",
    corePersonality:
      "A practical builder who teaches by shipping small wins and sharing what broke along the way.",
    toneNotes:
      "Direct, warm, and specific. Prefer short paragraphs. Avoid hype without proof.",
    wordsUse: "we, ship, learn, scaffold, tradeoff, note",
    wordsAvoid: "synergy, revolutionary, world-class, ninja, crush it",
  };
}

function isCareerStage(value: unknown): value is CareerStage {
  return (
    value === "beginner" ||
    value === "intermediate" ||
    value === "advanced" ||
    value === "expert"
  );
}

function readProfileString(
  raw: Record<string, unknown>,
  key: keyof CreatorProfile,
  fallback: string
): string {
  const v = raw[key];
  return typeof v === "string" ? v : fallback;
}

/**
 * Merge unknown JSON (DB row or API body) with defaults.
 * Unknown keys are ignored; missing keys use defaults.
 */
export function creatorProfileFromJson(data: unknown): CreatorProfile {
  const defaults = defaultCreatorProfile();
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return defaults;
  }
  const o = data as Record<string, unknown>;
  return {
    bio: readProfileString(o, "bio", defaults.bio),
    niche: readProfileString(o, "niche", defaults.niche),
    techStack: readProfileString(o, "techStack", defaults.techStack),
    currentWork: readProfileString(o, "currentWork", defaults.currentWork),
    goals: readProfileString(o, "goals", defaults.goals),
    targetAudience: readProfileString(
      o,
      "targetAudience",
      defaults.targetAudience
    ),
    careerStage: isCareerStage(o.careerStage)
      ? o.careerStage
      : defaults.careerStage,
    corePersonality: readProfileString(
      o,
      "corePersonality",
      defaults.corePersonality
    ),
    toneNotes: readProfileString(o, "toneNotes", defaults.toneNotes),
    wordsUse: readProfileString(o, "wordsUse", defaults.wordsUse),
    wordsAvoid: readProfileString(o, "wordsAvoid", defaults.wordsAvoid),
  };
}

function emptyLine(value: string, label: string): string {
  const v = value.trim();
  return `${label}: ${v.length ? v : "(empty)"}`;
}

/** Human-readable block for LLM user messages (generators + analyze). */
export function profileToPromptBlock(p: CreatorProfile): string {
  return [
    emptyLine(p.bio, "Bio"),
    emptyLine(p.niche, "Niche"),
    emptyLine(p.techStack, "Tech stack"),
    emptyLine(p.currentWork, "Current work"),
    emptyLine(p.goals, "Goals on X"),
    emptyLine(p.targetAudience, "Target audience"),
    emptyLine(p.careerStage, "Career stage"),
    emptyLine(p.corePersonality, "Core personality"),
    emptyLine(p.toneNotes, "Tone"),
    emptyLine(p.wordsUse, "Words to use"),
    emptyLine(p.wordsAvoid, "Words to avoid"),
  ].join("\n");
}

function readStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((x): x is string => typeof x === "string");
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Parse and validate Gemini JSON for profile analysis.
 * Returns `null` if the shape is invalid or `alignmentScore` is not a finite number.
 */
export function profileAnalysisFromJson(data: unknown): ProfileAnalysis | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }
  const o = data as Record<string, unknown>;
  const score = o.alignmentScore;
  if (typeof score !== "number" || !Number.isFinite(score)) {
    return null;
  }

  const rawMap = o.topicLeverageMap;
  if (!rawMap || typeof rawMap !== "object" || Array.isArray(rawMap)) {
    return null;
  }
  const m = rawMap as Record<string, unknown>;
  const topicLeverageMap = {
    doubleDown: readStringList(m.doubleDown),
    explore: readStringList(m.explore),
    drop: readStringList(m.drop),
  };

  const voiceAuthorityZones = readStringList(o.voiceAuthorityZones);
  const strategicBlindSpots = readStringList(o.strategicBlindSpots);
  const summary = typeof o.summary === "string" ? o.summary : "";

  return {
    alignmentScore: score,
    topicLeverageMap,
    voiceAuthorityZones,
    strategicBlindSpots,
    summary,
  };
}
