import type { Metadata } from "next";

import { ReviewWorkspace } from "@/features/review/components/workspace/review-workspace";

export const metadata: Metadata = {
  title: "Review Kaizen",
};

interface ReviewDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReviewDetailPage({ params }: ReviewDetailPageProps) {
  const { id } = await params;

  return <ReviewWorkspace initialId={id} />;
}
