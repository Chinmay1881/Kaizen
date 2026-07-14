import type { Metadata } from "next";

import { PersonalWorkspaceView } from "@/features/kaizen/components/workspace/personal-workspace-view";

export const metadata: Metadata = {
  title: "My Innovation Workspace",
};

export default function MyIdeasPage() {
  return <PersonalWorkspaceView />;
}
