export type UserRole = "EMPLOYEE" | "DEPARTMENT_MANAGER" | "HR" | "CMD" | "SUPER_ADMIN";

export type KaizenStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "NEEDS_CHANGES"
  | "REJECTED"
  | "APPROVED"
  | "IMPLEMENTATION_IN_PROGRESS"
  | "IMPLEMENTATION_COMPLETED"
  | "BUSINESS_IMPACT_RECORDED"
  | "REWARD_ISSUED"
  | "ARCHIVED"
  | "PUBLISHED_TO_KNOWLEDGE_BASE";

export type KaizenPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type EstimatedImpact = "LOW" | "MEDIUM" | "HIGH" | "MAJOR";
