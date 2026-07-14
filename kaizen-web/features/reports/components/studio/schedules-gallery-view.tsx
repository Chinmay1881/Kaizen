"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, Pencil, Plus, Trash2, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { toast } from "@/components/feedback/success-toast";
import { REPORT_TYPE_LABEL } from "@/features/reports/constants/report-types";
import { ScheduleFormDialog } from "@/features/reports/components/studio/schedule-form-dialog";
import { useDeleteSchedule, useReportSchedules, useUpdateSchedule } from "@/features/reports/hooks/use-report-schedules";
import type { ReportScheduleItem } from "@/features/reports/types/report-schedule";
import { fadeInUpVariants } from "@/lib/motion";
import { ApiError } from "@/lib/api-client";
import { formatDate, formatRelativeTime } from "@/utils/format";

const FREQUENCY_LABEL: Record<string, string> = { DAILY: "Daily", WEEKLY: "Weekly", MONTHLY: "Monthly", QUARTERLY: "Quarterly", YEARLY: "Yearly" };

function ScheduleCard({ schedule, index, onEdit }: { schedule: ReportScheduleItem; index: number; onEdit: () => void }) {
  const updateSchedule = useUpdateSchedule();
  const deleteSchedule = useDeleteSchedule();

  function handleToggle() {
    updateSchedule.mutate({ id: schedule.id, input: { isEnabled: !schedule.isEnabled } }, { onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not update this schedule.") });
  }

  function handleDelete() {
    if (!window.confirm("Delete this schedule?")) return;
    deleteSchedule.mutate(schedule.id, {
      onSuccess: () => toast.success("Schedule removed."),
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not delete this schedule."),
    });
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeInUpVariants} transition={{ delay: Math.min(index, 10) * 0.04 }} className="interactive-lift flex flex-col gap-4 rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{REPORT_TYPE_LABEL[schedule.reportType]}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge variant="outline">{FREQUENCY_LABEL[schedule.frequency]}</Badge>
            <Badge variant="outline">{schedule.format}</Badge>
            <Badge variant={schedule.isEnabled ? "success" : "secondary"}>{schedule.isEnabled ? "Enabled" : "Disabled"}</Badge>
          </div>
        </div>
        <span className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <CalendarClock className="h-5 w-5" />
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t pt-3 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Next Run</p>
          <p className="font-medium">{formatDate(schedule.nextRunAt)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Last Run</p>
          <p className="font-medium">{schedule.lastRunAt ? formatRelativeTime(schedule.lastRunAt) : "Never"}</p>
        </div>
      </div>

      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <Users className="h-3 w-3" />
        {schedule.recipientIds.length} recipient{schedule.recipientIds.length === 1 ? "" : "s"}
      </p>

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t pt-3">
        <Button variant="outline" size="sm" onClick={handleToggle} disabled={updateSchedule.isPending}>
          {schedule.isEnabled ? "Disable" : "Enable"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleteSchedule.isPending}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}

/** Redesign of `ReportSchedulesView` — calendar-like cards instead of a flat list. "Quick Edit"
 * opens the same `ScheduleFormDialog` the Studio's Actions Panel uses to create schedules,
 * prefilled via `useUpdateSchedule` (already existed, previously only wired to the
 * Enable/Disable toggle) — not a second form. */
export function SchedulesGalleryView() {
  const query = useReportSchedules();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ReportScheduleItem | null>(null);

  if (query.isError) {
    return <ErrorState title="Couldn't load schedules" description={query.error instanceof ApiError ? query.error.message : "Something went wrong."} onRetry={() => query.refetch()} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Scheduled Reports</h1>
          <p className="text-muted-foreground text-sm">Runs automatically and notifies recipients when ready.</p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          New Schedule
        </Button>
      </div>

      {query.isLoading || !query.data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, index) => (
            <LoadingSkeleton key={index} className="h-56 w-full rounded-xl" />
          ))}
        </div>
      ) : query.data.length === 0 ? (
        <EmptyState icon={CalendarClock} title="No scheduled reports" description="Create a schedule to have a report generated automatically." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {query.data.map((schedule, index) => (
            <ScheduleCard key={schedule.id} schedule={schedule} index={index} onEdit={() => setEditing(schedule)} />
          ))}
        </div>
      )}

      <ScheduleFormDialog open={creating} onOpenChange={setCreating} />
      <ScheduleFormDialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)} editing={editing} />
    </div>
  );
}
