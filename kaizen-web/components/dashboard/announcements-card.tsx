import { Megaphone } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/** Placeholder until the Admin Panel milestone exists to publish real announcements. */
export function AnnouncementsCard() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Announcements</CardTitle>
        <CardDescription>Latest announcements will appear here.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-8 text-center">
          <Megaphone className="h-6 w-6" />
          <p className="text-sm">No announcements yet</p>
        </div>
      </CardContent>
    </Card>
  );
}
