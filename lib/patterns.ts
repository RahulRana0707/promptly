export type PatternCatalogEntry = {
  id: string;
  name: string;
  triggers: string;
  example: string;
};

export const PATTERN_CATALOG: PatternCatalogEntry[] = [
  {
    id: "POV_REALIZATION",
    name: "POV realization",
    triggers: "surprising shift in perspective with a lived example",
    example:
      "POV: I thought consistency meant posting daily. It actually meant repeating one useful insight until people remembered it.",
  },
  {
    id: "FORCED_CHOICE",
    name: "Forced choice",
    triggers: "A/B framing with explicit tradeoffs",
    example:
      "If you only get one focus this month: better product quality or better distribution? Why?",
  },
  {
    id: "HOT_TAKE",
    name: "Hot take",
    triggers: "strong opinion backed by practical proof",
    example:
      "Hot take: most creators don't need better hooks. They need better raw stories from real work.",
  },
  {
    id: "BUILDER_LOG",
    name: "Builder log",
    triggers: "shipping notes with concrete before/after",
    example:
      "Builder log: we removed 3 onboarding steps this week. Activation moved from 24% to 31%.",
  },
  {
    id: "CONTRARIAN_INSIGHT",
    name: "Contrarian insight",
    triggers: "counter-intuitive but useful claim with rationale",
    example:
      "Contrarian: batching 30 posts can hurt if your product changes weekly. Fresh context beats stale volume.",
  },
  {
    id: "MEME_FORMAT",
    name: "Meme format",
    triggers: "light humor grounded in creator reality",
    example:
      "Me: 'quick 15-minute writing sprint.' Also me 90 minutes later editing the same first line.",
  },
];

export const ALL_PATTERN_IDS = PATTERN_CATALOG.map((p) => p.id);
