import { Card, CardContent } from "@/components/ui/card";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";

export function MyIdeasSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <LoadingSkeleton className="h-12 w-full" />
      <div className="flex flex-col gap-3">
        {[...new Array(5)].map((_, index) => (
          <Card key={index}>
            <CardContent className="flex flex-col gap-3 p-5">
              <div className="flex items-center justify-between gap-4">
                <LoadingSkeleton className="h-5 w-1/3" />
                <LoadingSkeleton className="h-5 w-20" />
              </div>
              <LoadingSkeleton className="h-4 w-2/3" />
              <div className="flex gap-2">
                <LoadingSkeleton className="h-5 w-16" />
                <LoadingSkeleton className="h-5 w-16" />
                <LoadingSkeleton className="h-5 w-24" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
