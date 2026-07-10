import { CheckCircle2, Lightbulb, Medal, Rocket, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { CurrentUserGamification } from "@/features/auth/types/user";
import { formatNumber } from "@/utils/format";

interface StatsCardsProps {
  gamification: CurrentUserGamification;
}

interface StatDefinition {
  label: string;
  value: number | null;
  icon: LucideIcon;
}

export function StatsCards({ gamification }: StatsCardsProps) {
  const stats: StatDefinition[] = [
    { label: "Total Points", value: gamification.totalPoints, icon: Trophy },
    { label: "Ideas Submitted", value: gamification.ideasSubmitted, icon: Lightbulb },
    { label: "Ideas Approved", value: gamification.ideasApproved, icon: CheckCircle2 },
    { label: "Ideas Implemented", value: gamification.ideasImplemented, icon: Rocket },
    { label: "Current Rank", value: gamification.currentRank, icon: Medal },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="flex flex-col gap-3 p-6">
            <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-xl">
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">
                {stat.value === null ? "—" : formatNumber(stat.value)}
              </p>
              <p className="text-muted-foreground text-sm">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
