"use client";

import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  ClipboardList,
  HardHat,
  Plus,
  Settings as SettingsIcon,
  ShieldCheck,
  Tag,
  Users,
} from "lucide-react";

import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { ROUTES } from "@/constants/routes";
import { AnimatedMetricCard } from "@/features/admin/components/control-center/animated-metric-card";
import { useAdminCategories } from "@/features/admin/hooks/use-admin-categories";
import { useAdminDepartments } from "@/features/admin/hooks/use-admin-departments";
import { useAdminSettings } from "@/features/admin/hooks/use-admin-settings";
import { useAdminUsers } from "@/features/admin/hooks/use-admin-users";
import { buildActivityFeed } from "@/features/admin/utils/activity-feed";
import { useDepartmentAnalytics } from "@/features/analytics/hooks/use-analytics";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/utils/format";

const QUICK_ACTIONS = [
  { label: "Add User", description: "Create an account and assign a role.", href: ROUTES.ADMIN_USERS, icon: Users },
  { label: "Add Department", description: "Set up a new department.", href: ROUTES.ADMIN_DEPARTMENTS, icon: Building2 },
  { label: "Add Category", description: "New Kaizen submission category.", href: ROUTES.ADMIN_CATEGORIES, icon: Tag },
  { label: "Platform Settings", description: "Tune points, uploads, pagination.", href: ROUTES.ADMIN_SETTINGS, icon: SettingsIcon },
];

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/**
 * The Control Center home. "Platform Status" below is a real, client-observed reachability signal
 * — every admin query either resolved or errored — not a fabricated uptime/SLA metric; there is no
 * backend health-check endpoint to report against instead.
 */
export function AdminOverviewView() {
  const usersQuery = useAdminUsers({ page: 1, pageSize: 100 });
  const departmentsQuery = useAdminDepartments();
  const categoriesQuery = useAdminCategories();
  const settingsQuery = useAdminSettings();
  const deptAnalyticsQuery = useDepartmentAnalytics();

  const anyError = usersQuery.isError || departmentsQuery.isError || categoriesQuery.isError || settingsQuery.isError;
  if (anyError) {
    return (
      <ErrorState
        title="Couldn't load the Control Center"
        description="One or more admin data sources failed to load. Please try again."
        onRetry={() => {
          usersQuery.refetch();
          departmentsQuery.refetch();
          categoriesQuery.refetch();
          settingsQuery.refetch();
        }}
      />
    );
  }

  const isLoading = usersQuery.isLoading || departmentsQuery.isLoading || categoriesQuery.isLoading || settingsQuery.isLoading;
  if (isLoading || !usersQuery.data || !departmentsQuery.data || !categoriesQuery.data || !settingsQuery.data) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {[...Array(5)].map((_, index) => (
          <LoadingSkeleton key={index} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const totalUsers = usersQuery.data.meta.total;
  const activeDepartments = departmentsQuery.data.filter((department) => department.isActive).length;
  const activeCategories = categoriesQuery.data.filter((category) => category.isActive).length;
  const pendingReviews = sum((deptAnalyticsQuery.data ?? []).map((department) => department.pendingReviews));
  const pendingImplementations = sum((deptAnalyticsQuery.data ?? []).map((department) => department.pendingImplementations));

  const subsystems = [
    { name: "Users", ok: !usersQuery.isError },
    { name: "Departments", ok: !departmentsQuery.isError },
    { name: "Categories", ok: !categoriesQuery.isError },
    { name: "Settings", ok: !settingsQuery.isError },
    { name: "Analytics", ok: !deptAnalyticsQuery.isError },
  ];
  const allOperational = subsystems.every((subsystem) => subsystem.ok);

  const activity = buildActivityFeed(usersQuery.data.items, departmentsQuery.data, settingsQuery.data).slice(0, 8);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Platform Health</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <AnimatedMetricCard label="Total Users" target={totalUsers} icon={Users} href={ROUTES.ADMIN_USERS} />
          <AnimatedMetricCard label="Active Departments" target={activeDepartments} icon={Building2} href={ROUTES.ADMIN_DEPARTMENTS} />
          <AnimatedMetricCard label="Categories" target={activeCategories} icon={Tag} href={ROUTES.ADMIN_CATEGORIES} />
          <AnimatedMetricCard label="Pending Reviews" target={pendingReviews} icon={ClipboardList} tone="warning" href={ROUTES.REVIEW} />
          <AnimatedMetricCard label="Pending Implementations" target={pendingImplementations} icon={HardHat} tone="info" href={ROUTES.IMPLEMENTATION} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2">
              <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", allOperational ? "bg-success/15 text-success" : "bg-warning/20 text-warning-foreground")}>
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <p className="font-semibold">{allOperational ? "All Systems Operational" : "Degraded"}</p>
                <p className="text-muted-foreground text-xs">Client-observed reachability of every admin data source.</p>
              </div>
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {subsystems.map((subsystem) => (
                <li key={subsystem.name} className="flex items-center gap-1.5 text-xs">
                  <span className={cn("h-1.5 w-1.5 rounded-full", subsystem.ok ? "bg-success" : "bg-destructive")} aria-hidden="true" />
                  {subsystem.name}
                </li>
              ))}
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Quick Actions</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {QUICK_ACTIONS.map((action) => (
                <Link key={action.href} href={action.href} className="interactive-lift flex items-center gap-3 rounded-xl border bg-card p-4">
                  <span className="bg-primary/10 text-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                    <action.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{action.label}</p>
                    <p className="text-muted-foreground truncate text-xs">{action.description}</p>
                  </div>
                  <Plus className="text-muted-foreground h-4 w-4 shrink-0" />
                </Link>
              ))}
            </div>
          </section>
        </div>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">Recent Activity</h2>
            <Link href={ROUTES.ADMIN_ACTIVITY} className="text-primary text-xs font-medium hover:underline">
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border bg-card p-4">
            {activity.length === 0 ? (
              <p className="text-muted-foreground text-sm">No recent activity.</p>
            ) : (
              activity.map((event, index) => (
                <div key={event.id} className={cn("flex items-start gap-2.5 py-2", index !== activity.length - 1 && "border-b")}>
                  <CheckCircle2
                    className={cn(
                      "mt-0.5 h-3.5 w-3.5 shrink-0",
                      event.tone === "success" && "text-success",
                      event.tone === "warning" && "text-warning-foreground",
                      event.tone === "info" && "text-info",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm leading-snug">{event.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {event.actor ? `${event.actor} · ` : ""}
                      {formatRelativeTime(event.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
