/**
 * Built-in hero image prompts for X Articles (external image tools).
 * Slot-fill with `interpolateArticleImagePrompt`.
 */

export type ArticleImagePresetId =
  | "etching_baseline"
  | "split_tension"
  | "curiosity_gap"
  | "scale_awe"
  | "cinematic_operator"
  | "contrarian_collision"
  | "signal_noise"
  | "social_energy"
  | "urgency_motion"
  | "poster_thumb";

const NEGATIVES =
  "No text, no letters, no numbers, no logos, no watermarks, no UI chrome.";

export const IMAGE_PROMPT_PRESETS: {
    id: ArticleImagePresetId;
    label: string;
    description: string;
    template: string;
  }[] = [
    {
      id: "etching_baseline",
      label: "Etching / woodcut (baseline)",
      description: "Symbolic B&W illustration, conceptual tension, timeless metaphor.",
      template: `Create a high-quality black-and-white illustration in a detailed etching / stippling / woodcut style.
  
  Visualize {{topic}} as a symbolic, conceptual scene, not literal.
  
  The subject can be anything — human, object, symbol, abstract form, environment, machine, equation, creature, or metaphor — whatever best expresses {{topic}}.
  
  Introduce a clear conceptual tension related to {{topic}}, such as: {{tension}}
  
  The environment should feel vast, dramatic, and expressive, using swirling textures, flowing lines, distortion, and heavy grain to amplify meaning.
  
  Style notes:
  – Pure monochrome (black and white only, no gray tones, no color)
  – Hand-drawn engraving / ink / woodcut aesthetic
  – High contrast, ink-heavy, dense texture
  – Cinematic lighting with sharp highlights and deep shadows
  – ${NEGATIVES}
  – Timeless, bold, expressive, visually striking
  
  The final image should feel like a visual metaphor — instantly readable emotionally, open to interpretation intellectually.
  
  Composition hint: {{composition_hint}}`,
    },
    {
      id: "split_tension",
      label: "Split tension (before/after)",
      description: "Two halves, abstract state A vs B — instant narrative, feed contrast.",
      template: `Cinematic abstract illustration, strong horizontal or vertical split composition.
  
  Left side: chaotic, dense, turbulent forms suggesting overload and fragmentation related to {{topic}}.
  Right side: calm, ordered, spacious forms suggesting clarity and resolution.
  
  Conceptual tension: {{tension}}. Mood: {{mood}}.
  
  Style: high contrast, dramatic lighting across the split seam, subtle film grain. No literal devices or readable screens.
  
  ${NEGATIVES}
  
  Metaphor focus: {{metaphor}}. {{composition_hint}}`,
    },
    {
      id: "curiosity_gap",
      label: "Curiosity gap",
      description: "Incomplete story — door ajar, path vanishing; drives dwell.",
      template: `Surreal symbolic illustration for {{topic}}.
  
  Show an incomplete journey: a doorway slightly open onto darkness, a path that dissolves into mist, or a figure paused before the unknown. Emphasize mystery and anticipation, not explanation.
  
  Tension: {{tension}}. Metaphor: {{metaphor}}.
  
  Atmospheric, painterly or engraved texture, deep shadows, single focal point. Emotional tone: {{mood}}.
  
  ${NEGATIVES}
  
  {{composition_hint}}`,
    },
    {
      id: "scale_awe",
      label: "Scale & awe",
      description: "Tiny figure vs giant form — big-topic / AI energy.",
      template: `Epic wide-angle symbolic scene for {{topic}}.
  
  A very small human silhouette or abstract figure stands before an enormous geometric or organic mass (towering shape, starburst, monolith) — awe, ambition, facing the infinite.
  
  Sky or void with dramatic depth; dust, mist, or particles for scale.
  
  Tension: {{tension}}. Mood: {{mood}}.
  
  Rich detail in the giant form; tiny figure for contrast. Cinematic color or monochrome both acceptable; avoid sterile stock look.
  
  ${NEGATIVES}
  
  {{metaphor}}. {{composition_hint}}`,
    },
    {
      id: "cinematic_operator",
      label: "Cinematic operator",
      description: "Night desk / builder mood — credibility without fake metrics.",
      template: `Moody cinematic illustration: late-night workspace, rain-streaked window with soft city bokeh, single warm desk lamp.
  
  A figure in silhouette at a keyboard or laptop; secondary monitor suggested as abstract glowing rectangle — no readable text or code.
  
  Abstract floating shapes suggesting data (curves, bars as pure geometry only, blurred, not legible).
  
  Atmosphere: focus, craft, building in the dark. Relates to {{topic}}.
  
  Mood: {{mood}}. Tension: {{tension}}.
  
  ${NEGATIVES}
  
  {{metaphor}}. {{composition_hint}}`,
    },
    {
      id: "contrarian_collision",
      label: "Contrarian collision",
      description: "Two forces colliding — reply-prone emotional energy.",
      template: `Dynamic abstract composition: two massive forms colliding or grinding — fire vs ice, circle vs square, wave vs wall — representing opposing takes on {{topic}}.
  
  Explosive diagonal energy, motion blur as abstract streaks only.
  
  Palette: limited, high drama (deep blues vs ember orange allowed). No symbols that look like letters.
  
  Tension: {{tension}}. Metaphor: {{metaphor}}. Mood: {{mood}}.
  
  ${NEGATIVES}
  
  {{composition_hint}}`,
    },
    {
      id: "signal_noise",
      label: "Signal vs noise",
      description: "Clarity cutting through static — ‘cut through noise’ articles.",
      template: `Abstract visualization for {{topic}}: on one side, chaotic static, scribbles, and noise patterns; a clean beam, line, or column cuts through to the other side — clarity, focus, signal.
  
  High contrast; could be monochrome or duotone. Sci-fi minimal, not cheesy holograms.
  
  Tension: {{tension}}. Mood: {{mood}}.
  
  ${NEGATIVES}
  
  {{metaphor}}. {{composition_hint}}`,
    },
    {
      id: "social_energy",
      label: "Social energy",
      description: "Crowd vs lone focal — movement / FOMO without identifiable faces.",
      template: `Symbolic illustration for {{topic}}: abstract crowd as repeating silhouettes or blurred masses facing a single bright opening, stage, or doorway — energy of many toward one idea.
  
  No recognizable faces; backs of heads or pure shapes only.
  
  Tension: {{tension}}. Mood: {{mood}}.
  
  Theater lighting, strong depth. Grain welcome.
  
  ${NEGATIVES}
  
  {{metaphor}}. {{composition_hint}}`,
    },
    {
      id: "urgency_motion",
      label: "Urgency & motion",
      description: "Diagonals, storm, abstract urgency — no readable clocks.",
      template: `High-energy abstract scene for {{topic}}: diagonal composition, storm clouds or wind as stylized shapes, motion streaks, a figure or object pushed forward by invisible force.
  
  No clocks with digits; no text. Sense of deadline and momentum through weather and vectors only.
  
  Tension: {{tension}}. Mood: {{mood}}.
  
  ${NEGATIVES}
  
  {{metaphor}}. {{composition_hint}}`,
    },
    {
      id: "poster_thumb",
      label: "Poster (thumbnail legibility)",
      description: "2–3 flat colors, bold shapes — reads at tiny card size.",
      template: `Bold graphic poster style for {{topic}}: maximum readability at small thumbnail size.
  
  Flat shapes, 2–3 colors maximum (e.g. black, off-white, one accent), minimal detail, strong silhouette.
  
  Iconic central symbol or figure related to {{topic}} as pure shape — not literal photo.
  
  Tension suggested through composition only: {{tension}}.
  
  ${NEGATIVES}
  
  Mood: {{mood}}. {{metaphor}}. {{composition_hint}}`,
    },
  ];

export const IMAGE_ASPECT_OPTIONS = [
  { id: "5_2", label: "5:2", promptLine: "Aspect ratio 5:2." },
  { id: "16_9", label: "16:9", promptLine: "Aspect ratio 16:9." },
  { id: "3_2", label: "3:2", promptLine: "Aspect ratio 3:2." },
  { id: "1_1", label: "1:1", promptLine: "Aspect ratio 1:1." },
  { id: "4_5", label: "4:5", promptLine: "Aspect ratio 4:5." },
  { id: "none", label: "No aspect hint", promptLine: "" },
] as const;

export type ImageAspectRatioId = (typeof IMAGE_ASPECT_OPTIONS)[number]["id"];

function safeSlot(value: string): string {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : "(unspecified)";
}

export function interpolateArticleImagePrompt(input: {
  template: string;
  topic: string;
  tension: string;
  mood: string;
  metaphor: string;
  compositionHint: string;
}): string {
  return input.template
    .replaceAll("{{topic}}", safeSlot(input.topic))
    .replaceAll("{{tension}}", safeSlot(input.tension))
    .replaceAll("{{mood}}", safeSlot(input.mood))
    .replaceAll("{{metaphor}}", safeSlot(input.metaphor))
    .replaceAll("{{composition_hint}}", safeSlot(input.compositionHint));
}

export function appendAspectToImagePrompt(
  promptText: string,
  aspectId: ImageAspectRatioId
): string {
  const option = IMAGE_ASPECT_OPTIONS.find((x) => x.id === aspectId);
  if (!option || !option.promptLine.trim()) return promptText.trim();
  return `${promptText.trim()}\n\n${option.promptLine}`;
}

export function allPresetsForDisplay(
  usePlaceholdersOnly: boolean
): Array<{
  id: ArticleImagePresetId;
  label: string;
  description: string;
  template: string;
}> {
  if (!usePlaceholdersOnly) return IMAGE_PROMPT_PRESETS;
  return IMAGE_PROMPT_PRESETS.map((preset) => ({
    ...preset,
    template: preset.template
      .replaceAll("{{topic}}", "{{topic}}")
      .replaceAll("{{tension}}", "{{tension}}")
      .replaceAll("{{mood}}", "{{mood}}")
      .replaceAll("{{metaphor}}", "{{metaphor}}")
      .replaceAll("{{composition_hint}}", "{{composition_hint}}"),
  }));
}