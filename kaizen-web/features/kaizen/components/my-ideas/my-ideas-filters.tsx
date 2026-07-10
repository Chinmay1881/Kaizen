"use client";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  PRIORITY_FILTER_OPTIONS,
  SORT_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from "@/features/kaizen/constants/filter-options";
import { useCategories } from "@/features/kaizen/hooks/use-categories";
import type { KaizenSort } from "@/features/kaizen/types/kaizen";

interface MyIdeasFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  categoryId: string;
  onCategoryChange: (value: string) => void;
  priority: string;
  onPriorityChange: (value: string) => void;
  sort: KaizenSort;
  onSortChange: (value: KaizenSort) => void;
}

export function MyIdeasFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  categoryId,
  onCategoryChange,
  priority,
  onPriorityChange,
  sort,
  onSortChange,
}: MyIdeasFiltersProps) {
  const categoriesQuery = useCategories();

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by title or description..."
          className="pl-9"
          aria-label="Search my ideas"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Select
          value={status}
          onChange={(event) => onStatusChange(event.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          {STATUS_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          value={categoryId}
          onChange={(event) => onCategoryChange(event.target.value)}
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {categoriesQuery.data?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>

        <Select
          value={priority}
          onChange={(event) => onPriorityChange(event.target.value)}
          aria-label="Filter by priority"
        >
          <option value="">All Priorities</option>
          {PRIORITY_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>

        <Select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as KaizenSort)}
          aria-label="Sort by"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
