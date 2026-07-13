import { generateReportSchema } from "../modules/reports/report.schema.js";
import { reportExportService } from "../modules/report-exports/report-export.service.js";
import { computeNextRun, reportScheduleService } from "../modules/report-schedules/report-schedule.service.js";

const CHECK_INTERVAL_MS = 60 * 1000;

/** Same `setInterval`-background-job pattern as `leaderboard-refresh.job.ts` (Milestone 9) — no
 * cron/job-queue library is installed in this codebase. Every enabled `ReportSchedule` whose
 * `nextRunAt` has passed is executed through `ReportExportService.createScheduledExport`, the
 * exact same generation engine an interactive export uses, then its `nextRunAt` is rolled forward
 * by its own frequency. One schedule failing doesn't block the others — each run is individually
 * try/caught, matching `event-bus.ts`'s per-handler isolation. */
export function startReportScheduleJob() {
  setInterval(() => {
    void runDueSchedules().catch((error: unknown) => {
      console.error("[kaizen-api] Report schedule job failed:", error);
    });
  }, CHECK_INTERVAL_MS);
}

/** Exported (not just called from the interval above) so verification can trigger exactly one
 * pass synchronously instead of waiting on the real 60s interval. */
export async function runDueSchedules() {
  const due = await reportScheduleService.listDue(new Date());

  for (const schedule of due) {
    try {
      const requester = { id: schedule.user.id, role: schedule.user.role, departmentId: schedule.user.departmentId };
      // `schedule.filters` round-tripped through JSON storage — re-parse through the same Zod
      // schema the Report Builder uses so `dateFrom`/`dateTo` come back as real `Date` objects
      // (`z.coerce.date()`), not the raw ISO strings JSON storage leaves them as.
      const filters = generateReportSchema.parse({ ...(schedule.filters as Record<string, unknown>), reportType: schedule.reportType });

      await reportExportService.createScheduledExport(
        requester,
        { ...filters, format: schedule.format },
        schedule.id,
        schedule.recipientIds,
      );
    } catch (error) {
      console.error(`[kaizen-api] Scheduled report ${schedule.id} failed:`, error);
    } finally {
      await reportScheduleService.markRun(schedule.id, new Date(), computeNextRun(schedule.frequency));
    }
  }
}
