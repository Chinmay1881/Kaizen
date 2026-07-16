import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";

/** Full-page fallback for when `useCurrentUser()` hasn't resolved yet — before any
 * role-conditional section can even decide what to render. Mirrors `DashboardBody`'s actual
 * layout order (greeting, quick-action pills, Focus/Performance split, Ideas Summary) so the page
 * doesn't visibly reflow once the user loads. Each section has its own narrower loading state
 * after that; this one only covers the "we don't know who's looking yet" gap. */
export function DashboardSkeletonV2() {
  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3">
        <LoadingSkeleton className="h-11 w-1/2 rounded-lg" />
        <LoadingSkeleton className="h-8 w-2/3 rounded-lg" />
      </div>

      <div className="flex flex-wrap gap-3">
        {[...new Array(4)].map((_, index) => (
          <LoadingSkeleton key={index} className="h-10 w-32 rounded-full" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          <LoadingSkeleton className="h-7 w-24" />
          <LoadingSkeleton className="h-44 w-full rounded-2xl" />
          <LoadingSkeleton className="h-32 w-full rounded-2xl" />
        </div>
        <div className="flex flex-col gap-5">
          <LoadingSkeleton className="h-7 w-32" />
          <LoadingSkeleton className="h-72 w-full rounded-2xl" />
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <LoadingSkeleton className="h-7 w-32" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[...new Array(3)].map((_, index) => (
            <LoadingSkeleton key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
