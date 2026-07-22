export const COST_TYPES = ["ONE_TIME", "RECURRING"] as const;
export type CostType = (typeof COST_TYPES)[number];

export const DURATION_UNITS = ["DAYS", "WEEKS"] as const;
export type DurationUnit = (typeof DURATION_UNITS)[number];

export const IMPACT_LEVELS = ["LOW", "MEDIUM", "HIGH"] as const;
export type ImpactLevel = (typeof IMPACT_LEVELS)[number];
