"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface QuickActionButtonProps {
  label: string;
  icon: LucideIcon;
  tone?: string;
  href?: string;
  onClick?: () => void;
  /** `tile` is the original vertical icon-over-label card. `pill` is a horizontal, rounded-full
   * button with a small icon badge — for a compact action row directly under a page header. */
  variant?: "tile" | "pill";
  className?: string;
}

/** One button in a quick-actions row — the same link-or-button shape
 * `components/dashboard/quick-actions-grid.tsx`'s internal `Tile` already used (a `Link` when
 * `href` is given, a `<button>` when `onClick` is — e.g. the command-palette trigger, which has no
 * URL of its own), pulled out so it isn't redefined per page. */
export function QuickActionButton({
  label,
  icon: Icon,
  tone = "bg-muted text-foreground",
  href,
  onClick,
  variant = "tile",
  className,
}: QuickActionButtonProps) {
  const content =
    variant === "pill" ? (
      <>
        <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full", tone)}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <span className="text-sm font-medium">{label}</span>
      </>
    ) : (
      <>
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110",
            tone,
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-sm font-medium">{label}</span>
      </>
    );

  const sharedClassName = cn(
    "interactive-lift group focus-visible:ring-ring focus-visible:ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    variant === "pill"
      ? "flex items-center gap-2.5 rounded-full border bg-card py-2 pr-5 pl-2"
      : "flex flex-col items-center justify-center gap-3 rounded-xl border bg-card p-5 text-center",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={sharedClassName}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={sharedClassName}>
      {content}
    </button>
  );
}
