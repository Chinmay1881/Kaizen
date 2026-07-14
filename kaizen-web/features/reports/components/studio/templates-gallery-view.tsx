"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Copy, LayoutTemplate, Pin, Star, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { SectionHeading } from "@/components/dashboard/section-heading";
import { toast } from "@/components/feedback/success-toast";
import { REPORT_TYPE_LABEL } from "@/features/reports/constants/report-types";
import { useApplyTemplate, useDeleteTemplate, useDuplicateTemplate, useReportTemplates, useToggleFavorite, useTogglePin } from "@/features/reports/hooks/use-report-templates";
import type { ReportTemplateItem } from "@/features/reports/types/report-template";
import { templateApplyHref } from "@/features/reports/utils/report-url";
import { fadeInUpVariants } from "@/lib/motion";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/format";

function TemplateCard({ template, index }: { template: ReportTemplateItem; index: number }) {
  const applyTemplate = useApplyTemplate();
  const duplicateTemplate = useDuplicateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const toggleFavorite = useToggleFavorite();
  const togglePin = useTogglePin();

  const activeFilterKeys = Object.entries(template.filters).filter(([, value]) => value !== undefined && value !== null && value !== "");

  function handleDelete() {
    if (!window.confirm(`Delete template "${template.name}"?`)) return;
    deleteTemplate.mutate(template.id, { onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not delete this template.") });
  }

  function handleDuplicate() {
    duplicateTemplate.mutate(template.id, {
      onSuccess: () => toast.success("Template duplicated."),
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not duplicate this template."),
    });
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeInUpVariants}
      transition={{ delay: Math.min(index, 10) * 0.03 }}
      className={cn("interactive-lift group flex flex-col gap-3 rounded-xl border bg-card p-5", template.isPinned && "border-primary/50")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold">{template.name}</p>
          <p className="text-muted-foreground text-xs">{REPORT_TYPE_LABEL[template.reportType]}</p>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Button variant="ghost" size="icon" aria-label={template.isFavorite ? "Unfavorite" : "Favorite"} onClick={() => toggleFavorite.mutate({ id: template.id, value: !template.isFavorite })}>
            <Star className={cn("h-4 w-4", template.isFavorite && "fill-warning text-warning")} />
          </Button>
          <Button variant="ghost" size="icon" aria-label={template.isPinned ? "Unpin" : "Pin"} onClick={() => togglePin.mutate({ id: template.id, value: !template.isPinned })}>
            <Pin className={cn("h-4 w-4", template.isPinned && "fill-primary text-primary")} />
          </Button>
        </div>
      </div>

      {/* Hover preview: the filters this template applies, real values, nothing rendered. */}
      <div className="flex flex-wrap gap-1.5 opacity-70 transition-opacity duration-150 group-hover:opacity-100">
        {activeFilterKeys.length === 0 ? (
          <span className="text-muted-foreground text-xs">No filters — full scope</span>
        ) : (
          activeFilterKeys.slice(0, 4).map(([key]) => (
            <Badge key={key} variant="secondary" className="text-[10px]">
              {key}
            </Badge>
          ))
        )}
        {!template.chartsEnabled ? (
          <Badge variant="outline" className="text-[10px]">
            Charts off
          </Badge>
        ) : null}
      </div>

      <p className="text-muted-foreground text-xs">{template.lastUsedAt ? `Last used ${formatDate(template.lastUsedAt)}` : "Never used"}</p>

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t pt-3">
        <Button size="sm" asChild onClick={() => applyTemplate.mutate(template.id)}>
          <Link href={templateApplyHref(template.id, template.reportType, template.filters)}>Apply</Link>
        </Button>
        <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={duplicateTemplate.isPending}>
          <Copy className="h-4 w-4" />
          Duplicate
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleteTemplate.isPending}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

function TemplateGrid({ templates }: { templates: ReportTemplateItem[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((template, index) => (
        <TemplateCard key={template.id} template={template} index={index} />
      ))}
    </div>
  );
}

/**
 * Redesign of `ReportTemplatesView` — a gallery grouped Pinned/Favorites/Recent/All. The brief
 * also names "Shared"/"Personal" groups, but `ReportTemplateItem` has no owner/shared field (the
 * list endpoint is already self-scoped), so there's no real distinction to group by — shown here
 * honestly as a single personal collection instead of fabricating a Shared section with nothing
 * in it.
 */
export function TemplatesGalleryView() {
  const query = useReportTemplates();

  if (query.isError) {
    return <ErrorState title="Couldn't load templates" description={query.error instanceof ApiError ? query.error.message : "Something went wrong."} onRetry={() => query.refetch()} />;
  }

  if (query.isLoading || !query.data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, index) => (
          <LoadingSkeleton key={index} className="h-56 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (query.data.length === 0) {
    return <EmptyState icon={LayoutTemplate} title="No templates yet" description='Generate a report and click "Save as Template" to reuse it later.' />;
  }

  const pinned = query.data.filter((t) => t.isPinned);
  const favorites = query.data.filter((t) => t.isFavorite && !t.isPinned);
  const recent = [...query.data]
    .filter((t) => t.lastUsedAt && !t.isPinned && !t.isFavorite)
    .sort((a, b) => new Date(b.lastUsedAt ?? 0).getTime() - new Date(a.lastUsedAt ?? 0).getTime())
    .slice(0, 3);
  const shownIds = new Set([...pinned, ...favorites, ...recent].map((t) => t.id));
  const rest = query.data.filter((t) => !shownIds.has(t.id));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Report Templates</h1>
        <p className="text-muted-foreground text-sm">Saved report configurations — pin, favorite, duplicate, or apply them.</p>
      </div>

      {pinned.length > 0 ? (
        <div className="flex flex-col gap-3">
          <SectionHeading title="Pinned" />
          <TemplateGrid templates={pinned} />
        </div>
      ) : null}

      {favorites.length > 0 ? (
        <div className="flex flex-col gap-3">
          <SectionHeading title="Favorites" />
          <TemplateGrid templates={favorites} />
        </div>
      ) : null}

      {recent.length > 0 ? (
        <div className="flex flex-col gap-3">
          <SectionHeading title="Recently Opened" />
          <TemplateGrid templates={recent} />
        </div>
      ) : null}

      {rest.length > 0 ? (
        <div className="flex flex-col gap-3">
          <SectionHeading title="All Templates" />
          <TemplateGrid templates={rest} />
        </div>
      ) : null}
    </div>
  );
}
