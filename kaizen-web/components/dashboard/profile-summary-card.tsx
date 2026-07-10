import { Briefcase, Building2, Mail } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ROLE_LABELS } from "@/constants/roles";
import type { CurrentUser } from "@/features/auth/types/user";
import { getInitials } from "@/utils/format";

interface ProfileSummaryCardProps {
  user: CurrentUser;
}

export function ProfileSummaryCard({ user }: ProfileSummaryCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Avatar
            src={user.avatarUrl}
            alt={user.displayName}
            fallback={getInitials(user.firstName, user.lastName)}
            className="h-14 w-14 text-base"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold">{user.displayName}</p>
            <Badge variant="secondary" className="mt-1">
              {ROLE_LABELS[user.role]}
            </Badge>
          </div>
        </div>

        <Separator />

        <dl className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="text-muted-foreground h-4 w-4 shrink-0" />
            <dt className="sr-only">Email</dt>
            <dd className="text-muted-foreground truncate">{user.email}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="text-muted-foreground h-4 w-4 shrink-0" />
            <dt className="sr-only">Department</dt>
            <dd className="text-muted-foreground">{user.department?.name ?? "—"}</dd>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="text-muted-foreground h-4 w-4 shrink-0" />
            <dt className="sr-only">Job Title</dt>
            <dd className="text-muted-foreground">{user.jobTitle ?? "—"}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
