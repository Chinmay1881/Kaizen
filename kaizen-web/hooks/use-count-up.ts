"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Animates a number counting up to `target` on mount/whenever it changes — for the Executive
 * Hero's headline metrics. Runs via `requestAnimationFrame` rather than a Framer Motion
 * `MotionValue` since the caller needs a plain number to format (currency/percent/etc.), not a
 * DOM transform. Skips the animation entirely under `prefers-reduced-motion`.
 */
export function useCountUp(target: number, durationMs = 900): number {
  const reduceMotion = useReducedMotion();
  const [animatedValue, setAnimatedValue] = useState(0);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (reduceMotion) return;

    const start = performance.now();

    function tick(now: number) {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(target * eased);
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [target, durationMs, reduceMotion]);

  return reduceMotion ? target : animatedValue;
}
