import type { ReportType } from "@/features/reports/types/report";

export const REPORT_TYPE_OPTIONS: { value: ReportType; label: string }[] = [
  { value: "EXECUTIVE_SUMMARY", label: "Executive Summary" },
  { value: "MONTHLY", label: "Monthly Report" },
  { value: "DEPARTMENT", label: "Department Report" },
  { value: "EMPLOYEE_PERFORMANCE", label: "Employee Performance Report" },
  { value: "KAIZEN_PERFORMANCE", label: "Kaizen Performance Report" },
  { value: "REVIEW_PERFORMANCE", label: "Review Performance Report" },
  { value: "IMPLEMENTATION", label: "Implementation Report" },
  { value: "BUSINESS_IMPACT", label: "Business Impact Report" },
  { value: "REWARD", label: "Reward Report" },
  { value: "LEADERBOARD", label: "Leaderboard Report" },
];

export const REPORT_TYPE_LABEL: Record<ReportType, string> = Object.fromEntries(
  REPORT_TYPE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<ReportType, string>;
