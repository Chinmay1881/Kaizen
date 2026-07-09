import type { KaizenStatus } from "../../constants/kaizen-status.js";
import type { KaizenPriority } from "../../constants/kaizen-priority.js";

export interface ReviewQueueQuery {
  page?: number;
  pageSize?: number;
  /** Comma-separated KaizenStatus values. Defaults to "everything except DRAFT" when omitted. */
  status?: string;
  categoryId?: string;
  /** Only effective for HR/CMD/Super Admin — Department Managers are always scoped to their own
   * department regardless of this param. */
  departmentId?: string;
  priority?: KaizenPriority;
  search?: string;
  sort?: "newest" | "oldest" | "updated";
}

export interface ReviewActionResult {
  id: string;
  kaizenNumber: string;
  status: KaizenStatus;
}

export interface ReviewCommentItem {
  id: string;
  kaizenId: string;
  parentId: string | null;
  body: string;
  isResolved: boolean;
  author: { id: string; displayName: string; role: string };
  createdAt: string;
  updatedAt: string;
}
