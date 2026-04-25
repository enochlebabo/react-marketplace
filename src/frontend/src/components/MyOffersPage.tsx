import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { HandCoins } from "lucide-react";
import { useMyOffers } from "../hooks/useQueries";
import { MyOfferRow } from "./MyOfferRow";

export function MyOffersPage() {
  const { data: offers, isLoading, isError } = useMyOffers();

  if (isLoading) {
    return (
      <div className="space-y-4 py-4 md:py-6">
        <h1 className="text-2xl font-bold">My Offers</h1>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              // biome-ignore lint/suspicious/noArrayIndexKey: stable list
              key={i}
              className="h-20 w-full rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-4 md:py-6">
        <h1 className="text-2xl font-bold">My Offers</h1>
        <p className="mt-2 text-destructive">Failed to load offers.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-4 md:py-6">
      <h1 className="text-2xl font-bold">My Offers</h1>
      {!offers || offers.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <HandCoins className="h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">
            You haven&apos;t made any offers yet.
          </p>
          <Link to="/" className="text-sm text-primary hover:underline">
            Browse listings
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => (
            <MyOfferRow key={offer.id.toString()} offer={offer} />
          ))}
        </div>
      )}
    </div>
  );
}
