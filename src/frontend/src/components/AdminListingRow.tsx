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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ExternalLink, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Listing } from "../backend";
import { useAdminRemoveListing, useGetUserProfile } from "../hooks/useQueries";
import { STATUS_LABELS } from "../utils/constants";
import { formatPrice, fromNanoseconds } from "../utils/formatting";

interface AdminListingRowProps {
  listing: Listing;
}

export function AdminListingRow({ listing }: AdminListingRowProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const { mutate: removeListing, isPending } = useAdminRemoveListing();
  const { data: sellerProfile } = useGetUserProfile(listing.seller.toString());

  const sellerName =
    sellerProfile?.name ?? `${listing.seller.toString().slice(0, 16)}...`;

  const handleRemove = () => {
    removeListing(listing.id, {
      onSuccess: () => {
        toast.success("Listing removed");
        setShowConfirm(false);
      },
      onError: () => toast.error("Failed to remove listing"),
    });
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
        <div className="flex items-center gap-3 min-w-0">
          {listing.photos.length > 0 ? (
            <img
              src={listing.photos[0].hash.getDirectURL()}
              alt={listing.title}
              className="h-12 w-12 rounded-md object-cover shrink-0"
            />
          ) : (
            <div className="h-12 w-12 rounded-md bg-muted shrink-0" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{listing.title}</p>
              <Badge variant="outline">
                {STATUS_LABELS[listing.status] ?? listing.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatPrice(listing.price, listing.currency)} &middot;{" "}
              {sellerName} &middot;{" "}
              {format(fromNanoseconds(listing.createdAt), "MMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            to="/listing/$id"
            params={{ id: listing.id.toString() }}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 w-8 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
          >
            <ExternalLink className="h-4 w-4" />
          </Link>
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={() => setShowConfirm(true)}
          >
            {isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-1 h-4 w-4" />
            )}
            Remove
          </Button>
        </div>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove listing?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{listing.title}&rdquo; will be permanently removed and
              hidden from all feeds.
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
