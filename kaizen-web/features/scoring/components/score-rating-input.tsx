"use client";

import { cn } from "@/lib/utils";

interface ScoreRatingInputProps {
  value: number | undefined;
  onChange: (value: number) => void;
  max: number;
  disabled?: boolean;
  label: string;
}

/** SCORE-001's rating component: "Preferred: Slider. Alternative: 10 Clickable Dots. Not:
 * Textbox." A slider would need a new Radix dependency (not installed, not requested) — this
 * implements the documented dependency-free alternative instead: one button per integer score
 * (0–max, matching the doc's "Range 0 ↓ 10, Step 1"). */
export function ScoreRatingInput({ value, onChange, max, disabled, label }: ScoreRatingInputProps) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
      {Array.from({ length: max + 1 }, (_, score) => (
        <button
          key={score}
          type="button"
          role="radio"
          aria-checked={value === score}
          aria-label={`${label}: ${score}`}
          disabled={disabled}
          onClick={() => onChange(score)}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition-colors",
            value === score
              ? "bg-primary text-primary-foreground border-primary"
              : "border-input bg-background hover:bg-accent hover:text-accent-foreground",
            disabled ? "cursor-not-allowed opacity-50" : "",
          )}
        >
          {score}
        </button>
      ))}
    </div>
  );
}
