import { ArticlesListClient } from "@/app/articles/articles-list-client";
import { getPlaceholderUserId } from "@/lib/constants/dev-user-id";
import { listArticlesForUser } from "@/lib/db/articles";

export default async function ArticlesPage() {
  let initialArticles: Array<{ id: string; title: string; updatedAt: string }> = [];
  let initialError: string | null = null;

  try {
    initialArticles = await listArticlesForUser(getPlaceholderUserId());
  } catch {
    initialError = "Could not load articles from the database.";
  }

  return <ArticlesListClient initialArticles={initialArticles} initialError={initialError} />;
}
