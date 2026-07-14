"use client";

import { useState } from "react";
import Link from "next/link";
import { BarChart3, Award, FileBarChart, FileEdit, Plus, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { readStoredDraft } from "@/features/kaizen/utils/draft-storage";
import { canReview } from "@/lib/permissions";
import type { UserRole } from "@/types/enums";

interface QuickAction {
  label: string;
  href: string;
  icon: LucideIcon;
  tone: string;
}

interface QuickActionsTilesProps {
  role: UserRole;
}

/** Left panel quick actions. "Continue Draft" only appears when `readStoredDraft()` (the
 * wizard's own localStorage recovery mechanism, KAIZEN-001) actually finds one — otherwise it
 * would be a dead-end tile pointing at nothing to resume. "Achievements" scrolls to the Trophy
 * Cabinet section on this same page rather than linking to a route that doesn't exist. */
export function QuickActionsTiles({ role }: QuickActionsTilesProps) {
  const [hasDraft] = useState(() => Boolean(readStoredDraft()));

  const actions: QuickAction[] = [
    hasDraft
      ? { label: "Continue Draft", href: ROUTES.NEW_KAIZEN, icon: FileEdit, tone: "bg-warning/20 text-warning-foreground" }
      : { label: "Submit New Idea", href: ROUTES.NEW_KAIZEN, icon: Plus, tone: "bg-primary/10 text-primary" },
    { label: "Leaderboard", href: ROUTES.LEADERBOARD, icon: Trophy, tone: "bg-achievement/20 text-achievement-foreground" },
    { label: "Achievements", href: "#trophy-cabinet", icon: Award, tone: "bg-rewards/15 text-rewards" },
  ];

  if (canReview(role)) {
    actions.push(
      { label: "Analytics", href: ROUTES.ANALYTICS, icon: BarChart3, tone: "bg-info/15 text-info" },
      { label: "Reports", href: ROUTES.REPORTS, icon: FileBarChart, tone: "bg-business-impact/15 text-business-impact" },
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {actions.map((action) => (
        <Link key={action.label} href={action.href} className="interactive-lift group flex flex-col items-center justify-center gap-2 rounded-xl border bg-card p-4 text-center">
          <span className={`flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110 ${action.tone}`}>
            <action.icon className="h-4 w-4" />
          </span>
          <span className="text-xs font-medium">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}
