export interface ImplementationItem {
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
  verificationStatus: string;
  verifiedBy: { id: string; displayName: string } | null;
  verifiedAt: string | null;
  dueDate: string | null;
  attachments: ImplementationAttachmentItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ImplementationAttachmentItem {
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

export interface ImplementationListQuery {
  page?: number;
  pageSize?: number;
  status?: string;
  departmentId?: string;
  ownerId?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedImplementations {
  items: ImplementationItem[];
  meta: PaginationMeta;
}
