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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@tanstack/react-router";
import { Loader2, Package, Plus, User } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useDeleteListing, useMyListings } from "../hooks/useQueries";
import { useSellDialog } from "./AppLayout";
import { EditListingDialog } from "./EditListingDialog";
import { ListingCard } from "./ListingCard";

type StatusFilter = "all" | "available" | "reserved" | "sold";

export function MyListingsPage() {
  const { identity } = useInternetIdentity();
  const { openSellDialog } = useSellDialog();
  const [editListingId, setEditListingId] = useState<bigint | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [listingToDelete, setListingToDelete] = useState<{
    id: bigint;
    title: string;
  } | null>(null);

  const { data: listings, isLoading, isError } = useMyListings();
  const { mutate: deleteListing, isPending: isDeleting } = useDeleteListing();

  const filteredListings = useMemo(() => {
    if (!listings) return [];
    if (statusFilter === "all") return listings;
    return listings.filter((l) => l.status === statusFilter);
  }, [listings, statusFilter]);

  const listingToEdit = useMemo(() => {
    if (editListingId == null || !listings) return null;
    return listings.find((l) => l.id === editListingId) ?? null;
  }, [editListingId, listings]);

  const handleDelete = () => {
    if (!listingToDelete) return;
    deleteListing(listingToDelete.id, {
      onSuccess: () => {
        toast.success("Listing deleted");
        setListingToDelete(null);
      },
      onError: () => toast.error("Failed to delete listing"),
    });
  };

  return (
    <div className="py-4 md:py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Listings</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="sm:hidden" asChild>
            <Link
              to="/profile/$id"
              params={{ id: identity!.getPrincipal().toString() }}
            >
              <User className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
            asChild
          >
            <Link
              to="/profile/$id"
              params={{ id: identity!.getPrincipal().toString() }}
            >
              <User className="h-4 w-4" />
              View My Profile
            </Link>
          </Button>
          <Button onClick={openSellDialog}>
            <Plus className="h-4 w-4" />
            New Listing
          </Button>
        </div>
      </div>

      <Tabs
        value={statusFilter}
        onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        className="mt-4"
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="reserved">Reserved</TabsTrigger>
          <TabsTrigger value="sold">Sold</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading && (
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: stable list
              key={i}
              className="flex flex-col gap-2"
            >
              <Skeleton className="aspect-square w-full rounded-md" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <p className="mt-8 text-center text-destructive">
          Failed to load listings.
        </p>
      )}

      {!isLoading && !isError && filteredListings.length === 0 && (
        <div className="mt-12 flex flex-col items-center gap-2 text-muted-foreground">
          <Package className="h-12 w-12" />
          <p>
            {statusFilter === "all"
              ? "You haven't created any listings yet."
              : `No ${statusFilter} listings.`}
          </p>
        </div>
      )}

      {!isLoading && !isError && filteredListings.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id.toString()}
              listing={listing}
              onEdit={() => setEditListingId(listing.id)}
              onDelete={() =>
                setListingToDelete({ id: listing.id, title: listing.title })
              }
            />
          ))}
        </div>
      )}

      <EditListingDialog
        open={editListingId != null}
        onOpenChange={(open) => {
          if (!open) setEditListingId(null);
        }}
        listing={listingToEdit}
      />

      <AlertDialog
        open={!!listingToDelete}
        onOpenChange={() => setListingToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete listing?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{listingToDelete?.title}&rdquo; will be permanently
              deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
