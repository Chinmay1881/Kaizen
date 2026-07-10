import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { MyIdeasView } from "@/features/kaizen/components/my-ideas/my-ideas-view";

export const metadata: Metadata = {
  title: "My Ideas",
};

export default function MyIdeasPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <PageHeader title="My Ideas" description="Every Kaizen you've created, in one place." />
      <MyIdeasView />
    </div>
  );
}
