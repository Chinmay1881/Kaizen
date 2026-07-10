"use client";

import { useFormContext } from "react-hook-form";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/features/kaizen/components/field-error";
import type { WizardFormValues } from "@/features/kaizen/schemas/wizard-schema";

const QUESTIONS: { field: keyof WizardFormValues["fiveW1H"]; label: string; question: string }[] = [
  { field: "what", label: "What", question: "What is the problem?" },
  { field: "whereLocation", label: "Where", question: "Where does it occur?" },
  { field: "whenOccurs", label: "When", question: "When does it occur?" },
  { field: "who", label: "Who", question: "Who is affected?" },
  { field: "why", label: "Why", question: "Why is it important?" },
  { field: "how", label: "How", question: "How can it be improved?" },
];

export function Step4FiveW1H() {
  const {
    register,
    formState: { errors },
  } = useFormContext<WizardFormValues>();

  return (
    <div className="flex flex-col gap-6">
      {QUESTIONS.map(({ field, label, question }) => (
        <div key={field} className="space-y-2">
          <Label htmlFor={`five-w1h-${field}`}>
            {label} &mdash; <span className="text-muted-foreground font-normal">{question}</span>
          </Label>
          <Textarea id={`five-w1h-${field}`} rows={2} {...register(`fiveW1H.${field}` as const)} />
          <FieldError message={errors.fiveW1H?.[field]?.message} />
        </div>
      ))}
    </div>
  );
}
