import {
  CheckCheck,
  CheckCircle2,
  Crown,
  FileStack,
  Lightbulb,
  Rocket,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from "lucide-react";

/** Maps `achievement.icon` (a Lucide component name stored as a string, seeded in
 * kaizen-api/prisma/seed.ts) to the actual component — same convention as
 * features/kaizen/constants/category-icons.ts. Falls back to Trophy for anything unmapped. */
const ACHIEVEMENT_ICONS: Record<string, LucideIcon> = {
  Lightbulb,
  FileStack,
  CheckCircle2,
  CheckCheck,
  Rocket,
  TrendingUp,
  Trophy,
  Sparkles,
  Crown,
  Star,
};

export function getAchievementIcon(iconName: string): LucideIcon {
  return ACHIEVEMENT_ICONS[iconName] ?? Trophy;
}
