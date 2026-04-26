"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { analyzeProfile, suggestProfileFromAi } from "@/lib/fetch/profile";
import type { CreatorProfile, ProfileAnalysis } from "@/lib/types/profile";

function scrollToEl(el: HTMLElement | null) {
  if (!el) return;
  requestAnimationFrame(() => {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

export type ProfileAiBanner = {
  variant: "ok" | "err";
  title: string;
  text: string;
} | null;

type UseProfileAiOptions = {
  setProfile: React.Dispatch<React.SetStateAction<CreatorProfile>>;
  setFormBanner: React.Dispatch<React.SetStateAction<ProfileAiBanner>>;
};

/**
 * Analyze + AI field suggestions: scroll targets, loading flags, and actions.
 */
export function useProfileAi({ setProfile, setFormBanner }: UseProfileAiOptions) {
  const pageIntroRef = useRef<HTMLDivElement | null>(null);
  const cardsAnchorRef = useRef<HTMLDivElement | null>(null);
  const aiFeedbackRef = useRef<HTMLDivElement | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [analysis, setAnalysis] = useState<ProfileAnalysis | null>(null);

  useEffect(() => {
    if (!analysis) return;
    const id = window.setTimeout(() => {
      scrollToEl(aiFeedbackRef.current);
    }, 100);
    return () => window.clearTimeout(id);
  }, [analysis]);

  const analyzeProfileAi = useCallback(
    async (currentProfile: CreatorProfile) => {
      setAnalyzing(true);
      setFormBanner(null);
      try {
        const next = await analyzeProfile(currentProfile);
        setAnalysis(next);
        scrollToEl(aiFeedbackRef.current);
        return { ok: true as const };
      } catch (e) {
        const text =
          e instanceof Error ? e.message : "Could not analyze profile.";
        setFormBanner({
          variant: "err",
          title: "Analysis failed",
          text,
        });
        return { ok: false as const, error: text };
      } finally {
        setAnalyzing(false);
      }
    },
    [setFormBanner]
  );

  const fillProfileFromAi = useCallback(
    async (
      currentProfile: CreatorProfile,
      opts?: { analysis?: ProfileAnalysis | null }
    ) => {
      const effectiveAnalysis =
        opts && Object.prototype.hasOwnProperty.call(opts, "analysis")
          ? opts.analysis ?? null
          : analysis ?? null;

      setFormBanner(null);
      scrollToEl(cardsAnchorRef.current);
      setGenerating(true);
      try {
        const next = await suggestProfileFromAi({
          profile: currentProfile,
          analysis: effectiveAnalysis,
        });
        setProfile(next);
        window.setTimeout(() => {
          scrollToEl(pageIntroRef.current);
        }, 80);
        setFormBanner({
          variant: "ok",
          title: "Profile fields updated",
          text: "Review Creator identity and Voice, then click Save profile to persist.",
        });
        return { ok: true as const };
      } catch (e) {
        const text =
          e instanceof Error ? e.message : "Could not generate profile fields.";
        setFormBanner({
          variant: "err",
          title: "AI fill failed",
          text,
        });
        return { ok: false as const, error: text };
      } finally {
        setGenerating(false);
      }
    },
    [analysis, setFormBanner, setProfile]
  );

  const scrollToCards = useCallback(() => {
    scrollToEl(cardsAnchorRef.current);
  }, []);

  const scrollToAiFeedback = useCallback(() => {
    scrollToEl(aiFeedbackRef.current);
  }, []);

  return {
    pageIntroRef,
    cardsAnchorRef,
    aiFeedbackRef,
    analyzing,
    generating,
    analysis,
    setAnalysis,
    analyzeProfileAi,
    fillProfileFromAi,
    scrollToCards,
    scrollToAiFeedback,
  };
}
