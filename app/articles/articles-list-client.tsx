"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = {
  initialArticles: Array<{
    id: string;
    title: string;
    updatedAt: string;
  }>;
  initialError?: string | null;
};

export function ArticlesListClient({ initialArticles, initialError }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Studio
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Articles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Draft long-form X articles with card, body, and image prompts.
          </p>
        </div>
        <Button asChild>
          <Link href="/studio/articles/new">New article</Link>
        </Button>
      </div>

      {initialError ? (
        <Card>
          <CardHeader>
            <CardTitle>Could not load articles</CardTitle>
            <CardDescription>{initialError}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Saved articles</CardTitle>
          <CardDescription>
            {initialArticles.length} saved article{initialArticles.length === 1 ? "" : "s"}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {initialArticles.length ? (
            initialArticles.map((article) => (
              <Link
                key={article.id}
                href={`/studio/articles/${article.id}`}
                className="block rounded-lg border border-border/70 p-3 transition-colors hover:bg-muted/40"
              >
                <p className="font-medium">{article.title || "Untitled article"}</p>
                <p className="text-xs text-muted-foreground">
                  Updated {new Date(article.updatedAt).toLocaleString()}
                </p>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No saved articles yet. Create your first one.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
