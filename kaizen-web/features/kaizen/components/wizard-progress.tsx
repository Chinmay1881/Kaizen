import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { TOTAL_STEPS, WIZARD_STEPS } from "@/features/kaizen/constants/wizard-steps";

interface WizardProgressProps {
  currentStep: number;
}

export function WizardProgress({ currentStep }: WizardProgressProps) {
  const percentComplete = Math.round(((currentStep - 1) / TOTAL_STEPS) * 100);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">
        Step {currentStep} of {TOTAL_STEPS} &middot; {percentComplete}% Complete
      </p>
      <ol className="flex items-center gap-1 overflow-x-auto sm:gap-2">
        {WIZARD_STEPS.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <li key={step.id} className="flex flex-1 items-center gap-1 sm:gap-2">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors",
                    isCompleted && "bg-primary border-primary text-primary-foreground",
                    isCurrent && "border-primary text-primary",
                    !isCompleted && !isCurrent && "border-border text-muted-foreground",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                </div>
                {/* `whitespace-nowrap` keeps every label on one line — a wrapped label makes that
                    step's column taller than its neighbors, which throws off the connector's
                    vertical alignment (it's centered against its own column's height) and makes
                    the line look broken next to that step. */}
                <span
                  className={cn(
                    "hidden text-xs whitespace-nowrap sm:block",
                    isCurrent ? "text-foreground font-medium" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < WIZARD_STEPS.length - 1 ? (
                <div
                  className={cn("h-px min-w-2 flex-1", isCompleted ? "bg-primary" : "bg-border")}
                  aria-hidden="true"
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
