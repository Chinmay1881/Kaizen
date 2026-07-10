import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Implementation } from "@/features/implementation/types/implementation";
import { formatDate } from "@/utils/format";

interface ImplementationQueueCardProps {
  implementation: Implementation;
}

const VERIFICATION_BADGE_VARIANT: Record<string, "outline" | "success" | "destructive"> = {
  PENDING: "outline",
  VERIFIED: "success",
  REJECTED: "destructive",
};

export function ImplementationQueueCard({ implementation }: ImplementationQueueCardProps) {
  return (
    <Link href={`/implementation/${implementation.kaizenId}`}>
      <Card className="hover:border-primary/50 transition-colors">
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-muted-foreground text-xs">{implementation.kaizen.kaizenNumber}</p>
              <p className="font-semibold">{implementation.kaizen.title}</p>
              <p className="text-muted-foreground text-sm">
                Owner: {implementation.owner.displayName} &middot;{" "}
                {implementation.assignedDepartment.name}
              </p>
            </div>
            <Badge variant={VERIFICATION_BADGE_VARIANT[implementation.verificationStatus]}>
              {implementation.verificationStatus}
            </Badge>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{implementation.progressPercent}%</span>
            </div>
            <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-primary h-full rounded-full transition-all"
                style={{ width: `${implementation.progressPercent}%` }}
              />
            </div>
          </div>

          <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span>
              Started {implementation.startedAt ? formatDate(implementation.startedAt) : "—"}
            </span>
            {implementation.dueDate ? <span>Due {formatDate(implementation.dueDate)}</span> : null}
            {implementation.completedAt ? (
              <span>Completed {formatDate(implementation.completedAt)}</span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
