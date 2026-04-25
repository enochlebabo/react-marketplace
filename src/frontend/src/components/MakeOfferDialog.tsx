import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useMakeOffer } from "../hooks/useQueries";
import { formatPrice } from "../utils/formatting";

interface MakeOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: bigint;
  listingPrice: bigint;
  listingCurrency: string;
}

export function MakeOfferDialog({
  open,
  onOpenChange,
  listingId,
  listingPrice,
  listingCurrency,
}: MakeOfferDialogProps) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const { mutate: makeOffer, isPending } = useMakeOffer();

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (open) {
      setAmount("");
      setError("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number.parseInt(amount, 10);
    if (!amount || Number.isNaN(parsed) || parsed <= 0) {
      setError("Please enter a valid amount greater than zero");
      return;
    }
    makeOffer(
      { listingId, amount: BigInt(parsed) },
      {
        onSuccess: () => {
          toast.success("Offer sent");
          onOpenChange(false);
        },
        onError: (err) => {
          setError(err.message || "Failed to send offer");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Make an Offer</DialogTitle>
            <DialogDescription>
              Listing price: {formatPrice(listingPrice, listingCurrency)}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="offer-amount">
                Your offer ({listingCurrency})
              </Label>
              <Input
                id="offer-amount"
                type="number"
                min="1"
                placeholder="Enter your offer amount"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError("");
                }}
                disabled={isPending}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Sending..." : "Send Offer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
