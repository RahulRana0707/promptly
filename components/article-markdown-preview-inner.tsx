"use client";

type Props = {
  markdown: string;
};

export function ArticleMarkdownPreviewInner({ markdown }: Props) {
  if (!markdown.trim()) {
    return <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>;
  }

  return (
    <div className="rounded-lg border border-border/70 bg-background p-4">
      <pre className="whitespace-pre-wrap text-sm leading-6">{markdown}</pre>
    </div>
  );
}
