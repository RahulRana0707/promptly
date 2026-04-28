import { notFound } from "next/navigation";

import { ArticleDetailClient } from "@/app/articles/article-detail-client";
import { getPlaceholderUserId } from "@/lib/constants/dev-user-id";
import { getArticleForUser } from "@/lib/db/articles";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await getArticleForUser(getPlaceholderUserId(), id);
  if (!article) notFound();
  return <ArticleDetailClient article={article} />;
}
