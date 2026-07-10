import Link from "next/link";

import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNotifications } from "@/features/notifications/hooks/use-notifications";
import { formatDate } from "@/utils/format";

/** Fed by real notifications since Milestone 9 (Notifications & Gamification) — previously a
 * static skeleton placeholder with no backend module to populate it. */
export function RecentActivityCard() {
  const { data, isLoading } = useNotifications({ page: 1, pageSize: 4 });

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Your recent notifications.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading || !data ? (
          [...Array(4)].map((_, index) => <LoadingSkeleton key={index} className="h-4 w-full" />)
        ) : data.items.length === 0 ? (
          <p className="text-muted-foreground text-sm">No recent activity yet.</p>
        ) : (
          data.items.map((notification) => (
            <div key={notification.id} className="flex flex-col gap-0.5">
              <p className="text-sm leading-snug">{notification.title}</p>
              <p className="text-muted-foreground text-xs">{formatDate(notification.createdAt)}</p>
            </div>
          ))
        )}
        <Link href="/notifications" className="text-primary block text-sm font-medium hover:underline">
          View all
        </Link>
      </CardContent>
    </Card>
  );
}
