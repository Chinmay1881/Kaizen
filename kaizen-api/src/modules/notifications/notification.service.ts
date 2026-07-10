import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/api-error.js";
import { buildPaginationMeta, getSkipTake } from "../../utils/pagination.js";
import type { ListNotificationsQuerySchema } from "./notification.schema.js";
import type {
  CreateNotificationInput,
  NotificationItem,
  PaginatedNotifications,
} from "./notification.types.js";

function toItem(notification: {
  id: string;
  type: NotificationItem["type"];
  title: string;
  body: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}): NotificationItem {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    entityType: notification.entityType,
    entityId: notification.entityId,
    isRead: notification.isRead,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  };
}

/** Backs the API spec's "Notifications" section. `create` is the internal entry point used by
 * `src/events/handlers/index.ts` — there is no public "create notification" endpoint; every
 * notification originates from a domain event. */
class NotificationService {
  /** GET /notifications — always scoped to the requester's own notifications. */
  async list(userId: string, query: ListNotificationsQuerySchema): Promise<PaginatedNotifications> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));
    const { skip, take } = getSkipTake({ page, pageSize });

    const where = { userId, ...(query.isRead !== undefined ? { isRead: query.isRead } : {}) };

    const [rows, total] = await Promise.all([
      prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
      prisma.notification.count({ where }),
    ]);

    return {
      items: rows.map(toItem),
      meta: buildPaginationMeta({ page, pageSize }, total),
    };
  }

  /** GET /notifications/unread-count */
  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await prisma.notification.count({ where: { userId, isRead: false } });
    return { count };
  }

  /** PATCH /notifications/:id/read — "Required (own notifications)". */
  async markRead(id: string, userId: string): Promise<NotificationItem> {
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) {
      throw new ApiError("NOT_FOUND", "Notification not found.", 404);
    }
    if (notification.userId !== userId) {
      throw new ApiError("FORBIDDEN", "You cannot modify this notification.", 403);
    }
    if (notification.isRead) {
      return toItem(notification);
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
    return toItem(updated);
  }

  /** POST /notifications/read-all — Response: `{ "markedRead": 12 }`. */
  async markAllRead(userId: string): Promise<{ markedRead: number }> {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { markedRead: result.count };
  }

  /** Internal — used by event handlers only, never exposed over HTTP directly. */
  async create(input: CreateNotificationInput): Promise<void> {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        entityType: input.entityType,
        entityId: input.entityId,
      },
    });
  }
}

export const notificationService = new NotificationService();
