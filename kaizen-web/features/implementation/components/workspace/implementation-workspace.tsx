"use client";

import { useEffect, useRef, useState } from "react";
import { LayoutList } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useKaizenDetail } from "@/features/kaizen/hooks/use-kaizen-detail";
import { ImplementationControlCenter } from "@/features/implementation/components/workspace/implementation-control-center";
import { ImplementationDocument, type ImplementationDocumentHandle } from "@/features/implementation/components/workspace/implementation-document";
import { ImplementationInbox } from "@/features/implementation/components/workspace/implementation-inbox";
import type { ImplementationInboxFilterValues } from "@/features/implementation/components/workspace/implementation-inbox-filters";
import { useImplementation } from "@/features/implementation/hooks/use-implementation";
import { useImplementationList } from "@/features/implementation/hooks/use-implementation-list";
import type { SavedViewFilters } from "@/features/saved-views/types/saved-view";
import { ApiError } from "@/lib/api-client";
import type { VerificationStatus } from "@/features/implementation/types/implementation";

const PAGE_SIZE = 20;
const COMPANY_WIDE_ROLES = ["HR", "CMD", "SUPER_ADMIN"];

const DEFAULT_FILTERS = {
  status: "",
  departmentId: "",
  kaizenStatus: "",
  ownerId: "",
  dateFrom: "",
  dateTo: "",
  page: "1",
};

interface ImplementationWorkspaceProps {
  initialId?: string;
}

/**
 * The three-panel Implementation Workspace root — same shallow-URL-sync approach as the Review
 * Workspace (Milestone 13): selection is client state, the URL is kept in sync via
 * `window.history.replaceState` directly rather than Next's router, so selecting a row never
 * re-triggers the dashboard layout's `PageTransition` fade.
 */
export function ImplementationWorkspace({ initialId }: ImplementationWorkspaceProps) {
  const { data: currentUser } = useCurrentUser();
  const showDepartmentFilter = Boolean(currentUser && COMPANY_WIDE_ROLES.includes(currentUser.role));

  const { filters, setFilters, replaceAll } = useUrlFilters(DEFAULT_FILTERS);
  const page = Number(filters.page) || 1;
  const effectiveDepartmentId = showDepartmentFilter ? filters.departmentId : currentUser?.department?.id ?? "";

  const query = useImplementationList({
    page,
    pageSize: PAGE_SIZE,
    status: (filters.status as VerificationStatus) || undefined,
    departmentId: filters.departmentId || undefined,
    ownerId: filters.ownerId || undefined,
    kaizenStatus: (filters.kaizenStatus as never) || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  });

  const items = query.data?.items ?? [];
  const [explicitId, setExplicitId] = useState<string | null>(initialId ?? null);
  const selectedId = explicitId ?? items[0]?.kaizenId ?? null;

  const kaizenDetailQuery = useKaizenDetail(selectedId ?? "");
  const implementationQuery = useImplementation(selectedId ?? "");

  const documentRef = useRef<ImplementationDocumentHandle>(null);

  useEffect(() => {
    if (!selectedId) return;
    const nextPath = `/implementation/${selectedId}`;
    if (window.location.pathname !== nextPath) {
      window.history.replaceState(null, "", nextPath);
    }
  }, [selectedId]);

  function updateFilter<K extends keyof ImplementationInboxFilterValues>(key: K, value: string) {
    setFilters({ [key]: value } as Partial<typeof DEFAULT_FILTERS>);
  }

  const activeFilters: SavedViewFilters = Object.fromEntries(
    Object.entries(filters).filter(([key, value]) => key !== "page" && value !== "" && value !== DEFAULT_FILTERS[key as keyof typeof DEFAULT_FILTERS]),
  );

  if (query.isError && query.error instanceof ApiError && query.error.code === "FORBIDDEN") {
    return <ErrorState title="Access restricted" description="The Implementation Workspace is only available to department managers and above." />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Implementation Workspace</h1>
        <p className="text-muted-foreground text-sm">Approved Kaizens in progress, awaiting completion, or awaiting verification.</p>
      </div>

      <div className="flex h-[calc(100vh-11rem)] flex-col overflow-hidden rounded-xl border lg:grid lg:grid-cols-[300px_1fr] xl:grid-cols-[300px_1fr_360px]">
        <aside className="flex h-64 flex-col overflow-hidden border-b lg:h-full lg:border-b-0 lg:border-r">
          <ImplementationInbox
            values={filters}
            onChange={updateFilter}
            onApplySavedView={(saved) => replaceAll(saved as Partial<typeof DEFAULT_FILTERS>)}
            showDepartmentFilter={showDepartmentFilter}
            effectiveDepartmentId={effectiveDepartmentId}
            activeFilters={activeFilters}
            items={items}
            meta={query.data?.meta}
            isLoading={query.isLoading}
            isError={query.isError}
            error={query.error}
            onRetry={() => query.refetch()}
            onPageChange={(nextPage) => setFilters({ page: String(nextPage) } as Partial<typeof DEFAULT_FILTERS>)}
            selectedId={selectedId}
            onSelect={setExplicitId}
          />
        </aside>

        <main className="flex-1 overflow-y-auto">
          {!selectedId ? (
            <EmptyState icon={LayoutList} title="Nothing selected" description="Pick an implementation from the queue to see its full project view." className="border-none py-20" />
          ) : kaizenDetailQuery.isLoading || implementationQuery.isLoading || !kaizenDetailQuery.data || !implementationQuery.data ? (
            <div className="mx-auto flex max-w-3xl flex-col gap-4 px-8 py-8">
              <LoadingSkeleton className="h-40 w-full rounded-2xl" />
              <LoadingSkeleton className="h-24 w-full" />
              <LoadingSkeleton className="h-24 w-full" />
            </div>
          ) : (
            <>
              <ImplementationDocument ref={documentRef} kaizen={kaizenDetailQuery.data} implementation={implementationQuery.data} currentUser={currentUser} />
              <div className="border-t p-4 xl:hidden">
                {currentUser ? (
                  <ImplementationControlCenter
                    kaizen={kaizenDetailQuery.data}
                    implementation={implementationQuery.data}
                    currentUser={currentUser}
                    onFocusComment={() => documentRef.current?.focusComposer()}
                  />
                ) : null}
              </div>
            </>
          )}
        </main>

        {selectedId && kaizenDetailQuery.data && implementationQuery.data && currentUser ? (
          <aside className="hidden overflow-hidden border-l xl:flex xl:flex-col">
            <ImplementationControlCenter
              kaizen={kaizenDetailQuery.data}
              implementation={implementationQuery.data}
              currentUser={currentUser}
              onFocusComment={() => documentRef.current?.focusComposer()}
            />
          </aside>
        ) : (
          <aside className="hidden xl:flex" />
        )}
      </div>
    </div>
  );
}
