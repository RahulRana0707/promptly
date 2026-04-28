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
  initialProjects: Array<{
    id: string;
    title: string;
    status: string;
    updatedAt: string;
  }>;
  initialError?: string | null;
};

function formatUpdatedAt(input: string): string {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return date.toISOString().replace("T", " ").replace(".000Z", " UTC");
}

export function ShortsListClient({ initialProjects, initialError }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Studio
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Shorts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Convert podcasts and long videos into short-form clips.
          </p>
        </div>
        <Button asChild>
          <Link href="/studio/shorts/new">New shorts project</Link>
        </Button>
      </div>

      {initialError ? (
        <Card>
          <CardHeader>
            <CardTitle>Could not load shorts projects</CardTitle>
            <CardDescription>{initialError}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Saved projects</CardTitle>
          <CardDescription>
            {initialProjects.length} saved project{initialProjects.length === 1 ? "" : "s"}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {initialProjects.length ? (
            initialProjects.map((project) => (
              <Link
                key={project.id}
                href={`/studio/shorts/${project.id}`}
                className="block rounded-lg border border-border/70 p-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">
                    {project.title || "Untitled shorts project"}
                  </p>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {project.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Updated {formatUpdatedAt(project.updatedAt)}
                </p>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No shorts projects yet. Create your first one.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
