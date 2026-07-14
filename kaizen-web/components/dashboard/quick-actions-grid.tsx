"use client";

import Link from "next/link";
import { BarChart3, ClipboardList, FileBarChart, HardHat, ListChecks, Plus, Search, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { SectionHeading } from "@/components/dashboard/section-heading";
import { ROUTES } from "@/constants/routes";
import { OPEN_COMMAND_PALETTE_EVENT } from "@/features/search/components/command-palette";
import { canReview } from "@/lib/permissions";
import type { CurrentUser } from "@/features/auth/types/user";

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

interface QuickActionsGridProps {
  user: CurrentUser;
}

function Tile({ action }: { action: QuickAction }) {
  const content = (
    <>
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${action.tone}`}>
        <action.icon className="h-5 w-5" />
      </span>
      <span className="text-sm font-medium">{action.label}</span>
    </>
  );

  const className =
    "interactive-lift group flex flex-col items-center justify-center gap-3 rounded-xl border bg-card p-5 text-center";

  if (action.href) {
    return (
      <Link href={action.href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={action.onClick} className={className}>
      {content}
    </button>
  );
}

/** Every destination here already exists and ships today. `Search` doesn't navigate — it
 * dispatches the same `OPEN_COMMAND_PALETTE_EVENT` the header's search trigger and ⌘K shortcut
 * use, rather than duplicating the search UI. */
export function QuickActionsGrid({ user }: QuickActionsGridProps) {
  const actions = canReview(user.role) ? [...BASE_ACTIONS, ...REVIEWER_ACTIONS] : BASE_ACTIONS;

  return (
    <div className="flex flex-col gap-4">
      <SectionHeading title="Quick Actions" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {actions.map((action) => (
          <Tile key={action.label} action={action} />
        ))}
      </div>
    </div>
  );
}
