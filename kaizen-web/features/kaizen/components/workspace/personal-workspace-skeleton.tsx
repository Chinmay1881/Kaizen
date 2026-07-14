import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";

export function PersonalWorkspaceSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr_320px]">
        <div className="flex flex-col gap-4">
          <LoadingSkeleton className="h-64 w-full rounded-2xl" />
          <LoadingSkeleton className="h-28 w-full rounded-xl" />
        </div>
        <div className="flex flex-col gap-4">
          <LoadingSkeleton className="h-10 w-2/3" />
          {[...Array(3)].map((_, index) => (
            <LoadingSkeleton key={index} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {[...Array(4)].map((_, index) => (
            <LoadingSkeleton key={index} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </div>
      <LoadingSkeleton className="h-56 w-full rounded-2xl" />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {[...Array(8)].map((_, index) => (
          <LoadingSkeleton key={index} className="aspect-square w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
