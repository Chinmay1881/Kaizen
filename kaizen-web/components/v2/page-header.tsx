import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

/** V2's page-level title block — larger and quieter than `components/layout/page-header.tsx`
 * (kept untouched; every un-migrated V1 page still uses it). Deliberately separate rather than
 * changing the V1 version in place: bumping its type scale would visually shift every page still
 * on V1, which is out of scope for a Dashboard-only migration. */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {description ? <p className="text-muted-foreground text-base">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
