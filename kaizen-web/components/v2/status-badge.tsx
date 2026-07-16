import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone = "critical" | "warning" | "info" | "success" | "neutral";

const TONE_VARIANT: Record<StatusTone, "destructive" | "warning" | "info" | "success" | "outline"> = {
  critical: "destructive",
  warning: "warning",
  info: "info",
  success: "success",
  neutral: "outline",
};

const TONE_DOT: Record<StatusTone, string> = {
  critical: "bg-destructive",
  warning: "bg-warning",
  info: "bg-info",
  success: "bg-success",
  neutral: "bg-muted-foreground",
};

interface StatusBadgeProps {
  tone: StatusTone;
  children: React.ReactNode;
  /** A small leading dot instead of/alongside color alone — the brief's "no color-only
   * communication" accessibility requirement, satisfied at the primitive level so every consumer
   * gets it for free rather than remembering to add it themselves. */
  withDot?: boolean;
  className?: string;
}

/** Thin, semantically-named wrapper around the existing `Badge` — maps a "how urgent/positive is
 * this" concept to one of `Badge`'s already-existing variants rather than reimplementing tone
 * colors. Reuses the same semantic tokens (`--destructive`/`--warning`/`--info`/`--success`)
 * `lib/tone-classes.ts` and every V1 status pill already draw from. */
export function StatusBadge({ tone, children, withDot = false, className }: StatusBadgeProps) {
  return (
    <Badge variant={TONE_VARIANT[tone]} className={cn("gap-1.5", className)}>
      {withDot ? <span aria-hidden="true" className={cn("h-1.5 w-1.5 rounded-full", TONE_DOT[tone])} /> : null}
      {children}
    </Badge>
  );
}
