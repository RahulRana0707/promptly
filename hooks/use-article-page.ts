"use client"

import { useMemo, useState } from "react"

import {
  createArticle,
  generateArticleBody,
  generateArticleImagePrompts,
  generateArticleImageSlots,
  generateArticlePlan,
  updateArticle,
} from "@/lib/fetch/articles"
import { getProfile } from "@/lib/fetch/profile"
import type {
  ArticleImageSlots,
  ArticleOutlineSection,
  ArticleWizardStep,
  GeneratedImagePrompt,
} from "@/lib/types/article-draft"
import {
  normalizeSavedArticleData,
  type SavedArticleData,
} from "@/lib/types/saved-article"

function emptySlots(): ArticleImageSlots {
  return { tension: "", mood: "", metaphor: "", composition: "" }
}

export function useArticlePage() {
  const [wizardStep, setWizardStep] = useState<ArticleWizardStep>("intent")
  const [topic, setTopic] = useState("")
  const [audience, setAudience] = useState("")
  const [tone, setTone] = useState("")
  const [promise, setPromise] = useState("")
  const [wellnessClaimsAllowed, setWellnessClaimsAllowed] = useState(false)
  const [workingTitle, setWorkingTitle] = useState("")
  const [titleVariants, setTitleVariants] = useState<string[]>([])
  const [previewHook, setPreviewHook] = useState("")
  const [outline, setOutline] = useState<ArticleOutlineSection[]>([])
  const [bodyMarkdown, setBodyMarkdown] = useState("")
  const [imageAspectRatioId, setImageAspectRatioId] = useState("5_2")
  const [imageSlots, setImageSlots] = useState<ArticleImageSlots>(emptySlots())
  const [slotsBackupBeforeAi, setSlotsBackupBeforeAi] = useState<ArticleImageSlots | null>(null)
  const [aiSuggestedSlots, setAiSuggestedSlots] = useState<ArticleImageSlots | null>(null)
  const [generatedImagePrompts, setGeneratedImagePrompts] = useState<GeneratedImagePrompt[]>([])
  const [savedArticleId, setSavedArticleId] = useState<string | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState(false)
  const [loadingExpand, setLoadingExpand] = useState(false)
  const [loadingImageSlots, setLoadingImageSlots] = useState(false)
  const [loadingImagePrompts, setLoadingImagePrompts] = useState(false)
  const [savingArticle, setSavingArticle] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const intent = useMemo(
    () => ({ topic, audience, tone, promise, wellnessClaimsAllowed }),
    [topic, audience, tone, promise, wellnessClaimsAllowed]
  )

  function serializeForSave(): SavedArticleData {
    return normalizeSavedArticleData({
      topic,
      audience,
      tone,
      promise,
      wellnessClaimsAllowed,
      workingTitle,
      titleVariants,
      previewHook,
      outline,
      bodyMarkdown,
      imageAspectRatioId,
      imageSlots,
      slotsBackupBeforeAi,
      aiSuggestedSlots,
      generatedImagePrompts,
      wizardStep,
    })
  }

  function hydrateFromSaved(input: { id: string; data: unknown }) {
    const normalized = normalizeSavedArticleData(input.data)
    setSavedArticleId(input.id)
    setWizardStep(normalized.wizardStep)
    setTopic(normalized.topic)
    setAudience(normalized.audience)
    setTone(normalized.tone)
    setPromise(normalized.promise)
    setWellnessClaimsAllowed(normalized.wellnessClaimsAllowed)
    setWorkingTitle(normalized.workingTitle)
    setTitleVariants(normalized.titleVariants)
    setPreviewHook(normalized.previewHook)
    setOutline(normalized.outline)
    setBodyMarkdown(normalized.bodyMarkdown)
    setImageAspectRatioId(normalized.imageAspectRatioId)
    setImageSlots(normalized.imageSlots)
    setSlotsBackupBeforeAi(normalized.slotsBackupBeforeAi)
    setAiSuggestedSlots(normalized.aiSuggestedSlots)
    setGeneratedImagePrompts(normalized.generatedImagePrompts)
  }

  async function runPlan() {
    setLoadingPlan(true)
    setError(null)
    try {
      setLoadingProfile(true)
      const profile = await getProfile()
      const res = await generateArticlePlan({ intent, profile })
      setWorkingTitle(res.workingTitle)
      setTitleVariants(res.titleVariants)
      setPreviewHook(res.previewHook)
      setOutline(res.outline)
      setBodyMarkdown("")
      setGeneratedImagePrompts([])
      setSlotsBackupBeforeAi(null)
      setAiSuggestedSlots(null)
      setWizardStep("card")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate article plan")
    } finally {
      setLoadingProfile(false)
      setLoadingPlan(false)
    }
  }

  async function runExpand() {
    setLoadingExpand(true)
    setError(null)
    try {
      const profile = await getProfile()
      const res = await generateArticleBody({
        intent,
        profile,
        workingTitle,
        previewHook,
        outline,
      })
      setBodyMarkdown(res.markdown)
      setWizardStep("body")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate article body")
    } finally {
      setLoadingExpand(false)
    }
  }

  async function runSuggestImageSlots() {
    setLoadingImageSlots(true)
    setError(null)
    try {
      const backup = imageSlots
      const res = await generateArticleImageSlots({
        topic,
        workingTitle,
        previewHook,
        articleMarkdown: bodyMarkdown,
      })
      setSlotsBackupBeforeAi(backup)
      setAiSuggestedSlots(res)
      setImageSlots(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate image slots")
    } finally {
      setLoadingImageSlots(false)
    }
  }

  async function runGenerateImagePrompts() {
    setLoadingImagePrompts(true)
    setError(null)
    try {
      const res = await generateArticleImagePrompts({
        workingTitle,
        previewHook,
        articleMarkdown: bodyMarkdown,
      })
      setGeneratedImagePrompts(
        res.prompts.map((p) => ({ ...p, source: "generated" as const }))
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate image prompts")
    } finally {
      setLoadingImagePrompts(false)
    }
  }

  async function runSave(): Promise<string | null> {
    setSavingArticle(true)
    setError(null)
    try {
      const data = serializeForSave()
      if (!savedArticleId) {
        const created = await createArticle({ data })
        setSavedArticleId(created.id)
        setWizardStep("save")
        return created.id
      }
      await updateArticle(savedArticleId, { data })
      setWizardStep("save")
      return savedArticleId
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save article")
      return null
    } finally {
      setSavingArticle(false)
    }
  }

  return {
    wizardStep,
    setWizardStep,
    topic,
    setTopic,
    audience,
    setAudience,
    tone,
    setTone,
    promise,
    setPromise,
    wellnessClaimsAllowed,
    setWellnessClaimsAllowed,
    workingTitle,
    setWorkingTitle,
    titleVariants,
    setTitleVariants,
    previewHook,
    setPreviewHook,
    outline,
    setOutline,
    bodyMarkdown,
    setBodyMarkdown,
    imageAspectRatioId,
    setImageAspectRatioId,
    imageSlots,
    setImageSlots,
    slotsBackupBeforeAi,
    aiSuggestedSlots,
    generatedImagePrompts,
    savedArticleId,
    loadingProfile,
    loadingPlan,
    loadingExpand,
    loadingImageSlots,
    loadingImagePrompts,
    savingArticle,
    error,
    serializeForSave,
    hydrateFromSaved,
    runPlan,
    runExpand,
    runSuggestImageSlots,
    runGenerateImagePrompts,
    runSave,
    restoreSlotsBackup() {
      if (slotsBackupBeforeAi) setImageSlots(slotsBackupBeforeAi)
    },
    restoreLastAiSlots() {
      if (aiSuggestedSlots) setImageSlots(aiSuggestedSlots)
    },
  }
}
