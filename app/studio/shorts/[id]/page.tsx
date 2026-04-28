import { notFound } from "next/navigation";

import { ShortsDetailClient } from "@/app/shorts/shorts-detail-client";
import { getPlaceholderUserId } from "@/lib/constants/dev-user-id";
import { getShortsProjectForUser } from "@/lib/db/shorts";

export default async function ShortsDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getShortsProjectForUser(getPlaceholderUserId(), id);
  if (!project) notFound();
  return <ShortsDetailClient project={project} />;
}
