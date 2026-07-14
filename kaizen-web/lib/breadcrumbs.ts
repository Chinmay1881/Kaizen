import { ROUTES } from "@/constants/routes";

export interface PageContext {
  title: string;
  breadcrumbs: Array<{ label: string; href?: string }>;
}

const STATIC_ROUTES: Array<{ href: string; label: string; parent?: { label: string; href: string } }> = [
  { href: ROUTES.DASHBOARD, label: "Dashboard" },
  { href: ROUTES.ANALYTICS, label: "Analytics" },
  { href: ROUTES.MY_IDEAS, label: "My Ideas" },
  { href: ROUTES.NEW_KAIZEN, label: "Submit Idea", parent: { label: "My Ideas", href: ROUTES.MY_IDEAS } },
  { href: ROUTES.REVIEW, label: "Review Queue" },
  { href: ROUTES.IMPLEMENTATION, label: "Implementation" },
  { href: ROUTES.LEADERBOARD, label: "Leaderboard" },
  { href: ROUTES.NOTIFICATIONS, label: "Notifications" },
  { href: ROUTES.REPORTS, label: "Reports" },
  { href: ROUTES.REPORTS_HISTORY, label: "Download Center", parent: { label: "Reports", href: ROUTES.REPORTS } },
  { href: ROUTES.REPORTS_SCHEDULES, label: "Scheduled Reports", parent: { label: "Reports", href: ROUTES.REPORTS } },
  { href: ROUTES.REPORTS_TEMPLATES, label: "Report Templates", parent: { label: "Reports", href: ROUTES.REPORTS } },
  { href: ROUTES.ADMIN, label: "Administration" },
  { href: `${ROUTES.ADMIN}/users`, label: "Users", parent: { label: "Administration", href: ROUTES.ADMIN } },
  { href: `${ROUTES.ADMIN}/departments`, label: "Departments", parent: { label: "Administration", href: ROUTES.ADMIN } },
  { href: `${ROUTES.ADMIN}/categories`, label: "Categories", parent: { label: "Administration", href: ROUTES.ADMIN } },
  { href: `${ROUTES.ADMIN}/settings`, label: "Settings", parent: { label: "Administration", href: ROUTES.ADMIN } },
];

const DYNAMIC_ROUTES: Array<{ prefix: string; label: string; parent: { label: string; href: string } }> = [
  { prefix: `${ROUTES.MY_IDEAS}/`, label: "Idea Details", parent: { label: "My Ideas", href: ROUTES.MY_IDEAS } },
  { prefix: `${ROUTES.REVIEW}/`, label: "Review Details", parent: { label: "Review Queue", href: ROUTES.REVIEW } },
  {
    prefix: `${ROUTES.IMPLEMENTATION}/`,
    label: "Implementation Details",
    parent: { label: "Implementation", href: ROUTES.IMPLEMENTATION },
  },
];

/** Derives a page title + breadcrumb trail purely from the current pathname — no per-page
 * wiring needed, so every existing route (including ones later chunks will still redesign)
 * automatically gets a correct header without being touched. Falls back to the workspace default
 * for anything unrecognized (auth pages, the root redirect, etc.), which never renders since
 * `AppHeader` only mounts inside the authenticated dashboard layout. */
export function getPageContext(pathname: string): PageContext {
  const exact = STATIC_ROUTES.find((route) => route.href === pathname);
  if (exact) {
    return {
      title: exact.label,
      breadcrumbs: exact.parent
        ? [{ label: exact.parent.label, href: exact.parent.href }, { label: exact.label }]
        : [{ label: exact.label }],
    };
  }

  const dynamic = DYNAMIC_ROUTES.find((route) => pathname.startsWith(route.prefix));
  if (dynamic) {
    return {
      title: dynamic.label,
      breadcrumbs: [{ label: dynamic.parent.label, href: dynamic.parent.href }, { label: dynamic.label }],
    };
  }

  return { title: "Muliya Kaizan", breadcrumbs: [{ label: "Workspace" }] };
}
