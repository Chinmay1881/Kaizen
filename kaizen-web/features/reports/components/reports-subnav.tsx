"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: ROUTES.REPORTS, label: "Builder" },
  { href: ROUTES.REPORTS_HISTORY, label: "Download Center" },
  { href: ROUTES.REPORTS_SCHEDULES, label: "Schedules" },
  { href: ROUTES.REPORTS_TEMPLATES, label: "Templates" },
];

/** A small in-page sub-nav rather than 3 new top-level sidebar items — Reports already has one
 * role-gated nav entry (Chunk 3A); Download Center/Schedules/Templates are sub-features of it, not
 * separate destinations someone browses to directly. */
export function ReportsSubNav() {
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
