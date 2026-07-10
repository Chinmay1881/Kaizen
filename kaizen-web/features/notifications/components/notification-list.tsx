"use client";

import { useState } from "react";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { toast } from "@/components/feedback/success-toast";
import { MyIdeasPagination } from "@/features/kaizen/components/my-ideas/my-ideas-pagination";
import { NotificationItem } from "@/features/notifications/components/notification-item";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from "@/features/notifications/hooks/use-notification-mutations";
import { useNotifications } from "@/features/notifications/hooks/use-notifications";

const PAGE_SIZE = 20;

export function NotificationList() {
  const [page, setPage] = useState(1);
  const query = useNotifications({ page, pageSize: PAGE_SIZE });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  if (query.isError) {
    return (
      <ErrorState
        title="Couldn't load notifications"
        description="Something went wrong while fetching your notifications. Please try again."
        onRetry={() => query.refetch()}
      />
    );
  }

  if (query.isLoading || !query.data) {
    return (
      <div className="flex flex-col gap-3">
        {[...Array(5)].map((_, index) => (
          <LoadingSkeleton key={index} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const hasUnread = query.data.items.some((notification) => !notification.isRead);

  if (query.data.items.length === 0) {
    return (
      <EmptyState
        icon={Bell}
        title="No notifications yet"
        description="Updates on your Kaizens, rewards, and achievements will show up here."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {hasUnread ? (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            disabled={markAllRead.isPending}
            onClick={() =>
              markAllRead.mutate(undefined, {
                onSuccess: (result) => toast.success(`Marked ${result.markedRead} as read.`),
              })
            }
          >
            Mark all as read
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {query.data.items.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkRead={(id) => markRead.mutate(id)}
          />
        ))}
      </div>

      <MyIdeasPagination meta={query.data.meta} onPageChange={setPage} />
    </div>
  );
}
