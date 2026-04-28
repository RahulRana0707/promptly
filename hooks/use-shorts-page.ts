"use client";

import { useState } from "react";

import {
  analyzeShortsProject,
  createShortsProject,
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
  const [savingProject, setSavingProject] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      await transcribeShortsProject(savedProjectId, input);
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
      const result = await renderShortsProject({
        id: savedProjectId,
        candidateIds: selectedCandidateIds,
        preset: renderPreset,
      });
      setRenderJobs(
        result.jobs.map((job) => ({
          id: job.id.replace(`${savedProjectId}--`, ""),
          candidateId: "",
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

  async function pollRenderJob(renderId: string) {
    setError(null);
    try {
      const status = await fetchRenderStatus(renderId);
      if (status.status === "completed") {
        setWizardStep("download");
      }
      return status;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not fetch render status";
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
    savingProject,
    error,
    serializeForSave,
    hydrateFromSaved,
    runSave,
    runTranscribe,
    runAnalyze,
    runRender,
    pollRenderJob,
  };
}
