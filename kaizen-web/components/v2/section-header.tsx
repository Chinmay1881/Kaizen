import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: { label: string; href: string };
  className?: string;
}

/** V2's section break — the same typography-over-borders idea as
 * `components/dashboard/section-heading.tsx` (kept untouched; still used by 19 other files), just
 * one step larger to match V2's "bigger type, less chrome" density target. A distinct component
 * rather than a size prop on the original so un-migrated pages don't shift underneath it. */
export function SectionHeader({ title, description, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        {description ? <p className="text-muted-foreground text-sm sm:text-base">{description}</p> : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-0.5 text-sm font-medium transition-colors duration-150"
        >
          {action.label}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </div>
  );
}
