import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title: string;
  description: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title, description, onRetry, className }: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border px-6 py-14 text-center",
        className,
      )}
    >
      <div className="relative flex h-14 w-14 items-center justify-center">
        <span className="bg-destructive/10 absolute inset-0 rounded-full" aria-hidden="true" />
        <AlertTriangle className="text-destructive relative h-6 w-6" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold tracking-tight">{title}</h3>
        <p className="text-muted-foreground max-w-sm text-sm text-balance">{description}</p>
      </div>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
          Try Again
        </Button>
      ) : null}
    </div>
  );
}
