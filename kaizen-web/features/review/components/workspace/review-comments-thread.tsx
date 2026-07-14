"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { CheckCheck, Loader2, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/feedback/empty-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { toast } from "@/components/feedback/success-toast";
import type { CurrentUser } from "@/features/auth/types/user";
import type { KaizenDetail } from "@/features/kaizen/types/kaizen";
import { useAddComment, useResolveComment } from "@/features/review/hooks/use-comment-mutations";
import { useReviewComments } from "@/features/review/hooks/use-review-comments";
import { highlightMentions } from "@/features/review/utils/highlight-mentions";
import { fadeInUpVariants } from "@/lib/motion";
import { ApiError } from "@/lib/api-client";
import { formatDate, formatRelativeTime, getInitials, getInitialsFromName } from "@/utils/format";

interface ReviewCommentsThreadProps {
  kaizen: KaizenDetail;
  currentUser: CurrentUser | undefined;
}

export interface ReviewCommentsThreadHandle {
  focusComposer: () => void;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

/**
 * Rebuild of the old shared `ReviewCommentsPanel` (deleted in Milestone 15 — this component now
 * covers every consumer: Review, Implementation, and the My Ideas case-study page). Same
 * `useReviewComments`/`useAddComment`/`useResolveComment` hooks and the exact same permission
 * logic (a submitter can post only while their Kaizen is `NEEDS_CHANGES`, which the old panel's
 * `readOnly` prop used to special-case for My Ideas — this component's own gating already
 * produces that same read-only behavior for a submitter automatically, no separate prop needed),
 * presented as Slack-style chat bubbles instead of bordered list items.
 */
export const ReviewCommentsThread = forwardRef<ReviewCommentsThreadHandle, ReviewCommentsThreadProps>(
  function ReviewCommentsThread({ kaizen, currentUser }, ref) {
    const [body, setBody] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { data: comments, isLoading } = useReviewComments(kaizen.id);
    const addComment = useAddComment(kaizen.id);
    const resolveComment = useResolveComment(kaizen.id);

    useImperativeHandle(ref, () => ({
      focusComposer: () => textareaRef.current?.focus(),
    }));

    if (!currentUser) return null;

    const isDeptManagerHere = currentUser.role === "DEPARTMENT_MANAGER" && currentUser.department?.id === kaizen.department.id;
    const isCompanyWideReviewer = ["HR", "CMD", "SUPER_ADMIN"].includes(currentUser.role);
    const isSubmitter = currentUser.id === kaizen.submitter.id;
    const canComment = isDeptManagerHere || isCompanyWideReviewer || (isSubmitter && kaizen.status === "NEEDS_CHANGES");
    const canResolve = isDeptManagerHere;

    function handleSubmit() {
      const trimmed = body.trim();
      if (!trimmed) return;
      addComment.mutate(trimmed, {
        onSuccess: () => setBody(""),
        onError: (error) => toast.error(getErrorMessage(error, "Could not add comment.")),
      });
    }

    return (
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <LoadingSkeleton className="h-14 w-3/4" />
            <LoadingSkeleton className="h-14 w-2/3" />
          </div>
        ) : !comments || comments.length === 0 ? (
          <EmptyState icon={MessageSquare} title="No comments yet" description="Start the discussion below." className="border-none px-0 py-6" />
        ) : (
          <ol className="flex flex-col gap-4">
            {comments.map((comment, index) => {
              const isOwn = comment.author.id === currentUser.id;
              return (
                <motion.li
                  key={comment.id}
                  initial="hidden"
                  animate="visible"
                  variants={fadeInUpVariants}
                  transition={{ delay: Math.min(index, 6) * 0.03 }}
                  className="flex gap-3"
                >
                  <Avatar alt={comment.author.displayName} fallback={getInitialsFromName(comment.author.displayName)} className="h-8 w-8 shrink-0 text-xs" />
                  <div className="min-w-0 flex-1">
                    <div
                      className={
                        isOwn
                          ? "bg-primary/10 rounded-2xl rounded-tl-sm px-4 py-2.5"
                          : "bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5"
                      }
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-sm font-semibold">{comment.author.displayName}</p>
                        <p className="text-muted-foreground text-[11px]" title={formatDate(comment.createdAt)}>
                          {formatRelativeTime(comment.createdAt)}
                        </p>
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap text-sm">{highlightMentions(comment.body)}</p>
                    </div>
                    <div className="mt-1 flex items-center gap-2 px-1">
                      {comment.isResolved ? (
                        <Badge variant="success" className="text-[10px]">
                          <CheckCheck className="h-3 w-3" />
                          Resolved
                        </Badge>
                      ) : canResolve ? (
                        <button
                          type="button"
                          disabled={resolveComment.isPending}
                          onClick={() =>
                            resolveComment.mutate(comment.id, {
                              onError: (error) => toast.error(getErrorMessage(error, "Could not resolve comment.")),
                            })
                          }
                          className="text-muted-foreground hover:text-foreground text-[11px] font-medium"
                        >
                          Mark resolved
                        </button>
                      ) : null}
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        )}

        {canComment ? (
          <div className="flex gap-3 border-t pt-4">
            <Avatar
              src={currentUser.avatarUrl}
              alt={currentUser.displayName}
              fallback={getInitials(currentUser.firstName, currentUser.lastName)}
              className="h-8 w-8 shrink-0 text-xs"
            />
            <div className="flex flex-1 flex-col gap-2">
              <Textarea
                ref={textareaRef}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Write a comment… use @name to mention someone"
                rows={3}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                    event.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <Button className="self-end" size="sm" disabled={!body.trim() || addComment.isPending} onClick={handleSubmit}>
                {addComment.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Comment
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    );
  },
);
