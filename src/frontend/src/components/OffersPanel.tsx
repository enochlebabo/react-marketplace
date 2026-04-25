import { useGetListing, useOffersForListing } from "../hooks/useQueries";
import { DEFAULT_CURRENCY } from "../utils/constants";
import { OfferRow } from "./OfferRow";

interface OffersPanelProps {
  listingId: string;
}

export function OffersPanel({ listingId }: OffersPanelProps) {
  const { data: offers, isLoading, isError } = useOffersForListing(listingId);
  const { data: listing } = useGetListing(listingId);
  const currency = listing?.currency || DEFAULT_CURRENCY;

  if (isLoading) {
    return (
      <div className="rounded-lg border p-4">
        <h3 className="mb-3 font-semibold">Offers</h3>
        <p className="text-sm text-muted-foreground">Loading offers...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border p-4">
        <h3 className="mb-3 font-semibold">Offers</h3>
        <p className="text-sm text-destructive">Failed to load offers.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-3 font-semibold">
        Offers {offers && offers.length > 0 && `(${offers.length})`}
      </h3>
      {!offers || offers.length === 0 ? (
        <p className="text-sm text-muted-foreground">No offers yet.</p>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => (
            <OfferRow
              key={offer.id.toString()}
              offer={offer}
              listingId={listingId}
              currency={currency}
            />
          ))}
        </div>
      )}
    </div>
  );
}
