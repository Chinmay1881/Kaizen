"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import { pageTransitionVariants } from "@/lib/motion";

// Matches a trailing `/<uuid>` path segment — every "workspace" route with an inline detail pane
// (`/review/[id]`, `/implementation/[id]`, `/kaizen/[id]`) keys its dynamic segment on the
// Kaizen's real Postgres UUID (`Kaizen.id`, `gen_random_uuid()`), never a slug.
const TRAILING_UUID_SEGMENT = /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Strips a trailing UUID segment so `/review/<id-A>` and `/review/<id-B>` — and `/review` itself
 * — all resolve to the same transition key. Those workspaces update the URL's UUID in place as
 * the user selects a different row (see `review-workspace.tsx`/`implementation-workspace.tsx`);
 * that's an in-page detail-pane change, not a real page-to-page navigation, and must not
 * cross-fade or remount. A genuine navigation (`/review` -> `/dashboard`) still changes this key
 * and still fades normally.
 *
 * This isn't cosmetic: Next.js 16 patches `window.history.pushState`/`replaceState` globally so
 * that *any* call to them — including the raw, router-bypassing calls those workspaces make —
 * updates `usePathname()` to match (see `app-router.js`'s `applyUrlFromHistoryPushReplace`). Under
 * Next 15 and earlier this wasn't the case, which is what the original "bypass the router so
 * selecting a row never triggers a page transition" comment in those files assumed. Under Next 16,
 * keying directly on `pathname` means every single row click changed this component's `key`,
 * unmounting and remounting the entire page subtree — including the workspace's own selection
 * state — on every click. That's the actual cause of Review's "only the first Kaizen ever stays
 * selected" bug: the remount reset `explicitId` back to whatever `initialId` the page was
 * originally server-rendered with.
 */
function transitionKeyFor(pathname: string): string {
  return pathname.replace(TRAILING_UUID_SEGMENT, "");
}

/** A quiet cross-fade + slight rise between route changes, using the shared
 * `pageTransitionVariants` (`lib/motion.ts`) — the system's own doc comment names this component
 * as its intended consumer. `mode="wait"` avoids the outgoing and incoming pages ever overlapping. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={transitionKeyFor(pathname)} initial="hidden" animate="visible" exit="exit" variants={pageTransitionVariants}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
