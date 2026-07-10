import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KaizenStatusBadge } from "@/features/kaizen/components/kaizen-status-badge";
import type { KaizenListItem } from "@/features/kaizen/types/kaizen";
import { formatDate } from "@/utils/format";

interface KaizenListCardProps {
  kaizen: KaizenListItem;
}

export function KaizenListCard({ kaizen }: KaizenListCardProps) {
  return (
    <Link href={`/kaizen/${kaizen.id}`}>
      <Card className="hover:border-primary/50 transition-colors">
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-muted-foreground text-xs">{kaizen.kaizenNumber}</p>
              <p className="font-semibold">{kaizen.title}</p>
            </div>
            <KaizenStatusBadge status={kaizen.status} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{kaizen.category?.name ?? "Uncategorized"}</Badge>
            <Badge variant="outline">{kaizen.priority}</Badge>
          </div>

          <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span>Created {formatDate(kaizen.createdAt)}</span>
            <span>Updated {formatDate(kaizen.updatedAt)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
