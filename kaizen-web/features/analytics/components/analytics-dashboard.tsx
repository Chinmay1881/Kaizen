"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DepartmentAnalyticsView } from "@/features/analytics/components/department/department-analytics-view";
import { ExecutiveDashboard } from "@/features/analytics/components/executive/executive-dashboard";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { cn } from "@/lib/utils";

type Tab = "executive" | "departments";

/** Company-wide `GET /analytics/overview` is HR/CMD/Super Admin only (per the API spec) — a
 * Department Manager only ever sees the "By Department" tab (auto-scoped to their own department
 * by the backend), never the Executive Overview tab, even though both roles land on the same
 * `/dashboard/analytics` page per Part 1's own page listing. */
export function AnalyticsDashboard() {
  const { data: currentUser } = useCurrentUser();
  const canSeeExecutiveOverview = currentUser
    ? (["HR", "CMD", "SUPER_ADMIN"] as const).includes(currentUser.role as never)
    : false;
  const [tab, setTab] = useState<Tab>(canSeeExecutiveOverview ? "executive" : "departments");

  return (
    <div className="flex flex-col gap-6">
      {canSeeExecutiveOverview ? (
        <div className="flex gap-2">
          <Button
            variant={tab === "executive" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("executive")}
            className={cn(tab !== "executive" && "text-muted-foreground")}
          >
            Executive Overview
          </Button>
          <Button
            variant={tab === "departments" ? "default" : "outline"}
            size="sm"
            onClick={() => setTab("departments")}
            className={cn(tab !== "departments" && "text-muted-foreground")}
          >
            By Department
          </Button>
        </div>
      ) : null}

      {tab === "executive" && canSeeExecutiveOverview ? <ExecutiveDashboard /> : <DepartmentAnalyticsView />}
    </div>
  );
}
