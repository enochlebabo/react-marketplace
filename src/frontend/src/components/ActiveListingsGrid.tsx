import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { ImageIcon } from "lucide-react";
import { useBrowseListings } from "../hooks/useQueries";
import { formatPrice } from "../utils/formatting";

interface ActiveListingsGridProps {
  sellerPrincipal: string;
}

export function ActiveListingsGrid({
  sellerPrincipal,
}: ActiveListingsGridProps) {
  const { data: listings, isLoading, isError } = useBrowseListings({});

  const sellerListings = listings?.filter(
    (l) => l.seller.toString() === sellerPrincipal,
  );

  if (isLoading) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-semibold">Active Listings</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton
              // biome-ignore lint/suspicious/noArrayIndexKey: stable list
              key={i}
              className="h-48 rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-sm text-destructive">Failed to load listings.</div>
    );
  }

  if (!sellerListings || sellerListings.length === 0) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-semibold">Active Listings</h2>
        <p className="text-sm text-muted-foreground">
          This seller has no active listings.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Active Listings</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sellerListings.map((listing) => (
          <Link
            key={listing.id.toString()}
            to="/listing/$id"
            params={{ id: listing.id.toString() }}
            className="group"
          >
            <Card className="overflow-hidden transition-shadow hover:shadow-md">
              <div className="aspect-video bg-muted">
                {listing.photos.length > 0 ? (
                  <img
                    src={listing.photos[0].hash.getDirectURL()}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <CardContent className="p-3">
                <p className="truncate font-medium group-hover:underline">
                  {listing.title}
                </p>
                <p className="text-sm font-bold">
                  {formatPrice(listing.price, listing.currency)}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
