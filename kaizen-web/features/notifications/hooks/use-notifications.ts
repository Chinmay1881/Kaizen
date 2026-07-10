"use client";

import { useAuth } from "@clerk/nextjs";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { notificationService } from "@/features/notifications/services/notification-service";
import type { NotificationListParams } from "@/features/notifications/types/notification";

export function useNotifications(params: NotificationListParams) {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["notifications", "list", params],
    queryFn: async () => notificationService.list(await getToken(), params),
    enabled: isLoaded && isSignedIn,
    placeholderData: keepPreviousData,
  });
}

/** Polls every 30s so the header bell's unread badge stays reasonably fresh without a websocket. */
export function useUnreadNotificationCount() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => notificationService.getUnreadCount(await getToken()),
    enabled: isLoaded && isSignedIn,
    refetchInterval: 30_000,
  });
}
