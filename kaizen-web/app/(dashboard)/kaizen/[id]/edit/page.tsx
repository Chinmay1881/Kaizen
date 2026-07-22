import type { Metadata } from "next";

import { EditKaizenGate } from "@/features/kaizen/components/edit-kaizen-gate";

export const metadata: Metadata = {
  title: "Edit Kaizen",
};

interface EditKaizenPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditKaizenPage({ params }: EditKaizenPageProps) {
  const { id } = await params;

  return <EditKaizenGate id={id} />;
}
