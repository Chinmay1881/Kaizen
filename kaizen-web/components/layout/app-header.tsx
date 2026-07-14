"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Moon, Plus, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { BreadcrumbNav } from "@/components/layout/breadcrumb-nav";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { getPageContext } from "@/lib/breadcrumbs";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { SearchTriggerButton } from "@/features/search/components/search-trigger-button";

export function AppHeader() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const { title, breadcrumbs } = getPageContext(pathname);

  return (
    <header className="bg-background/80 sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b px-4 backdrop-blur-md sm:px-6">
      <div className="hidden min-w-0 flex-1 flex-col justify-center gap-0.5 sm:flex">
        {breadcrumbs.length > 1 ? <BreadcrumbNav items={breadcrumbs} /> : null}
        <h1 className="truncate text-lg leading-tight font-semibold tracking-tight">{title}</h1>
      </div>

      <div className="flex flex-1 items-center justify-end gap-1.5 sm:flex-none">
        <SearchTriggerButton />

        <Button size="sm" className="hidden gap-1.5 md:inline-flex" asChild>
          <Link href={ROUTES.NEW_KAIZEN}>
            <Plus className="h-4 w-4" />
            New Idea
          </Link>
        </Button>

        <div className="bg-border mx-1 hidden h-6 w-px sm:block" aria-hidden="true" />

        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-[18px] w-[18px] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[18px] w-[18px] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        </Button>
        <NotificationBell />
        <LogoutButton iconOnly />
        <UserButton />
      </div>
    </header>
  );
}
