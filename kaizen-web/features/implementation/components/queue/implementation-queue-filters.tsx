"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useDepartments } from "@/features/kaizen/hooks/use-departments";
import type { VerificationStatus } from "@/features/implementation/types/implementation";

const VERIFICATION_STATUS_OPTIONS: { value: VerificationStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
];

const KAIZEN_STATUS_OPTIONS = [
  { value: "IMPLEMENTATION_IN_PROGRESS", label: "In Progress" },
  { value: "IMPLEMENTATION_COMPLETED", label: "Completed" },
];

interface ImplementationQueueFiltersProps {
  status: string;
  onStatusChange: (value: string) => void;
  /** Only rendered for company-wide roles — a Department Manager's list is already scoped to
   * their own department server-side. Matches ReviewQueueFilters' identical pattern. */
  showDepartmentFilter: boolean;
  departmentId: string;
  onDepartmentChange: (value: string) => void;
  kaizenStatus: string;
  onKaizenStatusChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
}

/** No search box here — unlike the Review queue, GET /implementations only documents
 * `status`/`departmentId`/`ownerId` as query params (no `search`), so none is built. Milestone 11
 * Chunk 2 added `kaizenStatus` (Implementation Status) and `dateFrom`/`dateTo` (Date Range). */
export function ImplementationQueueFilters({
  status,
  onStatusChange,
  showDepartmentFilter,
  departmentId,
  onDepartmentChange,
  kaizenStatus,
  onKaizenStatusChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}: ImplementationQueueFiltersProps) {
  const departmentsQuery = useDepartments();

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      <Select
        value={status}
        onChange={(event) => onStatusChange(event.target.value)}
        aria-label="Filter by verification status"
      >
        <option value="">All Verification Statuses</option>
        {VERIFICATION_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      <Select
        value={kaizenStatus}
        onChange={(event) => onKaizenStatusChange(event.target.value)}
        aria-label="Filter by implementation status"
      >
        <option value="">Any Implementation Status</option>
        {KAIZEN_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      {showDepartmentFilter ? (
        <Select
          value={departmentId}
          onChange={(event) => onDepartmentChange(event.target.value)}
          aria-label="Filter by assigned department"
        >
          <option value="">All Departments</option>
          {departmentsQuery.data?.map((department) => (
            <option key={department.id} value={department.id}>
              {department.name}
            </option>
          ))}
        </Select>
      ) : null}

      <Input
        type="date"
        value={dateFrom}
        onChange={(event) => onDateFromChange(event.target.value)}
        aria-label="Started from"
      />
      <Input
        type="date"
        value={dateTo}
        onChange={(event) => onDateToChange(event.target.value)}
        aria-label="Started to"
      />
    </div>
  );
}
