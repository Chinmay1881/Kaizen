import { ListChecks, Plus, Trophy } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";

interface QuickAction {
  label: string;
  icon: LucideIcon;
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Submit Kaizen", icon: Plus },
  { label: "View Ideas", icon: ListChecks },
  { label: "Leaderboard", icon: Trophy },
];

/** Actions are disabled until the Kaizen Wizard and Gamification milestones ship. */
export function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks, coming soon.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        {QUICK_ACTIONS.map((action) => (
          <Tooltip key={action.label} content="Coming soon">
            <Button variant="outline" disabled className="gap-2">
              <action.icon className="h-4 w-4" />
              {action.label}
            </Button>
          </Tooltip>
        ))}
      </CardContent>
    </Card>
  );
}
