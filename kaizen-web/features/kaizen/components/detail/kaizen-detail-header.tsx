import { Badge } from "@/components/ui/badge";
import { KaizenStatusBadge } from "@/features/kaizen/components/kaizen-status-badge";
import type { KaizenDetail } from "@/features/kaizen/types/kaizen";
import { formatDate } from "@/utils/format";

interface KaizenDetailHeaderProps {
  kaizen: KaizenDetail;
}

export function KaizenDetailHeader({ kaizen }: KaizenDetailHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-muted-foreground text-sm">{kaizen.kaizenNumber}</p>
      <h1 className="text-2xl font-bold tracking-tight">{kaizen.title}</h1>

      <div className="flex flex-wrap items-center gap-2">
        <KaizenStatusBadge status={kaizen.status} />
        <Badge variant="outline">{kaizen.priority}</Badge>
        <Badge variant="outline">{kaizen.category?.name ?? "Uncategorized"}</Badge>
        <Badge variant="outline">{kaizen.department.name}</Badge>
      </div>

      <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span>Created {formatDate(kaizen.createdAt)}</span>
        <span>Updated {formatDate(kaizen.updatedAt)}</span>
        {kaizen.submittedAt ? <span>Submitted {formatDate(kaizen.submittedAt)}</span> : null}
      </div>
    </div>
  );
}
