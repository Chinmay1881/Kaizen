"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Download, Loader2, ShieldCheck, ShieldOff, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/feedback/success-toast";
import { USER_ROLE_OPTIONS } from "@/features/admin/constants/roles";
import { useBulkUserActions, type BulkUserChange } from "@/features/admin/hooks/use-bulk-user-actions";
import type { AdminDepartment, AdminUser } from "@/features/admin/types/admin";
import { downloadCsv, usersToCsv } from "@/features/admin/utils/csv-export";
import { DURATION, EASE } from "@/lib/motion";
import type { UserRole } from "@/types/enums";

interface BulkToolbarProps {
  selectedUsers: AdminUser[];
  departments: AdminDepartment[];
  onClearSelection: () => void;
}

interface UndoState {
  label: string;
  restore: BulkUserChange[];
}

const slideUpVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: DURATION.moderate, ease: EASE.out } },
  exit: { opacity: 0, y: 12, transition: { duration: DURATION.fast, ease: EASE.out } },
};

/**
 * There is no bulk endpoint on the backend — every action here loops the single-user
 * `useUpdateAdminUser` mutation via `useBulkUserActions`. "Bulk Delete" from the brief is folded
 * into "Deactivate Selected" (same as the single-user panel: `DELETE /users/:id` is itself a soft
 * deactivation, so a separate button would just be a relabeled duplicate). Undo re-applies the
 * mutation with each user's own captured *previous* role/department/active value — a real reversal,
 * not a fabricated one — within a short window before the snapshot is discarded.
 */
export function BulkToolbar({ selectedUsers, departments, onClearSelection }: BulkToolbarProps) {
  const { apply, isPending } = useBulkUserActions();
  const [bulkRole, setBulkRole] = useState<UserRole | "">("");
  const [bulkDepartmentId, setBulkDepartmentId] = useState("");
  const [undo, setUndo] = useState<UndoState | null>(null);

  if (selectedUsers.length === 0 && !undo) return null;

  async function runBulk(label: string, buildInput: (user: AdminUser) => Partial<BulkUserChange["input"]>) {
    const restore: BulkUserChange[] = selectedUsers.map((user) => ({
      id: user.id,
      input: { role: user.role, departmentId: user.department?.id ?? null, isActive: user.isActive },
    }));
    const changes: BulkUserChange[] = selectedUsers.map((user) => ({ id: user.id, input: buildInput(user) }));

    const result = await apply(changes);
    if (result.succeededIds.length > 0) {
      toast.success(`${label} for ${result.succeededIds.length} user${result.succeededIds.length === 1 ? "" : "s"}.`);
      setUndo({ label, restore: restore.filter((change) => result.succeededIds.includes(change.id)) });
      onClearSelection();
    }
    if (result.failed.length > 0) {
      toast.error(`${result.failed.length} update${result.failed.length === 1 ? "" : "s"} failed.`);
    }
  }

  async function handleUndo() {
    if (!undo) return;
    const result = await apply(undo.restore);
    if (result.succeededIds.length > 0) toast.success("Undone.");
    setUndo(null);
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4">
      <AnimatePresence mode="wait">
        {selectedUsers.length > 0 ? (
          <motion.div
            key="bulk-toolbar"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={slideUpVariants}
            className="bg-popover text-popover-foreground pointer-events-auto flex flex-wrap items-center gap-2 rounded-xl border p-2.5 shadow-2xl"
          >
            <span className="bg-primary text-primary-foreground flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-semibold">
              {selectedUsers.length}
            </span>
            <span className="text-sm font-medium">selected</span>
            <div className="bg-border mx-1 h-5 w-px" />

            <Select value={bulkRole} onChange={(event) => setBulkRole(event.target.value as UserRole)} className="h-8 w-auto text-xs">
              <option value="">Set role…</option>
              {USER_ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            <Button size="sm" variant="outline" className="h-8" disabled={!bulkRole || isPending} onClick={() => bulkRole && runBulk("Role updated", () => ({ role: bulkRole }))}>
              Apply
            </Button>

            <Select value={bulkDepartmentId} onChange={(event) => setBulkDepartmentId(event.target.value)} className="h-8 w-auto text-xs">
              <option value="">Set department…</option>
              <option value="__none__">— None —</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
            <Button
              size="sm"
              variant="outline"
              className="h-8"
              disabled={!bulkDepartmentId || isPending}
              onClick={() => bulkDepartmentId && runBulk("Department assigned", () => ({ departmentId: bulkDepartmentId === "__none__" ? null : bulkDepartmentId }))}
            >
              Apply
            </Button>

            <div className="bg-border mx-1 h-5 w-px" />

            <Button size="sm" variant="outline" className="h-8" disabled={isPending} onClick={() => runBulk("Activated", () => ({ isActive: true }))}>
              <ShieldCheck className="h-3.5 w-3.5" />
              Activate
            </Button>
            <Button size="sm" variant="outline" className="text-destructive hover:text-destructive h-8" disabled={isPending} onClick={() => runBulk("Deactivated", () => ({ isActive: false }))}>
              <ShieldOff className="h-3.5 w-3.5" />
              Deactivate
            </Button>
            <Button size="sm" variant="outline" className="h-8" onClick={() => downloadCsv(`users-export-${Date.now()}.csv`, usersToCsv(selectedUsers))}>
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>

            {isPending ? <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" /> : null}

            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onClearSelection} aria-label="Clear selection">
              <X className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        ) : undo ? (
          <motion.div
            key="undo-snackbar"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={slideUpVariants}
            onAnimationComplete={(definition) => {
              if (definition === "visible") setTimeout(() => setUndo((current) => (current === undo ? null : current)), 6000);
            }}
            className="bg-popover text-popover-foreground pointer-events-auto flex items-center gap-3 rounded-xl border p-3 shadow-2xl"
          >
            <CheckCircle2 className="text-success h-4 w-4 shrink-0" />
            <span className="text-sm">{undo.label}.</span>
            <Button size="sm" variant="outline" className="h-7" onClick={handleUndo}>
              Undo
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
