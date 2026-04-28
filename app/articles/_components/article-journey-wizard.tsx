"use client";

import { ArticleMarkdownPreview } from "@/components/article-markdown-preview";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArticleJourneyImagesTab } from "@/app/articles/_components/article-journey-images-tab";
import type { ArticleOutlineSection, ArticleWizardStep } from "@/lib/types/article-draft";

const STEP_ORDER: ArticleWizardStep[] = ["intent", "card", "body", "images", "save"];

type Props = {
  state: {
    wizardStep: ArticleWizardStep;
    setWizardStep: (value: ArticleWizardStep) => void;
    topic: string;
    setTopic: (value: string) => void;
    audience: string;
    setAudience: (value: string) => void;
    tone: string;
    setTone: (value: string) => void;
    promise: string;
    setPromise: (value: string) => void;
    wellnessClaimsAllowed: boolean;
    setWellnessClaimsAllowed: (value: boolean) => void;
    workingTitle: string;
    setWorkingTitle: (value: string) => void;
    titleVariants: string[];
    previewHook: string;
    setPreviewHook: (value: string) => void;
    outline: ArticleOutlineSection[];
    setOutline: (value: ArticleOutlineSection[]) => void;
    bodyMarkdown: string;
    setBodyMarkdown: (value: string) => void;
    imageAspectRatioId: string;
    setImageAspectRatioId: (value: string) => void;
    imageSlots: {
      tension: string;
      mood: string;
      metaphor: string;
      composition: string;
    };
    setImageSlots: (value: {
      tension: string;
      mood: string;
      metaphor: string;
      composition: string;
    }) => void;
    generatedImagePrompts: Array<{
      id: string;
      label: string;
      promptText: string;
      source: "generated";
    }>;
    loadingPlan: boolean;
    loadingExpand: boolean;
    loadingImageSlots: boolean;
    loadingImagePrompts: boolean;
    savingArticle: boolean;
    error: string | null;
    runPlan: () => Promise<void>;
    runExpand: () => Promise<void>;
    runSuggestImageSlots: () => Promise<void>;
    runGenerateImagePrompts: () => Promise<void>;
    runSave: () => Promise<string | null>;
    restoreSlotsBackup: () => void;
    restoreLastAiSlots: () => void;
  };
  onSaveArticle: (id: string) => void;
};

export function ArticleJourneyWizard({ state, onSaveArticle }: Props) {
  async function saveNow() {
    const id = await state.runSave();
    if (id) onSaveArticle(id);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {STEP_ORDER.map((step) => (
          <Button
            key={step}
            type="button"
            size="sm"
            variant={state.wizardStep === step ? "default" : "outline"}
            onClick={() => state.setWizardStep(step)}
          >
            {step}
          </Button>
        ))}
      </div>

      {state.error ? (
        <Alert variant="destructive">
          <AlertTitle>Action failed</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      {state.wizardStep === "intent" ? (
        <Card>
          <CardHeader>
            <CardTitle>Intent</CardTitle>
            <CardDescription>Set the input context for plan generation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Topic</Label>
              <Input value={state.topic} onChange={(e) => state.setTopic(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Audience</Label>
              <Input
                value={state.audience}
                onChange={(e) => state.setAudience(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Tone</Label>
              <Input value={state.tone} onChange={(e) => state.setTone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Reader promise</Label>
              <Input
                value={state.promise}
                onChange={(e) => state.setPromise(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={state.wellnessClaimsAllowed}
                onChange={(e) => state.setWellnessClaimsAllowed(e.target.checked)}
              />
              Allow wellness or health-style claims
            </label>
            <Button
              type="button"
              onClick={() => void state.runPlan()}
              disabled={state.loadingPlan}
            >
              {state.loadingPlan ? "Generating..." : "Generate article plan"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {state.wizardStep === "card" ? (
        <Card>
          <CardHeader>
            <CardTitle>Card</CardTitle>
            <CardDescription>Adjust title, hook, and section outline.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Working title</Label>
              <Input
                value={state.workingTitle}
                onChange={(e) => state.setWorkingTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Title variants</Label>
              <div className="flex flex-wrap gap-2">
                {state.titleVariants.map((variant) => (
                  <Button
                    key={variant}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => state.setWorkingTitle(variant)}
                  >
                    Use: {variant}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Preview hook</Label>
              <Textarea
                rows={4}
                value={state.previewHook}
                onChange={(e) => state.setPreviewHook(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Outline sections</Label>
              {state.outline.map((section, index) => (
                <div key={section.id} className="rounded-lg border border-border/70 p-3">
                  <Input
                    value={section.title}
                    onChange={(e) => {
                      const next = [...state.outline];
                      next[index] = { ...section, title: e.target.value };
                      state.setOutline(next);
                    }}
                  />
                </div>
              ))}
            </div>
            <Button
              type="button"
              onClick={() => void state.runExpand()}
              disabled={state.loadingExpand}
            >
              {state.loadingExpand ? "Expanding..." : "Generate article body"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {state.wizardStep === "body" ? (
        <Card>
          <CardHeader>
            <CardTitle>Body</CardTitle>
            <CardDescription>Edit markdown and preview it live.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 lg:grid-cols-2">
            <Textarea
              className="min-h-[340px] font-mono text-xs"
              value={state.bodyMarkdown}
              onChange={(e) => state.setBodyMarkdown(e.target.value)}
            />
            <ArticleMarkdownPreview markdown={state.bodyMarkdown} />
          </CardContent>
        </Card>
      ) : null}

      {state.wizardStep === "images" ? (
        <ArticleJourneyImagesTab
          topic={state.topic}
          imageAspectRatioId={state.imageAspectRatioId}
          setImageAspectRatioId={state.setImageAspectRatioId}
          imageSlots={state.imageSlots}
          setImageSlots={state.setImageSlots}
          generatedImagePrompts={state.generatedImagePrompts}
          loadingImageSlots={state.loadingImageSlots}
          loadingImagePrompts={state.loadingImagePrompts}
          runSuggestImageSlots={state.runSuggestImageSlots}
          runGenerateImagePrompts={state.runGenerateImagePrompts}
          restoreSlotsBackup={state.restoreSlotsBackup}
          restoreLastAiSlots={state.restoreLastAiSlots}
        />
      ) : null}

      {state.wizardStep === "save" ? (
        <Card>
          <CardHeader>
            <CardTitle>Save</CardTitle>
            <CardDescription>Persist this article to your workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" onClick={saveNow} disabled={state.savingArticle}>
              {state.savingArticle ? "Saving..." : "Save article"}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
