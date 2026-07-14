import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <LoadingSkeleton className="h-56 w-full rounded-2xl" />

      <div className="flex flex-col gap-4">
        <LoadingSkeleton className="h-6 w-48" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...new Array(4)].map((_, index) => (
            <LoadingSkeleton key={index} className="h-[68px] w-full rounded-xl" />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <LoadingSkeleton className="h-6 w-40" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[...new Array(4)].map((_, index) => (
            <LoadingSkeleton key={index} className="h-[340px] w-full rounded-xl" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <LoadingSkeleton className="h-96 w-full rounded-xl lg:col-span-2" />
        <LoadingSkeleton className="h-96 w-full rounded-xl" />
      </div>

      <div className="flex flex-col gap-4">
        <LoadingSkeleton className="h-6 w-40" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...new Array(3)].map((_, index) => (
            <LoadingSkeleton key={index} className="h-[220px] w-full rounded-xl" />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <LoadingSkeleton className="h-6 w-32" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[...new Array(4)].map((_, index) => (
            <LoadingSkeleton key={index} className="h-[104px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
