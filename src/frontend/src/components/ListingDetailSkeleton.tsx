import { Skeleton } from "@/components/ui/skeleton";

export function ListingDetailSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 py-4 md:py-6">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="aspect-video w-full rounded-md" />
      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-9 w-32" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
