"use client";

import { useUpdateAdminUser } from "@/features/admin/hooks/use-admin-users";
import type { UpdateUserInput } from "@/features/admin/types/admin";

export interface BulkUserChange {
  id: string;
  input: UpdateUserInput;
}

export interface BulkActionResult {
  succeededIds: string[];
  failed: Array<{ id: string; message: string }>;
}

/**
 * There is no bulk endpoint anywhere in `kaizen-api` (every user mutation is single-`:id`) — bulk
 * actions here are a client-side loop over the same `useUpdateAdminUser` mutation everything else
 * uses, reported per-item via `Promise.allSettled` rather than a single request. `apply` takes an
 * explicit `{id, input}` per user (not one shared input) so the same function can also drive
 * "Undo" — restoring each user to *its own* prior values, not a single shared one.
 */
export function useBulkUserActions() {
  const updateUser = useUpdateAdminUser();

  async function apply(changes: BulkUserChange[]): Promise<BulkActionResult> {
    const settled = await Promise.allSettled(
      changes.map((change) => updateUser.mutateAsync({ id: change.id, input: change.input })),
    );

    const succeededIds: string[] = [];
    const failed: Array<{ id: string; message: string }> = [];

    settled.forEach((result, index) => {
      const id = changes[index].id;
      if (result.status === "fulfilled") {
        succeededIds.push(id);
      } else {
        const message = result.reason instanceof Error ? result.reason.message : "Update failed.";
        failed.push({ id, message });
      }
    });

    return { succeededIds, failed };
  }

  return { apply, isPending: updateUser.isPending };
}
