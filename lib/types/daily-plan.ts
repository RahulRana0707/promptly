export type ToneRisk = "safe" | "balanced" | "aggressive";

export type SignalTarget = "replies" | "reposts" | "bookmarks";

export type PlannedTweet = {
  content: string;
  viralScore: number;
  patternName: string;
  gifSuggestion: string;
  reasoning: string;
  signalTarget: SignalTarget;
};

export type DailyPlanEngagementPlan = {
  summary: string;
  goal: string;
  keyMetric: string;
};

export type DailyPlanResult = {
  engagementPlan: DailyPlanEngagementPlan;
  tweets: PlannedTweet[];
};

const SIGNAL_TARGETS: SignalTarget[] = ["replies", "reposts", "bookmarks"];
const TONE_RISK_VALUES: ToneRisk[] = ["safe", "balanced", "aggressive"];

export function isSignalTarget(value: unknown): value is SignalTarget {
  return SIGNAL_TARGETS.includes(value as SignalTarget);
}

export function isToneRisk(value: unknown): value is ToneRisk {
  return TONE_RISK_VALUES.includes(value as ToneRisk);
}

/**
 * Best-effort parser for DB/API JSON into a strongly typed DailyPlanResult.
 * Returns null when the required structure is missing.
 */
export function dailyPlanFromJson(data: unknown): DailyPlanResult | null {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }
  const root = data as Record<string, unknown>;
  const rawPlan = root.engagementPlan;
  const rawTweets = root.tweets;
  if (!rawPlan || typeof rawPlan !== "object" || Array.isArray(rawPlan)) {
    return null;
  }
  if (!Array.isArray(rawTweets)) {
    return null;
  }

  const p = rawPlan as Record<string, unknown>;
  const engagementPlan: DailyPlanEngagementPlan = {
    summary: typeof p.summary === "string" ? p.summary : "",
    goal: typeof p.goal === "string" ? p.goal : "",
    keyMetric: typeof p.keyMetric === "string" ? p.keyMetric : "",
  };

  const tweets: PlannedTweet[] = rawTweets
    .map((row) => {
      if (!row || typeof row !== "object" || Array.isArray(row)) return null;
      const t = row as Record<string, unknown>;
      const signalTarget = isSignalTarget(t.signalTarget)
        ? t.signalTarget
        : "replies";
      return {
        content: typeof t.content === "string" ? t.content : "",
        viralScore:
          typeof t.viralScore === "number" && Number.isFinite(t.viralScore)
            ? t.viralScore
            : 0,
        patternName: typeof t.patternName === "string" ? t.patternName : "",
        gifSuggestion:
          typeof t.gifSuggestion === "string" ? t.gifSuggestion : "",
        reasoning: typeof t.reasoning === "string" ? t.reasoning : "",
        signalTarget,
      } satisfies PlannedTweet;
    })
    .filter((x): x is PlannedTweet => x !== null);

  return { engagementPlan, tweets };
}
