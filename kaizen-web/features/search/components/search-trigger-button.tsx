"use client";

import { Search } from "lucide-react";

import { OPEN_COMMAND_PALETTE_EVENT } from "@/features/search/components/command-palette";

/** The header search bar (Part 4) — dispatches a DOM event `CommandPalette` also listens for
 * globally, rather than lifting open-state into a context just for this one trigger. */
export function SearchTriggerButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT))}
      className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex h-9 w-full max-w-xs items-center gap-2 rounded-lg border px-3 text-sm transition-colors sm:w-64"
      aria-label="Open search"
    >
      <Search className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left">Search…</span>
      <kbd className="bg-muted text-muted-foreground rounded border px-1.5 py-0.5 text-[10px] font-medium">
        Ctrl K
      </kbd>
    </button>
  );
}
