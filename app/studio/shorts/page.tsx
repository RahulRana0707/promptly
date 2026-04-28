import { ShortsListClient } from "@/app/shorts/shorts-list-client";
import { getPlaceholderUserId } from "@/lib/constants/dev-user-id";
import { listShortsForUser } from "@/lib/db/shorts";

export default async function ShortsPage() {
  let initialProjects: Array<{
    id: string;
    title: string;
    status: string;
    updatedAt: string;
  }> = [];
  let initialError: string | null = null;

  try {
    initialProjects = await listShortsForUser(getPlaceholderUserId());
  } catch {
    initialError = "Could not load shorts projects from the database.";
  }

  return (
    <ShortsListClient initialProjects={initialProjects} initialError={initialError} />
  );
}
