import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed p-12 text-center">
      {Icon ? (
        <div className="bg-muted text-muted-foreground flex h-14 w-14 items-center justify-center rounded-full">
          <Icon className="h-7 w-7" />
        </div>
      ) : null}
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground max-w-md">{description}</p>
      {actionLabel && onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null}
    </div>
  );
}
