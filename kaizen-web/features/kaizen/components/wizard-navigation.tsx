import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { TOTAL_STEPS } from "@/features/kaizen/constants/wizard-steps";

interface WizardNavigationProps {
  currentStep: number;
  isSaving: boolean;
  isSubmitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function WizardNavigation({
  currentStep,
  isSaving,
  isSubmitting,
  onPrevious,
  onNext,
  onSubmit,
}: WizardNavigationProps) {
  const isLastStep = currentStep === TOTAL_STEPS;
  const isFirstStep = currentStep === 1;

  return (
    <div className="bg-background/95 sticky bottom-0 flex items-center justify-between gap-3 border-t px-1 py-4 backdrop-blur">
      <Button
        type="button"
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstStep || isSaving || isSubmitting}
      >
        Previous
      </Button>

      <div className="flex items-center gap-3">
        {isSaving ? (
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Saving...
          </span>
        ) : null}

        {isLastStep ? (
          <Button type="button" onClick={onSubmit} disabled={isSaving || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Kaizen"
            )}
          </Button>
        ) : (
          <Button type="button" onClick={onNext} disabled={isSaving || isSubmitting}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}
