"use client";

import { useEffect, useState } from "react";

import { localDateYmd } from "@/lib/date/local-ymd";
import {
  deleteDailyPlanForDateApi,
  fetchDailyPlanState,
  generateDailyPlanApi,
  type DailyPlanDayListItem,
} from "@/lib/fetch/daily-plan";
import { getProfile } from "@/lib/fetch/profile";
import { ALL_PATTERN_IDS } from "@/lib/patterns";
import type {
  DailyPlanResult,
  SignalTarget,
  ToneRisk,
} from "@/lib/types/daily-plan";
import { defaultCreatorProfile, type CreatorProfile } from "@/lib/types/profile";

export function useDailyPlanPage() {
  const [selectedDate, setSelectedDate] = useState<string>(localDateYmd());
  const [dates, setDates] = useState<DailyPlanDayListItem[]>([]);
  const [plan, setPlan] = useState<DailyPlanResult | null>(null);
  const [loadingDay, setLoadingDay] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedPatterns, setSelectedPatterns] =
    useState<string[]>(ALL_PATTERN_IDS);
  const [signalTargets, setSignalTargets] = useState<SignalTarget[]>([
    "replies",
    "reposts",
    "bookmarks",
  ]);
  const [toneRisk, setToneRisk] = useState<ToneRisk>("balanced");
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState<boolean>(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  async function refreshSelectedDay(dateYmd: string) {
    setLoadingDay(true);
    setLoadError(null);
    try {
      const data = await fetchDailyPlanState(dateYmd);
      setDates(data.dates ?? []);
      setPlan(data.plan ?? null);
    } catch (e) {
      setPlan(null);
      setLoadError(e instanceof Error ? e.message : "Could not load daily plan");
    } finally {
      setLoadingDay(false);
    }
  }

  useEffect(() => {
    void refreshSelectedDay(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    let cancelled = false;
    setProfileLoading(true);
    setProfileError(null);
    getProfile()
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
      })
      .catch((e) => {
        if (cancelled) return;
        setProfileError(e instanceof Error ? e.message : "Could not load profile");
        setProfile(defaultCreatorProfile());
      })
      .finally(() => {
        if (cancelled) return;
        setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function generateSelectedDayPlan() {
    setGenerating(true);
    setActionError(null);
    try {
      const res = await generateDailyPlanApi({
        planDate: selectedDate,
        profile: profile ?? defaultCreatorProfile(),
        patternIds: selectedPatterns,
        signalTargets,
        toneRisk,
      });
      setPlan(res.plan);
      await refreshSelectedDay(selectedDate);
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Could not generate daily plan"
      );
    } finally {
      setGenerating(false);
    }
  }

  async function deleteSelectedDayPlan() {
    setDeleting(true);
    setActionError(null);
    try {
      await deleteDailyPlanForDateApi(selectedDate);
      setPlan(null);
      await refreshSelectedDay(selectedDate);
    } catch (e) {
      setActionError(
        e instanceof Error ? e.message : "Could not delete daily plan"
      );
    } finally {
      setDeleting(false);
    }
  }

  return {
    selectedDate,
    setSelectedDate,
    dates,
    plan,
    setPlan,
    loadingDay,
    loadError,
    generating,
    deleting,
    actionError,
    profile,
    profileLoading,
    profileError,
    selectedPatterns,
    setSelectedPatterns,
    signalTargets,
    setSignalTargets,
    toneRisk,
    setToneRisk,
    generateSelectedDayPlan,
    deleteSelectedDayPlan,
    refreshSelectedDay,
  };
}
