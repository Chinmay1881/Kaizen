"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { useTheme } from "next-themes";

import { clerkLocalization, getClerkAppearance } from "@/features/auth/constants/clerk-appearance";

interface ClerkThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Wraps ClerkProvider with a theme-aware appearance. Must render inside ThemeProvider so
 * `useTheme()` resolves. Clerk's `appearance` is evaluated at render time (not CSS variables),
 * so it can't react to the `.dark` class alone — it needs to be recomputed on theme change.
 * `resolvedTheme` is `undefined` until next-themes mounts client-side; that briefly falls back
 * to the light palette, then re-renders once the real theme is known — same as any other
 * next-themes consumer, and harmless here since Clerk's widgets render fully client-side anyway.
 */
export function ClerkThemeProvider({ children }: ClerkThemeProviderProps) {
  const { resolvedTheme } = useTheme();
  const appearance = getClerkAppearance(resolvedTheme === "dark" ? "dark" : "light");

  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      appearance={appearance}
      localization={clerkLocalization}
    >
      {children}
    </ClerkProvider>
  );
}
