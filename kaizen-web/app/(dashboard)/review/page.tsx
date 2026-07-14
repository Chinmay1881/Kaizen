import type { Metadata } from "next";

import { ReviewWorkspace } from "@/features/review/components/workspace/review-workspace";

export const metadata: Metadata = {
  title: "Review Workspace",
};

export default function ReviewQueuePage() {
  return <ReviewWorkspace />;
}
