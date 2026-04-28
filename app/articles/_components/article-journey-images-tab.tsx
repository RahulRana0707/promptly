"use client";

import { useState } from "react";

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
import {
  appendAspectToImagePrompt,
  IMAGE_ASPECT_OPTIONS,
  IMAGE_PROMPT_PRESETS,
  interpolateArticleImagePrompt,
  type ImageAspectRatioId,
} from "@/lib/prompts/article-image-preset";
import type { GeneratedImagePrompt } from "@/lib/types/article-draft";

type Props = {
  topic: string;
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
  generatedImagePrompts: GeneratedImagePrompt[];
  loadingImageSlots: boolean;
  loadingImagePrompts: boolean;
  runSuggestImageSlots: () => Promise<void>;
  runGenerateImagePrompts: () => Promise<void>;
  restoreSlotsBackup: () => void;
  restoreLastAiSlots: () => void;
};

export function ArticleJourneyImagesTab(props: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1200);
  }

  const aspectId = IMAGE_ASPECT_OPTIONS.some((x) => x.id === props.imageAspectRatioId)
    ? (props.imageAspectRatioId as ImageAspectRatioId)
    : "5_2";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Image slots</CardTitle>
          <CardDescription>
            Fill these once and reuse across built-in presets.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <Label>Tension</Label>
              <Input
                value={props.imageSlots.tension}
                onChange={(e) =>
                  props.setImageSlots({ ...props.imageSlots, tension: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Mood</Label>
              <Input
                value={props.imageSlots.mood}
                onChange={(e) =>
                  props.setImageSlots({ ...props.imageSlots, mood: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Metaphor</Label>
              <Input
                value={props.imageSlots.metaphor}
                onChange={(e) =>
                  props.setImageSlots({ ...props.imageSlots, metaphor: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Composition hint</Label>
              <Input
                value={props.imageSlots.composition}
                onChange={(e) =>
                  props.setImageSlots({ ...props.imageSlots, composition: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Aspect ratio</Label>
            <div className="flex flex-wrap gap-2">
              {IMAGE_ASPECT_OPTIONS.map((option) => (
                <Button
                  key={option.id}
                  type="button"
                  size="sm"
                  variant={props.imageAspectRatioId === option.id ? "default" : "outline"}
                  onClick={() => props.setImageAspectRatioId(option.id)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => void props.runSuggestImageSlots()}
              disabled={props.loadingImageSlots}
            >
              {props.loadingImageSlots ? "Filling..." : "Suggest slots with AI"}
            </Button>
            <Button type="button" variant="outline" onClick={props.restoreSlotsBackup}>
              Restore my previous values
            </Button>
            <Button type="button" variant="outline" onClick={props.restoreLastAiSlots}>
              Use last AI fills again
            </Button>
            <Button
              type="button"
              onClick={() => void props.runGenerateImagePrompts()}
              disabled={props.loadingImagePrompts}
            >
              {props.loadingImagePrompts ? "Generating..." : "Generate prompts from article"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Built-in presets</CardTitle>
          <CardDescription>
            Uses `lib/prompts/article-image-preset.ts` templates with your slot values.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {IMAGE_PROMPT_PRESETS.map((preset) => {
            const interpolated = interpolateArticleImagePrompt({
              template: preset.template,
              topic: props.topic,
              tension: props.imageSlots.tension,
              mood: props.imageSlots.mood,
              metaphor: props.imageSlots.metaphor,
              compositionHint: props.imageSlots.composition,
            });
            const finalPrompt = appendAspectToImagePrompt(interpolated, aspectId);
            return (
              <div key={preset.id} className="rounded-lg border border-border/70 p-3">
                <p className="text-sm font-medium">{preset.label}</p>
                <p className="text-xs text-muted-foreground">{preset.description}</p>
                <Button
                  type="button"
                  size="sm"
                  className="mt-2"
                  onClick={() => void copy(finalPrompt, `preset-${preset.id}`)}
                >
                  {copiedId === `preset-${preset.id}` ? "Copied" : "Copy preset prompt"}
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated prompts</CardTitle>
          <CardDescription>3-5 prompts inferred from your article content.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {props.generatedImagePrompts.length ? (
            props.generatedImagePrompts.map((prompt) => {
              const finalPrompt = appendAspectToImagePrompt(prompt.promptText, aspectId);
              return (
                <div key={prompt.id} className="rounded-lg border border-border/70 p-3">
                  <p className="text-sm font-medium">{prompt.label}</p>
                  <Button
                    type="button"
                    size="sm"
                    className="mt-2"
                    onClick={() => void copy(finalPrompt, `gen-${prompt.id}`)}
                  >
                    {copiedId === `gen-${prompt.id}` ? "Copied" : "Copy generated prompt"}
                  </Button>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">
              No generated prompts yet. Use "Generate prompts from article".
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
