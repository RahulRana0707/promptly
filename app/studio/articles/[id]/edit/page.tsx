import { notFound } from "next/navigation";

import { ArticlesJourneyClient } from "@/app/articles/articles-journey-client";
import { getPlaceholderUserId } from "@/lib/constants/dev-user-id";
import { getArticleForUser } from "@/lib/db/articles";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let initialArticle: { id: string; data: unknown } | null = null;
  let initialLoadError: string | null = null;

  try {
    const article = await getArticleForUser(getPlaceholderUserId(), id);
    if (!article) notFound();
    initialArticle = { id: article.id, data: article.data };
  } catch {
    initialLoadError = "Could not load this article from the database.";
  }

  return (
    <ArticlesJourneyClient
      initialArticle={initialArticle}
      initialLoadError={initialLoadError}
    />
  );
}
