import type { UserRole } from "@/types/enums";

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  roles: UserRole[];
}

export const EMPLOYEE_NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", roles: ["EMPLOYEE"] },
  { label: "Submit Kaizen", href: "/kaizen/new", icon: "Lightbulb", roles: ["EMPLOYEE"] },
  { label: "My Ideas", href: "/kaizen", icon: "FileText", roles: ["EMPLOYEE"] },
  { label: "Knowledge Base", href: "/knowledge-base", icon: "BookOpen", roles: ["EMPLOYEE"] },
  { label: "Leaderboard", href: "/leaderboard", icon: "Trophy", roles: ["EMPLOYEE"] },
  { label: "Achievements", href: "/achievements", icon: "Award", roles: ["EMPLOYEE"] },
  { label: "Profile", href: "/profile", icon: "User", roles: ["EMPLOYEE"] },
  { label: "Settings", href: "/settings", icon: "Settings", roles: ["EMPLOYEE"] },
];

export const MANAGER_NAV: NavItem[] = [
  ...EMPLOYEE_NAV,
  { label: "Review", href: "/review", icon: "ClipboardCheck", roles: ["DEPARTMENT_MANAGER"] },
  {
    label: "Implementation",
    href: "/implementation",
    icon: "Workflow",
    roles: ["DEPARTMENT_MANAGER"],
  },
  { label: "Analytics", href: "/analytics", icon: "BarChart3", roles: ["DEPARTMENT_MANAGER"] },
];

export function getNavItemsForRole(role: UserRole): NavItem[] {
  switch (role) {
    case "SUPER_ADMIN":
    case "CMD":
    case "HR":
      return MANAGER_NAV;
    case "DEPARTMENT_MANAGER":
      return MANAGER_NAV;
    default:
      return EMPLOYEE_NAV;
  }
}
