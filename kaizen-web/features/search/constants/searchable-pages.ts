import {
  BarChart3,
  ClipboardList,
  FileText,
  HardHat,
  LayoutDashboard,
  Lightbulb,
  ShieldCheck,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import { ROUTES } from "@/constants/routes";
import { canAccessAdmin, canReview } from "@/lib/permissions";
import type { UserRole } from "@/types/enums";

export interface SearchablePage {
  label: string;
  href: string;
  icon: LucideIcon;
  keywords: string;
}

const BASE_PAGES: SearchablePage[] = [
  { label: "Dashboard", href: ROUTES.DASHBOARD, icon: LayoutDashboard, keywords: "home overview" },
  { label: "Submit Kaizen", href: ROUTES.NEW_KAIZEN, icon: Lightbulb, keywords: "new idea wizard" },
  { label: "My Ideas", href: ROUTES.MY_IDEAS, icon: FileText, keywords: "kaizens submissions" },
  { label: "Leaderboard", href: ROUTES.LEADERBOARD, icon: Trophy, keywords: "ranking points achievements" },
  { label: "Notifications", href: ROUTES.NOTIFICATIONS, icon: FileText, keywords: "alerts" },
];

/** Static "Navigation pages" search corpus (Part 4) — small and fixed, so this is matched with
 * plain substring search on the client rather than round-tripping to the fuzzy backend endpoint
 * for a handful of known routes. */
export function getSearchablePages(role?: UserRole): SearchablePage[] {
  if (!role) return BASE_PAGES;
  const pages = [...BASE_PAGES];
  if (canReview(role)) {
    pages.push(
      { label: "Review Queue", href: ROUTES.REVIEW, icon: ClipboardList, keywords: "reviews approvals" },
      { label: "Implementation Queue", href: ROUTES.IMPLEMENTATION, icon: HardHat, keywords: "implementations progress" },
      { label: "Analytics", href: ROUTES.ANALYTICS, icon: BarChart3, keywords: "reports charts kpis" },
    );
  }
  if (canAccessAdmin(role)) {
    pages.push({ label: "Administration", href: ROUTES.ADMIN, icon: ShieldCheck, keywords: "admin settings users" });
  }
  return pages;
}
