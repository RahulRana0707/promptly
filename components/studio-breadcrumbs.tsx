"use client";

import Link from "next/link";
import { Fragment, useMemo } from "react";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const SEGMENT_LABELS: Record<string, string> = {
  compose: "Compose",
  profile: "Profile",
  "daily-plan": "Daily Plan",
  patterns: "Patterns",
  "quote-repost": "Quote Repost",
  articles: "Articles",
  new: "New article",
};

function labelForSegment(segment: string): string {
  return (
    SEGMENT_LABELS[segment] ??
    segment
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

export type StudioCrumb = {
  href: string;
  label: string;
  isCurrentPage: boolean;
};

export function getStudioBreadcrumbs(pathname: string): StudioCrumb[] {
  const normalized = pathname.replace(/\/$/, "") || "/";
  const parts = normalized.split("/").filter(Boolean);

  if (parts[0] !== "studio") {
    return [{ href: "/", label: "Home", isCurrentPage: true }];
  }

  const crumbs: StudioCrumb[] = [
    { href: "/studio/compose", label: "Studio", isCurrentPage: false },
  ];

  if (parts.length === 1) {
    crumbs[0] = { ...crumbs[0], isCurrentPage: true };
    return crumbs;
  }

  let acc = "/studio";
  for (let i = 1; i < parts.length; i++) {
    acc += `/${parts[i]}`;
    const isLast = i === parts.length - 1;
    crumbs.push({
      href: acc,
      label: labelForSegment(parts[i]),
      isCurrentPage: isLast,
    });
  }

  return crumbs;
}

export function StudioBreadcrumbs() {
  const pathname = usePathname();
  const crumbs = useMemo(() => getStudioBreadcrumbs(pathname), [pathname]);

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, index) => (
          <Fragment key={`${crumb.href}-${index}`}>
            {index > 0 ? (
              <BreadcrumbSeparator className="hidden sm:block" />
            ) : null}
            <BreadcrumbItem className="min-w-0 shrink">
              {crumb.isCurrentPage ? (
                <BreadcrumbPage className="truncate font-medium">
                  {crumb.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild className="truncate">
                  <Link href={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
