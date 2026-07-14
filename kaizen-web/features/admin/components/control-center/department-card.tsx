"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Pencil, ShieldOff, TrendingUp, Users } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkline } from "@/components/charts/sparkline";
import type { AdminDepartment, AdminUser } from "@/features/admin/types/admin";
import type { DepartmentAnalyticsItem } from "@/features/analytics/types/analytics";
import { fadeInUpVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";

interface DepartmentCardProps {
  department: AdminDepartment;
  manager: AdminUser | null;
  employeeCount: number;
  analytics: DepartmentAnalyticsItem | null;
  onEdit: () => void;
  onDeactivate: () => void;
  isDeactivating: boolean;
  index: number;
}

export function DepartmentCard({ department, manager, employeeCount, analytics, onEdit, onDeactivate, isDeactivating, index }: DepartmentCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeInUpVariants} transition={{ delay: Math.min(index, 8) * 0.04 }} className="flex flex-col rounded-xl border bg-card">
      <div className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{department.name}</h3>
            <Badge variant="outline" className="font-mono text-[10px]">
              {department.code}
            </Badge>
            <Badge variant={department.isActive ? "success" : "outline"}>{department.isActive ? "Active" : "Inactive"}</Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm">{manager ? `Managed by ${manager.displayName}` : "No manager assigned"}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Edit department" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          {department.isActive ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Deactivate department">
                  <ShieldOff className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Deactivate {department.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Existing Kaizens and users keep their reference to it, but it won&apos;t appear as a choice for new submissions. This can be reversed by editing it again.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(event) => {
                      event.preventDefault();
                      onDeactivate();
                    }}
                    disabled={isDeactivating}
                  >
                    Deactivate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 border-t px-5 py-3 text-center">
        <div>
          <p className="text-lg font-semibold tracking-tight">{employeeCount}</p>
          <p className="text-muted-foreground text-[11px]">Employees</p>
        </div>
        <div>
          <p className="text-lg font-semibold tracking-tight">{analytics?.statusCounts.total ?? "—"}</p>
          <p className="text-muted-foreground text-[11px]">Ideas</p>
        </div>
        <div>
          <p className="text-lg font-semibold tracking-tight">{analytics ? `${Math.round(analytics.approvalRate)}%` : "—"}</p>
          <p className="text-muted-foreground text-[11px]">Approval Rate</p>
        </div>
        <div>
          <p className="text-lg font-semibold tracking-tight">{analytics ? formatCurrency(analytics.actualSavings) : "—"}</p>
          <p className="text-muted-foreground text-[11px]">Savings</p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 border-t py-2 text-xs font-medium transition-colors"
        aria-expanded={expanded}
      >
        {expanded ? "Hide details" : "Show details"}
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded ? (
        <div className="flex flex-col gap-4 border-t p-5">
          {!analytics ? (
            <p className="text-muted-foreground text-sm">No analytics activity recorded for this department yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <p className="text-muted-foreground text-xs">Avg. Score</p>
                  <p className="font-medium">{analytics.avgScore !== null ? analytics.avgScore.toFixed(1) : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Avg. Implementation Time</p>
                  <p className="font-medium">{analytics.avgImplementationTimeDays !== null ? `${Math.round(analytics.avgImplementationTimeDays)}d` : "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Pending Reviews</p>
                  <p className="font-medium">{analytics.pendingReviews}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Pending Implementations</p>
                  <p className="font-medium">{analytics.pendingImplementations}</p>
                </div>
              </div>

              {analytics.monthlyTrend.length > 1 ? (
                <div>
                  <p className="text-muted-foreground mb-1.5 flex items-center gap-1 text-xs">
                    <TrendingUp className="h-3 w-3" />
                    Monthly Submissions
                  </p>
                  <Sparkline data={analytics.monthlyTrend.map((point) => point.value)} color="var(--color-primary)" className="h-8 w-full" />
                </div>
              ) : null}

              {analytics.topEmployees.length > 0 ? (
                <div>
                  <p className="text-muted-foreground mb-1.5 flex items-center gap-1 text-xs">
                    <Users className="h-3 w-3" />
                    Top Contributors
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {analytics.topEmployees.slice(0, 5).map((employee) => (
                      <Badge key={employee.id} variant="secondary">
                        {employee.name} · {employee.value}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </motion.div>
  );
}
