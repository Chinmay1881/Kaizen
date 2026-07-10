"use client";

import { useState } from "react";
import { CheckCheck, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { toast } from "@/components/feedback/success-toast";
import { Textarea } from "@/components/ui/textarea";
import { DetailSection } from "@/features/kaizen/components/detail/detail-section";
import type { CurrentUser } from "@/features/auth/types/user";
import type { KaizenDetail } from "@/features/kaizen/types/kaizen";
import { useAddComment, useResolveComment } from "@/features/review/hooks/use-comment-mutations";
import { useReviewComments } from "@/features/review/hooks/use-review-comments";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/utils/format";

interface ReviewCommentsPanelProps {
  kaizen: KaizenDetail;
  currentUser: CurrentUser | undefined;
  /** Renders the discussion list only — no add-comment form, no resolve action. Used on the
   * employee-facing My Ideas detail page, which is read-only by design (see Milestone 5). */
  readOnly?: boolean;
}

const COMPANY_WIDE_ROLES = ["HR", "CMD", "SUPER_ADMIN"];

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function ReviewCommentsPanel({
  kaizen,
  currentUser,
  readOnly = false,
}: ReviewCommentsPanelProps) {
  const [body, setBody] = useState("");
  const { data: comments, isLoading } = useReviewComments(kaizen.id);
  const addComment = useAddComment(kaizen.id);
  const resolveComment = useResolveComment(kaizen.id);

  if (!currentUser) return null;

  const isDeptManagerHere =
    currentUser.role === "DEPARTMENT_MANAGER" &&
    currentUser.department?.id === kaizen.department.id;
  const isCompanyWideReviewer = COMPANY_WIDE_ROLES.includes(currentUser.role);
  const isSubmitter = currentUser.id === kaizen.submitter.id;
  const canComment =
    !readOnly &&
    (isDeptManagerHere ||
      isCompanyWideReviewer ||
      (isSubmitter && kaizen.status === "NEEDS_CHANGES"));
  const canResolve = !readOnly && isDeptManagerHere;

  function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed) return;

    addComment.mutate(trimmed, {
      onSuccess: () => setBody(""),
      onError: (error) => toast.error(getErrorMessage(error, "Could not add comment.")),
    });
  }

  return (
    <DetailSection title="Review Comments">
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex flex-col gap-2">
            <LoadingSkeleton className="h-5 w-full" />
            <LoadingSkeleton className="h-5 w-2/3" />
          </div>
        ) : !comments || comments.length === 0 ? (
          <p className="text-muted-foreground">No comments yet.</p>
        ) : (
          <ol className="flex flex-col gap-4">
            {comments.map((comment) => (
              <li key={comment.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{comment.author.displayName}</p>
                  <div className="flex items-center gap-2">
                    {comment.isResolved ? <Badge variant="success">Resolved</Badge> : null}
                    <p className="text-muted-foreground text-xs">{formatDate(comment.createdAt)}</p>
                  </div>
                </div>
                <p className="mt-1 whitespace-pre-wrap">{comment.body}</p>
                {canResolve && !comment.isResolved ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    disabled={resolveComment.isPending}
                    onClick={() =>
                      resolveComment.mutate(comment.id, {
                        onError: (error) =>
                          toast.error(getErrorMessage(error, "Could not resolve comment.")),
                      })
                    }
                  >
                    <CheckCheck className="h-4 w-4" />
                    Mark Resolved
                  </Button>
                ) : null}
              </li>
            ))}
          </ol>
        )}

        {canComment ? (
          <div className="flex flex-col gap-2 border-t pt-4">
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Add a comment..."
              rows={3}
            />
            <Button
              className="self-end"
              disabled={!body.trim() || addComment.isPending}
              onClick={handleSubmit}
            >
              {addComment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Post Comment
            </Button>
          </div>
        ) : null}
      </div>
    </DetailSection>
  );
}
