import type { KaizenListItem } from "@/features/kaizen/types/kaizen";

/** The review queue returns the same shape as My Ideas' list — reuse it rather than duplicating. */
export type ReviewQueueItem = KaizenListItem;

export interface ReviewActionResult {
  id: string;
  kaizenNumber: string;
  status: string;
}

export interface ReviewComment {
  id: string;
  kaizenId: string;
  parentId: string | null;
  body: string;
  isResolved: boolean;
  author: { id: string; displayName: string; role: string };
  createdAt: string;
  updatedAt: string;
}

export interface ReviewActionInput {
  notes?: string;
}
