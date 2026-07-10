import type { Metadata } from "next";

import { ReviewDetailView } from "@/features/review/components/detail/review-detail-view";

export const metadata: Metadata = {
  title: "Review Kaizen",
};

interface ReviewDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReviewDetailPage({ params }: ReviewDetailPageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <ReviewDetailView id={id} />
    </div>
  );
}
