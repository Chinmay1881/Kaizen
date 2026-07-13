import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/empty-state";
import { Table2 } from "lucide-react";
import type { ReportResult } from "@/features/reports/types/report";

interface ReportTableProps {
  table: ReportResult["table"];
}

export function ReportTable({ table }: ReportTableProps) {
  if (table.columns.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Detailed Table</CardTitle>
      </CardHeader>
      <CardContent>
        {table.rows.length === 0 ? (
          <EmptyState icon={Table2} title="No matching records" description="Nothing matched the selected filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  {table.columns.map((column) => (
                    <th key={column.key} className="text-muted-foreground px-3 py-2 font-medium">
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row, index) => (
                  <tr key={index} className="border-b last:border-0">
                    {table.columns.map((column) => (
                      <td key={column.key} className="px-3 py-2">
                        {row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
