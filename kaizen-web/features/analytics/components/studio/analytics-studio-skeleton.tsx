import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";

export function AnalyticsStudioSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <LoadingSkeleton className="h-24 w-full rounded-xl" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <LoadingSkeleton key={index} className="h-40 w-full rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[...Array(4)].map((_, index) => (
          <LoadingSkeleton key={index} className="h-80 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
