"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lightbulb } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { useDebounce } from "@/hooks/use-debounce";
import { KaizenListCard } from "@/features/kaizen/components/my-ideas/kaizen-list-card";
import { MyIdeasFilters } from "@/features/kaizen/components/my-ideas/my-ideas-filters";
import { MyIdeasPagination } from "@/features/kaizen/components/my-ideas/my-ideas-pagination";
import { MyIdeasSkeleton } from "@/features/kaizen/components/my-ideas/my-ideas-skeleton";
import { useKaizenList } from "@/features/kaizen/hooks/use-kaizen-list";
import type { KaizenSort } from "@/features/kaizen/types/kaizen";
import type { KaizenPriority, KaizenStatus } from "@/types/enums";

const PAGE_SIZE = 10;

export function MyIdeasView() {
  const router = useRouter();

  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState("");
  const [sort, setSort] = useState<KaizenSort>("newest");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebounce(searchInput, 400);

  const query = useKaizenList({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: (status as KaizenStatus) || undefined,
    categoryId: categoryId || undefined,
    priority: (priority as KaizenPriority) || undefined,
    sort,
  });

  function updateFilter<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  const hasActiveFilters = Boolean(debouncedSearch || status || categoryId || priority);

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
      <MyIdeasFilters
        search={searchInput}
        onSearchChange={updateFilter(setSearchInput)}
        status={status}
        onStatusChange={updateFilter(setStatus)}
        categoryId={categoryId}
        onCategoryChange={updateFilter(setCategoryId)}
        priority={priority}
        onPriorityChange={updateFilter(setPriority)}
        sort={sort}
        onSortChange={updateFilter(setSort)}
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
          <MyIdeasPagination meta={query.data.meta} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
