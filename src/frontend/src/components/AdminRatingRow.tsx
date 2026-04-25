import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Loader2, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAdminRemoveRating } from "../hooks/useQueries";
// Uses PublicRating shape from backend (reviewer, reviewerUsername, stars, review, etc.)
import { fromNanoseconds } from "../utils/formatting";

interface AdminRatingRowProps {
  rating: {
    listingId: bigint;
    reviewer?: { toString(): string };
    reviewerUsername: string;
    stars: bigint;
    review: string | null;
    createdAt: bigint;
  };
  sellerPrincipal: string;
}

export function AdminRatingRow({
  rating,
  sellerPrincipal,
}: AdminRatingRowProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const { mutate: removeRating, isPending } = useAdminRemoveRating();

  const handleRemove = () => {
    removeRating(
      { seller: sellerPrincipal, listingId: rating.listingId },
      {
        onSuccess: () => {
          toast.success("Rating removed");
          setShowConfirm(false);
        },
        onError: () => toast.error("Failed to remove rating"),
      },
    );
  };

  return (
    <>
      <div className="rounded-lg border p-3 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  // biome-ignore lint/suspicious/noArrayIndexKey: stable list
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    i < Number(rating.stars)
                      ? "fill-yellow-500 text-yellow-500"
                      : "text-muted-foreground",
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              Listing #{rating.listingId.toString()}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => setShowConfirm(true)}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        </div>
        {rating.review && (
          <p className="text-sm">&ldquo;{rating.review}&rdquo;</p>
        )}
        <p className="text-xs text-muted-foreground">
          By {rating.reviewerUsername} &middot;{" "}
          {format(fromNanoseconds(rating.createdAt), "MMM d, yyyy")}
        </p>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove rating?</AlertDialogTitle>
            <AlertDialogDescription>
              This rating will be removed and excluded from the seller&apos;s
              average rating.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
