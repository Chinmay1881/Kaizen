import {
  AlertCircle,
  Archive,
  ArrowUpDown,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileEdit,
  FileText,
  Gift,
  HardHat,
  MessageSquare,
  RefreshCcw,
  RefreshCw,
  Rocket,
  Send,
  TrendingUp,
  UserCheck,
  XCircle,
  type LucideIcon,
} from "lucide-react";

/** Every real `TimelineEventType` value (kaizen-api `schema.prisma`) mapped to an icon + tone —
 * the brief's example timeline includes a "Manager Viewed" step, but this app has no view-tracking
 * event, so it's intentionally not rendered here rather than fabricated. */
export const TIMELINE_EVENT_ICON: Record<string, LucideIcon> = {
  DRAFT_CREATED: FileText,
  DRAFT_UPDATED: FileEdit,
  SUBMITTED: Send,
  REVIEW_STARTED: Eye,
  COMMENT_ADDED: MessageSquare,
  EVALUATION_SUBMITTED: ClipboardCheck,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
  NEEDS_CHANGES: AlertCircle,
  RESUBMITTED: RefreshCw,
  IMPLEMENTATION_ASSIGNED: UserCheck,
  IMPLEMENTATION_STARTED: HardHat,
  IMPLEMENTATION_COMPLETED: Rocket,
  BUSINESS_IMPACT_RECORDED: TrendingUp,
  REWARD_ISSUED: Gift,
  ARCHIVED: Archive,
  KNOWLEDGE_BASE_PUBLISHED: BookOpen,
  PRIORITY_CHANGED: ArrowUpDown,
  STATUS_CHANGED: RefreshCcw,
};

export type TimelineTone = "success" | "warning" | "destructive" | "info";

const SUCCESS_EVENTS = new Set([
  "APPROVED",
  "IMPLEMENTATION_COMPLETED",
  "BUSINESS_IMPACT_RECORDED",
  "REWARD_ISSUED",
  "KNOWLEDGE_BASE_PUBLISHED",
]);
const DESTRUCTIVE_EVENTS = new Set(["REJECTED"]);
const WARNING_EVENTS = new Set(["NEEDS_CHANGES", "PRIORITY_CHANGED"]);

export function getTimelineTone(eventType: string): TimelineTone {
  if (SUCCESS_EVENTS.has(eventType)) return "success";
  if (DESTRUCTIVE_EVENTS.has(eventType)) return "destructive";
  if (WARNING_EVENTS.has(eventType)) return "warning";
  return "info";
}

export function humanizeEventType(eventType: string): string {
  return eventType
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
