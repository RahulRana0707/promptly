"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ArticleJourneyWizard } from "@/app/articles/_components/article-journey-wizard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getProfile } from "@/lib/fetch/profile";
import { useArticlePage } from "@/hooks/use-article-page";

type Props = {
  initialArticle?: {
    id: string;
    data: unknown;
  } | null;
  initialLoadError?: string | null;
};

export function ArticlesJourneyClient({ initialArticle, initialLoadError }: Props) {
  const router = useRouter();
  const state = useArticlePage();
  const [profileNeedsSetup, setProfileNeedsSetup] = useState(false);

  useEffect(() => {
    if (initialArticle) {
      state.hydrateFromSaved(initialArticle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialArticle?.id]);

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then((profile) => {
        if (cancelled) return;
        setProfileNeedsSetup(!profile.bio.trim() && !profile.niche.trim());
      })
      .catch(() => {
        if (cancelled) return;
        setProfileNeedsSetup(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Studio
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {initialArticle ? "Edit article" : "New article"}
        </h1>
      </div>

      {initialLoadError ? (
        <Alert variant="destructive">
          <AlertTitle>Article load failed</AlertTitle>
          <AlertDescription>{initialLoadError}</AlertDescription>
        </Alert>
      ) : null}

      {profileNeedsSetup ? (
        <Alert>
          <AlertTitle>Profile context improves article quality</AlertTitle>
          <AlertDescription>
            Your niche and bio are empty, so output may be generic. Update profile first.
            {" "}
            <Link href="/studio/profile" className="underline underline-offset-2">
              Open profile
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : null}

      <ArticleJourneyWizard
        state={state}
        onSaveArticle={(id) => {
          router.push(`/studio/articles/${id}`);
        }}
      />
    </div>
  );
}
