import {
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
import type { Notification, NotificationType } from "@/features/notifications/types/notification";

/** Exported as a plain lookup map, not a `getXIcon(type)` function — indexing this directly at
 * the call site (`NOTIFICATION_TYPE_ICON[type] ?? Trophy`) keeps the resulting component
 * reference statically analyzable; wrapping the same lookup in a function trips
 * `react-hooks/static-components` ("component created during render"), even though nothing is
 * actually being constructed either way. */
export const NOTIFICATION_TYPE_ICON: Record<NotificationType, LucideIcon> = {
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

/** A status "tone" per notification type, for color-coding a status dot/icon background —
 * mirrors the semantic meaning (good news / needs attention / neutral) rather than reusing the
 * type name verbatim. */
const TYPE_TONE: Record<NotificationType, "success" | "warning" | "destructive" | "info" | "achievement" | "rewards"> = {
  KAIZEN_SUBMITTED: "info",
  KAIZEN_APPROVED: "success",
  KAIZEN_REJECTED: "destructive",
  KAIZEN_NEEDS_CHANGES: "warning",
  KAIZEN_ASSIGNED: "info",
  IMPLEMENTATION_STARTED: "info",
  IMPLEMENTATION_COMPLETED: "success",
  REWARD_ISSUED: "rewards",
  ACHIEVEMENT_UNLOCKED: "achievement",
  KNOWLEDGE_BASE_PUBLISHED: "info",
  ANNOUNCEMENT: "info",
  COMMENT_ADDED: "info",
  MENTION: "info",
  REPORT_READY: "success",
};

export function getNotificationTone(type: NotificationType) {
  return TYPE_TONE[type] ?? "info";
}

/** `ReportExport` links to the Download Center rather than a direct file link — downloads are
 * authenticated (Bearer token) fetches, not something a plain `<a href>` to the API can do, so the
 * notification takes the user to the page with the "Download" button instead. */
export function getNotificationHref(notification: Notification): string | null {
  if (notification.entityType === "Kaizen" && notification.entityId) {
    return `/kaizen/${notification.entityId}`;
  }
  if (notification.entityType === "ReportExport" && notification.entityId) {
    return `${ROUTES.REPORTS_HISTORY}?highlight=${notification.entityId}`;
  }
  return null;
}
