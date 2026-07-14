"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Lightbulb, Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { useDebounce } from "@/hooks/use-debounce";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { STATUS_FILTER_OPTIONS } from "@/features/kaizen/constants/filter-options";
import { useCategories } from "@/features/kaizen/hooks/use-categories";
import { useKaizenList } from "@/features/kaizen/hooks/use-kaizen-list";
import { MyIdeasPagination } from "@/features/kaizen/components/my-ideas/my-ideas-pagination";
import { JourneyEntry } from "@/features/kaizen/components/workspace/journey-entry";
import type { KaizenPriority, KaizenStatus } from "@/types/enums";
import { SavedViewsBar } from "@/features/saved-views/components/saved-views-bar";
import type { SavedViewFilters } from "@/features/saved-views/types/saved-view";

const PAGE_SIZE = 8;

const QUICK_STATUS_CHIPS = [
  { value: "", label: "All" },
  ...STATUS_FILTER_OPTIONS.filter((option) => ["DRAFT", "SUBMITTED", "UNDER_REVIEW", "NEEDS_CHANGES", "APPROVED", "IMPLEMENTATION_IN_PROGRESS", "REJECTED"].includes(option.value)),
];

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

/** Center panel — the Innovation Journey. Every card reads like a portfolio piece (see
 * `JourneyEntry`), grouped in one connected vertical timeline rather than a flat table. */
export function InnovationJourney() {
  const router = useRouter();
  const { filters, setFilters, replaceAll } = useUrlFilters(DEFAULT_FILTERS);
  const debouncedSearch = useDebounce(filters.search, 400);
  const page = Number(filters.page) || 1;
  const categoriesQuery = useCategories();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const query = useKaizenList({
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: (filters.status as KaizenStatus) || undefined,
    categoryId: filters.categoryId || undefined,
    priority: (filters.priority as KaizenPriority) || undefined,
    sort: "newest",
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  });

  function updateFilter<K extends keyof typeof DEFAULT_FILTERS>(key: K, value: string) {
    setFilters({ [key]: value } as Partial<typeof DEFAULT_FILTERS>);
  }

  const activeFilters: SavedViewFilters = Object.fromEntries(
    Object.entries(filters).filter(([key, value]) => key !== "page" && value !== "" && value !== DEFAULT_FILTERS[key as keyof typeof DEFAULT_FILTERS]),
  );
  const hasActiveFilters = Object.keys(activeFilters).length > 0;
  const activeAdvancedCount = [filters.dateFrom, filters.dateTo].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4">
      <SectionHeading title="Innovation Journey" description="Every idea you've submitted, from spark to impact." />

      <div className="flex flex-col gap-2.5">
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input value={filters.search} onChange={(event) => updateFilter("search", event.target.value)} placeholder="Search your ideas…" className="pl-9" aria-label="Search my ideas" />
          {filters.search ? (
            <button type="button" onClick={() => updateFilter("search", "")} aria-label="Clear search" className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2">
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {QUICK_STATUS_CHIPS.map((chip) => (
            <button
              key={chip.value}
              type="button"
              onClick={() => updateFilter("status", chip.value)}
              className={
                filters.status === chip.value
                  ? "bg-primary text-primary-foreground border-primary rounded-full border px-2.5 py-1 text-xs font-medium"
                  : "text-muted-foreground hover:bg-accent rounded-full border border-transparent px-2.5 py-1 text-xs font-medium"
              }
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Select value={filters.categoryId} onChange={(event) => updateFilter("categoryId", event.target.value)} aria-label="Filter by category" className="h-8 text-xs">
            <option value="">All Categories</option>
            {categoriesQuery.data?.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <DropdownMenu open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-8 shrink-0 gap-1.5 text-xs">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                More
                {activeAdvancedCount > 0 ? <span className="bg-primary text-primary-foreground flex h-4 w-4 items-center justify-center rounded-full text-[10px]">{activeAdvancedCount}</span> : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-3">
              <DropdownMenuLabel className="px-0">Advanced Filters</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="flex flex-col gap-3 pt-1">
                <div className="flex flex-col gap-1">
                  <label className="text-muted-foreground text-xs">Priority</label>
                  <Select value={filters.priority} onChange={(event) => updateFilter("priority", event.target.value)} className="h-8 text-xs">
                    <option value="">Any</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-muted-foreground text-xs">From</label>
                    <Input type="date" value={filters.dateFrom} onChange={(event) => updateFilter("dateFrom", event.target.value)} className="h-8 text-xs" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-muted-foreground text-xs">To</label>
                    <Input type="date" value={filters.dateTo} onChange={(event) => updateFilter("dateTo", event.target.value)} className="h-8 text-xs" />
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <SavedViewsBar entityType="KAIZEN_LIST" currentFilters={activeFilters} onApply={(saved) => replaceAll(saved as Partial<typeof DEFAULT_FILTERS>)} />
        </div>
      </div>

      {query.isError ? (
        <ErrorState title="Couldn't load your ideas" description="Something went wrong while fetching your Kaizens. Please try again." onRetry={() => query.refetch()} />
      ) : query.isLoading || !query.data ? (
        <div className="flex flex-col gap-4">
          {[...Array(3)].map((_, index) => (
            <LoadingSkeleton key={index} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : query.data.items.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState icon={Lightbulb} title="No ideas match your filters" description="Try adjusting your search or filters." />
        ) : (
          <EmptyState
            icon={Lightbulb}
            title="Your journey starts here"
            description="Submit your first Kaizen — it only takes a few minutes."
            actionLabel="Submit Your First Kaizen"
            onAction={() => router.push("/kaizen/new")}
          />
        )
      ) : (
        <>
          <ol className="flex flex-col">
            {query.data.items.map((kaizen, index) => (
              <JourneyEntry key={kaizen.id} kaizen={kaizen} index={index} isLast={index === query.data!.items.length - 1} />
            ))}
          </ol>
          <MyIdeasPagination meta={query.data.meta} onPageChange={(nextPage) => setFilters({ page: String(nextPage) } as Partial<typeof DEFAULT_FILTERS>)} />
        </>
      )}
    </div>
  );
}
