import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { ImplementationQueueView } from "@/features/implementation/components/queue/implementation-queue-view";

export const metadata: Metadata = {
  title: "Implementation Tracking",
};

export default function ImplementationQueuePage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader
        title="Implementation Tracking"
        description="Approved Kaizens in progress, awaiting completion, or awaiting verification."
      />
      <ImplementationQueueView />
    </div>
  );
}
