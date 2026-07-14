"use client";

import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  tone?: "default" | "success" | "destructive" | "warning";
  className?: string;
}

const TONE_STROKE: Record<NonNullable<ProgressRingProps["tone"]>, string> = {
  default: "var(--color-primary)",
  success: "var(--color-success)",
  destructive: "var(--color-destructive)",
  warning: "var(--color-warning)",
};

/** A single configurable circular progress indicator used at two scales: small in the
 * Implementation Inbox rows, large in the center panel's Overview. The stroke animates via a
 * plain CSS `transition` (governed by the global `prefers-reduced-motion` rule in globals.css),
 * the percentage label via `useCountUp` (M12) which already skips animating under reduced
 * motion. */
export function ProgressRing({ value, size = 96, strokeWidth = 8, label, tone = "default", className }: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const animated = useCountUp(clamped, 700);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" role="img" aria-label={label ?? `${clamped}% complete`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-muted)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={TONE_STROKE[tone]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span data-metric className="font-semibold tabular-nums" style={{ fontSize: size / 3.4 }}>
          {Math.round(animated)}%
        </span>
      </div>
    </div>
  );
}
