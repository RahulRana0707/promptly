"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { ShortsJourneyWizard } from "@/app/shorts/_components/shorts-journey-wizard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useShortsPage } from "@/hooks/use-shorts-page";

type Props = {
  initialProject?: {
    id: string;
    data: unknown;
  } | null;
  initialLoadError?: string | null;
};

export function ShortsJourneyClient({ initialProject, initialLoadError }: Props) {
  const router = useRouter();
  const state = useShortsPage();

  useEffect(() => {
    if (initialProject) {
      state.hydrateFromSaved(initialProject);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProject?.id]);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Studio
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {initialProject ? "Edit shorts project" : "New shorts project"}
        </h1>
      </div>

      {initialLoadError ? (
        <Alert variant="destructive">
          <AlertTitle>Shorts project load failed</AlertTitle>
          <AlertDescription>{initialLoadError}</AlertDescription>
        </Alert>
      ) : null}

      <ShortsJourneyWizard
        state={state}
        onSaveProject={(id) => {
          router.push(`/studio/shorts/${id}`);
        }}
      />
    </div>
  );
}
