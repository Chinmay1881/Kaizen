import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

import { WorkspaceCard } from "@/components/v2/workspace-card";
import { cn } from "@/lib/utils";

interface ActionCardProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description?: string;
  cta: { label: string; href: string };
  className?: string;
}

/** A secondary "next up" row — one level down from `FocusCard`. The whole row is a single link
 * (rather than nesting a separate `<Link>` inside the card for the CTA label) so the interactive
 * surface stays one focusable element per card, not two competing for the same click/tab stop. */
export function ActionCard({ icon: Icon, eyebrow, title, description, cta, className }: ActionCardProps) {
  return (
    <Link
      href={cta.href}
      className="focus-visible:ring-ring focus-visible:ring-offset-background block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
    >
      <WorkspaceCard variant="interactive" className={cn("flex items-center gap-4 p-5", className)}>
        <div className="bg-muted text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{eyebrow}</p>
          <p className="truncate text-base font-semibold">{title}</p>
          {description ? <p className="text-muted-foreground truncate text-sm">{description}</p> : null}
        </div>
        <div className="text-muted-foreground flex shrink-0 items-center gap-1 text-sm font-medium">
          {cta.label}
          <ChevronRight className="h-4 w-4" />
        </div>
      </WorkspaceCard>
    </Link>
  );
}
