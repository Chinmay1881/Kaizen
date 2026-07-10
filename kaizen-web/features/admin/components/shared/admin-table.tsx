import { cn } from "@/lib/utils";

export interface AdminTableColumn<T> {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

interface AdminTableProps<T> {
  columns: AdminTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
}

/** Dependency-free `<table>` (no `@tanstack/react-table` installed) — small and reusable across
 * every Admin Portal list. `components/data-table/*` were literal `return null;` stubs planned
 * around that library; this is a minimal, working replacement scoped to what the Admin Portal
 * actually needs (no sorting/column-visibility toolbar). */
export function AdminTable<T>({ columns, rows, getRowKey }: AdminTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th
                key={column.header}
                className={cn("px-4 py-3 text-left font-medium", column.className)}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={getRowKey(row)} className="hover:bg-muted/30 transition-colors">
              {columns.map((column) => (
                <td key={column.header} className={cn("px-4 py-3 align-middle", column.className)}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
