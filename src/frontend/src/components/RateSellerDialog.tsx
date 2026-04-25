import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Loader2, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRateSeller } from "../hooks/useQueries";

interface RateSellerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: bigint;
  sellerName: string;
}

export function RateSellerDialog({
  open,
  onOpenChange,
  listingId,
  sellerName,
}: RateSellerDialogProps) {
  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [review, setReview] = useState("");
  const [error, setError] = useState("");
  const { mutate: rateSeller, isPending } = useRateSeller();

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (nextOpen) {
      setStars(0);
      setHoveredStar(0);
      setReview("");
      setError("");
    }
  };

  const handleSubmit = () => {
    if (stars === 0) {
      setError("Please select a rating");
      return;
    }
    rateSeller(
      {
        listingId,
        stars: BigInt(stars),
        review: review.trim() || null,
      },
      {
        onSuccess: () => {
          toast.success("Rating submitted");
          onOpenChange(false);
        },
        onError: (err) => {
          setError(err.message || "Failed to submit rating");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Seller</DialogTitle>
          <DialogDescription>
            How was your experience with {sellerName}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-center gap-1">
            {Array.from({ length: 5 }, (_, i) => {
              const starValue = i + 1;
              const isFilled = starValue <= (hoveredStar || stars);
              return (
                <button
                  // biome-ignore lint/suspicious/noArrayIndexKey: stable list
                  key={i}
                  type="button"
                  className="rounded p-1 transition-transform hover:scale-110"
                  onClick={() => setStars(starValue)}
                  onMouseEnter={() => setHoveredStar(starValue)}
                  onMouseLeave={() => setHoveredStar(0)}
                  disabled={isPending}
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      isFilled
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30",
                    )}
                  />
                </button>
              );
            })}
          </div>

          <Textarea
            placeholder="Write an optional review..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
            disabled={isPending}
            rows={3}
          />

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || stars === 0}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Submitting..." : "Submit Rating"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
