"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { toast } from "@/components/feedback/success-toast";
import { Textarea } from "@/components/ui/textarea";
import type { CurrentUser } from "@/features/auth/types/user";
import type { KaizenDetail } from "@/features/kaizen/types/kaizen";
import {
  useBusinessImpact,
  useRecordBusinessImpact,
} from "@/features/implementation/hooks/use-business-impact";
import { ApiError } from "@/lib/api-client";
import { formatDate } from "@/utils/format";

interface BusinessImpactPanelProps {
  kaizen: KaizenDetail;
  currentUser: CurrentUser | undefined;
}

const COMPANY_WIDE_ROLES = ["HR", "CMD", "SUPER_ADMIN"];

const IMPROVEMENT_FIELDS = [
  { key: "processImprovement", label: "Process Improvement" },
  { key: "qualityImprovement", label: "Quality Improvement" },
  { key: "safetyImprovement", label: "Safety Improvement" },
  { key: "productivityImprovement", label: "Productivity Improvement" },
  { key: "customerSatisfactionImprovement", label: "Customer Satisfaction Improvement" },
] as const;

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function BusinessImpactPanel({ kaizen, currentUser }: BusinessImpactPanelProps) {
  const { data: businessImpact, isLoading } = useBusinessImpact(kaizen.id);
  const record = useRecordBusinessImpact(kaizen.id);

  const [moneySaved, setMoneySaved] = useState("");
  const [hoursSaved, setHoursSaved] = useState("");
  const [employeesBenefited, setEmployeesBenefited] = useState("");
  const [customersBenefited, setCustomersBenefited] = useState("");
  const [improvements, setImprovements] = useState<Record<string, boolean>>({});
  const [remarks, setRemarks] = useState("");

  if (isLoading || !currentUser) {
    return (
      <Card>
        <CardContent className="p-5">
          <LoadingSkeleton className="h-5 w-1/3" />
        </CardContent>
      </Card>
    );
  }

  if (businessImpact) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business Impact</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="text-muted-foreground text-xs">Money Saved</p>
              <p className="font-medium">
                {businessImpact.moneySaved != null
                  ? `₹${businessImpact.moneySaved.toLocaleString()}`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Hours Saved</p>
              <p className="font-medium">{businessImpact.hoursSaved ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Employees Benefited</p>
              <p className="font-medium">{businessImpact.employeesBenefited ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Customers Benefited</p>
              <p className="font-medium">{businessImpact.customersBenefited ?? "—"}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {IMPROVEMENT_FIELDS.filter((field) => businessImpact[field.key]).map((field) => (
              <span
                key={field.key}
                className="bg-success/10 text-success rounded-full px-2.5 py-0.5 text-xs font-medium"
              >
                {field.label}
              </span>
            ))}
          </div>
          {businessImpact.remarks ? (
            <p className="whitespace-pre-wrap">{businessImpact.remarks}</p>
          ) : null}
          <p className="text-muted-foreground text-xs">
            Recorded by {businessImpact.recordedBy.displayName} on{" "}
            {formatDate(businessImpact.createdAt)}
          </p>
        </CardContent>
      </Card>
    );
  }

  const isDeptManagerHere =
    currentUser.role === "DEPARTMENT_MANAGER" &&
    currentUser.department?.id === kaizen.department.id;
  const canRecord = isDeptManagerHere || COMPANY_WIDE_ROLES.includes(currentUser.role);

  if (!canRecord || kaizen.status !== "IMPLEMENTATION_COMPLETED") {
    return null;
  }

  function handleRecord() {
    record.mutate(
      {
        moneySaved: moneySaved ? Number(moneySaved) : undefined,
        hoursSaved: hoursSaved ? Number(hoursSaved) : undefined,
        employeesBenefited: employeesBenefited ? Number(employeesBenefited) : undefined,
        customersBenefited: customersBenefited ? Number(customersBenefited) : undefined,
        processImprovement: Boolean(improvements.processImprovement),
        qualityImprovement: Boolean(improvements.qualityImprovement),
        safetyImprovement: Boolean(improvements.safetyImprovement),
        productivityImprovement: Boolean(improvements.productivityImprovement),
        customerSatisfactionImprovement: Boolean(improvements.customerSatisfactionImprovement),
        remarks: remarks.trim() || undefined,
      },
      {
        onSuccess: () => toast.success("Business impact recorded."),
        onError: (error) =>
          toast.error(getErrorMessage(error, "Could not record business impact.")),
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Record Business Impact</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm">Money Saved</label>
            <Input
              type="number"
              min={0}
              value={moneySaved}
              onChange={(e) => setMoneySaved(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm">Hours Saved</label>
            <Input
              type="number"
              min={0}
              value={hoursSaved}
              onChange={(e) => setHoursSaved(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm">Employees Benefited</label>
            <Input
              type="number"
              min={0}
              value={employeesBenefited}
              onChange={(e) => setEmployeesBenefited(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm">Customers Benefited</label>
            <Input
              type="number"
              min={0}
              value={customersBenefited}
              onChange={(e) => setCustomersBenefited(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Improvements</p>
          <div className="flex flex-wrap gap-3">
            {IMPROVEMENT_FIELDS.map((field) => (
              <label key={field.key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(improvements[field.key])}
                  onChange={(event) =>
                    setImprovements((prev) => ({ ...prev, [field.key]: event.target.checked }))
                  }
                  className="accent-primary h-4 w-4"
                />
                {field.label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm">Remarks (optional)</label>
          <Textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={3}
            maxLength={2000}
          />
        </div>

        <Button className="self-end" onClick={handleRecord} disabled={record.isPending}>
          {record.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Record Business Impact
        </Button>
      </CardContent>
    </Card>
  );
}
