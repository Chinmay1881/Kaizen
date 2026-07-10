"use client";

import { Select } from "@/components/ui/select";
import { useDepartments } from "@/features/kaizen/hooks/use-departments";
import type { VerificationStatus } from "@/features/implementation/types/implementation";

const VERIFICATION_STATUS_OPTIONS: { value: VerificationStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
];

interface ImplementationQueueFiltersProps {
  status: string;
  onStatusChange: (value: string) => void;
  /** Only rendered for company-wide roles — a Department Manager's list is already scoped to
   * their own department server-side. Matches ReviewQueueFilters' identical pattern. */
  showDepartmentFilter: boolean;
  departmentId: string;
  onDepartmentChange: (value: string) => void;
}

/** No search box here — unlike the Review queue, GET /implementations only documents
 * `status`/`departmentId`/`ownerId` as query params (no `search`), so none is built. */
export function ImplementationQueueFilters({
  status,
  onStatusChange,
  showDepartmentFilter,
  departmentId,
  onDepartmentChange,
}: ImplementationQueueFiltersProps) {
  const departmentsQuery = useDepartments();

  return (
    <div className={`grid grid-cols-1 gap-2 ${showDepartmentFilter ? "sm:grid-cols-2" : ""}`}>
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
    </div>
  );
}
