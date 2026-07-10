import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="space-y-2">
        <LoadingSkeleton className="h-9 w-72" />
        <LoadingSkeleton className="h-5 w-56" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {[...new Array(5)].map((_, index) => (
          <Card key={index}>
            <CardContent className="flex flex-col gap-3 p-6">
              <LoadingSkeleton className="h-10 w-10 rounded-xl" />
              <LoadingSkeleton className="h-7 w-16" />
              <LoadingSkeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {[...new Array(3)].map((_, index) => (
          <Card key={index} className="h-64">
            <CardHeader>
              <LoadingSkeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <LoadingSkeleton className="h-4 w-full" />
              <LoadingSkeleton className="h-4 w-full" />
              <LoadingSkeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <LoadingSkeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="flex gap-3">
          <LoadingSkeleton className="h-10 w-32" />
          <LoadingSkeleton className="h-10 w-32" />
          <LoadingSkeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    </div>
  );
}
