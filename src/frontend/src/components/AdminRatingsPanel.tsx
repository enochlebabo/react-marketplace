import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { useState } from "react";
// Reviews use PublicRating shape from backend
import { useAdminSellerReviews } from "../hooks/useQueries";
import { AdminRatingRow } from "./AdminRatingRow";

export function AdminRatingsPanel() {
  const [sellerInput, setSellerInput] = useState("");
  const [sellerPrincipal, setSellerPrincipal] = useState<string | undefined>(
    undefined,
  );

  const {
    data: reviews,
    isLoading,
    isError,
  } = useAdminSellerReviews(sellerPrincipal);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = sellerInput.trim();
    if (trimmed) {
      setSellerPrincipal(trimmed);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Enter seller principal ID..."
            value={sellerInput}
            onChange={(e) => setSellerInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" size="sm">
          Search
        </Button>
      </form>

      {!sellerPrincipal && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Enter a seller&apos;s principal ID to view and manage their ratings.
        </p>
      )}

      {sellerPrincipal && isLoading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {sellerPrincipal && isError && (
        <p className="text-sm text-destructive text-center py-8">
          Failed to load ratings. Make sure the principal ID is valid.
        </p>
      )}

      {sellerPrincipal &&
        !isLoading &&
        !isError &&
        reviews &&
        (reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No ratings found for this seller.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {reviews.length} rating{reviews.length !== 1 ? "s" : ""} found
            </p>
            {reviews.map((rating: any) => (
              <AdminRatingRow
                key={`${rating.reviewer?.toString?.() ?? rating.reviewerUsername}-${rating.listingId}`}
                rating={rating}
                sellerPrincipal={sellerPrincipal}
              />
            ))}
          </div>
        ))}
    </div>
  );
}
