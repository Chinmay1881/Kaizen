import {
  BarChart3,
  ClipboardList,
  FileText,
  FileBarChart,
  HardHat,
  LayoutDashboard,
  ShieldCheck,
  Trophy,
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

const BASE_FOUNDATION_NAV: FoundationNavItem[] = [
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: "My Ideas", href: ROUTES.MY_IDEAS, icon: FileText },
  { label: "Leaderboard", href: ROUTES.LEADERBOARD, icon: Trophy },
];

const REVIEW_NAV_ITEM: FoundationNavItem = {
  label: "Review",
  href: ROUTES.REVIEW,
  icon: ClipboardList,
};

const IMPLEMENTATION_NAV_ITEM: FoundationNavItem = {
  label: "Implementation",
  href: ROUTES.IMPLEMENTATION,
  icon: HardHat,
};

const ANALYTICS_NAV_ITEM: FoundationNavItem = {
  label: "Analytics",
  href: ROUTES.ANALYTICS,
  icon: BarChart3,
};

const REPORTS_NAV_ITEM: FoundationNavItem = {
  label: "Reports",
  href: ROUTES.REPORTS,
  icon: FileBarChart,
};

const ADMIN_NAV_ITEM: FoundationNavItem = {
  label: "Administration",
  href: ROUTES.ADMIN,
  icon: ShieldCheck,
};

/**
 * Shared between AppSidebar and MobileNav so the two stay in sync. Deliberately not the richer
 * role-based EMPLOYEE_NAV/MANAGER_NAV in constants/navigation.ts — those are still unused
 * scaffolding (see PROJECT_STATUS.md Known Issues); wiring the sidebar/mobile-nav up to full
 * role-based navigation is a bigger change than this milestone needs. The role-conditional items
 * so far are "Review" (Milestone 6), "Implementation" (Milestone 8) — both shown for roles that
 * can access the corresponding workspace (Department Manager and above, `canReview`) — and
 * "Administration" (Administration Portal), shown only to Super Admin (`canAccessAdmin`), matching
 * every Admin Portal endpoint's own backend RBAC exactly. Employees still see their own
 * implementation/business-impact progress via the existing My Ideas detail page, so the
 * Implementation link is intentionally not shown to them even though `GET /implementations` itself
 * grants them read-only access.
 */
export function getFoundationNav(role?: UserRole): FoundationNavItem[] {
  if (!role) return BASE_FOUNDATION_NAV;

  const items = [...BASE_FOUNDATION_NAV];
  if (canReview(role)) items.push(REVIEW_NAV_ITEM, IMPLEMENTATION_NAV_ITEM, ANALYTICS_NAV_ITEM, REPORTS_NAV_ITEM);
  if (canAccessAdmin(role)) items.push(ADMIN_NAV_ITEM);
  return items;
}

/** "My Ideas" should also read as active on its detail page (/kaizen/[id]), but not on the
 * separate Submit Kaizen wizard (/kaizen/new). "Review"/"Implementation"/"Administration"/
 * "Analytics"/"Reports" read as active on their sub-pages too. */
export function isFoundationNavItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === ROUTES.MY_IDEAS) {
    return pathname.startsWith(`${ROUTES.MY_IDEAS}/`) && pathname !== ROUTES.NEW_KAIZEN;
  }
  if (
    href === ROUTES.REVIEW ||
    href === ROUTES.IMPLEMENTATION ||
    href === ROUTES.ADMIN ||
    href === ROUTES.ANALYTICS ||
    href === ROUTES.REPORTS
  ) {
    return pathname.startsWith(`${href}/`);
  }
  return false;
}
