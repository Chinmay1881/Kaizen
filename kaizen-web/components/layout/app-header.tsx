"use client";

import { UserButton } from "@clerk/nextjs";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { SearchTriggerButton } from "@/features/search/components/search-trigger-button";

interface AppHeaderProps {
  title?: string;
}

export function AppHeader({ title = "Muliya Kaizan" }: AppHeaderProps) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="bg-background/95 sticky top-0 z-30 flex h-16 items-center justify-between border-b px-6 backdrop-blur">
      <div className="hidden sm:block">
        <p className="text-muted-foreground text-sm">Workspace</p>
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
        <SearchTriggerButton />
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        </Button>
        <NotificationBell />
        <LogoutButton iconOnly />
        <UserButton />
      </div>
    </header>
  );
}
