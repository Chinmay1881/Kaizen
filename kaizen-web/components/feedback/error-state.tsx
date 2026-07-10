import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title: string;
  description: string;
  onRetry?: () => void;
}

export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border p-12 text-center">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground max-w-md">{description}</p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      ) : null}
    </div>
  );
}
