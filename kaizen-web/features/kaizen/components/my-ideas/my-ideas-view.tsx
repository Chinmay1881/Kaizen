"use client";

import { useRouter } from "next/navigation";
import { Lightbulb } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { KaizenListCard } from "@/features/kaizen/components/my-ideas/kaizen-list-card";
import { MyIdeasFilters } from "@/features/kaizen/components/my-ideas/my-ideas-filters";
import { MyIdeasPagination } from "@/features/kaizen/components/my-ideas/my-ideas-pagination";
import { MyIdeasSkeleton } from "@/features/kaizen/components/my-ideas/my-ideas-skeleton";
import { useKaizenList } from "@/features/kaizen/hooks/use-kaizen-list";
import type { KaizenSort } from "@/features/kaizen/types/kaizen";
import { SavedViewsBar } from "@/features/saved-views/components/saved-views-bar";
import type { SavedViewFilters } from "@/features/saved-views/types/saved-view";
import type { KaizenPriority, KaizenStatus } from "@/types/enums";

const PAGE_SIZE = 10;

const DEFAULT_FILTERS = {
  search: "",
  status: "",
  categoryId: "",
  priority: "",
  sort: "newest",
  dateFrom: "",
  dateTo: "",
  page: "1",
};

export function MyIdeasView() {
  const router = useRouter();
  const { filters, setFilters, replaceAll } = useUrlFilters(DEFAULT_FILTERS);
  const debouncedSearch = useDebounce(filters.search, 400);
  const page = Number(filters.page) || 1;

  const query = useKaizenList({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: (filters.status as KaizenStatus) || undefined,
    categoryId: filters.categoryId || undefined,
    priority: (filters.priority as KaizenPriority) || undefined,
    sort: filters.sort as KaizenSort,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  });

  function updateFilter<K extends keyof typeof DEFAULT_FILTERS>(key: K) {
    return (value: string) => setFilters({ [key]: value } as Partial<typeof DEFAULT_FILTERS>);
  }

  const activeFilters: SavedViewFilters = Object.fromEntries(
    Object.entries(filters).filter(
      ([key, value]) => key !== "page" && value !== "" && value !== DEFAULT_FILTERS[key as keyof typeof DEFAULT_FILTERS],
    ),
  );
  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  if (query.isError) {
    return (
      <ErrorState
        title="Couldn't load your ideas"
        description="Something went wrong while fetching your Kaizens. Please try again."
        onRetry={() => query.refetch()}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SavedViewsBar
        entityType="KAIZEN_LIST"
        currentFilters={activeFilters}
        onApply={(saved) => replaceAll(saved as Partial<typeof DEFAULT_FILTERS>)}
      />

      <MyIdeasFilters
        search={filters.search}
        onSearchChange={updateFilter("search")}
        status={filters.status}
        onStatusChange={updateFilter("status")}
        categoryId={filters.categoryId}
        onCategoryChange={updateFilter("categoryId")}
        priority={filters.priority}
        onPriorityChange={updateFilter("priority")}
        sort={filters.sort as KaizenSort}
        onSortChange={updateFilter("sort")}
        dateFrom={filters.dateFrom}
        onDateFromChange={updateFilter("dateFrom")}
        dateTo={filters.dateTo}
        onDateToChange={updateFilter("dateTo")}
      />

      {query.isLoading || !query.data ? (
        <MyIdeasSkeleton />
      ) : query.data.items.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            icon={Lightbulb}
            title="No ideas match your filters"
            description="Try adjusting your search or filters."
          />
        ) : (
          <EmptyState
            icon={Lightbulb}
            title="You haven't submitted any Kaizens yet."
            description="Start your first improvement idea — it only takes a few minutes."
            actionLabel="Submit Your First Kaizen"
            onAction={() => router.push("/kaizen/new")}
          />
        )
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {query.data.items.map((kaizen) => (
              <KaizenListCard key={kaizen.id} kaizen={kaizen} />
            ))}
          </div>
          <MyIdeasPagination
            meta={query.data.meta}
            onPageChange={(nextPage) => setFilters({ page: String(nextPage) } as Partial<typeof DEFAULT_FILTERS>)}
          />
        </>
      )}
    </div>
  );
}
