import {
  BarChart3,
  Bell,
  ClipboardList,
  FileBarChart,
  FileText,
  FolderKanban,
  HardHat,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { canAccessAdmin, canReview } from "@/lib/permissions";
import type { UserRole } from "@/types/enums";

export interface FoundationNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface FoundationNavGroup {
  label: string;
  items: FoundationNavItem[];
}

/** Milestone 12 Chunk 1 — grouped sidebar navigation. Every destination here already exists
 * (Milestones 1-11); this only changes how they're organized and labeled, not what's reachable.
 * "Administration" expands to its 4 real sub-pages (previously a single link collapsing all of
 * them) since a flat single entry undersold what's actually there once inside. */
export function getFoundationNavGroups(role?: UserRole): FoundationNavGroup[] {
  const groups: FoundationNavGroup[] = [
    {
      label: "Workspace",
      items: [
        { label: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
        { label: "My Ideas", href: ROUTES.MY_IDEAS, icon: FileText },
        ...(role && canReview(role)
          ? [
              { label: "Review", href: ROUTES.REVIEW, icon: ClipboardList },
              { label: "Implementation", href: ROUTES.IMPLEMENTATION, icon: HardHat },
            ]
          : []),
      ],
    },
    {
      label: "Insights",
      items: [
        ...(role && canReview(role)
          ? [
              { label: "Analytics", href: ROUTES.ANALYTICS, icon: BarChart3 },
              { label: "Reports", href: ROUTES.REPORTS, icon: FileBarChart },
            ]
          : []),
        { label: "Leaderboard", href: ROUTES.LEADERBOARD, icon: Trophy },
      ],
    },
  ];

  if (role && canAccessAdmin(role)) {
    groups.push({
      label: "Administration",
      items: [
        { label: "Overview", href: ROUTES.ADMIN, icon: ShieldCheck },
        { label: "Users", href: `${ROUTES.ADMIN}/users`, icon: Users },
        { label: "Departments", href: `${ROUTES.ADMIN}/departments`, icon: FolderKanban },
        { label: "Categories", href: `${ROUTES.ADMIN}/categories`, icon: ClipboardList },
        { label: "Settings", href: `${ROUTES.ADMIN}/settings`, icon: Settings },
      ],
    });
  }

  groups.push({
    label: "You",
    items: [{ label: "Notifications", href: ROUTES.NOTIFICATIONS, icon: Bell }],
  });

  return groups;
}

/** Flat form of {@link getFoundationNavGroups}, for surfaces without room for section labels
 * (the mobile bottom bar). Sub-pages under "Administration" are collapsed back to the single
 * `/admin` overview link — a 5-deep bottom bar isn't usable at phone width. */
export function getFoundationNavFlat(role?: UserRole): FoundationNavItem[] {
  const groups = getFoundationNavGroups(role);
  const seen = new Set<string>();
  const items: FoundationNavItem[] = [];

  for (const group of groups) {
    for (const item of group.items) {
      const key = group.label === "Administration" ? ROUTES.ADMIN : item.href;
      const label = group.label === "Administration" ? "Admin" : item.label;
      if (seen.has(key)) continue;
      seen.add(key);
      items.push({ label, href: key, icon: group.label === "Administration" ? ShieldCheck : item.icon });
    }
  }

  return items;
}

/** "My Ideas" should also read as active on its detail page (/kaizen/[id]), but not on the
 * separate Submit Kaizen wizard (/kaizen/new). Section-root links (Review/Implementation/Admin/
 * Analytics/Reports) read as active on their own sub-pages too. Admin sub-items match their own
 * exact prefix so "Users" doesn't also light up while viewing "Departments". */
export function isFoundationNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === ROUTES.MY_IDEAS) {
    return pathname.startsWith(`${ROUTES.MY_IDEAS}/`) && pathname !== ROUTES.NEW_KAIZEN;
  }
  if (href === ROUTES.ADMIN) {
    return pathname.startsWith(`${ROUTES.ADMIN}/`);
  }
  if (
    href === ROUTES.REVIEW ||
    href === ROUTES.IMPLEMENTATION ||
    href === ROUTES.ANALYTICS ||
    href === ROUTES.REPORTS
  ) {
    return pathname.startsWith(`${href}/`);
  }
  return false;
}
