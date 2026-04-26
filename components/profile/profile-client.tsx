"use client";

import Link from "next/link";
import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProfileAi, type ProfileAiBanner } from "@/hooks/use-profile-ai";
import { saveProfile } from "@/lib/fetch/profile";
import { cn } from "@/lib/utils";
import type {
  CareerStage,
  CreatorProfile,
  ProfileAnalysis,
} from "@/lib/types/profile";

const CAREER_OPTIONS: { value: CareerStage; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];

type ProfileClientProps = {
  initialProfile: CreatorProfile;
  loadError: string | null;
};

export function ProfileClient({
  initialProfile,
  loadError,
}: ProfileClientProps) {
  const [profile, setProfile] = useState<CreatorProfile>(initialProfile);
  const [saving, setSaving] = useState(false);
  const [formBanner, setFormBanner] = useState<ProfileAiBanner>(null);

  const {
    pageIntroRef,
    cardsAnchorRef,
    aiFeedbackRef,
    analyzing,
    generating,
    analysis,
    analyzeProfileAi,
    fillProfileFromAi,
  } = useProfileAi({ setProfile, setFormBanner });

  function patch(updates: Partial<CreatorProfile>) {
    setProfile((p) => ({ ...p, ...updates }));
    setFormBanner(null);
  }

  async function onSave() {
    setSaving(true);
    setFormBanner(null);
    try {
      const next = await saveProfile(profile);
      setProfile(next);
      setFormBanner({
        variant: "ok",
        title: "Saved",
        text: "Profile saved.",
      });
    } catch (e) {
      const text = e instanceof Error ? e.message : "Could not save profile.";
      setFormBanner({
        variant: "err",
        title: "Save failed",
        text,
      });
    } finally {
      setSaving(false);
    }
  }

  const busy = saving || analyzing || generating;

  return (
    <div className="flex flex-col gap-6">
      <div ref={pageIntroRef} className="scroll-mt-24">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Voice system
        </p>
        <h1 className="mt-1 font-semibold text-2xl tracking-tight">Profile</h1>
        <p className="mt-2 text-muted-foreground text-sm">
          One shared profile for Compose, Daily Plan, Patterns, and other studio
          tools. Edit fields, then save. Use AI to analyze, then optionally fill
          your cards from those insights.
        </p>
      </div>

      {loadError ? (
        <Alert variant="destructive">
          <AlertTitle>Could not load profile</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : null}

      {formBanner ? (
        <Alert
          variant={formBanner.variant === "err" ? "destructive" : "default"}
        >
          <AlertTitle>{formBanner.title}</AlertTitle>
          <AlertDescription>{formBanner.text}</AlertDescription>
        </Alert>
      ) : null}

      <div ref={cardsAnchorRef} className="scroll-mt-24">
        <div
          className={cn(
            "grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start",
            generating && "pointer-events-none"
          )}
          aria-busy={generating}
        >
            <Card className={cn(generating && "opacity-60 transition-opacity")}>
              <CardHeader>
                <CardTitle>Creator identity</CardTitle>
                <CardDescription>
                  Who you are and who you write for.
                </CardDescription>
              </CardHeader>
              <CardContent
                className={cn(
                  "flex flex-col gap-4",
                  generating && "animate-pulse"
                )}
              >
                <Field
                  label="Bio"
                  value={profile.bio}
                  rows={4}
                  disabled={generating}
                  onChange={(bio) => patch({ bio })}
                />
                <Field
                  label="Niche"
                  value={profile.niche}
                  rows={2}
                  disabled={generating}
                  onChange={(niche) => patch({ niche })}
                />
                <Field
                  label="Tech stack"
                  value={profile.techStack}
                  rows={2}
                  disabled={generating}
                  onChange={(techStack) => patch({ techStack })}
                />
                <Field
                  label="Current work"
                  value={profile.currentWork}
                  rows={2}
                  disabled={generating}
                  onChange={(currentWork) => patch({ currentWork })}
                />
                <Field
                  label="Goals on X"
                  value={profile.goals}
                  rows={3}
                  disabled={generating}
                  onChange={(goals) => patch({ goals })}
                />
                <Field
                  label="Target audience"
                  value={profile.targetAudience}
                  rows={3}
                  disabled={generating}
                  onChange={(targetAudience) => patch({ targetAudience })}
                />
                <Separator />
                <div className="flex flex-col gap-2">
                  <Label htmlFor="career-stage">Career stage</Label>
                  <Select
                    value={profile.careerStage}
                    disabled={generating}
                    onValueChange={(value) =>
                      patch({ careerStage: value as CareerStage })
                    }
                  >
                    <SelectTrigger id="career-stage" className="w-full">
                      <SelectValue placeholder="Career stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAREER_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className={cn(generating && "opacity-60 transition-opacity")}>
              <CardHeader>
                <CardTitle>Voice</CardTitle>
                <CardDescription>How you sound on X.</CardDescription>
              </CardHeader>
              <CardContent
                className={cn(
                  "flex flex-col gap-4",
                  generating && "animate-pulse"
                )}
              >
                <Field
                  label="Core personality"
                  value={profile.corePersonality}
                  rows={5}
                  disabled={generating}
                  onChange={(corePersonality) => patch({ corePersonality })}
                />
                <Field
                  label="Tone notes"
                  value={profile.toneNotes}
                  rows={4}
                  disabled={generating}
                  onChange={(toneNotes) => patch({ toneNotes })}
                />
                <Field
                  label="Words to use"
                  value={profile.wordsUse}
                  rows={2}
                  disabled={generating}
                  onChange={(wordsUse) => patch({ wordsUse })}
                />
                <Field
                  label="Words to avoid"
                  value={profile.wordsAvoid}
                  rows={2}
                  disabled={generating}
                  onChange={(wordsAvoid) => patch({ wordsAvoid })}
                />
              </CardContent>
            </Card>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button type="button" size="lg" onClick={onSave} disabled={busy}>
          {saving ? "Saving…" : "Save profile"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={() => analyzeProfileAi(profile)}
          disabled={busy}
        >
          {analyzing ? "Analyzing…" : "Analyze profile (AI)"}
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link href="/studio/compose">Open Compose</Link>
        </Button>
      </div>

      {analysis ? (
        <Card
          ref={aiFeedbackRef}
          id="profile-ai-insights"
          className="scroll-mt-24 border-primary/20"
        >
          <CardHeader className="space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>AI insights</CardTitle>
                <CardDescription className="max-w-prose">
                  Plain-language summary first, then simple details below.
                  Nothing here is saved until you apply AI and save.
                </CardDescription>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => fillProfileFromAi(profile, { analysis })}
                >
                  Apply AI
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="rounded-lg border border-border/80 bg-muted/30 p-4">
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                What to do next
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                {analysis.summary || "—"}
              </p>
            </div>
            <div className="rounded-lg border border-border/60 p-4">
              <p className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-wide">
                Technical breakdown
              </p>
              <InsightsTechnical analysis={analysis} />
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function InsightsTechnical({ analysis }: { analysis: ProfileAnalysis }) {
  return (
    <div className="flex flex-col gap-6 text-sm">
      <div>
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Alignment score
        </p>
        <p className="mt-1 text-muted-foreground text-xs">
          Rough fit between your profile and typical growth patterns on X (not a
          grade on you as a person).
        </p>
        <p className="mt-1 font-semibold text-2xl tabular-nums tracking-tight">
          {Math.round(analysis.alignmentScore)}
          <span className="text-muted-foreground text-base font-normal">
            /100
          </span>
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <TopicList
          title="Double down"
          hint="Topics that already match your strengths."
          items={analysis.topicLeverageMap.doubleDown}
        />
        <TopicList
          title="Explore"
          hint="Angles worth testing next."
          items={analysis.topicLeverageMap.explore}
        />
        <TopicList
          title="Drop"
          hint="Themes that may dilute your positioning."
          items={analysis.topicLeverageMap.drop}
        />
      </div>
      <div>
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Voice authority zones
        </p>
        <p className="mt-1 text-muted-foreground text-xs">
          Where your voice already feels credible on the timeline.
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          {analysis.voiceAuthorityZones.length ? (
            analysis.voiceAuthorityZones.map((z, i) => (
              <li key={`${i}-${z}`}>{z}</li>
            ))
          ) : (
            <li className="text-muted-foreground">None listed</li>
          )}
        </ul>
      </div>
      <div>
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          Strategic blind spots
        </p>
        <p className="mt-1 text-muted-foreground text-xs">
          Gaps that might confuse your audience or weaken consistency.
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          {analysis.strategicBlindSpots.length ? (
            analysis.strategicBlindSpots.map((s, i) => (
              <li key={`${i}-${s}`}>{s}</li>
            ))
          ) : (
            <li className="text-muted-foreground">None listed</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function TopicList({
  title,
  hint,
  items,
}: {
  title: string
  hint: string
  items: string[]
}) {
  return (
    <div>
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
        {title}
      </p>
      <p className="mt-1 text-muted-foreground text-xs">{hint}</p>
      <ul className="mt-2 list-inside list-disc space-y-1">
        {items.length ? (
          items.map((item, i) => (
            <li key={`${i}-${item}`}>{item}</li>
          ))
        ) : (
          <li className="text-muted-foreground">None listed</li>
        )}
      </ul>
    </div>
  );
}

function Field({
  label,
  value,
  rows,
  disabled,
  onChange,
}: {
  label: string
  value: string
  rows: number
  disabled?: boolean
  onChange: (v: string) => void
}) {
  const id = label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="min-h-0 resize-y"
      />
    </div>
  );
}
