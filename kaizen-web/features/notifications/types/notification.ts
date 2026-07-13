export type NotificationType =
  | "KAIZEN_SUBMITTED"
  | "KAIZEN_APPROVED"
  | "KAIZEN_REJECTED"
  | "KAIZEN_NEEDS_CHANGES"
  | "KAIZEN_ASSIGNED"
  | "IMPLEMENTATION_STARTED"
  | "IMPLEMENTATION_COMPLETED"
  | "REWARD_ISSUED"
  | "ACHIEVEMENT_UNLOCKED"
  | "KNOWLEDGE_BASE_PUBLISHED"
  | "ANNOUNCEMENT"
  | "COMMENT_ADDED"
  | "MENTION"
  | "REPORT_READY";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListParams {
  page?: number;
  pageSize?: number;
  isRead?: boolean;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
