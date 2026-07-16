import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { WorkspaceCard } from "@/components/v2/workspace-card";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
  className?: string;
}

/** A compact "meaningful summary" tile — one number, plainly labeled, optionally linking to the
 * page that explains it. Deliberately not a KPI/metric grid: the brief asks to replace raw
 * statistics with summaries a person would actually act on, so callers should reach for this only
 * for counts tied to a real next step (e.g. "3 ideas in review"), not vanity totals. */
export function SummaryCard({ icon: Icon, label, value, hint, href, className }: SummaryCardProps) {
  const content = (
    <WorkspaceCard variant={href ? "interactive" : "default"} className={cn("flex flex-col gap-3 p-5", className)}>
      <div className="bg-muted text-muted-foreground flex h-9 w-9 items-center justify-center rounded-lg">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex flex-col gap-0.5">
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        <p className="text-muted-foreground text-sm">{label}</p>
        {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      </div>
    </WorkspaceCard>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      className="focus-visible:ring-ring focus-visible:ring-offset-background block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      {content}
    </Link>
  );
}
