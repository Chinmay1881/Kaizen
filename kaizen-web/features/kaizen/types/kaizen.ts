import type { EstimatedImpact, KaizenPriority, KaizenStatus } from "@/types/enums";

export type { EstimatedImpact, KaizenPriority };

export interface FiveW1H {
  what?: string;
  whereLocation?: string;
  whenOccurs?: string;
  who?: string;
  why?: string;
  how?: string;
}

export type CostType = "ONE_TIME" | "RECURRING";
export type DurationUnit = "DAYS" | "WEEKS";
export type ImpactLevel = "LOW" | "MEDIUM" | "HIGH";

export interface CostOfImplementation {
  costType?: CostType;
  estimatedCost?: number;
  currency?: string;
  estimatedDurationValue?: number;
  estimatedDurationUnit?: DurationUnit;
  employeesRequired?: number;
  departmentIds?: string[];
  materialsRequired?: string;
  machinesRequired?: string;
  vendorRequired?: boolean;
  vendorDetails?: string;
  estimatedAnnualSavings?: number;
  timeSavedHoursPerDay?: number;
  qualityImprovement?: ImpactLevel;
  safetyImprovement?: ImpactLevel;
  customerSatisfactionImprovement?: ImpactLevel;
  wasteReductionImprovement?: ImpactLevel;
  expectedPaybackPeriod?: string;
  additionalNotes?: string;
}

export interface Benefit {
  benefitType: string;
  description: string;
  isCustom?: boolean;
}

export interface BenefitWithId extends Benefit {
  id: string;
}

export interface KaizenAttachment {
  id: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  fileSizeBytes: number;
  cloudinaryPublicId: string;
  cloudinarySecureUrl: string;
  uploadedBy: { id: string; displayName: string };
  createdAt: string;
}

export interface KaizenDetail {
  id: string;
  kaizenNumber: string;
  title: string;
  status: KaizenStatus;
  priority: KaizenPriority;
  estimatedImpact: EstimatedImpact;
  location: string | null;
  problemStatement: string | null;
  currentProcess: string | null;
  proposedSolution: string | null;
  category: { id: string; name: string } | null;
  department: { id: string; name: string };
  submitter: { id: string; displayName: string };
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  fiveW1H: FiveW1H | null;
  costOfImplementation: CostOfImplementation | null;
  benefits: BenefitWithId[];
  attachments: KaizenAttachment[];
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
  fiveW1H?: FiveW1H;
  costOfImplementation?: CostOfImplementation;
  benefits?: Benefit[];
}

export interface SubmitKaizenResult {
  id: string;
  kaizenNumber: string;
  status: KaizenStatus;
  submittedAt: string;
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

export type KaizenSort = "newest" | "oldest" | "updated";

export interface ListKaizensParams {
  page?: number;
  pageSize?: number;
  status?: KaizenStatus;
  categoryId?: string;
  priority?: KaizenPriority;
  search?: string;
  sort?: KaizenSort;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface TimelineEventItem {
  id: string;
  eventType: string;
  actor: { id: string; displayName: string } | null;
  description: string;
  metadata: unknown;
  createdAt: string;
}
