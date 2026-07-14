"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import type { Variants } from "framer-motion";

import { StudioAreaChart, StudioBarChart } from "@/features/analytics/components/studio/studio-charts";
import type { AnalyticsOverview, DepartmentAnalyticsItem } from "@/features/analytics/types/analytics";
import { DURATION, EASE, overlayVariants } from "@/lib/motion";
import { useMounted } from "@/hooks/use-mounted";
import { formatCurrency, formatNumber } from "@/utils/format";

export type DrillDownTarget = { type: "kpi"; label: string } | { type: "department"; id: string; label: string } | { type: "employee"; id: string; label: string } | null;

interface DrillDownDrawerProps {
  target: DrillDownTarget;
  onClose: () => void;
  overview: AnalyticsOverview | undefined;
  departments: DepartmentAnalyticsItem[];
}

/** Slide-in-from-the-right — reuses the shared `DURATION`/`EASE` vocabulary (M12) rather than
 * inventing new numbers, matching every other dialog/drawer's motion in this app. */
const drawerVariants: Variants = {
  hidden: { x: "100%" },
  visible: { x: 0, transition: { duration: DURATION.moderate, ease: EASE.out } },
  exit: { x: "100%", transition: { duration: DURATION.fast, ease: EASE.out } },
};

/**
 * Section 7 — click any KPI/department/employee, see a detailed breakdown without navigating
 * away. A side panel rather than the shared centered `Dialog` primitive (Review/Implementation
 * still use that unmodified) — this needs full-height slide-in-from-the-edge positioning that
 * primitive doesn't offer, so it's its own small drawer built the same way (portal +
 * AnimatePresence) rather than hacking the shared one's fixed centered layout.
 */
export function DrillDownDrawer({ target, onClose, overview, departments }: DrillDownDrawerProps) {
  const mounted = useMounted();

  useEffect(() => {
    if (!target) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [target, onClose]);

  if (!mounted) return null;

  const department = target?.type === "department" ? departments.find((dept) => dept.departmentId === target.id) : undefined;
  const employee = target?.type === "employee" ? (overview?.topEmployees.find((entry) => entry.id === target.id) ?? null) : undefined;

  return createPortal(
    <AnimatePresence>
      {target ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div initial="hidden" animate="visible" exit="hidden" variants={overlayVariants} className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={drawerVariants}
            role="dialog"
            aria-modal="true"
            aria-label={target.label}
            className="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto border-l bg-card shadow-[var(--shadow-xl)]"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-5 py-4">
              <h2 className="text-base font-semibold">{target.label}</h2>
              <button type="button" onClick={onClose} aria-label="Close" className="text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md p-1.5 transition-colors duration-150">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-5 p-5">
              {target.type === "kpi" ? (
                <>
                  <p className="text-muted-foreground text-sm">Company-wide trend behind this metric.</p>
                  <StudioAreaChart title="Submission Trend" data={overview?.charts.monthlyKaizens ?? []} height={220} />
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-semibold">By Department</p>
                    {[...departments]
                      .sort((a, b) => b.approvalRate - a.approvalRate)
                      .map((dept) => (
                        <div key={dept.departmentId} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                          <span className="truncate">{dept.departmentName}</span>
                          <span className="text-muted-foreground">{dept.approvalRate}% approval</span>
                        </div>
                      ))}
                  </div>
                </>
              ) : null}

              {target.type === "department" && department ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground text-xs">Approval Rate</p>
                      <p className="text-lg font-semibold">{department.approvalRate}%</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground text-xs">Actual Savings</p>
                      <p className="text-lg font-semibold">{formatCurrency(department.actualSavings)}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground text-xs">Pending Reviews</p>
                      <p className="text-lg font-semibold">{formatNumber(department.pendingReviews)}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-muted-foreground text-xs">Pending Implementations</p>
                      <p className="text-lg font-semibold">{formatNumber(department.pendingImplementations)}</p>
                    </div>
                  </div>
                  <StudioBarChart title="Monthly Submissions" data={department.monthlyTrend} height={220} />
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-semibold">Top Contributors</p>
                    {department.topEmployees.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No data yet.</p>
                    ) : (
                      department.topEmployees.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
                          <span className="truncate">{entry.name}</span>
                          <span className="text-muted-foreground">{formatNumber(entry.value)} pts</span>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : null}

              {target.type === "employee" ? (
                <>
                  {employee ? (
                    <div className="rounded-lg border p-4">
                      <p className="text-muted-foreground text-xs">Rank #{employee.rank}</p>
                      <p className="text-2xl font-semibold">{formatNumber(employee.value)} pts</p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Full ranking detail isn&apos;t in this quick view.</p>
                  )}
                  <p className="text-muted-foreground text-sm">Personal analytics (approval rate, score trend, achievements) are only available to that employee themselves and are not exposed to other viewers.</p>
                  <a href="/leaderboard" className="text-primary text-sm font-medium hover:underline">
                    View full leaderboard →
                  </a>
                </>
              ) : null}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
