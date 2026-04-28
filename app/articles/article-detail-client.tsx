"use client";

import Link from "next/link";
import { useState } from "react";

import { ArticleMarkdownPreview } from "@/components/article-markdown-preview";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  buildXArticleMarkdown,
  normalizeSavedArticleData,
} from "@/lib/types/saved-article";

type Props = {
  article: {
    id: string;
    title: string;
    data: unknown;
  };
};

export function ArticleDetailClient({ article }: Props) {
  const [copied, setCopied] = useState(false);
  const data = normalizeSavedArticleData(article.data);

  async function copyForX() {
    const text = buildXArticleMarkdown({
      workingTitle: data.workingTitle,
      previewHook: data.previewHook,
      bodyMarkdown: data.bodyMarkdown,
    });
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Article
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {data.workingTitle || article.title || "Untitled article"}
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/studio/articles">Back</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/studio/articles/${article.id}/edit`}>Edit article</Link>
          </Button>
          <Button onClick={() => void copyForX()}>{copied ? "Copied" : "Copy for X"}</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preview hook</CardTitle>
          <CardDescription>Card subtitle shown in feeds.</CardDescription>
        </CardHeader>
        <CardContent>
          <blockquote className="border-l-2 border-border pl-3 text-sm text-muted-foreground">
            {data.previewHook || "No preview hook."}
          </blockquote>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Article body</CardTitle>
        </CardHeader>
        <CardContent>
          <ArticleMarkdownPreview markdown={data.bodyMarkdown} />
        </CardContent>
      </Card>
    </div>
  );
}
