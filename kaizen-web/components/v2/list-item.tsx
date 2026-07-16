import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface ListItemProps {
  icon?: LucideIcon;
  iconClassName?: string;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  href?: string;
  className?: string;
}

/** One row in a compact list — achievements, notifications, recent activity. Generalizes the
 * `icon + title + trailing badge` row `components/dashboard/personal-workspace.tsx`'s
 * `AchievementsCard` hand-rolled, so the next list on the dashboard doesn't rewrite it again. */
export function ListItem({ icon: Icon, iconClassName, title, subtitle, trailing, href, className }: ListItemProps) {
  const content = (
    <div className={cn("flex items-center gap-3 py-1", className)}>
      {Icon ? (
        <span
          className={cn(
            "bg-primary/10 text-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            iconClassName,
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        {subtitle ? <p className="text-muted-foreground truncate text-xs">{subtitle}</p> : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      className="hover:bg-accent focus-visible:ring-ring focus-visible:ring-offset-background -mx-2 block rounded-lg px-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      {content}
    </Link>
  );
}
