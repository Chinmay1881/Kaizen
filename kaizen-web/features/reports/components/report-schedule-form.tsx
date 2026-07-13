"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/feedback/success-toast";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useCategories } from "@/features/kaizen/hooks/use-categories";
import { useDepartments } from "@/features/kaizen/hooks/use-departments";
import { useDepartmentUsers } from "@/features/kaizen/hooks/use-department-users";
import { REPORT_TYPE_OPTIONS } from "@/features/reports/constants/report-types";
import { useCreateSchedule } from "@/features/reports/hooks/use-report-schedules";
import type { ScheduleFrequency } from "@/features/reports/types/report-schedule";
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

/** Part 6 — "Choose Report Type, Recipients, Filters, Department, Category, Enable/Disable."
 * Recipients reuse the same department-scoped user picker Chunk 2/Milestone 8 already built
 * (`useDepartmentUsers`) rather than a new company-wide directory endpoint (same documented
 * scope trim as the Review Queue's "Employee"/"Assigned To" filters — see Known Issues). */
export function ReportScheduleForm({ onCreated }: { onCreated: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { data: currentUser } = useCurrentUser();
  const isCompanyWide = currentUser ? (["HR", "CMD", "SUPER_ADMIN"] as const).includes(currentUser.role as never) : false;
  const isDeptManagerOnly = currentUser?.role === "DEPARTMENT_MANAGER";

  const [reportType, setReportType] = useState<ReportType>("EXECUTIVE_SUMMARY");
  const [frequency, setFrequency] = useState<ScheduleFrequency>("MONTHLY");
  const [format, setFormat] = useState<ExportFormat>("PDF");
  const [departmentId, setDepartmentId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [recipientIds, setRecipientIds] = useState<string[]>([]);
  const [notifyMe, setNotifyMe] = useState(true);

  const departmentsQuery = useDepartments();
  const categoriesQuery = useCategories();
  const effectiveDepartmentId = isCompanyWide ? departmentId : (currentUser?.department?.id ?? "");
  const departmentUsersQuery = useDepartmentUsers(effectiveDepartmentId);

  const createSchedule = useCreateSchedule();

  function open() {
    dialogRef.current?.showModal();
  }
  function close() {
    dialogRef.current?.close();
  }

  function handleSubmit() {
    if (!currentUser) return;
    const recipients = new Set(recipientIds);
    if (notifyMe) recipients.add(currentUser.id);
    if (recipients.size === 0) {
      toast.error("Pick at least one recipient (or keep \"Notify me\" checked).");
      return;
    }

    createSchedule.mutate(
      {
        reportType,
        frequency,
        format,
        recipientIds: [...recipients],
        ...(departmentId ? { departmentId } : {}),
        ...(categoryId ? { categoryId } : {}),
      },
      {
        onSuccess: () => {
          toast.success("Schedule created.");
          close();
          onCreated();
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not create this schedule."),
      },
    );
  }

  return (
    <>
      <Button size="sm" onClick={open}>
        New Schedule
      </Button>
      <dialog ref={dialogRef} className="w-full max-w-lg rounded-xl border p-0 backdrop:bg-black/40">
        <div className="flex max-h-[80vh] flex-col gap-4 overflow-y-auto p-5">
          <div>
            <h3 className="text-base font-semibold">New Scheduled Report</h3>
            <p className="text-muted-foreground text-sm">Runs automatically and notifies recipients when ready.</p>
          </div>

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
            <Label>Recipients</Label>
            {effectiveDepartmentId ? (
              <div className="flex max-h-32 flex-col gap-1 overflow-y-auto rounded-lg border p-2">
                {departmentUsersQuery.data?.map((user) => (
                  <label key={user.id} className="flex items-center gap-2 text-sm">
                    <Input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={recipientIds.includes(user.id)}
                      onChange={(event) =>
                        setRecipientIds((prev) =>
                          event.target.checked ? [...prev, user.id] : prev.filter((id) => id !== user.id),
                        )
                      }
                    />
                    {user.displayName}
                  </label>
                ))}
                {departmentUsersQuery.data?.length === 0 ? (
                  <p className="text-muted-foreground text-xs">No other users in this department.</p>
                ) : null}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">Pick a department above to choose additional recipients.</p>
            )}
            <label className="mt-1 flex items-center gap-2 text-sm">
              <Input
                type="checkbox"
                checked={notifyMe}
                onChange={(event) => setNotifyMe(event.target.checked)}
                className="h-4 w-4"
              />
              Notify me too
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createSchedule.isPending}>
              Create Schedule
            </Button>
          </div>
        </div>
      </dialog>
    </>
  );
}
