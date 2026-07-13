"use client";

import Link from "next/link";
import { Clock, Copy, LayoutTemplate, Pin, Star, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { toast } from "@/components/feedback/success-toast";
import { REPORT_TYPE_LABEL } from "@/features/reports/constants/report-types";
import {
  useApplyTemplate,
  useDeleteTemplate,
  useDuplicateTemplate,
  useReportTemplates,
  useToggleFavorite,
  useTogglePin,
} from "@/features/reports/hooks/use-report-templates";
import type { ReportTemplateItem } from "@/features/reports/types/report-template";
import { filtersToSearchParams } from "@/features/reports/utils/report-url";
import { ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/format";

function TemplateCard({ template }: { template: ReportTemplateItem }) {
  const applyTemplate = useApplyTemplate();
  const duplicateTemplate = useDuplicateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const toggleFavorite = useToggleFavorite();
  const togglePin = useTogglePin();

  const applyHref = `/reports?${filtersToSearchParams(template.reportType, template.filters).toString()}`;

  function handleDelete() {
    if (!window.confirm(`Delete template "${template.name}"?`)) return;
    deleteTemplate.mutate(template.id, {
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not delete this template."),
    });
  }

  function handleDuplicate() {
    duplicateTemplate.mutate(template.id, {
      onSuccess: () => toast.success("Template duplicated."),
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Could not duplicate this template."),
    });
  }

  return (
    <Card className={cn(template.isPinned && "border-primary")}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{template.name}</CardTitle>
            <p className="text-muted-foreground text-xs">{REPORT_TYPE_LABEL[template.reportType]}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={template.isFavorite ? "Unfavorite" : "Favorite"}
              onClick={() => toggleFavorite.mutate({ id: template.id, value: !template.isFavorite })}
            >
              <Star className={cn("h-4 w-4", template.isFavorite && "fill-warning text-warning")} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={template.isPinned ? "Unpin" : "Pin"}
              onClick={() => togglePin.mutate({ id: template.id, value: !template.isPinned })}
            >
              <Pin className={cn("h-4 w-4", template.isPinned && "fill-primary text-primary")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(template.filters)
            .filter(([, value]) => value !== undefined && value !== null && value !== "")
            .slice(0, 4)
            .map(([key]) => (
              <Badge key={key} variant="secondary">
                {key}
              </Badge>
            ))}
          {!template.chartsEnabled ? <Badge variant="outline">Charts off</Badge> : null}
        </div>
        <p className="text-muted-foreground text-xs">
          {template.lastUsedAt ? `Last used ${formatDate(template.lastUsedAt)}` : "Never used"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" asChild onClick={() => applyTemplate.mutate(template.id)}>
            <Link href={applyHref}>Apply</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleDuplicate} disabled={duplicateTemplate.isPending}>
            <Copy className="h-4 w-4" />
            Duplicate
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleteTemplate.isPending}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/** Report Templates (Part 7) + Report Favorites (Part 8 — favorite/pin/recently-opened/duplicate
 * all attach to a Template; see the schema's own doc comment for why). */
export function ReportTemplatesView() {
  const query = useReportTemplates();

  if (query.isError) {
    const message = query.error instanceof ApiError ? query.error.message : "Something went wrong loading templates.";
    return <ErrorState title="Couldn't load templates" description={message} onRetry={() => query.refetch()} />;
  }

  if (query.isLoading || !query.data) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, index) => (
          <LoadingSkeleton key={index} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (query.data.length === 0) {
    return (
      <EmptyState
        icon={LayoutTemplate}
        title="No templates yet"
        description='Generate a report and click "Save as Template" to reuse it later.'
      />
    );
  }

  const recent = [...query.data]
    .filter((t) => t.lastUsedAt)
    .sort((a, b) => new Date(b.lastUsedAt ?? 0).getTime() - new Date(a.lastUsedAt ?? 0).getTime())
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Report Templates</h1>
        <p className="text-muted-foreground text-sm">Saved report configurations — pin, favorite, duplicate, or apply them.</p>
      </div>

      {recent.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Clock className="h-4 w-4" />
            Recently Opened
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">All Templates</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {query.data.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      </div>
    </div>
  );
}
