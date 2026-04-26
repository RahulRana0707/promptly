import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { StudioBreadcrumbs } from "@/components/studio-breadcrumbs";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider className="h-dvh max-h-dvh min-h-0 overflow-hidden">
      <AppSidebar />
      <SidebarInset className="min-h-0 flex-1 overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background">
          <div className="flex min-w-0 flex-1 items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 shrink-0" />
            <Separator
              orientation="vertical"
              className="h-4 shrink-0 data-[orientation=vertical]:h-4"
            />
            <StudioBreadcrumbs />
          </div>
        </header>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
