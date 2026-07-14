import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  description?: string;
  action?: { label: string; href: string };
  className?: string;
}

/** Shared section header for the dashboard — typography carries the section break instead of a
 * boxed card title, matching "executive dashboards rely on typography before borders." */
export function SectionHeading({ title, description, action, className }: SectionHeadingProps) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
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
