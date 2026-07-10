"use client";

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
          {children}
          <Toaster position="top-right" richColors closeButton />
        </QueryProvider>
      </ClerkThemeProvider>
    </ThemeProvider>
  );
}
