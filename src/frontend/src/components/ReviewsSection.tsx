import { Skeleton } from "@/components/ui/skeleton";
import { useSellerReviews } from "../hooks/useQueries";
import { ReviewItem } from "./ReviewItem";

interface ReviewsSectionProps {
  sellerPrincipal: string;
}

export function ReviewsSection({ sellerPrincipal }: ReviewsSectionProps) {
  const {
    data: reviews,
    isLoading,
    isError,
  } = useSellerReviews(sellerPrincipal);

  if (isLoading) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-semibold">Reviews</h2>
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-lg" />
          <Skeleton className="h-20 rounded-lg" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-semibold">Reviews</h2>
        <p className="text-sm text-destructive">Failed to load reviews.</p>
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div>
        <h2 className="mb-4 text-lg font-semibold">Reviews</h2>
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">
        Reviews{" "}
        <span className="text-sm font-normal text-muted-foreground">
          ({reviews.length})
        </span>
      </h2>
      <div className="space-y-3">
        {reviews.map((review) => (
          <ReviewItem
            key={`${review.reviewer?.toString?.() ?? review.reviewerUsername}-${review.listingId.toString()}`}
            review={review}
            sellerPrincipal={sellerPrincipal}
          />
        ))}
      </div>
    </div>
  );
}
