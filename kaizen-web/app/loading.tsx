import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <LoadingSkeleton className="h-32 w-full max-w-md" />
    </div>
  );
}
