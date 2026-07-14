"use client";

import { Search } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { Input } from "@/components/ui/input";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { MyIdeasPagination } from "@/features/kaizen/components/my-ideas/my-ideas-pagination";
import { SavedViewsBar } from "@/features/saved-views/components/saved-views-bar";
import type { SavedViewFilters } from "@/features/saved-views/types/saved-view";
import { USER_ROLE_OPTIONS } from "@/features/admin/constants/roles";
import type { AdminDepartment, AdminUser, PaginationMeta } from "@/features/admin/types/admin";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export type UserFilterValues = {
  search: string;
  role: string;
  departmentId: string;
  isActive: string;
  page: string;
};

interface UserListPanelProps {
  values: UserFilterValues;
  onChange: <K extends keyof UserFilterValues>(key: K, value: string) => void;
  onApplySavedView: (filters: SavedViewFilters) => void;
  activeFilters: SavedViewFilters;
  departments: AdminDepartment[];
  items: AdminUser[];
  meta?: PaginationMeta;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  onPageChange: (page: number) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        active ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

export function UserListPanel({
  values,
  onChange,
  onApplySavedView,
  activeFilters,
  departments,
  items,
  meta,
  isLoading,
  isError,
  error,
  onRetry,
  onPageChange,
  selectedId,
  onSelect,
  selectedIds,
  onToggleSelect,
}: UserListPanelProps) {
  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden p-3">
      <SavedViewsBar entityType="ADMIN_USERS" currentFilters={activeFilters} onApply={onApplySavedView} />

      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
        <Input value={values.search} onChange={(event) => onChange("search", event.target.value)} placeholder="Search name or email…" className="h-9 pl-8 text-sm" aria-label="Search users" />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex flex-wrap gap-1">
          <Chip active={values.role === ""} onClick={() => onChange("role", "")}>
            All Roles
          </Chip>
          {USER_ROLE_OPTIONS.map((option) => (
            <Chip key={option.value} active={values.role === option.value} onClick={() => onChange("role", option.value)}>
              {option.label}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          <Chip active={values.departmentId === ""} onClick={() => onChange("departmentId", "")}>
            All Departments
          </Chip>
          {departments.map((department) => (
            <Chip key={department.id} active={values.departmentId === department.id} onClick={() => onChange("departmentId", department.id)}>
              {department.name}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          <Chip active={values.isActive === ""} onClick={() => onChange("isActive", "")}>
            Any Status
          </Chip>
          <Chip active={values.isActive === "true"} onClick={() => onChange("isActive", "true")}>
            Active
          </Chip>
          <Chip active={values.isActive === "false"} onClick={() => onChange("isActive", "false")}>
            Inactive
          </Chip>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isError ? (
          <ErrorState title="Couldn't load users" description={error instanceof ApiError ? error.message : "Something went wrong."} onRetry={onRetry} />
        ) : isLoading && items.length === 0 ? (
          <div className="flex flex-col gap-2">
            {[...Array(6)].map((_, index) => (
              <LoadingSkeleton key={index} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={Search} title="No users found" description="Try adjusting your search or filters." className="border-none py-10" />
        ) : (
          <ul className="flex flex-col gap-1">
            {items.map((user) => (
              <li key={user.id} className={cn("flex items-center gap-2 rounded-lg border px-2 py-2 transition-colors", selectedId === user.id ? "border-primary bg-primary/5" : "hover:bg-muted/50")}>
                <input
                  type="checkbox"
                  checked={selectedIds.has(user.id)}
                  onChange={() => onToggleSelect(user.id)}
                  onClick={(event) => event.stopPropagation()}
                  className="accent-primary h-4 w-4 shrink-0"
                  aria-label={`Select ${user.displayName}`}
                />
                <button type="button" onClick={() => onSelect(user.id)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-medium">{user.displayName}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {user.role.replace("_", " ")} {user.department ? `· ${user.department.name}` : ""}
                  </p>
                </button>
                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", user.isActive ? "bg-success" : "bg-muted-foreground")} aria-hidden="true" title={user.isActive ? "Active" : "Inactive"} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {meta ? <MyIdeasPagination meta={meta} onPageChange={onPageChange} /> : null}
    </div>
  );
}
