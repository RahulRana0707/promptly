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
import { normalizeSavedShortsData } from "@/lib/types/saved-shorts";

type Props = {
  project: {
    id: string;
    title: string;
    status: string;
    data: unknown;
  };
};

export function ShortsDetailClient({ project }: Props) {
  const data = normalizeSavedShortsData(project.data);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Shorts project
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {project.title || data.sourceTitle || "Untitled shorts project"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Status: {project.status}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/studio/shorts">Back</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/studio/shorts/${project.id}/edit`}>Edit project</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Source</CardTitle>
          <CardDescription>Input used to generate clip candidates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>
            <span className="text-muted-foreground">URL:</span> {data.sourceUrl || "Not set"}
          </p>
          <p>
            <span className="text-muted-foreground">Type:</span> {data.sourceType}
          </p>
          <p>
            <span className="text-muted-foreground">Language:</span> {data.language || "N/A"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Candidate clips</CardTitle>
          <CardDescription>Ranked shortlist from transcript analysis.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.candidates.length ? (
            data.candidates.map((candidate) => (
              <div key={candidate.id} className="rounded-lg border border-border/70 p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{candidate.title}</p>
                  <span className="text-xs text-muted-foreground">Score {candidate.score}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {candidate.startSec}s - {candidate.endSec}s
                </p>
                <p>{candidate.reason}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No candidates generated yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
