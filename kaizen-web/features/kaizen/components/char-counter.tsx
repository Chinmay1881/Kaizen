import { cn } from "@/lib/utils";

interface CharCounterProps {
  current: number;
  max: number;
}

export function CharCounter({ current, max }: CharCounterProps) {
  return (
    <p
      className={cn(
        "text-right text-xs",
        current > max ? "text-destructive" : "text-muted-foreground",
      )}
    >
      {current}/{max}
    </p>
  );
}
