import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/v2/section-header";

interface DashboardSectionProps {
  title: string;
  description?: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
  className?: string;
}

/** `SectionHeader` + content, spaced consistently — replaces the
 * `<div className="flex flex-col gap-4"><SectionHeading/>{content}</div>` shape every V1
 * dashboard component (mission-critical, personal-workspace, quick-actions-grid, ...) rewrote by
 * hand. One place decides "how far a section's body sits from its heading." */
export function DashboardSection({ title, description, action, children, className }: DashboardSectionProps) {
  return (
    <section className={cn("flex flex-col gap-5", className)}>
      <SectionHeader title={title} description={description} action={action} />
      {children}
    </section>
  );
}
