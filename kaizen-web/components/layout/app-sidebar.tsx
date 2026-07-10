"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { getFoundationNav, isFoundationNavItemActive } from "@/components/layout/foundation-nav";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";

export function AppSidebar() {
  const pathname = usePathname();
  const { data: currentUser } = useCurrentUser();
  const navItems = getFoundationNav(currentUser?.role);

  return (
    <aside className="bg-sidebar text-sidebar-foreground hidden w-[280px] shrink-0 border-r lg:flex lg:flex-col">
      <div className="border-sidebar-border border-b p-6">
        <p className="text-lg font-bold">Muliya Kaizan</p>
        <p className="text-muted-foreground text-sm">Foundation</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isFoundationNavItemActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
