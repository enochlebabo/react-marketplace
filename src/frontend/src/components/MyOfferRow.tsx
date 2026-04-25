import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { type Offer, OfferStatus } from "../backend";
import { useGetListing } from "../hooks/useQueries";
import { OFFER_STATUS_LABELS, getOfferStatusVariant } from "../utils/constants";
import { formatPrice, fromNanoseconds } from "../utils/formatting";

interface MyOfferRowProps {
  offer: Offer;
}

export function MyOfferRow({ offer }: MyOfferRowProps) {
  const { data: listing } = useGetListing(offer.listingId.toString());
  const currency = listing?.currency;
  const title = listing?.title ?? `Listing #${offer.listingId.toString()}`;

  return (
    <Link
      to="/listing/$id"
      params={{ id: offer.listingId.toString() }}
      className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(fromNanoseconds(offer.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold">
            {formatPrice(offer.amount, currency)}
          </span>
          <Badge variant={getOfferStatusVariant(offer.status as OfferStatus)}>
            {OFFER_STATUS_LABELS[offer.status as OfferStatus]}
          </Badge>
        </div>
      </div>
      {offer.status === OfferStatus.countered &&
        offer.counterAmount != null && (
          <p className="mt-1 text-xs text-muted-foreground">
            Seller countered: {formatPrice(offer.counterAmount, currency)}
          </p>
        )}
    </Link>
  );
}
