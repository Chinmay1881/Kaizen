"use client";

import { motion } from "framer-motion";
import { Trophy } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/feedback/empty-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { SectionHeading } from "@/components/dashboard/section-heading";
import type { CurrentUser } from "@/features/auth/types/user";
import { useDepartmentAnalytics, useEmployeesAnalytics } from "@/features/analytics/hooks/use-analytics";
import type { LeaderboardPreviewEntry } from "@/features/analytics/types/analytics";
import { fadeInUpVariants } from "@/lib/motion";
import { formatNumber, getInitialsFromName } from "@/utils/format";

const RANK_TONE: Record<number, string> = {
  1: "bg-achievement/20 text-achievement-foreground",
  2: "bg-muted-foreground/15 text-foreground",
  3: "bg-rewards/15 text-rewards",
};

interface EmployeeIntelligenceSectionProps {
  user: CurrentUser;
  search: string;
  onDrillDown: (employeeId: string, employeeName: string) => void;
}

/**
 * Section 4 — top performers ranked by points (the same real field the Leaderboard page ranks
 * by). "Leaderboard evolution" isn't backed by any historical snapshot data (the leaderboard is
 * a live computation, not a time series), so rather than fabricate movement, ranks simply
 * animate into view in order — an honest "alive" motion instead of an invented trend, the same
 * choice the Dashboard's Leaderboard Spotlight made in Milestone 12.
 */
export function EmployeeIntelligenceSection({ user, search, onDrillDown }: EmployeeIntelligenceSectionProps) {
  const isCompanyWide = ["HR", "CMD", "SUPER_ADMIN"].includes(user.role);
  const employeesQuery = useEmployeesAnalytics(isCompanyWide);
  const departmentQuery = useDepartmentAnalytics(user.department?.id, !isCompanyWide);

  const source: LeaderboardPreviewEntry[] = isCompanyWide ? (employeesQuery.data ?? []) : (departmentQuery.data?.[0]?.topEmployees ?? []);
  const isLoading = isCompanyWide ? employeesQuery.isLoading : departmentQuery.isLoading;
  const entries = source.filter((entry) => entry.name.toLowerCase().includes(search.trim().toLowerCase())).slice(0, 12);

  return (
    <div className="flex flex-col gap-4">
      <SectionHeading title="Employee Intelligence" description={isCompanyWide ? "Top contributors company-wide, by points" : "Top contributors in your department"} action={{ label: "Full Leaderboard", href: "/leaderboard" }} />
      {isLoading ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, index) => (
            <LoadingSkeleton key={index} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <EmptyState icon={Trophy} title="No matches" description="No one matches your search yet." />
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry, index) => (
            <motion.button
              key={entry.id}
              type="button"
              onClick={() => onDrillDown(entry.id, entry.name)}
              initial="hidden"
              animate="visible"
              variants={fadeInUpVariants}
              transition={{ delay: Math.min(index, 10) * 0.03 }}
              className="interactive-lift flex items-center gap-3 rounded-xl border bg-card p-3 text-left"
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${RANK_TONE[entry.rank] ?? "bg-muted text-muted-foreground"}`}>{entry.rank}</span>
              <Avatar alt={entry.name} fallback={getInitialsFromName(entry.name)} className="h-9 w-9 text-xs" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{entry.name}</p>
              </div>
              <span data-metric className="text-sm font-semibold whitespace-nowrap">
                {formatNumber(entry.value)} pts
              </span>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
