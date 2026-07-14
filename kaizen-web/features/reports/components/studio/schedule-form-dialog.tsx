"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/feedback/success-toast";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useCategories } from "@/features/kaizen/hooks/use-categories";
import { useDepartments } from "@/features/kaizen/hooks/use-departments";
import { useDepartmentUsers } from "@/features/kaizen/hooks/use-department-users";
import { REPORT_TYPE_OPTIONS } from "@/features/reports/constants/report-types";
import { useCreateSchedule, useUpdateSchedule } from "@/features/reports/hooks/use-report-schedules";
import type { ReportScheduleItem, ScheduleFrequency } from "@/features/reports/types/report-schedule";
import type { ReportType } from "@/features/reports/types/report";
import type { ExportFormat } from "@/features/reports/types/report-export";
import { ApiError } from "@/lib/api-client";

const FREQUENCY_OPTIONS: { value: ScheduleFrequency; label: string }[] = [
  { value: "DAILY", label: "Daily" },
  { value: "WEEKLY", label: "Weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "YEARLY", label: "Yearly" },
];

interface ScheduleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the dialog edits this schedule (`useUpdateSchedule`) instead of creating a new
   * one — same fields, same dialog, no second form to maintain. */
  editing?: ReportScheduleItem | null;
  /** Prefills the report type when opened from the Studio (e.g. "Schedule this report"). */
  initialReportType?: ReportType;
}

/**
 * The one authoritative schedule create/edit UI — used from the Studio's Actions Panel ("New
 * Schedule") and the Schedules gallery's "Quick Edit". Replaces the old `ReportScheduleForm`
 * (native `<dialog>`, create-only) with the Milestone 12 `Dialog` primitive and adds real edit
 * support via the already-existing `useUpdateSchedule` mutation (previously only wired to the
 * Enable/Disable toggle).
 */
export function ScheduleFormDialog({ open, onOpenChange, editing, initialReportType }: ScheduleFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        {/* `Dialog` only mounts this subtree while `open` is true, so keying the form fields'
            state on nothing extra is enough — every open is already a fresh mount, which is what
            resets the fields to `editing`'s values without a "sync state to prop" effect. */}
        {open ? <ScheduleFormFields onOpenChange={onOpenChange} editing={editing ?? null} initialReportType={initialReportType} /> : null}
      </DialogContent>
    </Dialog>
  );
}

interface ScheduleFormFieldsProps {
  onOpenChange: (open: boolean) => void;
  editing: ReportScheduleItem | null;
  initialReportType?: ReportType;
}

function ScheduleFormFields({ onOpenChange, editing, initialReportType }: ScheduleFormFieldsProps) {
  const { data: currentUser } = useCurrentUser();
  const isCompanyWide = currentUser ? (["HR", "CMD", "SUPER_ADMIN"] as const).includes(currentUser.role as never) : false;
  const isDeptManagerOnly = currentUser?.role === "DEPARTMENT_MANAGER";

  const [reportType, setReportType] = useState<ReportType>(editing?.reportType ?? initialReportType ?? "EXECUTIVE_SUMMARY");
  const [frequency, setFrequency] = useState<ScheduleFrequency>(editing?.frequency ?? "MONTHLY");
  const [format, setFormat] = useState<ExportFormat>(editing?.format ?? "PDF");
  const [departmentId, setDepartmentId] = useState((editing?.filters.departmentId as string) ?? "");
  const [categoryId, setCategoryId] = useState((editing?.filters.categoryId as string) ?? "");
  const [recipientIds, setRecipientIds] = useState<string[]>(editing?.recipientIds ?? []);

  const departmentsQuery = useDepartments();
  const categoriesQuery = useCategories();
  const effectiveDepartmentId = isCompanyWide ? departmentId : (currentUser?.department?.id ?? "");
  const departmentUsersQuery = useDepartmentUsers(effectiveDepartmentId);

  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const isPending = createSchedule.isPending || updateSchedule.isPending;

  function handleSubmit() {
    if (!currentUser) return;
    const recipients = new Set(recipientIds);
    recipients.add(currentUser.id);

    const input = {
      reportType,
      frequency,
      format,
      recipientIds: [...recipients],
      ...(departmentId ? { departmentId } : {}),
      ...(categoryId ? { categoryId } : {}),
    };

    if (editing) {
      updateSchedule.mutate(
        { id: editing.id, input },
        {
          onSuccess: () => {
            toast.success("Schedule updated.");
            onOpenChange(false);
          },
          onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not update this schedule."),
        },
      );
    } else {
      createSchedule.mutate(input, {
        onSuccess: () => {
          toast.success("Schedule created.");
          onOpenChange(false);
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not create this schedule."),
      });
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{editing ? "Edit Schedule" : "New Scheduled Report"}</DialogTitle>
        <DialogDescription>Runs automatically and notifies recipients when ready.</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Report Type</Label>
          <Select value={reportType} onChange={(event) => setReportType(event.target.value as ReportType)}>
            {REPORT_TYPE_OPTIONS.filter((option) => !isDeptManagerOnly || option.value === "DEPARTMENT").map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Frequency</Label>
            <Select value={frequency} onChange={(event) => setFrequency(event.target.value as ScheduleFrequency)}>
              {FREQUENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Format</Label>
            <Select value={format} onChange={(event) => setFormat(event.target.value as ExportFormat)}>
              <option value="PDF">PDF</option>
              <option value="EXCEL">Excel</option>
              <option value="CSV">CSV</option>
            </Select>
          </div>
        </div>

        {isCompanyWide ? (
          <div className="flex flex-col gap-1.5">
            <Label>Department</Label>
            <Select value={departmentId} onChange={(event) => setDepartmentId(event.target.value)}>
              <option value="">All Departments</option>
              {departmentsQuery.data?.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        <div className="flex flex-col gap-1.5">
          <Label>Category</Label>
          <Select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">All Categories</option>
            {categoriesQuery.data?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Additional Recipients</Label>
          {effectiveDepartmentId ? (
            <div className="flex max-h-32 flex-col gap-1 overflow-y-auto rounded-lg border p-2">
              {departmentUsersQuery.data?.map((user) => (
                <label key={user.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-primary h-4 w-4"
                    checked={recipientIds.includes(user.id)}
                    onChange={(event) => setRecipientIds((prev) => (event.target.checked ? [...prev, user.id] : prev.filter((id) => id !== user.id)))}
                  />
                  {user.displayName}
                </label>
              ))}
              {departmentUsersQuery.data?.length === 0 ? <p className="text-muted-foreground text-xs">No other users in this department.</p> : null}
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">Pick a department above to choose additional recipients.</p>
          )}
          <p className="text-muted-foreground mt-1 text-xs">You&apos;re always included as a recipient.</p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {editing ? "Save Changes" : "Create Schedule"}
        </Button>
      </DialogFooter>
    </>
  );
}
