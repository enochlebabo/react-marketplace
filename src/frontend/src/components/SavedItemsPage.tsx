import { Skeleton } from "@/components/ui/skeleton";
import { Bookmark } from "lucide-react";
import { useSavedListings } from "../hooks/useQueries";
import { BrowseListingCard } from "./BrowseListingCard";

export function SavedItemsPage() {
  const { data: savedListings, isLoading, isError } = useSavedListings();

  if (isLoading) {
    return (
      <div className="space-y-6 py-4 md:py-6">
        <h1 className="text-2xl font-bold">Saved Items</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              // biome-ignore lint/suspicious/noArrayIndexKey: stable list
              key={i}
              className="aspect-square rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-4 md:py-6">
        <h1 className="text-2xl font-bold">Saved Items</h1>
        <p className="mt-4 text-destructive">Failed to load saved items.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4 md:py-6">
      <h1 className="text-2xl font-bold">Saved Items</h1>

      {!savedListings || savedListings.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <Bookmark className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-lg font-medium">No saved items yet</p>
          <p className="text-sm text-muted-foreground">
            Bookmark listings you&apos;re interested in and they&apos;ll appear
            here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {savedListings.map((listing) => (
            <BrowseListingCard key={listing.id.toString()} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
