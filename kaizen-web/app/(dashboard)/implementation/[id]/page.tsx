import type { Metadata } from "next";

import { ImplementationDetailView } from "@/features/implementation/components/detail/implementation-detail-view";

export const metadata: Metadata = {
  title: "Implementation Details",
};

interface ImplementationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ImplementationDetailPage({ params }: ImplementationDetailPageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <ImplementationDetailView id={id} />
    </div>
  );
}
