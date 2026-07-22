export const COST_TYPE_OPTIONS = [
  { value: "ONE_TIME", label: "One-Time" },
  { value: "RECURRING", label: "Recurring" },
] as const;

export const DURATION_UNIT_OPTIONS = [
  { value: "DAYS", label: "Days" },
  { value: "WEEKS", label: "Weeks" },
] as const;

export const IMPACT_LEVEL_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
] as const;

export const IMPACT_LEVEL_LABELS: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};
