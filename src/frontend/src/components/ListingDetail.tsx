import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  ArrowLeft,
  Bookmark,
  CheckCircle,
  Flag,
  HandCoins,
  Loader2,
  MapPin,
  MessageSquare,
  Pencil,
  Star,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ListingStatus } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetListing,
  useGetUserProfile,
  useProfile,
  useSaveListing,
  useSavedListingIds,
  useStartConversation,
  useUnsaveListing,
  useUpdateListing,
} from "../hooks/useQueries";
import { CATEGORY_LABELS, STATUS_LABELS } from "../utils/constants";
import { calculateDistance, formatDistance } from "../utils/distance";
import { formatPrice } from "../utils/formatting";
import { fromNanoseconds } from "../utils/formatting";
import { EditListingDialog } from "./EditListingDialog";
import { ListingDetailSkeleton } from "./ListingDetailSkeleton";
import { MakeOfferDialog } from "./MakeOfferDialog";
import { OffersPanel } from "./OffersPanel";
import { PhotoGallery } from "./PhotoGallery";
import { RateSellerDialog } from "./RateSellerDialog";
import { ReportDialog } from "./ReportDialog";

interface ListingDetailProps {
  id: string;
}

export function ListingDetail({ id }: ListingDetailProps) {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: listing, isLoading, isError } = useGetListing(id);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { mutate: startConversation, isPending: isStartingChat } =
    useStartConversation();
  const { mutate: updateListing, isPending: isUpdatingStatus } =
    useUpdateListing();
  const savedIds = useSavedListingIds();
  const { mutate: saveListing, isPending: isSaving } = useSaveListing();
  const { mutate: unsaveListing, isPending: isUnsaving } = useUnsaveListing();

  const sellerPrincipalText = listing ? listing.seller.toString() : undefined;
  const { data: sellerProfile } = useGetUserProfile(sellerPrincipalText);
  const { data: myProfile } = useProfile();

  const currentUserPrincipal = identity?.getPrincipal().toString();
  const isOwnListing =
    currentUserPrincipal && sellerPrincipalText === currentUserPrincipal;

  if (isLoading) return <ListingDetailSkeleton />;

  if (isError || !listing) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-lg font-medium">Listing not found</p>
        <p className="text-sm text-muted-foreground">
          This listing may have been removed or doesn&apos;t exist.
        </p>
        <Button variant="outline" onClick={() => navigate({ to: "/" })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to browse
        </Button>
      </div>
    );
  }

  const distanceKm =
    myProfile?.latitude != null &&
    myProfile?.longitude != null &&
    sellerProfile?.latitude != null &&
    sellerProfile?.longitude != null
      ? calculateDistance(
          myProfile.latitude,
          myProfile.longitude,
          sellerProfile.latitude,
          sellerProfile.longitude,
        )
      : null;

  const sellerLocationText = sellerProfile?.location ?? "";

  const showStatusPill = listing.status !== ListingStatus.available;
  const statusPillClass =
    listing.status === ListingStatus.reserved
      ? "bg-primary text-primary-foreground"
      : "bg-foreground/85 text-background";

  const sellerInitials = sellerProfile?.name
    ? sellerProfile.name.charAt(0).toUpperCase()
    : "?";

  return (
    <div className="mx-auto max-w-4xl space-y-4 py-4 md:py-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ to: "/" })}
        className="-ml-2"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back
      </Button>

      <PhotoGallery listing={listing} />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <div className="space-y-2">
            <h1 className="text-xl font-semibold">{listing.title}</h1>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-extrabold tracking-tight">
                {formatPrice(listing.price, listing.currency)}
              </p>
              {showStatusPill && (
                <span
                  className={cn(
                    "rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    statusPillClass,
                  )}
                >
                  {STATUS_LABELS[listing.status as ListingStatus]}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              {sellerLocationText && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {sellerLocationText}
                  {distanceKm != null && (
                    <span className="ml-1 text-xs">
                      ({formatDistance(distanceKm)} away)
                    </span>
                  )}
                </span>
              )}
              <span>
                {
                  CATEGORY_LABELS[
                    listing.category as keyof typeof CATEGORY_LABELS
                  ]
                }
              </span>
              <span>
                Listed{" "}
                {format(fromNanoseconds(listing.createdAt), "MMM d, yyyy")}
              </span>
            </div>
          </div>

          {listing.description && (
            <div>
              <h2 className="mb-1.5 text-sm font-semibold">Description</h2>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {listing.description}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Link
            to="/profile/$id"
            params={{ id: sellerPrincipalText ?? "" }}
            className="flex items-center gap-2 rounded-md py-1 text-sm hover:underline"
          >
            <Avatar className="h-8 w-8">
              {sellerProfile?.profilePhoto && (
                <AvatarImage
                  src={sellerProfile.profilePhoto.getDirectURL()}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="bg-primary text-[11px] font-semibold text-primary-foreground">
                {sellerInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate font-medium">
                {sellerProfile?.name ?? "Unknown seller"}
              </span>
              {sellerProfile?.username && (
                <span className="truncate text-xs text-muted-foreground">
                  @{sellerProfile.username}
                </span>
              )}
            </div>
          </Link>

          <div className="flex flex-col gap-2">
            {isOwnListing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Listing
                </Button>
                {listing.status !== "sold" && (
                  <Button
                    variant="secondary"
                    disabled={isUpdatingStatus}
                    onClick={() =>
                      updateListing(
                        {
                          ...listing,
                          photos: listing.photos.map((p) => p.hash),
                          status: ListingStatus.sold,
                        },
                        {
                          onSuccess: () =>
                            toast.success("Listing marked as sold"),
                          onError: () => toast.error("Failed to update status"),
                        },
                      )
                    }
                  >
                    {isUpdatingStatus ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Mark as Sold
                  </Button>
                )}
                <OffersPanel listingId={id} />
              </>
            ) : (
              <>
                <Button
                  disabled={!identity || isStartingChat}
                  onClick={() => {
                    startConversation(listing.id, {
                      onSuccess: (conversation) => {
                        navigate({
                          to: "/inbox/$id",
                          params: { id: conversation.id.toString() },
                        });
                      },
                      onError: (error) => {
                        toast.error(
                          error.message || "Failed to start conversation",
                        );
                      },
                    });
                  }}
                >
                  {isStartingChat ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquare className="mr-2 h-4 w-4" />
                  )}
                  Message Seller
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setOfferDialogOpen(true)}
                  disabled={
                    !identity || listing.status !== ListingStatus.available
                  }
                >
                  <HandCoins className="mr-2 h-4 w-4" />
                  Make Offer
                </Button>
                <Button
                  variant="outline"
                  disabled={!identity || isSaving || isUnsaving}
                  onClick={() => {
                    if (listing && savedIds.has(listing.id)) {
                      unsaveListing(listing.id);
                    } else if (listing) {
                      saveListing(listing.id);
                    }
                  }}
                >
                  <Bookmark
                    className={cn(
                      "mr-2 h-4 w-4",
                      listing && savedIds.has(listing.id) && "fill-current",
                    )}
                  />
                  {listing && savedIds.has(listing.id) ? "Saved" : "Save"}
                </Button>
                {listing.status === ListingStatus.sold && (
                  <Button
                    variant="outline"
                    onClick={() => setRateDialogOpen(true)}
                    disabled={!identity}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Rate Seller
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setReportDialogOpen(true)}
                  disabled={!identity}
                >
                  <Flag className="mr-1 h-4 w-4" />
                  Report
                </Button>
              </>
            )}
          </div>

          {isOwnListing && (
            <EditListingDialog
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              listing={listing}
            />
          )}

          {!isOwnListing && (
            <>
              <MakeOfferDialog
                open={offerDialogOpen}
                onOpenChange={setOfferDialogOpen}
                listingId={listing.id}
                listingPrice={listing.price}
                listingCurrency={listing.currency}
              />
              <RateSellerDialog
                open={rateDialogOpen}
                onOpenChange={setRateDialogOpen}
                listingId={listing.id}
                sellerName={sellerProfile?.name ?? "this seller"}
              />
              <ReportDialog
                open={reportDialogOpen}
                onOpenChange={setReportDialogOpen}
                target={{ type: "listing", id: listing.id }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
