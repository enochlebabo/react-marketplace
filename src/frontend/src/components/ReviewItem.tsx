import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Flag, Star } from "lucide-react";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetUserProfile } from "../hooks/useQueries";
import { fromNanoseconds } from "../utils/formatting";
import { ReportDialog } from "./ReportDialog";

interface PublicRating {
  listingId: bigint;
  reviewer: { toString(): string };
  reviewerUsername: string;
  stars: bigint;
  review?: string | null;
  createdAt: bigint;
}

interface ReviewItemProps {
  review: PublicRating;
  sellerPrincipal: string;
}

export function ReviewItem({ review, sellerPrincipal }: ReviewItemProps) {
  const { identity } = useInternetIdentity();
  const [reportOpen, setReportOpen] = useState(false);
  const reviewerPrincipal = review.reviewer.toString();
  const { data: reviewerProfile } = useGetUserProfile(reviewerPrincipal);

  const reviewerName =
    reviewerProfile?.name || review.reviewerUsername || "Anonymous";
  const initials = reviewerName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const stars = Number(review.stars);
  const timeAgo = formatDistanceToNow(fromNanoseconds(review.createdAt), {
    addSuffix: true,
  });

  const currentPrincipal = identity?.getPrincipal().toString();
  const isOwnReview = currentPrincipal === reviewerPrincipal;

  return (
    <Card>
      <CardContent className="flex gap-3 p-4">
        <Link
          to="/profile/$id"
          params={{ id: reviewerPrincipal }}
          className="shrink-0"
        >
          <Avatar className="h-10 w-10">
            {reviewerProfile?.profilePhoto && (
              <AvatarImage
                src={reviewerProfile.profilePhoto.getDirectURL()}
                className="object-cover"
              />
            )}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to="/profile/$id"
                params={{ id: reviewerPrincipal }}
                className="font-medium hover:underline"
              >
                {reviewerName}
              </Link>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
            {identity && !isOwnReview && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => setReportOpen(true)}
              >
                <Flag className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                // biome-ignore lint/suspicious/noArrayIndexKey: stable list
                key={i}
                className={cn(
                  "h-3.5 w-3.5",
                  i < stars
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/30",
                )}
              />
            ))}
          </div>
          {review.review && (
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {review.review}
            </p>
          )}
        </div>
      </CardContent>
      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        target={{
          type: "rating",
          seller: sellerPrincipal,
          listingId: review.listingId,
        }}
      />
    </Card>
  );
}
