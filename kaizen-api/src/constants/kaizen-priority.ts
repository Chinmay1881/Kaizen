export const KAIZEN_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type KaizenPriority = (typeof KAIZEN_PRIORITIES)[number];

export const ESTIMATED_IMPACTS = ["LOW", "MEDIUM", "HIGH", "MAJOR"] as const;
export type EstimatedImpact = (typeof ESTIMATED_IMPACTS)[number];
