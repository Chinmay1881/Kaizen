import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Separator } from "@/components/ui/separator";
import { AchievementsGrid } from "@/features/gamification/components/achievements-grid";
import { LeaderboardView } from "@/features/gamification/components/leaderboard-view";

export const metadata: Metadata = {
  title: "Leaderboard",
};

export default function LeaderboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <PageHeader title="Leaderboard" description="See how you and your department rank." />
      <LeaderboardView />

      <Separator />

      <div className="flex flex-col gap-4">
        <PageHeader title="Achievements" description="Unlock these by contributing Kaizens." />
        <AchievementsGrid />
      </div>
    </div>
  );
}
