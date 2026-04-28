import { notFound } from "next/navigation";

import { ShortsJourneyClient } from "@/app/shorts/shorts-journey-client";
import { getPlaceholderUserId } from "@/lib/constants/dev-user-id";
import { getShortsProjectForUser } from "@/lib/db/shorts";

export default async function EditShortsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let initialProject: { id: string; data: unknown } | null = null;
  let initialLoadError: string | null = null;

  try {
    const project = await getShortsProjectForUser(getPlaceholderUserId(), id);
    if (!project) notFound();
    initialProject = { id: project.id, data: project.data };
  } catch {
    initialLoadError = "Could not load this shorts project from the database.";
  }

  return (
    <ShortsJourneyClient
      initialProject={initialProject}
      initialLoadError={initialLoadError}
    />
  );
}
