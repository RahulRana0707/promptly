"use client";

import Link from "next/link";
import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDailyPlanPage } from "@/hooks/use-daily-plan-page";
import { cn } from "@/lib/utils";
import { PATTERN_CATALOG } from "@/lib/patterns";
import { formatYmdForUi, localDateYmd } from "@/lib/date/local-ymd";
import type { PlannedTweet, SignalTarget } from "@/lib/types/daily-plan";

const SIGNAL_OPTIONS: SignalTarget[] = ["replies", "reposts", "bookmarks"];

const SIGNAL_META: Record<
  SignalTarget,
  { short: string; help: string; cardLabel: string }
> = {
  replies: {
    short: "Replies",
    help: "Ask for takes and lived experiences.",
    cardLabel: "Conversation starter",
  },
  reposts: {
    short: "Reposts",
    help: "Create a clear takeaway people share.",
    cardLabel: "Share-worthy takeaway",
  },
  bookmarks: {
    short: "Bookmarks",
    help: "Offer practical steps worth saving.",
    cardLabel: "Save-worthy resource",
  },
};

function ymdToDate(ymd: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return undefined;
  const date = new Date(
    Number(m[1]),
    Number(m[2]) - 1,
    Number(m[3]),
    12,
    0,
    0,
    0
  );
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

function dateToYmd(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function DailyPlanClient() {
  const [copiedTweetIndex, setCopiedTweetIndex] = useState<number | null>(null);
  const {
    selectedDate,
    setSelectedDate,
    dates,
    plan,
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
  } = useDailyPlanPage();

  function togglePattern(id: string) {
    setSelectedPatterns((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleSignal(id: SignalTarget) {
    setSignalTargets((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  const selectedDateObj = ymdToDate(selectedDate);

  async function copyTweet(text: string, index: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTweetIndex(index);
      window.setTimeout(() => setCopiedTweetIndex(null), 1400);
    } catch {
      // no-op for now; actionError remains for API actions only
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Planning
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Daily plan</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Select a day, review saved plans, and generate or replace one plan for
          that day.
        </p>
      </div>

      {!profileLoading && profile && !profile.bio.trim() && !profile.niche.trim() ? (
        <Alert>
          <AlertTitle>Add your profile context first</AlertTitle>
          <AlertDescription>
            Your niche and bio are empty, so daily plans may feel generic. Update
            your profile for better output.
            {" "}
            <Link href="/studio/profile" className="underline underline-offset-2">
              Open profile
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : null}

      {profileError ? (
        <Alert variant="destructive">
          <AlertTitle>Profile load warning</AlertTitle>
          <AlertDescription>
            {profileError}. Daily plan generation is using defaults until profile
            loads successfully.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Day selector</CardTitle>
          <CardDescription>
            Plans are saved per calendar day and only overwrite that day.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <Label>Selected day</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  data-empty={!selectedDateObj}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDateObj && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon data-icon="inline-start" />
                  {selectedDateObj ? (
                    format(selectedDateObj, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDateObj}
                  onSelect={(date) => {
                    if (!date) return;
                    setSelectedDate(dateToYmd(date));
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedDate(localDateYmd())}
            >
              Today
            </Button>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Saved days</Label>
            <Select
              value={dates.some((d) => d.planDate === selectedDate) ? selectedDate : ""}
              onValueChange={setSelectedDate}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pick a saved day" />
              </SelectTrigger>
              <SelectContent>
                {dates.length ? (
                  dates.map((d) => (
                    <SelectItem key={d.planDate} value={d.planDate}>
                      {formatYmdForUi(d.planDate)}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No saved days yet
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>
            Choose patterns, signal targets, and tone for this day's plan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Patterns</Label>
            <div className="flex flex-wrap gap-2">
              {PATTERN_CATALOG.map((pattern) => {
                const active = selectedPatterns.includes(pattern.id);
                return (
                  <Button
                    key={pattern.id}
                    type="button"
                    size="sm"
                    variant={active ? "default" : "outline"}
                    onClick={() => togglePattern(pattern.id)}
                  >
                    {pattern.name}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Signal targets</Label>
            <div className="flex flex-wrap gap-2">
              {SIGNAL_OPTIONS.map((signal) => {
                const active = signalTargets.includes(signal);
                return (
                  <Button
                    key={signal}
                    type="button"
                    size="sm"
                    variant={active ? "default" : "outline"}
                    onClick={() => toggleSignal(signal)}
                  >
                    {SIGNAL_META[signal].short}
                  </Button>
                );
              })}
            </div>
            <div className="grid gap-1 text-xs text-muted-foreground">
              {SIGNAL_OPTIONS.map((signal) => (
                <p key={signal}>
                  <span className="font-medium">{SIGNAL_META[signal].short}:</span>{" "}
                  {SIGNAL_META[signal].help}
                </p>
              ))}
            </div>
          </div>

          <div className="max-w-xs space-y-2">
            <Label htmlFor="tone-risk">Tone / risk</Label>
            <Select value={toneRisk} onValueChange={(v) => setToneRisk(v as typeof toneRisk)}>
              <SelectTrigger id="tone-risk" className="w-full">
                <SelectValue placeholder="Choose tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="safe">Safe</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="aggressive">Aggressive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              onClick={() => generateSelectedDayPlan()}
              disabled={generating || deleting || loadingDay}
            >
              {generating
                ? "Generating..."
                : plan
                ? "Replace plan for this day"
                : "Generate plan for this day"}
            </Button>
            {plan ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => deleteSelectedDayPlan()}
                disabled={deleting || generating}
              >
                {deleting ? "Deleting..." : "Delete day plan"}
              </Button>
            ) : null}
          </div>
          {actionError ? (
            <p className="text-sm text-destructive">{actionError}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Plan output</CardTitle>
          <CardDescription>
            {loadingDay
              ? "Loading selected day..."
              : `Showing ${formatYmdForUi(selectedDate)}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : loadingDay ? (
            <p className="text-sm text-muted-foreground">Loading plan...</p>
          ) : plan ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Engagement plan
                </p>
                <p className="mt-2 text-sm">{plan.engagementPlan.summary}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Goal: {plan.engagementPlan.goal || "—"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Key metric: {plan.engagementPlan.keyMetric || "—"}
                </p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Tweets
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {plan.tweets.length} tweet{plan.tweets.length === 1 ? "" : "s"}{" "}
                  generated.
                </p>
                <div className="mt-4 space-y-3">
                  {plan.tweets.map((tweet, index) => (
                    <TweetCard
                      key={`${index}-${tweet.patternName}`}
                      tweet={tweet}
                      index={index}
                      copied={copiedTweetIndex === index}
                      onCopy={() => copyTweet(tweet.content, index)}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No plan for this day yet. Generate one next.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TweetCard({
  tweet,
  index,
  copied,
  onCopy,
}: {
  tweet: PlannedTweet;
  index: number;
  copied: boolean;
  onCopy: () => void;
}) {
  const draftHref = `/studio/compose?draft=${encodeURIComponent(tweet.content)}`;
  return (
    <div className="rounded-lg border border-border/80 p-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
          #{index + 1}
        </span>
        <span className="rounded-full bg-secondary/60 px-2 py-0.5 text-xs">
          {tweet.patternName || "Pattern"}
        </span>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
          {SIGNAL_META[tweet.signalTarget].cardLabel}
        </span>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          Score {Math.round(tweet.viralScore)}
        </span>
      </div>
      <p className="text-sm leading-relaxed">{tweet.content}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        Reasoning: {tweet.reasoning || "—"}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        GIF: {tweet.gifSuggestion || "—"}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" asChild>
          <Link href={draftHref}>Open in Compose</Link>
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onCopy}>
          {copied ? "Copied" : "Copy tweet"}
        </Button>
      </div>
    </div>
  );
}
