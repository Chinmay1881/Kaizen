"use client";

import { CalendarClock, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { toast } from "@/components/feedback/success-toast";
import { REPORT_TYPE_LABEL } from "@/features/reports/constants/report-types";
import { ReportScheduleForm } from "@/features/reports/components/report-schedule-form";
import { useDeleteSchedule, useReportSchedules, useUpdateSchedule } from "@/features/reports/hooks/use-report-schedules";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/utils/format";

const FREQUENCY_LABEL: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  YEARLY: "Yearly",
};

/** Part 6 — Scheduled Reports list. Enable/Disable is a single toggle (`isEnabled`), not a
 * separate pause/resume concept, matching the brief's own "Enable / Disable" wording. */
export function ReportSchedulesView() {
  const query = useReportSchedules();
  const updateSchedule = useUpdateSchedule();
  const deleteSchedule = useDeleteSchedule();

  function handleToggle(id: string, isEnabled: boolean) {
    updateSchedule.mutate(
      { id, input: { isEnabled } },
      { onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not update this schedule.") },
    );
  }

  function handleDelete(id: string) {
    if (!window.confirm("Delete this schedule?")) return;
    deleteSchedule.mutate(id, {
      onSuccess: () => toast.success("Schedule removed."),
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not delete this schedule."),
    });
  }

  if (query.isError) {
    const message = query.error instanceof ApiError ? query.error.message : "Something went wrong loading schedules.";
    return <ErrorState title="Couldn't load schedules" description={message} onRetry={() => query.refetch()} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Scheduled Reports</h1>
          <p className="text-muted-foreground text-sm">Runs automatically and notifies recipients when ready.</p>
        </div>
        <ReportScheduleForm onCreated={() => void query.refetch()} />
      </div>

      {query.isLoading || !query.data ? (
        <div className="flex flex-col gap-2">
          {[...Array(3)].map((_, index) => (
            <LoadingSkeleton key={index} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : query.data.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No scheduled reports" description="Create a schedule to have a report generated automatically." />
      ) : (
        <div className="flex flex-col gap-2">
          {query.data.map((schedule) => (
            <div key={schedule.id} className="flex flex-col gap-2 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{REPORT_TYPE_LABEL[schedule.reportType]}</p>
                  <Badge variant="outline">{FREQUENCY_LABEL[schedule.frequency]}</Badge>
                  <Badge variant="outline">{schedule.format}</Badge>
                  <Badge variant={schedule.isEnabled ? "success" : "secondary"}>
                    {schedule.isEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-xs">
                  {schedule.recipientIds.length} recipient{schedule.recipientIds.length === 1 ? "" : "s"} · Next run{" "}
                  {formatDate(schedule.nextRunAt)}
                  {schedule.lastRunAt ? ` · Last run ${formatDate(schedule.lastRunAt)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggle(schedule.id, !schedule.isEnabled)}
                  disabled={updateSchedule.isPending}
                >
                  {schedule.isEnabled ? "Disable" : "Enable"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(schedule.id)} disabled={deleteSchedule.isPending}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
