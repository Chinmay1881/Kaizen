"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { DashboardSection } from "@/components/v2/dashboard-section";
import { FocusCard } from "@/components/v2/focus-card";
import { ListItem } from "@/components/v2/list-item";
import { SectionHeader } from "@/components/v2/section-header";
import { StatusBadge, type StatusTone } from "@/components/v2/status-badge";
import { WorkspaceCard } from "@/components/v2/workspace-card";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import type { AttentionItem } from "@/components/dashboard-v2/use-attention-items";

const TONE_RANK: Record<StatusTone, number> = { critical: 3, warning: 2, info: 1, success: 0, neutral: 0 };

const TONE_BADGE: Record<StatusTone, string> = {
  critical: "Immediate Action",
  warning: "Needs Attention",
  info: "For Your Review",
  success: "All Clear",
  neutral: "For Your Review",
};

interface FocusSectionProps {
  items: AttentionItem[];
  isLoading: boolean;
}

/** Answers Q1, "what requires my attention today?" — one `FocusCard` for the single most urgent
 * item, everything else that still has a nonzero count as a real "Other Items Needing Attention"
 * list below it (the mockup's "Upcoming Tasks" slot has no backing calendar/task feature in this
 * app, so it's filled with real remaining attention items instead of fabricated task rows).
 * "Dismiss" is local UI state only — no query, mutation, or persistence — so it just promotes the
 * next-highest item for the rest of this session; it resets on reload. */
export function FocusSection({ items, isLoading }: FocusSectionProps) {
  const [dismissedKeys, setDismissedKeys] = useState<ReadonlySet<string>>(new Set());

  if (isLoading) {
    return (
      <DashboardSection title="Focus">
        <LoadingSkeleton className="h-44 w-full rounded-2xl" />
        <LoadingSkeleton className="h-32 w-full rounded-2xl" />
      </DashboardSection>
    );
  }

  const actionable = items.filter((item) => item.count > 0 && !dismissedKeys.has(item.key));

  if (actionable.length === 0) {
    return (
      <DashboardSection title="Focus">
        <WorkspaceCard className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="bg-success/15 text-success flex h-11 w-11 items-center justify-center rounded-xl">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold">You&apos;re all caught up</p>
            <p className="text-muted-foreground text-sm">Nothing needs your attention right now.</p>
          </div>
        </WorkspaceCard>
      </DashboardSection>
    );
  }

  const [hero, ...rest] = [...actionable].sort((a, b) => TONE_RANK[b.tone] - TONE_RANK[a.tone]);

  return (
    <DashboardSection title="Focus">
      <FocusCard
        tone={hero.tone}
        badgeLabel={TONE_BADGE[hero.tone]}
        meta={hero.meta}
        title={hero.title}
        cta={{ label: hero.ctaLabel, href: hero.href }}
        secondaryAction={{
          label: "Dismiss",
          onClick: () => setDismissedKeys((prev) => new Set(prev).add(hero.key)),
        }}
      />

      {rest.length > 0 ? (
        <div className="flex flex-col gap-3">
          <SectionHeader title="Other Items Needing Attention" />
          <WorkspaceCard className="divide-border flex flex-col divide-y p-2">
            {rest.map((item) => (
              <ListItem
                key={item.key}
                icon={item.icon}
                title={item.title}
                subtitle={item.meta}
                href={item.href}
                trailing={
                  <StatusBadge tone={item.tone} className="text-[10px] tracking-wide uppercase">
                    {TONE_BADGE[item.tone]}
                  </StatusBadge>
                }
              />
            ))}
          </WorkspaceCard>
        </div>
      ) : null}
    </DashboardSection>
  );
}
