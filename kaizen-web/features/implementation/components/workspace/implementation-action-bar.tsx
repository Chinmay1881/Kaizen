"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCheck, Download, Loader2, MessageSquare, Printer, ShieldCheck, ShieldX, Sparkles, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/feedback/success-toast";
import type { CurrentUser } from "@/features/auth/types/user";
import type { KaizenDetail } from "@/features/kaizen/types/kaizen";
import { useKaizenTimeline } from "@/features/kaizen/hooks/use-kaizen-timeline";
import type { BusinessImpact, Implementation } from "@/features/implementation/types/implementation";
import { useRecordBusinessImpact } from "@/features/implementation/hooks/use-business-impact";
import { useCompleteImplementation, useUpdateImplementationProgress, useVerifyImplementation } from "@/features/implementation/hooks/use-implementation-mutations";
import { exportImplementationAsJson } from "@/features/implementation/utils/export-implementation";
import { useReviewComments } from "@/features/review/hooks/use-review-comments";
import { downloadKaizenReportPdf } from "@/features/review/utils/generate-kaizen-report-pdf";
import { useKaizenScore } from "@/features/scoring/hooks/use-kaizen-score";
import { ApiError } from "@/lib/api-client";

type ActiveDialog = "progress" | "complete" | "verify" | "impact" | null;

interface ImplementationActionBarProps {
  kaizen: KaizenDetail;
  implementation: Implementation;
  currentUser: CurrentUser;
  businessImpact: BusinessImpact | null | undefined;
  onFocusComment: () => void;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

const IMPROVEMENT_FIELDS = [
  { key: "processImprovement", label: "Process" },
  { key: "qualityImprovement", label: "Quality" },
  { key: "safetyImprovement", label: "Safety" },
  { key: "productivityImprovement", label: "Productivity" },
  { key: "customerSatisfactionImprovement", label: "Customer Satisfaction" },
] as const;

/**
 * The Implementation Control Center's sticky action bar. Same mutations the now-deleted
 * `ImplementationProgressPanel`/`BusinessImpactPanel` used to call (Milestone 15 removed them once
 * My Ideas stopped being their only remaining consumer) —
 * `useUpdateImplementationProgress`/`useCompleteImplementation`/`useVerifyImplementation`/
 * `useRecordBusinessImpact` — and the exact same gating. "Mark In Progress" and a standalone
 * "Assign" action from the brief are intentionally not implemented as separate buttons: every
 * implementation here is already `IMPLEMENTATION_IN_PROGRESS` the moment it's assigned (assigning
 * is done in the Review Workspace, before an `Implementation` row even exists), and there is no
 * "mark in progress" or "reassign" endpoint to call — inventing one would violate this
 * milestone's own rule against fabricating behavior. Updating progress above 0% is what "in
 * progress" means in this data model.
 */
export function ImplementationActionBar({ kaizen, implementation, currentUser, businessImpact, onFocusComment }: ImplementationActionBarProps) {
  const updateProgress = useUpdateImplementationProgress(kaizen.id);
  const complete = useCompleteImplementation(kaizen.id);
  const verify = useVerifyImplementation(kaizen.id);
  const recordImpact = useRecordBusinessImpact(kaizen.id);
  const timelineQuery = useKaizenTimeline(kaizen.id);
  const scoreQuery = useKaizenScore(kaizen.id);
  const commentsQuery = useReviewComments(kaizen.id);

  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [progressPercent, setProgressPercent] = useState(implementation.progressPercent);
  const [progressDescription, setProgressDescription] = useState(implementation.description ?? "");
  const [estimatedCost, setEstimatedCost] = useState(implementation.estimatedCost != null ? String(implementation.estimatedCost) : "");
  const [actualCost, setActualCost] = useState(implementation.actualCost != null ? String(implementation.actualCost) : "");
  const [completionNotes, setCompletionNotes] = useState("");
  const [verifyNotes, setVerifyNotes] = useState("");
  const [impact, setImpact] = useState({ moneySaved: "", hoursSaved: "", employeesBenefited: "", customersBenefited: "", remarks: "" });
  const [improvements, setImprovements] = useState<Record<string, boolean>>({});

  const isOwner = implementation.owner.id === currentUser.id;
  const isDeptManagerHere = currentUser.role === "DEPARTMENT_MANAGER" && currentUser.department?.id === kaizen.department.id;
  const isCompanyWide = ["HR", "CMD", "SUPER_ADMIN"].includes(currentUser.role);
  const canUpdate = (isOwner || isDeptManagerHere) && kaizen.status === "IMPLEMENTATION_IN_PROGRESS";
  const canVerify = (isDeptManagerHere || isCompanyWide) && Boolean(implementation.completedAt) && implementation.verificationStatus === "PENDING";
  const canRecordImpact = (isDeptManagerHere || isCompanyWide) && kaizen.status === "IMPLEMENTATION_COMPLETED" && !businessImpact;

  function closeDialog() {
    setActiveDialog(null);
  }

  async function handlePrint() {
    setIsGeneratingPdf(true);
    try {
      await downloadKaizenReportPdf({
        kaizen,
        score: scoreQuery.data ?? null,
        timeline: timelineQuery.data ?? [],
        comments: commentsQuery.data ?? [],
        implementation,
        businessImpact: businessImpact ?? null,
      });
    } catch {
      toast.error("Could not generate the PDF report.");
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  function handleExport() {
    exportImplementationAsJson(kaizen, implementation, businessImpact, timelineQuery.data);
  }

  function handleSaveProgress() {
    updateProgress.mutate(
      {
        progressPercent,
        description: progressDescription.trim() || undefined,
        estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
        actualCost: actualCost ? Number(actualCost) : undefined,
      },
      { onSuccess: () => { toast.success("Progress updated."); closeDialog(); }, onError: (error) => toast.error(getErrorMessage(error, "Could not update progress.")) },
    );
  }

  function handleComplete() {
    complete.mutate(
      { completionNotes: completionNotes.trim() || undefined },
      { onSuccess: () => { toast.success("Implementation marked complete."); closeDialog(); }, onError: (error) => toast.error(getErrorMessage(error, "Could not mark complete.")) },
    );
  }

  function handleVerify(status: "VERIFIED" | "REJECTED") {
    verify.mutate(
      { status, notes: verifyNotes.trim() || undefined },
      { onSuccess: () => { toast.success(`Implementation ${status.toLowerCase()}.`); closeDialog(); }, onError: (error) => toast.error(getErrorMessage(error, "Could not verify.")) },
    );
  }

  function handleRecordImpact() {
    recordImpact.mutate(
      {
        moneySaved: impact.moneySaved ? Number(impact.moneySaved) : undefined,
        hoursSaved: impact.hoursSaved ? Number(impact.hoursSaved) : undefined,
        employeesBenefited: impact.employeesBenefited ? Number(impact.employeesBenefited) : undefined,
        customersBenefited: impact.customersBenefited ? Number(impact.customersBenefited) : undefined,
        processImprovement: Boolean(improvements.processImprovement),
        qualityImprovement: Boolean(improvements.qualityImprovement),
        safetyImprovement: Boolean(improvements.safetyImprovement),
        productivityImprovement: Boolean(improvements.productivityImprovement),
        customerSatisfactionImprovement: Boolean(improvements.customerSatisfactionImprovement),
        remarks: impact.remarks.trim() || undefined,
      },
      { onSuccess: () => { toast.success("Business impact recorded."); closeDialog(); }, onError: (error) => toast.error(getErrorMessage(error, "Could not record business impact.")) },
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2 border-t p-4">
        <div className="grid grid-cols-2 gap-2">
          <Button size="sm" variant="outline" disabled={!canUpdate} onClick={() => setActiveDialog("progress")}>
            <TrendingUp className="h-3.5 w-3.5" />
            Update Progress
          </Button>
          <Button size="sm" disabled={!canUpdate} onClick={() => setActiveDialog("complete")}>
            <CheckCheck className="h-3.5 w-3.5" />
            Mark Complete
          </Button>
        </div>

        {canVerify ? (
          <Button size="sm" variant="outline" onClick={() => setActiveDialog("verify")}>
            <ShieldCheck className="h-3.5 w-3.5" />
            Verify Implementation
          </Button>
        ) : null}

        {canRecordImpact ? (
          <Button size="sm" variant="outline" onClick={() => setActiveDialog("impact")}>
            <Sparkles className="h-3.5 w-3.5" />
            Record Business Impact
          </Button>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          <Button variant="ghost" size="sm" onClick={onFocusComment}>
            <MessageSquare className="h-3.5 w-3.5" />
            Comment
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/kaizen/${kaizen.id}`}>Original Kaizen</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void handlePrint()} disabled={isGeneratingPdf}>
            {isGeneratingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
            {isGeneratingPdf ? "Generating…" : "Print"}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExport}>
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      <Dialog open={activeDialog === "progress"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Progress</DialogTitle>
            <DialogDescription>Log where this implementation stands right now.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Progress %</label>
              <Input type="number" min={0} max={100} value={progressPercent} onChange={(event) => setProgressPercent(Number(event.target.value))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Estimated Cost</label>
                <Input type="number" min={0} value={estimatedCost} onChange={(event) => setEstimatedCost(event.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Actual Cost</label>
                <Input type="number" min={0} value={actualCost} onChange={(event) => setActualCost(event.target.value)} />
              </div>
            </div>
            <Textarea value={progressDescription} onChange={(event) => setProgressDescription(event.target.value)} placeholder="What's happening with this implementation?" rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={updateProgress.isPending}>
              Cancel
            </Button>
            <Button onClick={handleSaveProgress} disabled={updateProgress.isPending}>
              {updateProgress.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === "complete"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark this implementation complete?</DialogTitle>
            <DialogDescription>This moves the Kaizen to Implementation Completed and cannot be undone from here.</DialogDescription>
          </DialogHeader>
          <Textarea value={completionNotes} onChange={(event) => setCompletionNotes(event.target.value)} placeholder="Completion notes (optional)..." rows={3} />
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={complete.isPending}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={complete.isPending}>
              {complete.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Mark Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === "verify"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify this implementation</DialogTitle>
            <DialogDescription>Confirm the work was actually completed as described.</DialogDescription>
          </DialogHeader>
          <Textarea value={verifyNotes} onChange={(event) => setVerifyNotes(event.target.value)} placeholder="Verification notes (optional)..." rows={3} />
          <DialogFooter>
            <Button variant="destructive" disabled={verify.isPending} onClick={() => handleVerify("REJECTED")}>
              <ShieldX className="h-4 w-4" />
              Reject
            </Button>
            <Button disabled={verify.isPending} onClick={() => handleVerify("VERIFIED")}>
              {verify.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              Verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={activeDialog === "impact"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Business Impact</DialogTitle>
            <DialogDescription>What did this implementation actually deliver?</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm">Money Saved</label>
                <Input type="number" min={0} value={impact.moneySaved} onChange={(event) => setImpact((prev) => ({ ...prev, moneySaved: event.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm">Hours Saved</label>
                <Input type="number" min={0} value={impact.hoursSaved} onChange={(event) => setImpact((prev) => ({ ...prev, hoursSaved: event.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm">Employees Benefited</label>
                <Input type="number" min={0} value={impact.employeesBenefited} onChange={(event) => setImpact((prev) => ({ ...prev, employeesBenefited: event.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm">Customers Benefited</label>
                <Input type="number" min={0} value={impact.customersBenefited} onChange={(event) => setImpact((prev) => ({ ...prev, customersBenefited: event.target.value }))} />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {IMPROVEMENT_FIELDS.map((field) => (
                <label key={field.key} className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={Boolean(improvements[field.key])} onChange={(event) => setImprovements((prev) => ({ ...prev, [field.key]: event.target.checked }))} className="accent-primary h-4 w-4" />
                  {field.label}
                </label>
              ))}
            </div>
            <Textarea value={impact.remarks} onChange={(event) => setImpact((prev) => ({ ...prev, remarks: event.target.value }))} placeholder="Remarks (optional)" rows={2} maxLength={2000} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={recordImpact.isPending}>
              Cancel
            </Button>
            <Button onClick={handleRecordImpact} disabled={recordImpact.isPending}>
              {recordImpact.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
