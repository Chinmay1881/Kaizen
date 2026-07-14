"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: ROUTES.ADMIN, label: "Overview" },
  { href: ROUTES.ADMIN_USERS, label: "Users" },
  { href: ROUTES.ADMIN_DEPARTMENTS, label: "Departments" },
  { href: ROUTES.ADMIN_CATEGORIES, label: "Categories" },
  { href: ROUTES.ADMIN_SETTINGS, label: "Settings" },
  { href: ROUTES.ADMIN_ACTIVITY, label: "Activity Log" },
  { href: ROUTES.ADMIN_PERMISSIONS, label: "Permissions" },
];

/** Same in-page sub-nav pattern as `ReportsSubNav` — one role-gated top-level sidebar entry
 * ("Administration"), with these as sub-destinations inside the Control Center. */
export function AdminSubNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 border-b pb-2">
      {LINKS.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
