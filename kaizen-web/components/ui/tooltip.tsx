import * as React from "react";

import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Pure CSS (group-hover) tooltip — no @radix-ui/react-tooltip needed for a single static label
 * like "Coming soon". Reach for the Radix primitive instead if this ever needs to be
 * keyboard/focus-triggered with rich content.
 */
function Tooltip({ content, children, className }: TooltipProps) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className="bg-foreground text-background pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md px-2 py-1 text-xs whitespace-nowrap opacity-0 transition-opacity duration-150 group-focus-within:opacity-100 group-hover:opacity-100"
      >
        {content}
      </span>
    </span>
  );
}

export { Tooltip };
