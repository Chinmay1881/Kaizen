"use client";

import { BarChart3, ClipboardList, FileBarChart, HardHat, ListChecks, Plus, Search, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { QuickActionButton } from "@/components/v2/quick-action-button";
import { ROUTES } from "@/constants/routes";
import { OPEN_COMMAND_PALETTE_EVENT } from "@/features/search/components/command-palette";
import type { CurrentUser } from "@/features/auth/types/user";
import { canReview } from "@/lib/permissions";

interface QuickAction {
  label: string;
  icon: LucideIcon;
  tone: string;
  href?: string;
  onClick?: () => void;
}

const BASE_ACTIONS: QuickAction[] = [
  { label: "Submit Idea", href: ROUTES.NEW_KAIZEN, icon: Plus, tone: "bg-primary/10 text-primary" },
  { label: "My Ideas", href: ROUTES.MY_IDEAS, icon: ListChecks, tone: "bg-info/15 text-info" },
  { label: "Leaderboard", href: ROUTES.LEADERBOARD, icon: Trophy, tone: "bg-achievement/20 text-achievement-foreground" },
  {
    label: "Search",
    icon: Search,
    tone: "bg-muted text-foreground",
    onClick: () => window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT)),
  },
];

const REVIEWER_ACTIONS: QuickAction[] = [
  { label: "Review Queue", href: ROUTES.REVIEW, icon: ClipboardList, tone: "bg-warning/20 text-warning-foreground" },
  { label: "Implementation", href: ROUTES.IMPLEMENTATION, icon: HardHat, tone: "bg-implementation/15 text-implementation" },
  { label: "Reports", href: ROUTES.REPORTS, icon: FileBarChart, tone: "bg-business-impact/15 text-business-impact" },
  { label: "Analytics", href: ROUTES.ANALYTICS, icon: BarChart3, tone: "bg-rewards/15 text-rewards" },
];

interface QuickActionsSectionProps {
  user: CurrentUser;
}

/** Answers Q3, "what should I do next?" — the same destinations and the same role gate
 * (`canReview`) as `components/dashboard/quick-actions-grid.tsx`; `Search` still dispatches
 * `OPEN_COMMAND_PALETTE_EVENT` rather than duplicating the command palette. Kept as its own local
 * config (not imported from the V1 file, whose consts aren't exported) since it's static routing
 * data, not a query — nothing here duplicates a fetch. Rendered as a pill row directly under the
 * greeting (no section title of its own), matching the finalized design; every action from the V1
 * grid is still here, just restyled — trimming any of them would be a functionality loss, not a
 * visual one. */
export function QuickActionsSection({ user }: QuickActionsSectionProps) {
  const actions = canReview(user.role) ? [...BASE_ACTIONS, ...REVIEWER_ACTIONS] : BASE_ACTIONS;

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map((action) => (
        <QuickActionButton
          key={action.label}
          variant="pill"
          label={action.label}
          icon={action.icon}
          tone={action.tone}
          href={action.href}
          onClick={action.onClick}
        />
      ))}
    </div>
  );
}
