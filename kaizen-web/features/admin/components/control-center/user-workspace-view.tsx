"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Users as UsersIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { BulkToolbar } from "@/features/admin/components/control-center/bulk-toolbar";
import { UserActionsPanel } from "@/features/admin/components/control-center/user-actions-panel";
import { UserFormDialog } from "@/features/admin/components/control-center/user-form-dialog";
import { UserListPanel, type UserFilterValues } from "@/features/admin/components/control-center/user-list-panel";
import { UserProfilePanel } from "@/features/admin/components/control-center/user-profile-panel";
import { useAdminDepartments } from "@/features/admin/hooks/use-admin-departments";
import { useAdminUser, useAdminUsers } from "@/features/admin/hooks/use-admin-users";
import type { AdminUser } from "@/features/admin/types/admin";
import type { SavedViewFilters } from "@/features/saved-views/types/saved-view";

const PAGE_SIZE = 20;

const DEFAULT_FILTERS: UserFilterValues = {
  search: "",
  role: "",
  departmentId: "",
  isActive: "",
  page: "1",
};

/**
 * Three-panel User Management Workspace. Selection is client state kept in sync with a `?u=`
 * query param via `window.history.replaceState` (not `router.push`) — same reasoning as the
 * Review Workspace: a route change would re-trigger the dashboard layout's `PageTransition` on
 * every row click.
 */
export function UserWorkspaceView() {
  const searchParams = useSearchParams();
  const { filters, setFilters, replaceAll } = useUrlFilters(DEFAULT_FILTERS);
  const debouncedSearch = useDebounce(filters.search, 400);
  const page = Number(filters.page) || 1;

  const [explicitId, setExplicitId] = useState<string | null>(() => searchParams.get("u"));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);

  const departmentsQuery = useAdminDepartments();
  const query = useAdminUsers({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    role: (filters.role as AdminUser["role"]) || undefined,
    departmentId: filters.departmentId || undefined,
    isActive: filters.isActive === "" ? undefined : filters.isActive === "true",
  });

  const items = useMemo(() => query.data?.items ?? [], [query.data]);
  const selectedId = explicitId ?? items[0]?.id ?? null;
  const selectedDetail = useAdminUser(selectedId);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (selectedId) params.set("u", selectedId);
    else params.delete("u");
    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [selectedId]);

  function updateFilter<K extends keyof UserFilterValues>(key: K, value: string) {
    setFilters({ [key]: value, page: key === "page" ? value : "1" } as Partial<UserFilterValues>);
  }

  function toggleSelect(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const activeFilters: SavedViewFilters = Object.fromEntries(
    Object.entries(filters).filter(([key, value]) => key !== "page" && value !== "" && value !== DEFAULT_FILTERS[key as keyof UserFilterValues]),
  );

  const selectedUsers = items.filter((user) => selectedIds.has(user.id));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">User Management</h1>
          <p className="text-muted-foreground text-sm">Search, review, and act on any account in one place.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      <div className="flex h-[calc(100vh-11rem)] flex-col overflow-hidden rounded-xl border lg:grid lg:grid-cols-[300px_1fr] xl:grid-cols-[300px_1fr_280px]">
        <aside className="flex h-64 flex-col overflow-hidden border-b lg:h-full lg:border-b-0 lg:border-r">
          <UserListPanel
            values={filters}
            onChange={updateFilter}
            onApplySavedView={(saved) => replaceAll(saved as Partial<UserFilterValues>)}
            activeFilters={activeFilters}
            departments={departmentsQuery.data ?? []}
            items={items}
            meta={query.data?.meta}
            isLoading={query.isLoading}
            isError={query.isError}
            error={query.error}
            onRetry={() => query.refetch()}
            onPageChange={(nextPage) => setFilters({ page: String(nextPage) } as Partial<UserFilterValues>)}
            selectedId={selectedId}
            onSelect={setExplicitId}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
          />
        </aside>

        <main className="flex-1 overflow-y-auto">
          {!selectedId ? (
            <EmptyState icon={UsersIcon} title="Nothing selected" description="Pick a user from the list to view their profile." className="border-none py-20" />
          ) : selectedDetail.isLoading || !selectedDetail.data ? (
            <div className="flex flex-col gap-4 p-6">
              <LoadingSkeleton className="h-16 w-2/3" />
              <LoadingSkeleton className="h-24 w-full" />
              <LoadingSkeleton className="h-24 w-full" />
            </div>
          ) : (
            <>
              <UserProfilePanel user={selectedDetail.data} />
              <div className="border-t p-4 xl:hidden">
                <UserActionsPanel user={selectedDetail.data} />
              </div>
            </>
          )}
        </main>

        {selectedId && selectedDetail.data ? (
          <aside className="hidden overflow-hidden border-l xl:flex xl:flex-col">
            <UserActionsPanel user={selectedDetail.data} />
          </aside>
        ) : (
          <aside className="hidden xl:flex" />
        )}
      </div>

      <BulkToolbar selectedUsers={selectedUsers} departments={departmentsQuery.data ?? []} onClearSelection={() => setSelectedIds(new Set())} />
      <UserFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
