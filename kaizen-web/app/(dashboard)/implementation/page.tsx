import type { Metadata } from "next";

import { ImplementationWorkspace } from "@/features/implementation/components/workspace/implementation-workspace";

export const metadata: Metadata = {
  title: "Implementation Workspace",
};

export default function ImplementationQueuePage() {
  return <ImplementationWorkspace />;
}
