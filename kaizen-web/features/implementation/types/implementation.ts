export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

export interface ImplementationAttachment {
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

export interface Implementation {
  id: string;
  kaizenId: string;
  kaizen: {
    id: string;
    kaizenNumber: string;
    title: string;
    status: string;
    submitter: { id: string; displayName: string };
    department: { id: string; name: string };
  };
  owner: { id: string; displayName: string };
  assignedDepartment: { id: string; name: string };
  description: string | null;
  progressPercent: number;
  estimatedCost: number | null;
  actualCost: number | null;
  timeTakenDays: number | null;
  startedAt: string | null;
  completedAt: string | null;
  completionNotes: string | null;
  verificationStatus: VerificationStatus;
  verifiedBy: { id: string; displayName: string } | null;
  verifiedAt: string | null;
  dueDate: string | null;
  attachments: ImplementationAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface AssignImplementationInput {
  ownerId: string;
  assignedDepartmentId: string;
  dueDate?: string;
  description?: string;
}

export interface UpdateImplementationInput {
  progressPercent?: number;
  description?: string;
  estimatedCost?: number;
  actualCost?: number;
  timeTakenDays?: number;
}

export interface CompleteImplementationInput {
  completionNotes?: string;
}

export interface VerifyImplementationInput {
  status: "VERIFIED" | "REJECTED";
  notes?: string;
}

export interface BusinessImpact {
  id: string;
  kaizenId: string;
  moneySaved: number | null;
  hoursSaved: number | null;
  employeesBenefited: number | null;
  customersBenefited: number | null;
  processImprovement: boolean;
  qualityImprovement: boolean;
  safetyImprovement: boolean;
  productivityImprovement: boolean;
  customerSatisfactionImprovement: boolean;
  remarks: string | null;
  recordedBy: { id: string; displayName: string };
  createdAt: string;
  updatedAt: string;
}

export interface RecordBusinessImpactInput {
  moneySaved?: number;
  hoursSaved?: number;
  employeesBenefited?: number;
  customersBenefited?: number;
  processImprovement: boolean;
  qualityImprovement: boolean;
  safetyImprovement: boolean;
  productivityImprovement: boolean;
  customerSatisfactionImprovement: boolean;
  remarks?: string;
}

export interface ImplementationListParams {
  page?: number;
  pageSize?: number;
  status?: VerificationStatus;
  departmentId?: string;
  ownerId?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
