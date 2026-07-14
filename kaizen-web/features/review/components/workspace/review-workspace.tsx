"use client";

import { useEffect, useRef, useState } from "react";
import { Keyboard, LayoutList } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { useKaizenDetail } from "@/features/kaizen/hooks/use-kaizen-detail";
import type { KaizenSort } from "@/features/kaizen/types/kaizen";
import type { KaizenPriority, KaizenStatus } from "@/types/enums";
import { DecisionCenter } from "@/features/review/components/workspace/decision-center";
import type { ReviewActionBarHandle } from "@/features/review/components/workspace/review-action-bar";
import { ReviewDocument, type ReviewDocumentHandle } from "@/features/review/components/workspace/review-document";
import { ReviewInbox } from "@/features/review/components/workspace/review-inbox";
import type { ReviewInboxFilterValues } from "@/features/review/components/workspace/review-inbox-filters";
import { useReviewShortcuts } from "@/features/review/hooks/use-review-shortcuts";
import { useReviewQueue } from "@/features/review/hooks/use-review-queue";
import { ShortcutsDialog } from "@/features/review/components/workspace/shortcuts-dialog";
import type { SavedViewFilters } from "@/features/saved-views/types/saved-view";
import { ApiError } from "@/lib/api-client";

const PAGE_SIZE = 20;
const COMPANY_WIDE_ROLES = ["HR", "CMD", "SUPER_ADMIN"];

const DEFAULT_FILTERS = {
  search: "",
  status: "",
  departmentId: "",
  categoryId: "",
  priority: "",
  sort: "newest",
  dateFrom: "",
  dateTo: "",
  scoreMin: "",
  scoreMax: "",
  recommendation: "",
  submitterId: "",
  assignedReviewerId: "",
  page: "1",
};

interface ReviewWorkspaceProps {
  initialId?: string;
}

/**
 * The three-panel Review Workspace root. Selection is client-side state, not a route change —
 * `router.push`/`replace` would re-trigger the dashboard layout's `PageTransition` (keyed on
 * `usePathname()`) on every single row click, fading the whole page each time. Instead the URL
 * is kept in sync with `window.history.replaceState` directly (cosmetic + shareable + survives a
 * refresh via `/review/[id]`), bypassing Next's router entirely so selecting a row never
 * triggers a page transition.
 */
export function ReviewWorkspace({ initialId }: ReviewWorkspaceProps) {
  const { data: currentUser } = useCurrentUser();
  const showDepartmentFilter = Boolean(currentUser && COMPANY_WIDE_ROLES.includes(currentUser.role));

  const { filters, setFilters, replaceAll } = useUrlFilters(DEFAULT_FILTERS);
  const debouncedSearch = useDebounce(filters.search, 400);
  const page = Number(filters.page) || 1;

  const effectiveDepartmentId = showDepartmentFilter ? filters.departmentId : currentUser?.department?.id ?? "";

  const query = useReviewQueue({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: (filters.status as KaizenStatus) || undefined,
    departmentId: filters.departmentId || undefined,
    categoryId: filters.categoryId || undefined,
    priority: (filters.priority as KaizenPriority) || undefined,
    sort: filters.sort as KaizenSort,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
    scoreMin: filters.scoreMin || undefined,
    scoreMax: filters.scoreMax || undefined,
    recommendation: filters.recommendation || undefined,
    submitterId: filters.submitterId || undefined,
    assignedReviewerId: filters.assignedReviewerId || undefined,
  });

  const items = query.data?.items ?? [];
  const [explicitId, setExplicitId] = useState<string | null>(initialId ?? null);
  const selectedId = explicitId ?? items[0]?.id ?? null;

  const selectedDetail = useKaizenDetail(selectedId ?? "");
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const actionBarRef = useRef<ReviewActionBarHandle>(null);
  const documentRef = useRef<ReviewDocumentHandle>(null);

  useEffect(() => {
    if (!selectedId) return;
    const nextPath = `/review/${selectedId}`;
    if (window.location.pathname !== nextPath) {
      window.history.replaceState(null, "", nextPath);
    }
  }, [selectedId]);

  const currentIndex = items.findIndex((item) => item.id === selectedId);
  const nextId = currentIndex >= 0 && currentIndex < items.length - 1 ? items[currentIndex + 1].id : null;
  const previousId = currentIndex > 0 ? items[currentIndex - 1].id : null;

  useReviewShortcuts({
    onApprove: () => actionBarRef.current?.openApprove(),
    onReject: () => actionBarRef.current?.openReject(),
    onFocusComment: () => documentRef.current?.focusComposer(),
    onNext: nextId ? () => setExplicitId(nextId) : undefined,
    onPrevious: previousId ? () => setExplicitId(previousId) : undefined,
    onShowHelp: () => setShortcutsOpen(true),
  });

  function updateFilter<K extends keyof ReviewInboxFilterValues>(key: K, value: string) {
    setFilters({ [key]: value } as Partial<typeof DEFAULT_FILTERS>);
  }

  const activeFilters: SavedViewFilters = Object.fromEntries(
    Object.entries(filters).filter(([key, value]) => key !== "page" && value !== "" && value !== DEFAULT_FILTERS[key as keyof typeof DEFAULT_FILTERS]),
  );

  if (query.isError && query.error instanceof ApiError && query.error.code === "FORBIDDEN") {
    return (
      <ErrorState
        title="Access restricted"
        description="The Review Workspace is only available to department managers and above."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Review Workspace</h1>
          <p className="text-muted-foreground text-sm">Kaizens waiting for your review.</p>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground gap-1.5 text-xs" onClick={() => setShortcutsOpen(true)}>
          <Keyboard className="h-3.5 w-3.5" />
          Shortcuts
        </Button>
      </div>

      <div className="flex h-[calc(100vh-11rem)] flex-col overflow-hidden rounded-xl border lg:grid lg:grid-cols-[300px_1fr] xl:grid-cols-[300px_1fr_360px]">
        <aside className="flex h-64 flex-col overflow-hidden border-b lg:h-full lg:border-b-0 lg:border-r">
          <ReviewInbox
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
            <EmptyState icon={LayoutList} title="Nothing selected" description="Pick a Kaizen from the queue to start reviewing." className="border-none py-20" />
          ) : selectedDetail.isLoading || !selectedDetail.data ? (
            <div className="mx-auto flex max-w-3xl flex-col gap-4 px-8 py-8">
              <LoadingSkeleton className="h-8 w-2/3" />
              <LoadingSkeleton className="h-24 w-full" />
              <LoadingSkeleton className="h-24 w-full" />
            </div>
          ) : (
            <>
              <ReviewDocument ref={documentRef} kaizen={selectedDetail.data} currentUser={currentUser} />
              <div className="border-t p-4 xl:hidden">
                {currentUser ? <DecisionCenter kaizen={selectedDetail.data} currentUser={currentUser} /> : null}
              </div>
            </>
          )}
        </main>

        {selectedId && selectedDetail.data && currentUser ? (
          <aside className="hidden overflow-hidden border-l xl:flex xl:flex-col">
            <DecisionCenter ref={actionBarRef} kaizen={selectedDetail.data} currentUser={currentUser} />
          </aside>
        ) : (
          <aside className="hidden xl:flex" />
        )}
      </div>

      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}
