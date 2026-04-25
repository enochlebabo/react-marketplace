import { cn } from "@/lib/utils";
import type { Principal } from "@icp-sdk/core/principal";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Bookmark, ImageIcon, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { ListingStatus, type Media } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetUserProfile,
  useProfile,
  useSaveListing,
  useSavedListingIds,
  useUnsaveListing,
} from "../hooks/useQueries";
import { STATUS_LABELS } from "../utils/constants";
import { calculateDistance, formatDistance } from "../utils/distance";
import { formatPrice, fromNanoseconds } from "../utils/formatting";

interface BrowseListingCardProps {
  listing: {
    id: bigint;
    title: string;
    price: bigint;
    currency: string;
    status?: ListingStatus;
    seller: Principal;
    photos: Array<Media>;
    createdAt: bigint;
  };
}

export function BrowseListingCard({ listing }: BrowseListingCardProps) {
  const { identity } = useInternetIdentity();
  const { data: profile } = useProfile();
  const { data: sellerProfile } = useGetUserProfile(listing.seller.toString());
  const savedIds = useSavedListingIds();
  const { mutate: saveListing, isPending: isSaving } = useSaveListing();
  const { mutate: unsaveListing, isPending: isUnsaving } = useUnsaveListing();
  const isSaved = savedIds.has(listing.id);
  const isSaveToggling = isSaving || isUnsaving;

  const primaryPhoto = listing.photos[0];
  const timeAgo = formatDistanceToNow(fromNanoseconds(listing.createdAt), {
    addSuffix: true,
  });

  const distanceKm =
    profile?.latitude != null &&
    profile?.longitude != null &&
    sellerProfile?.latitude != null &&
    sellerProfile?.longitude != null
      ? calculateDistance(
          profile.latitude,
          profile.longitude,
          sellerProfile.latitude,
          sellerProfile.longitude,
        )
      : null;

  const sellerLocationText = sellerProfile?.location ?? "";

  const handleToggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSaveToggling) return;
    const onError = () => toast.error("Failed to update saved items");
    if (isSaved) unsaveListing(listing.id, { onError });
    else saveListing(listing.id, { onError });
  };

  const nonAvailableStatus =
    listing.status && listing.status !== ListingStatus.available
      ? listing.status
      : null;

  return (
    <Link
      to="/listing/$id"
      params={{ id: listing.id.toString() }}
      className="group block"
    >
      <div className="relative mb-2 aspect-square overflow-hidden rounded-md bg-muted">
        {primaryPhoto ? (
          <img
            src={primaryPhoto.hash.getDirectURL()}
            alt={listing.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}

        {nonAvailableStatus && (
          <span
            className={cn(
              "absolute left-2 top-2 rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              nonAvailableStatus === ListingStatus.reserved
                ? "bg-primary text-primary-foreground"
                : "bg-foreground/85 text-background",
            )}
          >
            {STATUS_LABELS[nonAvailableStatus]}
          </span>
        )}

        {identity && (
          <button
            type="button"
            onClick={handleToggleSave}
            disabled={isSaveToggling}
            aria-label={isSaved ? "Unsave" : "Save"}
            className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-background/85 backdrop-blur-sm transition-colors hover:bg-background disabled:opacity-50"
          >
            {isSaveToggling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Bookmark
                className={cn(
                  "h-4 w-4",
                  isSaved ? "fill-primary text-primary" : "text-foreground",
                )}
              />
            )}
          </button>
        )}
      </div>

      <div className="px-0.5">
        <p className="truncate text-sm font-medium">{listing.title}</p>
        <p className="text-base font-extrabold tracking-tight">
          {formatPrice(listing.price, listing.currency)}
        </p>
        {sellerProfile?.username && (
          <p className="truncate text-[11px] text-muted-foreground">
            @{sellerProfile.username}
          </p>
        )}
        <div className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
          {distanceKm != null ? (
            <>
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{formatDistance(distanceKm)}</span>
              <span className="mx-0.5 inline-block h-0.5 w-0.5 rounded-full bg-muted-foreground/60" />
            </>
          ) : sellerLocationText ? (
            <>
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{sellerLocationText}</span>
              <span className="mx-0.5 inline-block h-0.5 w-0.5 rounded-full bg-muted-foreground/60" />
            </>
          ) : null}
          <span className="truncate">{timeAgo}</span>
        </div>
      </div>
    </Link>
  );
}
