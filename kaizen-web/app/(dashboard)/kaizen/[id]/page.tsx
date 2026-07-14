import type { Metadata } from "next";

import { KaizenCaseStudy } from "@/features/kaizen/components/workspace/kaizen-case-study";

export const metadata: Metadata = {
  title: "Kaizen Details",
};

interface KaizenDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function KaizenDetailPage({ params }: KaizenDetailPageProps) {
  const { id } = await params;

  return <KaizenCaseStudy id={id} />;
}
