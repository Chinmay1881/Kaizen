"use client";

import { useState } from "react";

import { ErrorState } from "@/components/feedback/error-state";
import { FadeIn } from "@/components/feedback/fade-in";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useAnalyticsOverview, useDepartmentAnalytics } from "@/features/analytics/hooks/use-analytics";
import { AnalyticsStudioSkeleton } from "@/features/analytics/components/studio/analytics-studio-skeleton";
import { BusinessImpactSection } from "@/features/analytics/components/studio/business-impact-section";
import { CompanyHealthSection } from "@/features/analytics/components/studio/company-health-section";
import { DepartmentIntelligenceSection } from "@/features/analytics/components/studio/department-intelligence-section";
import { getPreviousPeriod } from "@/features/analytics/utils/compare-period";
import { DrillDownDrawer, type DrillDownTarget } from "@/features/analytics/components/studio/drill-down-drawer";
import { EmployeeIntelligenceSection } from "@/features/analytics/components/studio/employee-intelligence-section";
import { ExecutiveKpisSection } from "@/features/analytics/components/studio/executive-kpis-section";
import { InsightFeed } from "@/features/analytics/components/studio/insight-feed";
import { OperationalIntelligenceSection } from "@/features/analytics/components/studio/operational-intelligence-section";
import { StudioFilterBar, type AnalyticsFilterValues } from "@/features/analytics/components/studio/studio-filter-bar";
import { buildInsights } from "@/features/analytics/utils/insights-engine";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { canReview, canViewCompanyAnalytics } from "@/lib/permissions";

const DEFAULT_FILTERS = { dateFrom: "", dateTo: "", departmentId: "", compare: "", search: "" };

/**
 * Milestone 16 — Analytics Studio. Every section fetches only real, already-existing endpoints
 * (`/analytics/overview`, `/analytics/departments`, `/analytics/employees`) — no backend/API
 * changes. Role gating matches the deleted `AnalyticsGuard` exactly (Department Manager and
 * above); a Department Manager sees every section scoped to their own department instead of the
 * company-wide company sections (Department/Employee Intelligence are company-wide-only, same as
 * the old page's "Executive Overview vs. By Department" split).
 */
export function AnalyticsStudioView() {
  const { data: user, isLoading: userLoading } = useCurrentUser();
  const { filters, setFilters, replaceAll } = useUrlFilters(DEFAULT_FILTERS);
  const [drillDown, setDrillDown] = useState<DrillDownTarget>(null);

  const isCompanyWide = user ? canViewCompanyAnalytics(user.role) : false;
  const canCompare = filters.compare === "1" && Boolean(filters.dateFrom && filters.dateTo);
  const previousRange = canCompare ? getPreviousPeriod(filters.dateFrom, filters.dateTo) : null;

  const overviewQuery = useAnalyticsOverview({ dateFrom: filters.dateFrom || undefined, dateTo: filters.dateTo || undefined }, isCompanyWide);
  const previousOverviewQuery = useAnalyticsOverview(previousRange ?? {}, isCompanyWide && canCompare);
  const allDepartmentsQuery = useDepartmentAnalytics(undefined, isCompanyWide);

  function updateFilter<K extends keyof AnalyticsFilterValues>(key: K, value: string) {
    setFilters({ [key]: value } as Partial<AnalyticsFilterValues>);
  }

  if (userLoading || !user) {
    return <AnalyticsStudioSkeleton />;
  }

  if (!canReview(user.role)) {
    return <ErrorState title="Access restricted" description="Analytics are only available to Department Managers and above." />;
  }

  const insights = isCompanyWide ? buildInsights(overviewQuery.data, canCompare ? previousOverviewQuery.data : undefined, allDepartmentsQuery.data ?? []) : [];

  return (
    <div className="flex flex-col gap-8">
      <StudioFilterBar values={filters} onChange={updateFilter} onApplyAll={(next) => replaceAll(next)} showDepartmentFilter={isCompanyWide} userId={user.id} />

      <FadeIn>
        <ExecutiveKpisSection user={user} dateFrom={filters.dateFrom} dateTo={filters.dateTo} compare={canCompare} onDrillDown={(label) => setDrillDown({ type: "kpi", label })} />
      </FadeIn>

      <FadeIn delay={0.05}>
        <CompanyHealthSection user={user} dateFrom={filters.dateFrom} dateTo={filters.dateTo} />
      </FadeIn>

      <FadeIn delay={0.1}>
        <DepartmentIntelligenceSection user={user} search={filters.search} onDrillDown={(id, label) => setDrillDown({ type: "department", id, label })} />
      </FadeIn>

      <FadeIn delay={0.15}>
        <EmployeeIntelligenceSection user={user} search={filters.search} onDrillDown={(id, label) => setDrillDown({ type: "employee", id, label })} />
      </FadeIn>

      <FadeIn delay={0.2}>
        <OperationalIntelligenceSection user={user} />
      </FadeIn>

      <FadeIn delay={0.25}>
        <BusinessImpactSection user={user} dateFrom={filters.dateFrom} dateTo={filters.dateTo} />
      </FadeIn>

      {isCompanyWide ? (
        <FadeIn delay={0.3}>
          <InsightFeed insights={insights} />
        </FadeIn>
      ) : null}

      <DrillDownDrawer target={drillDown} onClose={() => setDrillDown(null)} overview={overviewQuery.data} departments={allDepartmentsQuery.data ?? []} />
    </div>
  );
}
