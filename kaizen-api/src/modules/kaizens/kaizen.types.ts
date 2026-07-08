import type { KaizenStatus } from "../../constants/kaizen-status.js";
import type { KaizenPriority, EstimatedImpact } from "../../constants/kaizen-priority.js";

export interface FiveW1HInput {
  what?: string;
  whereLocation?: string;
  whenOccurs?: string;
  who?: string;
  why?: string;
  how?: string;
}

export interface FiveWhyInput {
  level: number;
  answer: string;
}

export interface BenefitInput {
  benefitType: string;
  description: string;
  isCustom?: boolean;
}

export interface CreateKaizenInput {
  title?: string;
  departmentId?: string;
}

export interface UpdateKaizenInput {
  title?: string;
  categoryId?: string;
  priority?: KaizenPriority;
  estimatedImpact?: EstimatedImpact;
  location?: string;
  problemStatement?: string;
  currentProcess?: string;
  proposedSolution?: string;
  fiveW1H?: FiveW1HInput;
  fiveWhy?: FiveWhyInput[];
  benefits?: BenefitInput[];
}

export interface KaizenListItem {
  id: string;
  kaizenNumber: string;
  title: string;
  status: KaizenStatus;
  priority: KaizenPriority;
  estimatedImpact: EstimatedImpact;
  category: { id: string; name: string } | null;
  department: { id: string; name: string };
  submitter: { id: string; displayName: string };
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KaizenDetail extends KaizenListItem {
  location: string | null;
  problemStatement: string | null;
  currentProcess: string | null;
  proposedSolution: string | null;
  fiveW1H: FiveW1HInput | null;
  fiveWhy: FiveWhyInput[];
  benefits: (BenefitInput & { id: string })[];
  /** Real attachment records don't exist yet — Cloudinary upload isn't wired up. Always []. */
  attachments: [];
}

export interface SubmitKaizenResult {
  id: string;
  kaizenNumber: string;
  status: KaizenStatus;
  submittedAt: string;
}

/** Parsed/coerced GET /kaizens query — see kaizen.schema.ts for the raw Zod shape. */
export interface ListKaizensQuery {
  page?: number;
  pageSize?: number;
  /** Alias for pageSize. */
  limit?: number;
  /** Comma-separated KaizenStatus values. */
  status?: string;
  categoryId?: string;
  priority?: KaizenPriority;
  search?: string;
  sort?: "newest" | "oldest" | "updated";
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedKaizens {
  items: KaizenListItem[];
  meta: PaginationMeta;
}

export interface TimelineEventItem {
  id: string;
  eventType: string;
  actor: { id: string; displayName: string } | null;
  description: string;
  metadata: unknown;
  createdAt: string;
}
