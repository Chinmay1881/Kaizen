"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, MessageSquareWarning, PlayCircle, XCircle } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/feedback/success-toast";
import type { CurrentUser } from "@/features/auth/types/user";
import type { KaizenDetail } from "@/features/kaizen/types/kaizen";
import {
  useApproveKaizen,
  useRejectKaizen,
  useRequestChanges,
  useStartReview,
} from "@/features/review/hooks/use-review-actions";
import { useEvaluation } from "@/features/scoring/hooks/use-evaluation";
import { ApiError } from "@/lib/api-client";

interface ReviewActionPanelProps {
  kaizen: KaizenDetail;
  currentUser: CurrentUser | undefined;
}

const COMPANY_WIDE_ROLES = ["HR", "CMD", "SUPER_ADMIN"];

/** Statuses reached only after an implementation has been assigned (Milestone 8) — link over to
 * its own detail page instead of duplicating implementation/business-impact UI here. */
const IMPLEMENTATION_STAGE_STATUSES = [
  "IMPLEMENTATION_IN_PROGRESS",
  "IMPLEMENTATION_COMPLETED",
  "BUSINESS_IMPACT_RECORDED",
];

interface NotesActionDialogProps {
  triggerLabel: string;
  triggerVariant: "default" | "destructive" | "outline";
  triggerIcon: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  isPending: boolean;
  onConfirm: (notes: string) => void;
  /** Disables the trigger — used when the Approve/Reject evaluation precondition isn't met yet. */
  disabled?: boolean;
}

function NotesActionDialog({
  triggerLabel,
  triggerVariant,
  triggerIcon,
  title,
  description,
  confirmLabel,
  isPending,
  onConfirm,
  disabled = false,
}: NotesActionDialogProps) {
  const [notes, setNotes] = useState("");

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={triggerVariant} disabled={disabled}>
          {triggerIcon}
          {triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <Textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Add a note for the submitter (optional)..."
          rows={4}
        />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              onConfirm(notes);
            }}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function ReviewActionPanel({ kaizen, currentUser }: ReviewActionPanelProps) {
  const startReview = useStartReview();
  const approve = useApproveKaizen();
  const reject = useRejectKaizen();
  const requestChanges = useRequestChanges();
  const evaluationQuery = useEvaluation(kaizen.id);

  if (!currentUser) return null;

  const isCompanyWideReviewer = COMPANY_WIDE_ROLES.includes(currentUser.role);
  const isDeptManagerHere =
    currentUser.role === "DEPARTMENT_MANAGER" &&
    currentUser.department?.id === kaizen.department.id;

  // Per docs/engineering/02_API_SPECIFICATION.md, review actions (start/approve/reject/needs
  // changes) are scoped to "Department Manager (same department)" only — HR/CMD/Super Admin can
  // view the queue and this Kaizen, but cannot act on it (see Known Limitations).
  if (!isDeptManagerHere) {
    if (!isCompanyWideReviewer) return null;
    return (
      <Card>
        <CardContent className="text-muted-foreground p-5 text-sm">
          You can view this Kaizen, but only the department manager for {kaizen.department.name} can
          take review actions on it.
        </CardContent>
      </Card>
    );
  }

  if (kaizen.status === "SUBMITTED") {
    return (
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
          <p className="text-sm">This Kaizen is waiting for you to start the review.</p>
          <Button
            onClick={() =>
              startReview.mutate(
                { kaizenId: kaizen.id },
                {
                  onSuccess: () => toast.success("Review started."),
                  onError: (error) =>
                    toast.error(getErrorMessage(error, "Could not start the review.")),
                },
              )
            }
            disabled={startReview.isPending}
          >
            {startReview.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4" />
            )}
            Start Review
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (kaizen.status === "UNDER_REVIEW") {
    const evaluation = evaluationQuery.data;
    const isEvaluationLoading = evaluationQuery.isLoading;
    const canApprove =
      !isEvaluationLoading && evaluation?.isSubmitted && evaluation.recommendation === "APPROVE";
    const canReject =
      !isEvaluationLoading && evaluation?.isSubmitted && evaluation.recommendation === "REJECT";

    return (
      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium">Review actions:</p>

            <NotesActionDialog
              triggerLabel="Approve"
              triggerVariant="default"
              triggerIcon={<CheckCircle2 className="h-4 w-4" />}
              title="Approve this Kaizen?"
              description="The submitter will be notified and this Kaizen moves to Approved."
              confirmLabel="Approve"
              isPending={approve.isPending}
              disabled={isEvaluationLoading || !canApprove}
              onConfirm={(notes) =>
                approve.mutate(
                  { kaizenId: kaizen.id, notes: notes || undefined },
                  {
                    onSuccess: () => toast.success("Kaizen approved."),
                    onError: (error) => toast.error(getErrorMessage(error, "Could not approve.")),
                  },
                )
              }
            />

            <NotesActionDialog
              triggerLabel="Request Changes"
              triggerVariant="outline"
              triggerIcon={<MessageSquareWarning className="h-4 w-4" />}
              title="Request changes from the submitter?"
              description="This Kaizen moves back to Needs Changes and the submitter can edit and resubmit it."
              confirmLabel="Request Changes"
              isPending={requestChanges.isPending}
              onConfirm={(notes) =>
                requestChanges.mutate(
                  { kaizenId: kaizen.id, notes: notes || undefined },
                  {
                    onSuccess: () => toast.success("Changes requested."),
                    onError: (error) =>
                      toast.error(getErrorMessage(error, "Could not request changes.")),
                  },
                )
              }
            />

            <NotesActionDialog
              triggerLabel="Reject"
              triggerVariant="destructive"
              triggerIcon={<XCircle className="h-4 w-4" />}
              title="Reject this Kaizen?"
              description="This cannot be undone from here — the Kaizen moves to Rejected."
              confirmLabel="Reject"
              isPending={reject.isPending}
              disabled={isEvaluationLoading || !canReject}
              onConfirm={(notes) =>
                reject.mutate(
                  { kaizenId: kaizen.id, notes: notes || undefined },
                  {
                    onSuccess: () => toast.success("Kaizen rejected."),
                    onError: (error) => toast.error(getErrorMessage(error, "Could not reject.")),
                  },
                )
              }
            />
          </div>

          {!isEvaluationLoading && !canApprove && !canReject ? (
            <p className="text-muted-foreground text-xs">
              Submit an evaluation above with a matching recommendation to enable Approve or Reject.
              Request Changes doesn&apos;t require an evaluation.
            </p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5 text-sm">
        <p className="text-muted-foreground">
          No further review actions are available while this Kaizen is{" "}
          {kaizen.status.replaceAll("_", " ").toLowerCase()}.
        </p>
        {IMPLEMENTATION_STAGE_STATUSES.includes(kaizen.status) ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={`/implementation/${kaizen.id}`}>View Implementation</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
