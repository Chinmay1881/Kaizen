import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusTone } from "@/components/v2/status-badge";
import { WorkspaceCard } from "@/components/v2/workspace-card";
import { cn } from "@/lib/utils";

const TONE_BAR: Record<StatusTone, string> = {
  critical: "bg-destructive",
  warning: "bg-warning",
  info: "bg-info",
  success: "bg-success",
  neutral: "bg-muted-foreground",
};

interface FocusCardProps {
  tone: StatusTone;
  badgeLabel: string;
  meta?: string;
  title: string;
  description?: string;
  cta: { label: string; href: string };
  /** A local, presentation-only secondary action (e.g. "Dismiss") — not a data mutation, so it
   * takes a click handler rather than an `href`. */
  secondaryAction?: { label: string; onClick: () => void };
  className?: string;
}

/** The single hero slot on the dashboard — "the one thing that most needs a response right now."
 * Deliberately singular: rendering more than one competes with the point of a focus card, so
 * callers pick the single highest-severity attention item rather than mapping a list here. */
export function FocusCard({ tone, badgeLabel, meta, title, description, cta, secondaryAction, className }: FocusCardProps) {
  return (
    <WorkspaceCard className={cn("relative overflow-hidden pl-7 sm:p-8 sm:pl-9", className)}>
      <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 w-1.5", TONE_BAR[tone])} />
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusBadge tone={tone} className="uppercase tracking-wide">
            {badgeLabel}
          </StatusBadge>
          {meta ? <p className="text-muted-foreground text-sm">{meta}</p> : null}
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
          {description ? <p className="text-muted-foreground text-base">{description}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
          {secondaryAction ? (
            <Button variant="outline" size="lg" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          ) : null}
        </div>
      </div>
    </WorkspaceCard>
  );
}
