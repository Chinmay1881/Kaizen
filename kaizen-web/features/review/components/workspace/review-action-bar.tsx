"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Download, Loader2, MessageSquareWarning, PlayCircle, Printer, UserPlus, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/feedback/success-toast";
import type { CurrentUser } from "@/features/auth/types/user";
import type { KaizenDetail } from "@/features/kaizen/types/kaizen";
import { useKaizenTimeline } from "@/features/kaizen/hooks/use-kaizen-timeline";
import { useApproveKaizen, useRejectKaizen, useRequestChanges, useStartReview } from "@/features/review/hooks/use-review-actions";
import { exportKaizenAsJson } from "@/features/review/utils/export-kaizen";
import { useEvaluation } from "@/features/scoring/hooks/use-evaluation";
import { ApiError } from "@/lib/api-client";
import { fadeInUpVariants } from "@/lib/motion";

type ActiveDialog = "approve" | "reject" | "requestChanges" | null;

interface ReviewActionBarProps {
  kaizen: KaizenDetail;
  currentUser: CurrentUser;
  onOpenAssign: () => void;
}

export interface ReviewActionBarHandle {
  openApprove: () => void;
  openReject: () => void;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

const DIALOG_COPY: Record<Exclude<ActiveDialog, null>, { title: string; description: string; confirmLabel: string }> = {
  approve: { title: "Approve this Kaizen?", description: "The submitter will be notified and this Kaizen moves to Approved.", confirmLabel: "Approve" },
  reject: { title: "Reject this Kaizen?", description: "This cannot be undone from here — the Kaizen moves to Rejected.", confirmLabel: "Reject" },
  requestChanges: {
    title: "Request changes from the submitter?",
    description: "This Kaizen moves back to Needs Changes and the submitter can edit and resubmit it.",
    confirmLabel: "Request Changes",
  },
};

/**
 * The Decision Center's sticky action bar. Same four mutations `ReviewActionPanel` used
 * (`useStartReview`/`useApproveKaizen`/`useRejectKaizen`/`useRequestChanges`) and the exact same
 * Approve/Reject gating (an evaluation must be submitted with a matching recommendation) —
 * `ReviewActionPanel` itself is deleted, nothing else referenced it. Confirmation dialogs use the
 * Milestone 12 `Dialog` primitive instead of Radix `AlertDialog`, so a keyboard shortcut (A/R)
 * can open the exact same dialog a click would via the exposed `openApprove`/`openReject` ref
 * methods.
 */
export const ReviewActionBar = forwardRef<ReviewActionBarHandle, ReviewActionBarProps>(function ReviewActionBar(
  { kaizen, currentUser, onOpenAssign },
  ref,
) {
  const startReview = useStartReview();
  const approve = useApproveKaizen();
  const reject = useRejectKaizen();
  const requestChanges = useRequestChanges();
  const evaluationQuery = useEvaluation(kaizen.id);
  const timelineQuery = useKaizenTimeline(kaizen.id);

  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [notes, setNotes] = useState("");
  const [flashSuccess, setFlashSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!flashSuccess) return;
    const timer = window.setTimeout(() => setFlashSuccess(null), 1400);
    return () => window.clearTimeout(timer);
  }, [flashSuccess]);

  const isCompanyWideReviewer = ["HR", "CMD", "SUPER_ADMIN"].includes(currentUser.role);
  const isDeptManagerHere = currentUser.role === "DEPARTMENT_MANAGER" && currentUser.department?.id === kaizen.department.id;

  const evaluation = evaluationQuery.data;
  const canApprove = Boolean(evaluation?.isSubmitted && evaluation.recommendation === "APPROVE");
  const canReject = Boolean(evaluation?.isSubmitted && evaluation.recommendation === "REJECT");

  useImperativeHandle(ref, () => ({
    openApprove: () => {
      if (isDeptManagerHere && kaizen.status === "UNDER_REVIEW" && canApprove) setActiveDialog("approve");
    },
    openReject: () => {
      if (isDeptManagerHere && kaizen.status === "UNDER_REVIEW" && canReject) setActiveDialog("reject");
    },
  }));

  function closeDialog() {
    setActiveDialog(null);
    setNotes("");
  }

  function handleConfirm() {
    if (activeDialog === "approve") {
      approve.mutate(
        { kaizenId: kaizen.id, notes: notes || undefined },
        {
          onSuccess: () => {
            toast.success("Kaizen approved.");
            setFlashSuccess("approve");
            closeDialog();
          },
          onError: (error) => toast.error(getErrorMessage(error, "Could not approve.")),
        },
      );
    } else if (activeDialog === "reject") {
      reject.mutate(
        { kaizenId: kaizen.id, notes: notes || undefined },
        {
          onSuccess: () => {
            toast.success("Kaizen rejected.");
            setFlashSuccess("reject");
            closeDialog();
          },
          onError: (error) => toast.error(getErrorMessage(error, "Could not reject.")),
        },
      );
    } else if (activeDialog === "requestChanges") {
      requestChanges.mutate(
        { kaizenId: kaizen.id, notes: notes || undefined },
        {
          onSuccess: () => {
            toast.success("Changes requested.");
            setFlashSuccess("requestChanges");
            closeDialog();
          },
          onError: (error) => toast.error(getErrorMessage(error, "Could not request changes.")),
        },
      );
    }
  }

  const isPending = approve.isPending || reject.isPending || requestChanges.isPending;

  function handlePrint() {
    window.print();
  }

  function handleExport() {
    exportKaizenAsJson(kaizen, evaluation, timelineQuery.data);
  }

  if (!isDeptManagerHere && !isCompanyWideReviewer) return null;

  return (
    <>
      <div className="flex flex-col gap-2 border-t p-4">
        {!isDeptManagerHere ? (
          <p className="text-muted-foreground text-xs">Only {kaizen.department.name}&apos;s manager can take review actions on this Kaizen.</p>
        ) : kaizen.status === "SUBMITTED" ? (
          <Button
            className="w-full"
            onClick={() =>
              startReview.mutate(
                { kaizenId: kaizen.id },
                { onSuccess: () => toast.success("Review started."), onError: (error) => toast.error(getErrorMessage(error, "Could not start the review.")) },
              )
            }
            disabled={startReview.isPending}
          >
            {startReview.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
            Start Review
          </Button>
        ) : kaizen.status === "UNDER_REVIEW" ? (
          <div className="grid grid-cols-3 gap-2">
            <ActionButton label="Approve" icon={CheckCircle2} tone="default" disabled={!canApprove} justSucceeded={flashSuccess === "approve"} onClick={() => setActiveDialog("approve")} />
            <ActionButton label="Reject" icon={XCircle} tone="destructive" disabled={!canReject} justSucceeded={flashSuccess === "reject"} onClick={() => setActiveDialog("reject")} />
            <ActionButton label="Changes" icon={MessageSquareWarning} tone="outline" justSucceeded={flashSuccess === "requestChanges"} onClick={() => setActiveDialog("requestChanges")} />
          </div>
        ) : kaizen.status === "APPROVED" ? (
          <Button className="w-full" variant="outline" onClick={onOpenAssign}>
            <UserPlus className="h-4 w-4" />
            Assign Implementation
          </Button>
        ) : (
          <p className="text-muted-foreground text-xs">No further review actions while this Kaizen is {kaizen.status.replaceAll("_", " ").toLowerCase()}.</p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" size="sm" onClick={handlePrint}>
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      <Dialog open={activeDialog !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          {activeDialog ? (
            <>
              <DialogHeader>
                <DialogTitle>{DIALOG_COPY[activeDialog].title}</DialogTitle>
                <DialogDescription>{DIALOG_COPY[activeDialog].description}</DialogDescription>
              </DialogHeader>
              <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add a note for the submitter (optional)..." rows={4} />
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog} disabled={isPending}>
                  Cancel
                </Button>
                <Button variant={activeDialog === "reject" ? "destructive" : "default"} onClick={handleConfirm} disabled={isPending}>
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {DIALOG_COPY[activeDialog].confirmLabel}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
});

function ActionButton({
  label,
  icon: Icon,
  tone,
  disabled,
  justSucceeded,
  onClick,
}: {
  label: string;
  icon: typeof CheckCircle2;
  tone: "default" | "destructive" | "outline";
  disabled?: boolean;
  justSucceeded: boolean;
  onClick: () => void;
}) {
  return (
    <div className="relative">
      <Button variant={tone} size="sm" className="w-full" disabled={disabled} onClick={onClick}>
        <Icon className="h-3.5 w-3.5" />
        {label}
      </Button>
      <AnimatePresence>
        {justSucceeded ? (
          <motion.span
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={fadeInUpVariants}
            className="bg-success text-success-foreground absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full"
          >
            <CheckCircle2 className="h-3 w-3" />
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
