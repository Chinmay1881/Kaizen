import type { Transition, Variants } from "framer-motion";

/**
 * Motion System — Milestone 12 (Design Foundation).
 *
 * One shared vocabulary of durations/curves/variants so every future dialog, drawer, toast, and
 * page transition moves the same way instead of each component inventing its own numbers. Two
 * curves only: `EASE.out` for anything *entering* (content should arrive with intent, decelerating
 * into place — an "ease-out-expo" feel rather than linear or bouncy), `EASE.inOut` for anything
 * that moves *between* two states it owns on both ends (e.g. a page cross-fade). Nothing here uses
 * spring physics or overshoot — Arc/Linear-style "snappy but controlled", not playful.
 *
 * Every export maps to a real interaction, not a demo:
 *   DURATION.instant / EASE.out    → press/active feedback (Button `active:scale-*`)
 *   DURATION.fast     / EASE.out    → hover states (color, border, shadow — CSS transitions),
 *                                      dropdown menus/popovers (already anchored, short travel)
 *   DURATION.base      / EASE.out    → content fade-in (FadeIn), skeleton shimmer sweep
 *   DURATION.moderate  / EASE.out    → dialogs entering (centered, more distance to travel)
 *   DURATION.slow        / EASE.inOut → page-to-page transitions (PageTransition)
 *
 * (Replaces an earlier, unused `MOTION_DURATION`/`MOTION_EASE` stub — nothing imported it.)
 */
export const DURATION = {
  instant: 0.1,
  fast: 0.15,
  base: 0.2,
  moderate: 0.25,
  slow: 0.32,
} as const;

export const EASE = {
  out: [0.16, 1, 0.3, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
};

const fadeTransition: Transition = { duration: DURATION.base, ease: EASE.out };
const enterTransition: Transition = { duration: DURATION.moderate, ease: EASE.out };

/** Content easing in from slightly below — used by `FadeIn` for dashboard sections and any
 * content that streams in after a fetch resolves. */
export const fadeInUpVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: fadeTransition },
};

/** A dialog surface arriving — opacity + a small scale-up (never scale-down-to-fit, which reads
 * as content "shrinking away" instead of "arriving"). */
export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: enterTransition },
  exit: { opacity: 0, scale: 0.98, transition: { duration: DURATION.fast, ease: EASE.out } },
};

/** A modal backdrop — opacity only, never scale or blur-animate (a moving blur is expensive and
 * reads as jank, not polish). */
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DURATION.base, ease: EASE.out } },
  exit: { opacity: 0, transition: { duration: DURATION.fast, ease: EASE.out } },
};

/** A small anchored surface (dropdown menu, popover) — shorter travel than a centered dialog
 * since it's already anchored near its trigger. */
export const menuVariants: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: DURATION.fast, ease: EASE.out } },
  exit: { opacity: 0, scale: 0.98, y: -2, transition: { duration: DURATION.instant, ease: EASE.out } },
};

/** Route-to-route content transition (`PageTransition`) — deliberately the quietest motion in the
 * system; a page change happens far more often than a dialog opens, so it must never call
 * attention to itself. */
export const pageTransitionVariants: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.slow, ease: EASE.inOut } },
  exit: { opacity: 0, y: -6, transition: { duration: DURATION.fast, ease: EASE.inOut } },
};
