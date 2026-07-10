import type { Metadata } from "next";

import { MyIdeasDetailView } from "@/features/kaizen/components/detail/my-ideas-detail-view";

export const metadata: Metadata = {
  title: "Kaizen Details",
};

interface KaizenDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function KaizenDetailPage({ params }: KaizenDetailPageProps) {
  const { id } = await params;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <MyIdeasDetailView id={id} />
    </div>
  );
}
