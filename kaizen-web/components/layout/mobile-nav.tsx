"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { getFoundationNav, isFoundationNavItemActive } from "@/components/layout/foundation-nav";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";

export function MobileNav() {
  const pathname = usePathname();
  const { data: currentUser } = useCurrentUser();
  const navItems = getFoundationNav(currentUser?.role);

  return (
    <nav className="bg-background fixed inset-x-0 bottom-0 z-40 flex border-t lg:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = isFoundationNavItemActive(pathname, item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-3 text-xs",
              isActive ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
