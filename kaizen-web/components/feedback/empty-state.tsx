import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
  className?: string;
}

/** The one empty state used everywhere data legitimately hasn't arrived yet — always paired with
 * a specific title/description/(optional) call to action per call site, never a bare "No data". */
export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = Sparkles,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-14 text-center",
        className,
      )}
    >
      <div className="relative flex h-14 w-14 items-center justify-center">
        <span className="bg-primary/10 absolute inset-0 rounded-full" aria-hidden="true" />
        <Icon className="text-primary relative h-6 w-6" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        <p className="text-muted-foreground max-w-sm text-sm text-balance">{description}</p>
      </div>
      {actionLabel && onAction ? (
        <Button size="sm" onClick={onAction} className="mt-1">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
