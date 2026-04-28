import type {
  ArticleImageSlots,
  ArticleOutlineSection,
  ArticleWizardStep,
  GeneratedImagePrompt,
} from "@/lib/types/article-draft";

const ARTICLE_WIZARD_STEPS: ArticleWizardStep[] = [
  "intent",
  "card",
  "body",
  "images",
  "save",
];

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function asWizardStep(value: unknown): ArticleWizardStep {
  if (ARTICLE_WIZARD_STEPS.includes(value as ArticleWizardStep)) {
    return value as ArticleWizardStep;
  }
  // Backward compatibility with older export step naming.
  if (value === "export") return "save";
  return "intent";
}

function normalizeOutline(value: unknown): ArticleOutlineSection[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const o = item as Record<string, unknown>;
      return {
        id: asString(o.id) || `section-${index + 1}`,
        title: asString(o.title),
        beats: asStringArray(o.beats),
      } satisfies ArticleOutlineSection;
    })
    .filter((item): item is ArticleOutlineSection => item !== null);
}

function normalizeSlots(value: unknown): ArticleImageSlots {
  const o =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return {
    tension: asString(o.tension),
    mood: asString(o.mood),
    metaphor: asString(o.metaphor),
    composition: asString(o.composition),
  };
}

function normalizeGeneratedPrompts(value: unknown): GeneratedImagePrompt[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const o = item as Record<string, unknown>;
      const id = asString(o.id) || `generated-${index + 1}`;
      const label = asString(o.label) || `Prompt ${index + 1}`;
      const promptText = asString(o.promptText);
      if (!promptText.trim()) return null;
      return {
        id,
        label,
        promptText,
        source: "generated",
      } satisfies GeneratedImagePrompt;
    })
    .filter((item): item is GeneratedImagePrompt => item !== null);
}

export type SavedArticleData = {
  topic: string;
  audience: string;
  tone: string;
  promise: string;
  wellnessClaimsAllowed: boolean;
  workingTitle: string;
  titleVariants: string[];
  previewHook: string;
  outline: ArticleOutlineSection[];
  bodyMarkdown: string;
  imageAspectRatioId: string;
  imageSlots: ArticleImageSlots;
  slotsBackupBeforeAi: ArticleImageSlots | null;
  aiSuggestedSlots: ArticleImageSlots | null;
  generatedImagePrompts: GeneratedImagePrompt[];
  wizardStep: ArticleWizardStep;
};

export function normalizeSavedArticleData(data: unknown): SavedArticleData {
  const o =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};

  return {
    topic: asString(o.topic),
    audience: asString(o.audience),
    tone: asString(o.tone),
    promise: asString(o.promise),
    wellnessClaimsAllowed:
      typeof o.wellnessClaimsAllowed === "boolean"
        ? o.wellnessClaimsAllowed
        : false,
    workingTitle: asString(o.workingTitle),
    titleVariants: asStringArray(o.titleVariants),
    previewHook: asString(o.previewHook),
    outline: normalizeOutline(o.outline),
    bodyMarkdown: asString(o.bodyMarkdown),
    imageAspectRatioId: asString(o.imageAspectRatioId) || "5_2",
    imageSlots: normalizeSlots(o.imageSlots),
    slotsBackupBeforeAi: o.slotsBackupBeforeAi
      ? normalizeSlots(o.slotsBackupBeforeAi)
      : null,
    aiSuggestedSlots: o.aiSuggestedSlots ? normalizeSlots(o.aiSuggestedSlots) : null,
    generatedImagePrompts: normalizeGeneratedPrompts(o.generatedImagePrompts),
    wizardStep: asWizardStep(o.wizardStep),
  };
}

export function deriveArticleListTitle(data: SavedArticleData): string {
  const fromTitle = data.workingTitle.trim();
  if (fromTitle.length) return fromTitle;
  const fromTopic = data.topic.trim();
  if (fromTopic.length) return fromTopic;
  return "Untitled article";
}

export function buildXArticleMarkdown(input: {
  workingTitle: string;
  previewHook: string;
  bodyMarkdown: string;
}): string {
  const title = input.workingTitle.trim() || "Untitled article";
  const hook = input.previewHook.trim();
  const body = input.bodyMarkdown.trim();

  const parts: string[] = [`# ${title}`];

  if (hook.length) {
    const hookBlock = hook
      .split(/\r?\n/)
      .map((line) => `> ${line}`)
      .join("\n");
    parts.push(hookBlock);
  }

  if (body.length) {
    parts.push(body);
  }

  return parts.join("\n\n").trim();
}
