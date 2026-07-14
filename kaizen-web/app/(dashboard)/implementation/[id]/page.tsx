import type { Metadata } from "next";

import { ImplementationWorkspace } from "@/features/implementation/components/workspace/implementation-workspace";

export const metadata: Metadata = {
  title: "Implementation Details",
};

interface ImplementationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ImplementationDetailPage({ params }: ImplementationDetailPageProps) {
  const { id } = await params;

  return <ImplementationWorkspace initialId={id} />;
}
