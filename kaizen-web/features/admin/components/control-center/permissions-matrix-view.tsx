"use client";

import { Fragment, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { Input } from "@/components/ui/input";
import { PERMISSION_CAPABILITIES, PERMISSION_ROLES } from "@/features/admin/constants/permissions-matrix";
import { hasMinimumRole } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
  EMPLOYEE: "Employee",
  DEPARTMENT_MANAGER: "Dept. Manager",
  HR: "HR",
  CMD: "CMD",
  SUPER_ADMIN: "Super Admin",
};

/**
 * Read-only, static, and derived directly from the real `requireRole(...)` gates on every
 * `kaizen-api` route (see `permissions-matrix.ts`) — there is no permissions API to fetch a
 * matrix from, and this app's entire RBAC surface is a 5-level hierarchy plus per-route minimum
 * roles, nothing more granular. Nothing here is invented.
 */
export function PermissionsMatrixView() {
  const [search, setSearch] = useState("");

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = PERMISSION_CAPABILITIES.filter(
      (capability) => !term || capability.label.toLowerCase().includes(term) || capability.description.toLowerCase().includes(term),
    );
    const byGroup = new Map<string, typeof filtered>();
    for (const capability of filtered) {
      byGroup.set(capability.group, [...(byGroup.get(capability.group) ?? []), capability]);
    }
    return [...byGroup.entries()];
  }, [search]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Permissions</h1>
          <p className="text-muted-foreground text-sm">What each role can do, derived from the platform&apos;s actual route-level access rules.</p>
        </div>
        <div className="relative">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search capabilities…" className="h-9 w-56 pl-8" aria-label="Search permissions" />
        </div>
      </div>

      {groups.length === 0 ? (
        <EmptyState icon={Search} title="No matches" description={`Nothing matched "${search}".`} />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Capability</th>
                {PERMISSION_ROLES.map((role) => (
                  <th key={role} className="px-3 py-3 text-center font-medium whitespace-nowrap">
                    {ROLE_LABEL[role]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {groups.map(([group, capabilities]) => (
                <Fragment key={group}>
                  <tr className="bg-muted/20">
                    <td colSpan={PERMISSION_ROLES.length + 1} className="text-muted-foreground px-4 py-1.5 text-xs font-semibold tracking-wide uppercase">
                      {group}
                    </td>
                  </tr>
                  {capabilities.map((capability) => (
                    <tr key={capability.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 align-middle">
                        <p className="font-medium">{capability.label}</p>
                        <p className="text-muted-foreground text-xs">{capability.description}</p>
                      </td>
                      {PERMISSION_ROLES.map((role) => (
                        <td key={role} className="px-3 py-3 text-center align-middle">
                          {hasMinimumRole(role, capability.minRole) ? (
                            <Check className={cn("mx-auto h-4 w-4", role === capability.minRole ? "text-primary" : "text-success")} />
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
