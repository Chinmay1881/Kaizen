import type { ChartPoint } from "@/features/analytics/types/analytics";

/**
 * No streak field exists in the API — this app doesn't track daily activity at all, only
 * monthly aggregates (`EmployeeAnalytics.monthlyActivity`). "Current Streak" here is a disclosed
 * derivation: consecutive most-recent months (including the current one) with at least one
 * submission, counted backward from the last data point. It's a real, computed signal from real
 * data, just coarser-grained (monthly, not daily) than the word "streak" might usually imply.
 */
export function getMonthlyStreak(monthlyActivity: ChartPoint[]): number {
  let streak = 0;
  for (let i = monthlyActivity.length - 1; i >= 0; i--) {
    if (monthlyActivity[i].value > 0) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}
