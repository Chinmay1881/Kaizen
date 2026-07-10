import type { NotificationType } from "@prisma/client";

export interface NotificationItem {
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

export interface PaginatedNotifications {
  items: NotificationItem[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  entityType?: string;
  entityId?: string;
}
