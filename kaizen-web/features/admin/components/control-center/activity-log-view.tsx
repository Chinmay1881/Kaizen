"use client";

import { useMemo, useState } from "react";
import { Building2, History, Search, Settings as SettingsIcon, UserPlus } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Input } from "@/components/ui/input";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { useAdminDepartments } from "@/features/admin/hooks/use-admin-departments";
import { useAdminSettings } from "@/features/admin/hooks/use-admin-settings";
import { useAdminUsers } from "@/features/admin/hooks/use-admin-users";
import { buildActivityFeed, type AdminActivityEvent, type AdminActivityType } from "@/features/admin/utils/activity-feed";
import { useDayBoundaries } from "@/hooks/use-day-boundaries";
import { TONE_DOT_CLASS } from "@/lib/tone-classes";
import { cn } from "@/lib/utils";
import { dayGroupLabel, formatDate, formatRelativeTime } from "@/utils/format";

const TYPE_META: Record<AdminActivityType, { label: string; icon: typeof UserPlus }> = {
  user_joined: { label: "Users", icon: UserPlus },
  department_updated: { label: "Departments", icon: Building2 },
  setting_changed: { label: "Settings", icon: SettingsIcon },
};

/**
 * There is no audit-log read endpoint anywhere in `kaizen-api` — `auditService.record()` is
 * write-only, called internally by other services, with the routes file itself noting audit-log
 * read endpoints were left for a future module. This page is deliberately titled "Activity Log,"
 * not "Audit Log" — it composes real, disclosed events from three existing endpoints (new user
 * accounts, department edits, platform setting changes) rather than presenting itself as the
 * complete, immutable trail the brief's "Audit Log" section implies. See `activity-feed.ts`.
 */
export function ActivityLogView() {
  const usersQuery = useAdminUsers({ page: 1, pageSize: 100 });
  const departmentsQuery = useAdminDepartments();
  const settingsQuery = useAdminSettings();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AdminActivityType | "">("");

  const isError = usersQuery.isError || departmentsQuery.isError || settingsQuery.isError;
  const isLoading = usersQuery.isLoading || departmentsQuery.isLoading || settingsQuery.isLoading;

  const events = useMemo(() => {
    if (!usersQuery.data || !departmentsQuery.data || !settingsQuery.data) return [];
    return buildActivityFeed(usersQuery.data.items, departmentsQuery.data, settingsQuery.data);
  }, [usersQuery.data, departmentsQuery.data, settingsQuery.data]);

  const filtered = events.filter((event) => {
    if (typeFilter && event.type !== typeFilter) return false;
    if (!search.trim()) return true;
    return event.title.toLowerCase().includes(search.trim().toLowerCase());
  });

  const { today, yesterday } = useDayBoundaries();

  const rows = filtered.map((event: AdminActivityEvent, index) => {
    const group = dayGroupLabel(new Date(event.timestamp), today, yesterday, { includeYear: true });
    const previousGroup = index > 0 ? dayGroupLabel(new Date(filtered[index - 1].timestamp), today, yesterday, { includeYear: true }) : null;
    return { event, group, showGroup: group !== previousGroup };
  });

  if (isError) {
    return <ErrorState title="Couldn't load activity" description="One or more sources failed to load." onRetry={() => { usersQuery.refetch(); departmentsQuery.refetch(); settingsQuery.refetch(); }} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground text-sm">
            New accounts, department edits, and platform setting changes — the real, timestamped events this app can report. Not a complete audit trail; the backend has no audit-log
            read endpoint yet.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as AdminActivityType | "")}
            className="border-input bg-background h-9 rounded-md border px-2 text-sm"
            aria-label="Filter by type"
          >
            <option value="">All types</option>
            {(Object.keys(TYPE_META) as AdminActivityType[]).map((type) => (
              <option key={type} value={type}>
                {TYPE_META[type].label}
              </option>
            ))}
          </select>
          <div className="relative">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search activity…" className="h-9 w-56 pl-8" aria-label="Search activity" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[...Array(6)].map((_, index) => (
            <LoadingSkeleton key={index} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={History} title="No activity" description="Nothing matches your filters." />
      ) : (
        <ol className="flex flex-col gap-1">
          {rows.map(({ event, group, showGroup }) => {
            const Icon = TYPE_META[event.type].icon;
            return (
              <li key={event.id}>
                {showGroup ? <p className="text-muted-foreground mt-4 mb-1 text-xs font-semibold tracking-wide uppercase first:mt-0">{group}</p> : null}
                <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
                  <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", TONE_DOT_CLASS[event.tone])}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">{event.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {event.actor ? `${event.actor} · ` : ""}
                      {formatRelativeTime(event.timestamp)} ({formatDate(event.timestamp)})
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
