import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { Category, SortOrder } from "../backend";
import {
  useBrowseListings,
  useProfile,
  useUserProfiles,
} from "../hooks/useQueries";
import { filterByRadius } from "../utils/distance";
import { BrowseFilterBar } from "./BrowseFilterBar";
import { BrowseListingCard } from "./BrowseListingCard";

interface BrowseSearchParams {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  priceCurrency?: string;
  sort?: string;
  radius?: string;
}

const SORT_MAP: Record<string, SortOrder> = {
  newest: SortOrder.newest,
  priceAsc: SortOrder.priceAsc,
  priceDesc: SortOrder.priceDesc,
};

const CATEGORY_MAP: Record<string, Category> = {
  electronics: Category.electronics,
  furniture: Category.furniture,
  fashion: Category.fashion,
  sports: Category.sports,
  books: Category.books,
  vehicles: Category.vehicles,
  home: Category.home,
  toys: Category.toys,
  other: Category.other,
};

export function BrowsePage({
  searchParams,
}: {
  searchParams: BrowseSearchParams;
}) {
  const category = searchParams.category
    ? CATEGORY_MAP[searchParams.category]
    : undefined;
  const sort = searchParams.sort ? SORT_MAP[searchParams.sort] : undefined;
  const minPrice = searchParams.minPrice
    ? BigInt(searchParams.minPrice)
    : undefined;
  const maxPrice = searchParams.maxPrice
    ? BigInt(searchParams.maxPrice)
    : undefined;

  const {
    data: listings,
    isLoading,
    isError,
  } = useBrowseListings({
    keyword: searchParams.q,
    category,
    minPrice,
    maxPrice,
    priceCurrency: searchParams.priceCurrency,
    sort,
  });

  const { data: profile } = useProfile();
  const radius = searchParams.radius ?? "anywhere";
  const shouldSortByDistance =
    !searchParams.sort || searchParams.sort === "newest";

  const uniqueSellerIds = useMemo(
    () =>
      listings
        ? Array.from(new Set(listings.map((l) => l.seller.toString())))
        : [],
    [listings],
  );
  const sellerLocations = useUserProfiles(uniqueSellerIds);

  const enrichedListings = useMemo(() => {
    return listings?.map((l) => {
      const sellerLoc = sellerLocations.get(l.seller.toString());
      return {
        ...l,
        latitude: sellerLoc?.latitude ?? null,
        longitude: sellerLoc?.longitude ?? null,
      };
    });
  }, [listings, sellerLocations]);

  const visibleListings = useMemo(() => {
    return filterByRadius(
      enrichedListings,
      profile?.latitude ?? null,
      profile?.longitude ?? null,
      radius,
      shouldSortByDistance && radius !== "anywhere",
    );
  }, [
    enrichedListings,
    profile?.latitude,
    profile?.longitude,
    radius,
    shouldSortByDistance,
  ]);

  const count = visibleListings?.length ?? 0;
  const hasActiveFilters = !!(
    searchParams.q ||
    searchParams.category ||
    searchParams.minPrice ||
    searchParams.maxPrice ||
    searchParams.radius
  );

  return (
    <div className="py-4 md:py-6">
      <BrowseFilterBar resultCount={count} />

      {isLoading && (
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
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
        <div className="py-20 text-center text-destructive">
          Failed to load listings.
        </div>
      )}

      {!isLoading &&
        !isError &&
        visibleListings &&
        visibleListings.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">
            {hasActiveFilters
              ? "No listings match your filters."
              : "No listings yet. Be the first to sell something!"}
          </div>
        )}

      {!isLoading &&
        !isError &&
        visibleListings &&
        visibleListings.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {visibleListings.map((listing) => (
              <BrowseListingCard
                key={listing.id.toString()}
                listing={listing}
              />
            ))}
          </div>
        )}
    </div>
  );
}
