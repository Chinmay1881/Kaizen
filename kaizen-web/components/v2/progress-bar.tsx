import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  label?: string;
  valueLabel?: string;
  tone?: "primary" | "success" | "warning" | "info";
  className?: string;
}

const TONE_FILL: Record<NonNullable<ProgressBarProps["tone"]>, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  info: "bg-info",
};

/** A labeled percentage bar — the one piece missing from the V2 system for a "how am I doing on
 * this metric" readout (e.g. approval rate). Clamps to [0, 100] since the value is always a
 * percentage; callers pass a raw already-computed percentage, not a fraction. */
export function ProgressBar({ value, label, valueLabel, tone = "primary", className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label || valueLabel ? (
        <div className="flex items-center justify-between gap-2 text-sm">
          {label ? <span className="text-muted-foreground">{label}</span> : <span />}
          {valueLabel ? <span className="font-semibold">{valueLabel}</span> : null}
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="bg-muted h-2 w-full overflow-hidden rounded-full"
      >
        <div
          className={cn("h-full rounded-full transition-[width] duration-300 ease-out", TONE_FILL[tone])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
