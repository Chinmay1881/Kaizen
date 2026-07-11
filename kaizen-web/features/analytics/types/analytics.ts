export interface StatusCounts {
  total: number;
  draft: number;
  submitted: number;
  underReview: number;
  approved: number;
  rejected: number;
  needsChanges: number;
  implementationPending: number;
  implementationComplete: number;
  businessImpactRecorded: number;
  rewardsIssued: number;
  archived: number;
  publishedToKnowledgeBase: number;
}

export interface PerformanceMetrics {
  approvalRate: number;
  rejectionRate: number;
  avgReviewTimeHours: number | null;
  avgImplementationTimeDays: number | null;
  avgScore: number | null;
  avgBusinessImpact: number | null;
}

export interface BusinessMetrics {
  kaizensWithEstimatedSavings: number;
  actualSavings: number;
  totalRewardPoints: number;
  employeeParticipationPercent: number;
  activeEmployees: number;
  departmentParticipationPercent: number;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface AnalyticsCharts {
  monthlyKaizens: ChartPoint[];
  departmentSubmissions: ChartPoint[];
  statusDistribution: ChartPoint[];
  savingsTrend: ChartPoint[];
}

export interface LeaderboardPreviewEntry {
  rank: number;
  id: string;
  name: string;
  value: number;
}

export interface AnalyticsOverview {
  statusCounts: StatusCounts;
  performance: PerformanceMetrics;
  business: BusinessMetrics;
  charts: AnalyticsCharts;
  topEmployees: LeaderboardPreviewEntry[];
  topDepartments: LeaderboardPreviewEntry[];
}

export interface DepartmentAnalyticsItem {
  departmentId: string;
  departmentName: string;
  statusCounts: StatusCounts;
  approvalRate: number;
  avgScore: number | null;
  avgImplementationTimeDays: number | null;
  pendingReviews: number;
  pendingImplementations: number;
  kaizensWithEstimatedSavings: number;
  actualSavings: number;
  topEmployees: LeaderboardPreviewEntry[];
  lowestParticipation: LeaderboardPreviewEntry[];
  monthlyTrend: ChartPoint[];
}

export interface EmployeeAnalytics {
  userId: string;
  displayName: string;
  ideasSubmitted: number;
  ideasApproved: number;
  ideasRejected: number;
  approvalRate: number;
  avgScore: number | null;
  points: number;
  achievementsCount: number;
  rewardsTotal: number;
  kaizensWithEstimatedSavings: number;
  actualBusinessImpact: number;
  monthlyActivity: ChartPoint[];
  scoreTrend: ChartPoint[];
  pointsTrend: ChartPoint[];
}

export interface AnalyticsDateRange {
  dateFrom?: string;
  dateTo?: string;
}
