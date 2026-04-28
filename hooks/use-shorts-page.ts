"use client";

import { useState } from "react";

import {
  analyzeShortsProject,
  createShortsProject,
  fetchRenderDownload,
  fetchRenderStatus,
  renderShortsProject,
  transcribeShortsProject,
  updateShortsProject,
} from "@/lib/fetch/shorts";
import type { RenderPreset, ShortsWizardStep } from "@/lib/types/shorts-draft";
import {
  normalizeSavedShortsData,
  type SavedShortsData,
} from "@/lib/types/saved-shorts";

function defaultPreset(): RenderPreset {
  return {
    aspectRatio: "9:16",
    captionStyle: "clean",
    includeBranding: true,
  };
}

export function useShortsPage() {
  const [wizardStep, setWizardStep] = useState<ShortsWizardStep>("source");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceType, setSourceType] = useState<"youtube" | "other">("youtube");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceDurationSec, setSourceDurationSec] = useState(0);
  const [language, setLanguage] = useState("en");
  const [transcript, setTranscript] = useState<SavedShortsData["transcript"]>([]);
  const [candidates, setCandidates] = useState<SavedShortsData["candidates"]>([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [renderPreset, setRenderPreset] = useState<RenderPreset>(defaultPreset());
  const [renderJobs, setRenderJobs] = useState<SavedShortsData["renderJobs"]>([]);
  const [projectStatus, setProjectStatus] = useState<SavedShortsData["projectStatus"]>("created");
  const [savedProjectId, setSavedProjectId] = useState<string | null>(null);
  const [loadingTranscribe, setLoadingTranscribe] = useState(false);
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const [loadingRender, setLoadingRender] = useState(false);
  const [refreshingRenders, setRefreshingRenders] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function windowsOverlap(
    a: { startSec: number; endSec: number },
    b: { startSec: number; endSec: number }
  ): boolean {
    return Math.max(a.startSec, b.startSec) < Math.min(a.endSec, b.endSec);
  }

  function serializeForSave(): SavedShortsData {
    return normalizeSavedShortsData({
      sourceUrl,
      sourceType,
      sourceTitle,
      sourceDurationSec,
      language,
      transcript,
      candidates,
      selectedCandidateIds,
      renderPreset,
      renderJobs,
      projectStatus,
      wizardStep,
      error: "",
    });
  }

  function hydrateFromSaved(input: { id: string; data: unknown }) {
    const normalized = normalizeSavedShortsData(input.data);
    setSavedProjectId(input.id);
    setWizardStep(normalized.wizardStep);
    setSourceUrl(normalized.sourceUrl);
    setSourceType(normalized.sourceType);
    setSourceTitle(normalized.sourceTitle);
    setSourceDurationSec(normalized.sourceDurationSec);
    setLanguage(normalized.language);
    setTranscript(normalized.transcript);
    setCandidates(normalized.candidates);
    setSelectedCandidateIds(normalized.selectedCandidateIds);
    setRenderPreset(normalized.renderPreset);
    setRenderJobs(normalized.renderJobs);
    setProjectStatus(normalized.projectStatus);
  }

  async function runSave(): Promise<string | null> {
    setSavingProject(true);
    setError(null);
    try {
      const data = serializeForSave();
      if (!savedProjectId) {
        const created = await createShortsProject({ data });
        setSavedProjectId(created.id);
        return created.id;
      }
      await updateShortsProject(savedProjectId, { data });
      return savedProjectId;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save shorts project");
      return null;
    } finally {
      setSavingProject(false);
    }
  }

  async function runTranscribe(input?: { force?: boolean }) {
    if (!savedProjectId) {
      setError("Save project before transcription");
      return;
    }
    setLoadingTranscribe(true);
    setError(null);
    try {
      const result = await transcribeShortsProject(savedProjectId, input);
      setTranscript(result.transcript);
      setLanguage(result.language || "en");
      setProjectStatus("transcribing");
      setWizardStep("transcript");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not transcribe source");
    } finally {
      setLoadingTranscribe(false);
    }
  }

  async function runAnalyze(input?: { targetClipCount?: number; minScore?: number }) {
    if (!savedProjectId) {
      setError("Save project before analysis");
      return;
    }
    setLoadingAnalyze(true);
    setError(null);
    try {
      const result = await analyzeShortsProject(savedProjectId, input);
      setCandidates(result.candidates);
      setSelectedCandidateIds([]);
      setProjectStatus("ready_for_selection");
      setWizardStep("moments");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not analyze transcript");
    } finally {
      setLoadingAnalyze(false);
    }
  }

  async function runRender() {
    if (!savedProjectId) {
      setError("Save project before rendering");
      return;
    }
    if (!selectedCandidateIds.length) {
      setError("Select at least one clip");
      return;
    }
    setLoadingRender(true);
    setError(null);
    try {
      const rangeMap = Object.fromEntries(
        candidates
          .filter((candidate) => selectedCandidateIds.includes(candidate.id))
          .map((candidate) => [
            candidate.id,
            { startSec: candidate.startSec, endSec: candidate.endSec },
          ])
      );
      const result = await renderShortsProject({
        id: savedProjectId,
        candidateIds: selectedCandidateIds,
        candidateRanges: rangeMap,
        preset: renderPreset,
      });
      setRenderJobs(
        result.jobs.map((job, index) => ({
          id: job.id,
          candidateId: selectedCandidateIds[index] ?? "",
          status: job.status === "running" ? "running" : "queued",
          outputUrl: "",
          subtitleUrl: "",
          thumbnailUrl: "",
          error: "",
        }))
      );
      setProjectStatus("rendering");
      setWizardStep("render");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start render");
    } finally {
      setLoadingRender(false);
    }
  }

  function toggleCandidateSelection(candidateId: string, checked: boolean) {
    setError(null);
    if (!checked) {
      setSelectedCandidateIds((prev) => prev.filter((id) => id !== candidateId));
      return;
    }

    const candidate = candidates.find((item) => item.id === candidateId);
    if (!candidate) return;

    const conflict = candidates.find((item) => {
      if (!selectedCandidateIds.includes(item.id)) return false;
      return windowsOverlap(candidate, item);
    });
    if (conflict) {
      setError(`Selection overlaps with "${conflict.title}". Adjust trims or deselect it first.`);
      return;
    }

    setSelectedCandidateIds((prev) => [...prev, candidateId]);
  }

  function updateCandidateTrim(candidateId: string, startSec: number, endSec: number) {
    setCandidates((prev) =>
      prev.map((candidate) => {
        if (candidate.id !== candidateId) return candidate;
        const clampedStart = Math.max(0, Math.floor(startSec));
        const clampedEnd = Math.max(clampedStart + 1, Math.floor(endSec));
        return { ...candidate, startSec: clampedStart, endSec: clampedEnd };
      })
    );
  }

  async function pollRenderJob(renderId: string) {
    setError(null);
    try {
      const status = await fetchRenderStatus(renderId);
      setRenderJobs((prev) =>
        prev.map((job) =>
          job.id === renderId
            ? {
                ...job,
                status:
                  status.status === "completed"
                    ? "completed"
                    : status.status === "failed"
                      ? "failed"
                      : status.status === "running"
                        ? "running"
                        : "queued",
                outputUrl: status.outputUrl,
                subtitleUrl: status.subtitleUrl,
                thumbnailUrl: status.thumbnailUrl,
                error: status.error,
              }
            : job
        )
      );
      if (status.status === "failed") {
        setError(status.error || "Render job failed");
      }
      return status;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not fetch render status";
      setError(message);
      return null;
    }
  }

  async function refreshRenderStatuses() {
    if (!renderJobs.length) return;
    setRefreshingRenders(true);
    setError(null);
    try {
      const statuses = await Promise.all(renderJobs.map((job) => pollRenderJob(job.id)));
      const latestStatuses = statuses.filter((item): item is NonNullable<typeof item> => item !== null);
      if (latestStatuses.length && latestStatuses.every((item) => item.status === "completed")) {
        setWizardStep("download");
        setProjectStatus("completed");
      }
    } finally {
      setRefreshingRenders(false);
    }
  }

  async function resolveDownloadForJob(renderId: string) {
    setError(null);
    try {
      const download = await fetchRenderDownload(renderId);
      setRenderJobs((prev) =>
        prev.map((job) =>
          job.id === renderId
            ? {
                ...job,
                outputUrl: download.downloadUrl,
                subtitleUrl: download.subtitleUrl,
                thumbnailUrl: download.thumbnailUrl,
                status: "completed",
              }
            : job
        )
      );
      setWizardStep("download");
      return download;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not resolve download URL";
      setError(message);
      return null;
    }
  }

  return {
    wizardStep,
    setWizardStep,
    sourceUrl,
    setSourceUrl,
    sourceType,
    setSourceType,
    sourceTitle,
    setSourceTitle,
    sourceDurationSec,
    setSourceDurationSec,
    language,
    setLanguage,
    transcript,
    setTranscript,
    candidates,
    setCandidates,
    selectedCandidateIds,
    setSelectedCandidateIds,
    toggleCandidateSelection,
    updateCandidateTrim,
    renderPreset,
    setRenderPreset,
    renderJobs,
    setRenderJobs,
    projectStatus,
    setProjectStatus,
    savedProjectId,
    loadingTranscribe,
    loadingAnalyze,
    loadingRender,
    refreshingRenders,
    savingProject,
    error,
    serializeForSave,
    hydrateFromSaved,
    runSave,
    runTranscribe,
    runAnalyze,
    runRender,
    pollRenderJob,
    refreshRenderStatuses,
    resolveDownloadForJob,
  };
}
