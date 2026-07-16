"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

interface GreetingHeaderProps {
  name: string;
  /** The narrative line under the greeting — callers compute this from real data (e.g. an
   * attention-item count) rather than this component inventing copy. Omit for a plain greeting. */
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

/** The narrative greeting — same SSR-safe, IST-correct time-of-day pattern as
 * `components/dashboard/executive-hero.tsx`'s `greetingForHour`/lazy-`useState` (reused verbatim
 * rather than reinvented: a Node server runs in UTC, so reading the hour via a fixed-timezone
 * `Intl` formatter, once, keeps server and client agreeing on "morning" vs. "evening"). */
export function GreetingHeader({ name, subtitle, actions, className }: GreetingHeaderProps) {
  const [greeting] = useState(() => {
    const istHour = Number(
      new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(
        new Date(),
      ),
    );
    return greetingForHour(istHour);
  });

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {greeting}, {name}.
        </h1>
        {subtitle ? <p className="text-muted-foreground max-w-2xl text-2xl font-medium sm:text-3xl">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
