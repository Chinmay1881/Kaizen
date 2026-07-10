import {
  BadgeCheck,
  ClipboardList,
  Headset,
  HelpCircle,
  IndianRupee,
  Laptop,
  Megaphone,
  MoreHorizontal,
  Package,
  Shield,
  Store,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/** Maps `category.icon` (a Lucide component name stored as a string, seeded in kaizen-api/prisma/seed.ts) to the actual component. Falls back to a generic icon for anything unmapped. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Store,
  Package,
  Headset,
  Laptop,
  Megaphone,
  IndianRupee,
  Shield,
  Users,
  ClipboardList,
  Wrench,
  BadgeCheck,
  MoreHorizontal,
};

export function getCategoryIcon(iconName: string | null): LucideIcon {
  return (iconName && CATEGORY_ICONS[iconName]) || HelpCircle;
}
