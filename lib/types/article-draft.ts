export type ArticleWizardStep = "intent" | "card" | "body" | "images" | "save";

export type ArticleIntent = {
  topic: string;
  audience: string;
  tone: string;
  promise: string;
  wellnessClaimsAllowed: boolean;
};

export type ArticleOutlineSection = {
  id: string;
  title: string;
  beats: string[];
};

export type ArticleImageSlots = {
  tension: string;
  mood: string;
  metaphor: string;
  composition: string;
};

export type GeneratedImagePrompt = {
  id: string;
  label: string;
  promptText: string;
  source: "generated";
};
