"use client";

import Link from "next/link";
import {
  Trophy,
  Award,
  AlertCircle,
  AtSign,
  BookOpen,
  CheckCircle2,
  FileBarChart,
  FileText,
  Gift,
  HardHat,
  Megaphone,
  MessageSquare,
  Rocket,
  UserCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import type { Notification, NotificationType } from "@/features/notifications/types/notification";
import { formatDate } from "@/utils/format";

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  KAIZEN_SUBMITTED: FileText,
  KAIZEN_APPROVED: CheckCircle2,
  KAIZEN_REJECTED: XCircle,
  KAIZEN_NEEDS_CHANGES: AlertCircle,
  KAIZEN_ASSIGNED: UserCheck,
  IMPLEMENTATION_STARTED: HardHat,
  IMPLEMENTATION_COMPLETED: Rocket,
  REWARD_ISSUED: Gift,
  ACHIEVEMENT_UNLOCKED: Award,
  KNOWLEDGE_BASE_PUBLISHED: BookOpen,
  ANNOUNCEMENT: Megaphone,
  COMMENT_ADDED: MessageSquare,
  MENTION: AtSign,
  REPORT_READY: FileBarChart,
};

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
}

/** `ReportExport` links to the Download Center rather than a direct file link — downloads are
 * authenticated (Bearer token) fetches, not something a plain `<a href>` to the API can do, so the
 * notification takes the user to the page with the "Download" button instead ("Allow download
 * from notification" — Part 13 — satisfied via that one extra click). */
function getHref(notification: Notification): string | null {
  if (notification.entityType === "Kaizen" && notification.entityId) {
    return `/kaizen/${notification.entityId}`;
  }
  if (notification.entityType === "ReportExport" && notification.entityId) {
    return `${ROUTES.REPORTS_HISTORY}?highlight=${notification.entityId}`;
  }
  return null;
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const Icon = TYPE_ICON[notification.type] ?? Trophy;
  const href = getHref(notification);

  const content = (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-4 transition-colors",
        notification.isRead ? "bg-background" : "bg-primary/5 border-primary/20",
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          notification.isRead ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-semibold">{notification.title}</p>
        <p className="text-muted-foreground text-sm">{notification.body}</p>
        <p className="text-muted-foreground text-xs">{formatDate(notification.createdAt)}</p>
      </div>
      {!notification.isRead ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            onMarkRead(notification.id);
          }}
          className="text-primary self-start text-xs font-medium hover:underline"
        >
          Mark read
        </button>
      ) : null}
    </div>
  );

  if (!href) return content;

  return (
    <Link
      href={href}
      onClick={() => {
        if (!notification.isRead) onMarkRead(notification.id);
      }}
    >
      {content}
    </Link>
  );
}
