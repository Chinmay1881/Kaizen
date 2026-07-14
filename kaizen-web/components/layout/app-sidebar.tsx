"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Tooltip } from "@/components/ui/tooltip";
import { ROLE_LABELS } from "@/constants/roles";
import { cn } from "@/lib/utils";
import { getFoundationNavGroups, isFoundationNavItemActive } from "@/components/layout/foundation-nav";
import { useCurrentUser } from "@/features/auth/hooks/use-current-user";
import { getInitials } from "@/utils/format";

export function AppSidebar() {
  const pathname = usePathname();
  const { data: currentUser } = useCurrentUser();
  const groups = getFoundationNavGroups(currentUser?.role);
  // Session-only (not persisted to localStorage): a client-only initial read of a stored
  // preference would either need an effect (a same-tick setState-in-effect the lint rule flags)
  // or risk an SSR/first-paint hydration mismatch on a value that visibly changes layout width.
  // Collapsing is quick enough to redo per visit that this trade-off is a non-issue in practice.
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "bg-sidebar text-sidebar-foreground border-sidebar-border hidden shrink-0 border-r transition-[width] duration-200 ease-out lg:flex lg:flex-col",
        collapsed ? "w-[76px]" : "w-[264px]",
      )}
    >
      <div className={cn("border-sidebar-border flex h-16 shrink-0 items-center border-b", collapsed ? "justify-center px-2" : "gap-2.5 px-5")}>
        <span className="bg-primary text-primary-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold">
          M
        </span>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-sm leading-tight font-semibold">Muliya Kaizan</p>
            <p className="text-muted-foreground truncate text-xs leading-tight">Continuous Improvement</p>
          </div>
        ) : null}
      </div>

      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            {!collapsed ? (
              <p className="text-muted-foreground px-2.5 pb-1 text-[11px] font-semibold tracking-wide uppercase">
                {group.label}
              </p>
            ) : null}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = isFoundationNavItemActive(pathname, item.href);

              const link = (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-colors duration-150",
                    collapsed ? "justify-center px-0" : "px-2.5",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                  )}
                >
                  {isActive ? (
                    <span className="bg-primary absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full" />
                  ) : null}
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed ? <span className="truncate">{item.label}</span> : null}
                </Link>
              );

              return collapsed ? (
                <Tooltip key={item.href} content={item.label} className="w-full">
                  {link}
                </Tooltip>
              ) : (
                link
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-sidebar-border flex flex-col gap-2 border-t p-3">
        {currentUser ? (
          <div className={cn("flex items-center gap-2.5 rounded-lg p-1.5", collapsed && "justify-center")}>
            <Avatar
              src={currentUser.avatarUrl}
              alt={currentUser.displayName}
              fallback={getInitials(currentUser.firstName, currentUser.lastName)}
              className="h-8 w-8 shrink-0 text-xs"
            />
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm leading-tight font-medium">{currentUser.displayName}</p>
                <p className="text-muted-foreground truncate text-xs leading-tight">{ROLE_LABELS[currentUser.role]}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-pressed={collapsed}
          className="text-muted-foreground hover:bg-sidebar-accent hover:text-foreground flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-150"
        >
          <ChevronsLeft className={cn("h-[18px] w-[18px] shrink-0 transition-transform duration-200", collapsed && "rotate-180")} />
          {!collapsed ? <span>Collapse</span> : null}
        </button>
      </div>
    </aside>
  );
}
