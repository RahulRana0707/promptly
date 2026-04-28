"use client";

import dynamic from "next/dynamic";

const ArticleMarkdownPreviewInner = dynamic(
  () =>
    import("@/components/article-markdown-preview-inner").then(
      (m) => m.ArticleMarkdownPreviewInner
    ),
  { ssr: false }
);

type Props = {
  markdown: string;
};

export function ArticleMarkdownPreview({ markdown }: Props) {
  return <ArticleMarkdownPreviewInner markdown={markdown} />;
}
