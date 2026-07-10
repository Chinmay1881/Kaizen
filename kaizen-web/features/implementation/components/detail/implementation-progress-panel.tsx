"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCheck, Loader2, ShieldCheck, ShieldX } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { toast } from "@/components/feedback/success-toast";
import { Textarea } from "@/components/ui/textarea";
import type { CurrentUser } from "@/features/auth/types/user";
import type { KaizenDetail } from "@/features/kaizen/types/kaizen";
import { useImplementation } from "@/features/implementation/hooks/use-implementation";
import {
  useCompleteImplementation,
  useUpdateImplementationProgress,
  useVerifyImplementation,
} from "@/features/implementation/hooks/use-implementation-mutations";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/utils/format";

interface ImplementationProgressPanelProps {
  kaizen: KaizenDetail;
  currentUser: CurrentUser | undefined;
}

const COMPANY_WIDE_ROLES = ["HR", "CMD", "SUPER_ADMIN"];
const VERIFICATION_BADGE_VARIANT: Record<string, "outline" | "success" | "destructive"> = {
  PENDING: "outline",
  VERIFIED: "success",
  REJECTED: "destructive",
};

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function ImplementationProgressPanel({
  kaizen,
  currentUser,
}: ImplementationProgressPanelProps) {
  const { data: implementation, isLoading } = useImplementation(kaizen.id);
  const updateProgress = useUpdateImplementationProgress(kaizen.id);
  const complete = useCompleteImplementation(kaizen.id);
  const verify = useVerifyImplementation(kaizen.id);

  const [progressPercent, setProgressPercent] = useState(0);
  const [description, setDescription] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [actualCost, setActualCost] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [verifyNotes, setVerifyNotes] = useState("");
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current || !implementation) return;
    setProgressPercent(implementation.progressPercent);
    setDescription(implementation.description ?? "");
    setEstimatedCost(
      implementation.estimatedCost != null ? String(implementation.estimatedCost) : "",
    );
    setActualCost(implementation.actualCost != null ? String(implementation.actualCost) : "");
    initializedRef.current = true;
  }, [implementation]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-2 p-5">
          <LoadingSkeleton className="h-5 w-1/3" />
          <LoadingSkeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!implementation || !currentUser) return null;

  const isOwner = implementation.owner.id === currentUser.id;
  const isDeptManagerHere =
    currentUser.role === "DEPARTMENT_MANAGER" &&
    currentUser.department?.id === kaizen.department.id;
  const canUpdate = isOwner || isDeptManagerHere;
  const canVerify = isDeptManagerHere || COMPANY_WIDE_ROLES.includes(currentUser.role);
  const isInProgress = kaizen.status === "IMPLEMENTATION_IN_PROGRESS";
  const isCompleted = Boolean(implementation.completedAt);

  function handleSaveProgress() {
    updateProgress.mutate(
      {
        progressPercent,
        description: description.trim() || undefined,
        estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
        actualCost: actualCost ? Number(actualCost) : undefined,
      },
      {
        onSuccess: () => toast.success("Progress updated."),
        onError: (error) => toast.error(getErrorMessage(error, "Could not update progress.")),
      },
    );
  }

  function handleComplete() {
    complete.mutate(
      { completionNotes: completionNotes.trim() || undefined },
      {
        onSuccess: () => toast.success("Implementation marked complete."),
        onError: (error) => toast.error(getErrorMessage(error, "Could not mark complete.")),
      },
    );
  }

  function handleVerify(status: "VERIFIED" | "REJECTED") {
    verify.mutate(
      { status, notes: verifyNotes.trim() || undefined },
      {
        onSuccess: () => toast.success(`Implementation ${status.toLowerCase()}.`),
        onError: (error) => toast.error(getErrorMessage(error, "Could not verify.")),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Implementation</CardTitle>
          <Badge variant={VERIFICATION_BADGE_VARIANT[implementation.verificationStatus]}>
            {implementation.verificationStatus}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted-foreground text-xs">Owner</dt>
            <dd>{implementation.owner.displayName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Assigned Department</dt>
            <dd>{implementation.assignedDepartment.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Due Date</dt>
            <dd>{implementation.dueDate ? formatDate(implementation.dueDate) : "—"}</dd>
          </div>
        </dl>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{implementation.progressPercent}%</span>
          </div>
          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${implementation.progressPercent}%` }}
            />
          </div>
        </div>

        {canUpdate && isInProgress ? (
          <div className="flex flex-col gap-3 border-t pt-4">
            <p className="text-sm font-medium">Update progress</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm">Progress %</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={progressPercent}
                  onChange={(event) => setProgressPercent(Number(event.target.value))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm">Estimated Cost</label>
                <Input
                  type="number"
                  min={0}
                  value={estimatedCost}
                  onChange={(event) => setEstimatedCost(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm">Actual Cost</label>
                <Input
                  type="number"
                  min={0}
                  value={actualCost}
                  onChange={(event) => setActualCost(event.target.value)}
                />
              </div>
            </div>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What's happening with this implementation?"
              rows={2}
            />
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleSaveProgress}
                disabled={updateProgress.isPending}
              >
                {updateProgress.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Save Progress
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={complete.isPending}>
                    <CheckCheck className="h-4 w-4" />
                    Mark Complete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Mark this implementation complete?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This moves the Kaizen to Implementation Completed and cannot be undone from
                      here.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Textarea
                    value={completionNotes}
                    onChange={(event) => setCompletionNotes(event.target.value)}
                    placeholder="Completion notes (optional)..."
                    rows={3}
                  />
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={complete.isPending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(event) => {
                        event.preventDefault();
                        handleComplete();
                      }}
                      disabled={complete.isPending}
                    >
                      {complete.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Mark Complete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ) : null}

        {implementation.completionNotes ? (
          <p className="text-muted-foreground border-t pt-4 text-sm whitespace-pre-wrap">
            <span className="text-foreground font-medium">Completion notes: </span>
            {implementation.completionNotes}
          </p>
        ) : null}

        {canVerify && isCompleted && implementation.verificationStatus === "PENDING" ? (
          <div className="flex flex-col gap-3 border-t pt-4">
            <p className="text-sm font-medium">Verify implementation</p>
            <Textarea
              value={verifyNotes}
              onChange={(event) => setVerifyNotes(event.target.value)}
              placeholder="Verification notes (optional)..."
              rows={2}
            />
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="destructive"
                disabled={verify.isPending}
                onClick={() => handleVerify("REJECTED")}
              >
                <ShieldX className="h-4 w-4" />
                Reject Verification
              </Button>
              <Button disabled={verify.isPending} onClick={() => handleVerify("VERIFIED")}>
                {verify.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Verify
              </Button>
            </div>
          </div>
        ) : null}

        {implementation.verifiedBy ? (
          <p className="text-muted-foreground text-xs">
            {implementation.verificationStatus === "VERIFIED" ? "Verified" : "Verification decided"}{" "}
            by {implementation.verifiedBy.displayName}
            {implementation.verifiedAt ? ` on ${formatDate(implementation.verifiedAt)}` : ""}.
          </p>
        ) : null}

        {implementation.attachments.length > 0 ? (
          <div className="border-t pt-4">
            <p className="mb-2 text-sm font-medium">Evidence</p>
            <ul className="flex flex-col gap-1 text-sm">
              {implementation.attachments.map((attachment) => (
                <li key={attachment.id}>
                  <a
                    href={attachment.cloudinarySecureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {attachment.fileName}
                  </a>
                  <span className="text-muted-foreground">
                    {" "}
                    — uploaded by {attachment.uploadedBy.displayName}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
