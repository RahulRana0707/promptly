"use client";

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
import { useShortsPage } from "@/hooks/use-shorts-page";
import type { ShortsWizardStep } from "@/lib/types/shorts-draft";

const STEP_ORDER: ShortsWizardStep[] = [
  "source",
  "transcript",
  "moments",
  "selection",
  "render",
  "download",
];

type Props = {
  state: ReturnType<typeof useShortsPage>;
  onSaveProject: (id: string) => void;
};

export function ShortsJourneyWizard({ state, onSaveProject }: Props) {
  function badgeForScore(score: number) {
    if (score >= 90) return "Breakout";
    if (score >= 80) return "High reach";
    return "Backup";
  }

  async function saveNow() {
    const id = await state.runSave();
    if (id) onSaveProject(id);
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

      {state.wizardStep === "source" ? (
        <Card>
          <CardHeader>
            <CardTitle>Source</CardTitle>
            <CardDescription>
              Paste a podcast/video URL and save project before processing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label>Source URL</Label>
              <Input
                placeholder="https://www.youtube.com/watch?v=..."
                value={state.sourceUrl}
                onChange={(e) => state.setSourceUrl(e.target.value)}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Source type</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={state.sourceType}
                  onChange={(e) =>
                    state.setSourceType(
                      e.target.value === "youtube" ? "youtube" : "other",
                    )
                  }
                >
                  <option value="youtube">YouTube</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Source title (optional)</Label>
                <Input
                  value={state.sourceTitle}
                  onChange={(e) => state.setSourceTitle(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="button"
              onClick={() => void saveNow()}
              disabled={state.savingProject}
            >
              {state.savingProject ? "Saving..." : "Save project"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {state.wizardStep === "transcript" ? (
        <Card>
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
            <CardDescription>
              Run transcription and inspect segments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => void state.runTranscribe()}
                disabled={state.loadingTranscribe}
              >
                {state.loadingTranscribe ? "Transcribing..." : "Run transcribe"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void state.runTranscribe({ force: true })}
                disabled={state.loadingTranscribe}
              >
                Force re-transcribe
              </Button>
            </div>
            <div className="space-y-2">
              {state.transcript.length ? (
                state.transcript.map((segment) => (
                  <div
                    key={segment.id}
                    className="rounded-lg border border-border/70 p-3 text-sm"
                  >
                    <p className="text-xs text-muted-foreground">
                      {segment.startSec}s - {segment.endSec}s{" "}
                      {segment.speaker ? `- ${segment.speaker}` : ""}
                    </p>
                    <p>{segment.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No transcript yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {state.wizardStep === "moments" ? (
        <Card>
          <CardHeader>
            <CardTitle>Moments</CardTitle>
            <CardDescription>
              Generate ranked clips with score and reasons.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              type="button"
              onClick={() =>
                void state.runAnalyze({ targetClipCount: 8, minScore: 80 })
              }
              disabled={state.loadingAnalyze}
            >
              {state.loadingAnalyze ? "Analyzing..." : "Analyze moments"}
            </Button>
            <div className="space-y-2">
              {state.candidates.length ? (
                state.candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="rounded-lg border border-border/70 p-3 text-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{candidate.title}</p>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                          {badgeForScore(candidate.score)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Score {candidate.score}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {candidate.startSec}s - {candidate.endSec}s
                    </p>
                    <p>{candidate.reason}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No candidates yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {state.wizardStep === "selection" ? (
        <Card>
          <CardHeader>
            <CardTitle>Selection</CardTitle>
            <CardDescription>
              Select clips and set render style.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {state.candidates.length ? (
                state.candidates.map((candidate) => {
                  const checked = state.selectedCandidateIds.includes(
                    candidate.id,
                  );
                  return (
                    <label
                      key={candidate.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          state.toggleCandidateSelection(candidate.id, e.target.checked);
                        }}
                      />
                      {candidate.title} (score {candidate.score})
                    </label>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  Generate moments first.
                </p>
              )}
            </div>

            {state.selectedCandidateIds.length ? (
              <div className="space-y-2 rounded-lg border border-border/70 p-3">
                <p className="text-sm font-medium">Manual clip trims</p>
                {state.candidates
                  .filter((candidate) => state.selectedCandidateIds.includes(candidate.id))
                  .map((candidate) => (
                    <div key={candidate.id} className="grid gap-2 md:grid-cols-3">
                      <p className="text-sm">{candidate.title}</p>
                      <Input
                        type="number"
                        min={0}
                        value={candidate.startSec}
                        onChange={(e) =>
                          state.updateCandidateTrim(
                            candidate.id,
                            Number(e.target.value),
                            candidate.endSec
                          )
                        }
                      />
                      <Input
                        type="number"
                        min={1}
                        value={candidate.endSec}
                        onChange={(e) =>
                          state.updateCandidateTrim(
                            candidate.id,
                            candidate.startSec,
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                  ))}
              </div>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label>Caption style</Label>
                <select
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={state.renderPreset.captionStyle}
                  onChange={(e) =>
                    state.setRenderPreset({
                      ...state.renderPreset,
                      captionStyle:
                        e.target.value === "bold_kinetic" ||
                        e.target.value === "minimal"
                          ? e.target.value
                          : "clean",
                    })
                  }
                >
                  <option value="clean">Clean</option>
                  <option value="bold_kinetic">Bold kinetic</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Branding</Label>
                <label className="flex h-10 items-center gap-2 rounded-md border border-input px-3 text-sm">
                  <input
                    type="checkbox"
                    checked={state.renderPreset.includeBranding}
                    onChange={(e) =>
                      state.setRenderPreset({
                        ...state.renderPreset,
                        includeBranding: e.target.checked,
                      })
                    }
                  />
                  Include branding
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {state.wizardStep === "render" ? (
        <Card>
          <CardHeader>
            <CardTitle>Render</CardTitle>
            <CardDescription>
              Queue selected clips and monitor progress.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => void state.runRender()}
                disabled={state.loadingRender}
              >
                {state.loadingRender ? "Queueing..." : "Start render"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void state.refreshRenderStatuses()}
                disabled={state.refreshingRenders || !state.renderJobs.length}
              >
                {state.refreshingRenders ? "Refreshing..." : "Refresh status"}
              </Button>
            </div>
            <div className="space-y-2">
              {state.renderJobs.length ? (
                state.renderJobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-lg border border-border/70 p-3 text-sm"
                  >
                    <p className="font-medium">{job.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {job.status}
                    </p>
                    {job.status !== "completed" ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => void state.pollRenderJob(job.id)}
                      >
                        Check this job
                      </Button>
                    ) : null}
                    {job.error ? (
                      <p className="mt-2 text-xs text-destructive">{job.error}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No render jobs queued.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {state.wizardStep === "download" ? (
        <Card>
          <CardHeader>
            <CardTitle>Download</CardTitle>
            <CardDescription>Rendered clips will appear here.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {state.renderJobs.length ? (
              state.renderJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-lg border border-border/70 p-3 text-sm"
                >
                  <p className="font-medium">{job.id}</p>
                  {job.outputUrl ? (
                    <a
                      className="text-sm underline"
                      href={job.outputUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download clip
                    </a>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Render output pending.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void state.resolveDownloadForJob(job.id)}
                      >
                        Fetch download link
                      </Button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No outputs yet.</p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
