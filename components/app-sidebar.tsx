"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  BookTextIcon,
  CalendarDaysIcon,
  ClapperboardIcon,
  PenSquareIcon,
  QuoteIcon,
  Settings2Icon,
  SparklesIcon,
} from "lucide-react";

const data = {
  user: {
    name: "W",
    email: "profile@promptly.app",
    avatar: "",
  },
  navMain: [
    {
      title: "Compose",
      url: "/studio/compose",
      icon: <PenSquareIcon />,
      isActive: true,
    },
    {
      title: "Daily Plan",
      url: "/studio/daily-plan",
      icon: <CalendarDaysIcon />,
    },
    {
      title: "Patterns",
      url: "/studio/patterns",
      icon: <SparklesIcon />,
    },
    {
      title: "Quote Repost",
      url: "/studio/quote-repost",
      icon: <QuoteIcon />,
    },
    {
      title: "Articles",
      url: "/studio/articles",
      icon: <BookTextIcon />,
      items: [
        {
          title: "All Articles",
          url: "/studio/articles",
        },
        {
          title: "Create New",
          url: "/studio/articles/new",
        },
      ],
    },
    {
      title: "Shorts",
      url: "/studio/shorts",
      icon: <ClapperboardIcon />,
      items: [
        {
          title: "All Projects",
          url: "/studio/shorts",
        },
        {
          title: "Create New",
          url: "/studio/shorts/new",
        },
      ],
    },
    {
      title: "Profile",
      url: "/studio/profile",
      icon: <Settings2Icon />,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/studio/compose">
                <div className="flex size-10 items-center justify-center overflow-hidden">
                  <Image
                    src="/promptly_logo.svg"
                    alt="Promptly logo"
                    width={36}
                    height={36}
                    className="size-9"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Promptly</span>
                  <span className="truncate text-xs">
                    Write Better. Grow Faster.
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
