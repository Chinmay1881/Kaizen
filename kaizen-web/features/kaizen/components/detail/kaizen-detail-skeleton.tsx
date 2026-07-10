import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";

export function KaizenDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-3">
        <LoadingSkeleton className="h-4 w-32" />
        <LoadingSkeleton className="h-8 w-2/3" />
        <div className="flex gap-2">
          <LoadingSkeleton className="h-6 w-20" />
          <LoadingSkeleton className="h-6 w-20" />
          <LoadingSkeleton className="h-6 w-24" />
        </div>
      </div>

      {[...new Array(4)].map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <LoadingSkeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-2">
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
