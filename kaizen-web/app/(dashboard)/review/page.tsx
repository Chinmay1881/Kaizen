import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { ReviewQueueView } from "@/features/review/components/queue/review-queue-view";

export const metadata: Metadata = {
  title: "Review Workspace",
};

export default function ReviewQueuePage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        title="Review Workspace"
        description="Kaizens submitted by your team, waiting for review."
      />
      <ReviewQueueView />
    </div>
  );
}
