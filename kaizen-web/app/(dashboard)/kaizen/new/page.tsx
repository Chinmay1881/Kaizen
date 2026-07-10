import type { Metadata } from "next";

import { KaizenWizard } from "@/features/kaizen/components/kaizen-wizard";

export const metadata: Metadata = {
  title: "Submit Kaizen",
};

export default function NewKaizenPage() {
  return <KaizenWizard />;
}
