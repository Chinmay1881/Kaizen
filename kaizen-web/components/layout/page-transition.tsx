"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

import { pageTransitionVariants } from "@/lib/motion";

/** A quiet cross-fade + slight rise between route changes, using the shared
 * `pageTransitionVariants` (`lib/motion.ts`) — the system's own doc comment names this component
 * as its intended consumer. `mode="wait"` avoids the outgoing and incoming pages ever overlapping. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={pathname} initial="hidden" animate="visible" exit="exit" variants={pageTransitionVariants}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
