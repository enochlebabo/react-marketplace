import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { ArrowRightLeft, Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { type Offer, OfferResponse, OfferStatus } from "../backend";
import { useGetUserProfile, useRespondToOffer } from "../hooks/useQueries";
import { OFFER_STATUS_LABELS, getOfferStatusVariant } from "../utils/constants";
import { formatPrice, fromNanoseconds } from "../utils/formatting";

interface OfferRowProps {
  offer: Offer;
  listingId: string;
  currency: string;
}

export function OfferRow({ offer, listingId, currency }: OfferRowProps) {
  const buyerPrincipal = offer.buyer.toString();
  const { data: buyerProfile } = useGetUserProfile(buyerPrincipal);
  const { mutate: respondToOffer, isPending } = useRespondToOffer();
  const [counterAmount, setCounterAmount] = useState("");
  const [showCounter, setShowCounter] = useState(false);

  const handleRespond = (response: OfferResponse, counter?: bigint) => {
    respondToOffer(
      {
        offerId: offer.id,
        listingId: BigInt(listingId),
        response,
        counterAmount: counter,
      },
      {
        onSuccess: () => {
          const label =
            response === OfferResponse.accept
              ? "accepted"
              : response === OfferResponse.decline
                ? "declined"
                : "countered";
          toast.success(`Offer ${label}`);
          setShowCounter(false);
          setCounterAmount("");
        },
        onError: (err) => {
          toast.error(err.message || "Failed to respond to offer");
        },
      },
    );
  };

  const handleCounter = () => {
    const parsed = Number.parseInt(counterAmount, 10);
    if (!counterAmount || Number.isNaN(parsed) || parsed <= 0) return;
    handleRespond(OfferResponse.counter, BigInt(parsed));
  };

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {buyerProfile?.name ?? "Unknown buyer"}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(fromNanoseconds(offer.createdAt), {
              addSuffix: true,
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">
            {formatPrice(offer.amount, currency)}
          </span>
          <Badge variant={getOfferStatusVariant(offer.status as OfferStatus)}>
            {OFFER_STATUS_LABELS[offer.status as OfferStatus]}
          </Badge>
        </div>
      </div>

      {offer.status === OfferStatus.countered &&
        offer.counterAmount != null && (
          <p className="text-xs text-muted-foreground">
            Counter: {formatPrice(offer.counterAmount, currency)}
          </p>
        )}

      {offer.status === OfferStatus.pending && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => handleRespond(OfferResponse.accept)}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <Check className="mr-1 h-3 w-3" />
            )}
            Accept
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleRespond(OfferResponse.decline)}
            disabled={isPending}
          >
            <X className="mr-1 h-3 w-3" />
            Decline
          </Button>
          {!showCounter ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCounter(true)}
              disabled={isPending}
            >
              <ArrowRightLeft className="mr-1 h-3 w-3" />
              Counter
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min="1"
                placeholder="$"
                className="h-8 w-24"
                value={counterAmount}
                onChange={(e) => setCounterAmount(e.target.value)}
                disabled={isPending}
              />
              <Button
                size="sm"
                variant="outline"
                onClick={handleCounter}
                disabled={isPending || !counterAmount}
              >
                Send
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
