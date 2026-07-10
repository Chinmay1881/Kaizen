import Link from "next/link";
import { Building2, ChevronRight, Settings as SettingsIcon, Tag, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface AdminSection {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

const SECTIONS: AdminSection[] = [
  {
    label: "Users",
    description: "Create accounts, assign roles and departments, deactivate access.",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Departments",
    description: "Manage departments and assign a manager to each.",
    href: "/admin/departments",
    icon: Building2,
  },
  {
    label: "Categories",
    description: "Manage the Kaizen submission categories.",
    href: "/admin/categories",
    icon: Tag,
  },
  {
    label: "Platform Settings",
    description: "Tune points values and other platform-wide configuration.",
    href: "/admin/settings",
    icon: SettingsIcon,
  },
];

export function AdminOverview() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {SECTIONS.map((section) => (
        <Link key={section.href} href={section.href}>
          <Card className="hover:border-primary/50 h-full transition-colors">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                <section.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">{section.label}</p>
                <p className="text-muted-foreground text-sm">{section.description}</p>
              </div>
              <ChevronRight className="text-muted-foreground h-5 w-5 shrink-0" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
