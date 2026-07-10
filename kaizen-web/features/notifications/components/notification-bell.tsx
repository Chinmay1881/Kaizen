"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUnreadNotificationCount } from "@/features/notifications/hooks/use-notifications";

/** No dropdown/popover primitive is installed in this design system (only alert-dialog, label,
 * slot) — rather than add a new @radix-ui dependency for a preview panel, this links straight to
 * the full `/notifications` page, matching the simplest option that needs no new package. */
export function NotificationBell() {
  const { data } = useUnreadNotificationCount();
  const count = data?.count ?? 0;

  return (
    <Button variant="ghost" size="icon" className="relative" aria-label="Notifications" asChild>
      <Link href="/notifications">
        <Bell className="h-5 w-5" />
        {count > 0 ? (
          <span className="bg-destructive text-destructive-foreground absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
