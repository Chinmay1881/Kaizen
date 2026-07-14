"use client";

import { MotionConfig } from "framer-motion";

import { ThemeProvider } from "@/providers/theme-provider";
import { ClerkThemeProvider } from "@/providers/clerk-theme-provider";

import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "sonner";

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ClerkThemeProvider>
        <QueryProvider>
          {/* `reducedMotion="user"` makes every `motion.*` element in the app (PageTransition,
              FadeIn, Dialog, DropdownMenu, ...) automatically honor the OS/browser
              prefers-reduced-motion setting — Framer Motion drives transforms via JS, so it
              doesn't pick up the CSS `@media (prefers-reduced-motion: reduce)` rule in
              globals.css on its own. */}
          <MotionConfig reducedMotion="user">{children}</MotionConfig>
          <Toaster
            position="top-right"
            closeButton
            toastOptions={{
              classNames: {
                toast:
                  "bg-popover! text-popover-foreground! border! border-border! shadow-[var(--shadow-lg)]! rounded-lg!",
                title: "text-sm! font-medium!",
                description: "text-muted-foreground!",
                actionButton: "bg-primary! text-primary-foreground!",
                cancelButton: "bg-muted! text-muted-foreground!",
                closeButton: "bg-popover! border-border! text-muted-foreground!",
                success: "border-l-4! border-l-success!",
                error: "border-l-4! border-l-destructive!",
                warning: "border-l-4! border-l-warning!",
                info: "border-l-4! border-l-info!",
              },
            }}
          />
        </QueryProvider>
      </ClerkThemeProvider>
    </ThemeProvider>
  );
}
