import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";
import type {
  Category,
  Conversation,
  ExternalBlob,
  Listing,
  ListingStatus,
  Message,
  Notification,
  OfferResponse,
  ReportReason,
  SortOrder,
} from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useProfile() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["profile", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.getCallerUserProfile();
      return result ?? null;
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useSetProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      name,
      username,
      profilePhoto = null,
      location = "",
      latitude = null,
      longitude = null,
      currency,
    }: {
      name: string;
      username: string;
      profilePhoto?: ExternalBlob | null;
      location?: string;
      latitude?: number | null;
      longitude?: number | null;
      currency: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.saveCallerUserProfile(
        name,
        username,
        profilePhoto ?? null,
        location,
        latitude,
        longitude,
        currency,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profile", identity?.getPrincipal().toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      queryClient.invalidateQueries({ queryKey: ["publicProfile"] });
    },
  });
}

export function useIsUsernameAvailable(username: string) {
  const { actor, isFetching } = useActor();
  const normalized = username.trim().toLowerCase();
  return useQuery({
    queryKey: ["usernameAvailable", normalized],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.isUsernameAvailable(normalized);
    },
    enabled: !!actor && !isFetching && normalized.length >= 3,
  });
}

export function useMyListings() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["myListings", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.getMyListings();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useDeleteListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.deleteListing(id);
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({
        queryKey: ["myListings", identity?.getPrincipal().toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["browseListings"] });
      queryClient.invalidateQueries({ queryKey: ["savedListings"] });
      queryClient.invalidateQueries({ queryKey: ["myOffers"] });
      queryClient.invalidateQueries({
        queryKey: ["offersForListing", id.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["listing", id.toString()] });
    },
  });
}

interface UpdateListingInput {
  id: bigint;
  title: string;
  description: string;
  price: bigint;
  currency: string;
  category: Category;
  photos: ExternalBlob[];
  status: ListingStatus;
}

function toMediaArray(photos: ExternalBlob[]) {
  return photos.map((p) => ({ hash: p, mediaType: "image/jpeg" }));
}

export function useUpdateListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (input: UpdateListingInput) => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.updateListing(
        input.id,
        input.title,
        input.description,
        input.price,
        input.currency,
        input.category,
        toMediaArray(input.photos),
        input.status,
      );
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({
        queryKey: ["myListings", identity?.getPrincipal().toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["browseListings"] });
      queryClient.invalidateQueries({
        queryKey: ["listing", input.id.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["profile", identity?.getPrincipal().toString()],
      });
    },
  });
}

interface CreateListingInput {
  title: string;
  description: string;
  price: bigint;
  currency: string;
  category: Category;
  photos: ExternalBlob[];
}

export function useCreateListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (input: CreateListingInput) => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.createListing(
        input.title,
        input.description,
        input.price,
        input.currency,
        input.category,
        toMediaArray(input.photos),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["myListings", identity?.getPrincipal().toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["browseListings"] });
      // Backend updates profile's default currency on create; refresh it.
      queryClient.invalidateQueries({
        queryKey: ["profile", identity?.getPrincipal().toString()],
      });
    },
  });
}

interface BrowseFilters {
  keyword?: string;
  category?: Category;
  minPrice?: bigint;
  maxPrice?: bigint;
  priceCurrency?: string;
  sort?: SortOrder;
}

export function useGetListing(id: string) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      const result = await actor.getListing(BigInt(id));
      return result ?? null;
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useUserProfiles(principalTexts: string[]) {
  const { actor, isFetching } = useActor();

  const queries = useQueries({
    queries: principalTexts.map((id) => ({
      queryKey: ["userProfile", id],
      queryFn: async () => {
        if (!actor) throw new Error("Actor not ready");
        const { Principal } = await import("@icp-sdk/core/principal");
        const result = await actor.getUserProfile(Principal.fromText(id));
        return result ?? null;
      },
      enabled: !!actor && !isFetching && !!id,
    })),
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional cache key based on data timestamps
  return useMemo(() => {
    const map = new Map<
      string,
      {
        latitude: number | null;
        longitude: number | null;
        location: string;
      } | null
    >();
    for (let i = 0; i < queries.length; i++) {
      const q = queries[i];
      if (q.data !== undefined) {
        map.set(
          principalTexts[i],
          q.data
            ? {
                latitude: q.data.latitude ?? null,
                longitude: q.data.longitude ?? null,
                location: q.data.location,
              }
            : null,
        );
      }
    }
    return map;
  }, [queries.map((q) => q.dataUpdatedAt).join(","), principalTexts.join(",")]);
}

export function useGetUserProfile(principalText: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["userProfile", principalText],
    queryFn: async () => {
      if (!actor || !principalText) throw new Error("Actor not ready");
      const { Principal } = await import("@icp-sdk/core/principal");
      const result = await actor.getUserProfile(
        Principal.fromText(principalText),
      );
      return result ?? null;
    },
    enabled: !!actor && !isFetching && !!principalText,
  });
}

export function useBrowseListings(filters: BrowseFilters) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: [
      "browseListings",
      filters.keyword,
      filters.category,
      filters.minPrice?.toString(),
      filters.maxPrice?.toString(),
      filters.priceCurrency,
      filters.sort,
    ],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.browseListings(
        filters.keyword ?? null,
        filters.category ?? null,
        filters.minPrice ?? null,
        filters.maxPrice ?? null,
        filters.priceCurrency ?? null,
        filters.sort ?? null,
        0n,
        1000n,
      );
    },
    enabled: !!actor && !isFetching,
  });
}

export function useOffersForListing(listingId: string) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["offersForListing", listingId],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.getOffersForListing(BigInt(listingId));
    },
    enabled: !!actor && !isFetching && !!identity && !!listingId,
  });
}

export function useMyOffers() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["myOffers", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.getMyOffers();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useMakeOffer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listingId,
      amount,
    }: {
      listingId: bigint;
      amount: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.makeOffer(listingId, amount);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["offersForListing", variables.listingId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["myOffers"] });
    },
  });
}

interface RespondToOfferInput {
  offerId: bigint;
  listingId: bigint;
  response: OfferResponse;
  counterAmount?: bigint;
}

export function useRespondToOffer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RespondToOfferInput) => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.respondToOffer(
        input.offerId,
        input.listingId,
        input.response,
        input.counterAmount ?? null,
      );
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["offersForListing", variables.listingId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["myOffers"] });
      queryClient.invalidateQueries({
        queryKey: ["listing", variables.listingId.toString()],
      });
    },
  });
}

export function useConversations() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["conversations", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.getConversations();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useMessages(conversationId: string) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.getMessages(BigInt(conversationId));
    },
    enabled: !!actor && !isFetching && !!identity && !!conversationId,
    refetchInterval: 5000,
  });
}

export function useStartConversation() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listingId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.startConversation(listingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      content,
    }: {
      conversationId: bigint;
      content: string;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.sendMessage(conversationId, content);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", variables.conversationId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useSavedListings() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["savedListings", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.getSavedListings();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useSavedListingIds() {
  const { data: savedListings } = useSavedListings();
  return useMemo(
    () => new Set(savedListings?.map((l: Listing) => l.id) ?? []),
    [savedListings],
  );
}

export function useSaveListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listingId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.saveListing(listingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedListings"] });
    },
  });
}

export function useUnsaveListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listingId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.unsaveListing(listingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedListings"] });
    },
  });
}

export function useNotifications() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["notifications", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.getNotifications();
    },
    enabled: !!actor && !isFetching && !!identity,
    refetchInterval: 30000,
  });
}

export function useUnreadNotificationCount() {
  const { data: notifications } = useNotifications();
  return useMemo(
    () => notifications?.filter((n: Notification) => !n.read).length ?? 0,
    [notifications],
  );
}

export function useMarkNotificationRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notifId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.markNotificationRead(notifId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      await actor.markAllNotificationsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function usePublicProfile(principalStr: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["publicProfile", principalStr],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      const { Principal } = await import("@icp-sdk/core/principal");
      const principal = Principal.fromText(principalStr!);
      return await actor.getPublicProfile(principal);
    },
    enabled: !!actor && !isFetching && !!principalStr,
  });
}

export function useSellerReviews(principalStr: string | undefined) {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ["sellerReviews", principalStr],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      const { Principal } = await import("@icp-sdk/core/principal");
      return await actor.getSellerReviews(Principal.fromText(principalStr!));
    },
    enabled: !!actor && !isFetching && !!principalStr,
  });
}

export function useRateSeller() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listingId,
      stars,
      review,
    }: {
      listingId: bigint;
      stars: bigint;
      review: string | null;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.rateSeller(listingId, stars, review);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["publicProfile"] });
      queryClient.invalidateQueries({ queryKey: ["sellerReviews"] });
    },
  });
}

export function useReportListing() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      listingId,
      reason,
      description,
    }: {
      listingId: bigint;
      reason: ReportReason;
      description: string | null;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.reportListing(listingId, reason, description);
    },
  });
}

export function useReportUser() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      user,
      reason,
      description,
    }: {
      user: string;
      reason: ReportReason;
      description: string | null;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const { Principal } = await import("@icp-sdk/core/principal");
      await actor.reportUser(Principal.fromText(user), reason, description);
    },
  });
}

export function useReportRating() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      seller,
      listingId,
      reason,
      description,
    }: {
      seller: string;
      listingId: bigint;
      reason: ReportReason;
      description: string | null;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const { Principal } = await import("@icp-sdk/core/principal");
      await actor.reportRating(
        Principal.fromText(seller),
        listingId,
        reason,
        description,
      );
    },
  });
}

export function useBlockedUsers() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["blockedUsers", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.getBlockedUsers();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useBlockUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userPrincipalText: string) => {
      if (!actor) throw new Error("Actor not ready");
      const { Principal } = await import("@icp-sdk/core/principal");
      await actor.blockUser(Principal.fromText(userPrincipalText));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blockedUsers"] });
      queryClient.invalidateQueries({ queryKey: ["browseListings"] });
    },
  });
}

export function useUnblockUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userPrincipalText: string) => {
      if (!actor) throw new Error("Actor not ready");
      const { Principal } = await import("@icp-sdk/core/principal");
      await actor.unblockUser(Principal.fromText(userPrincipalText));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blockedUsers"] });
      queryClient.invalidateQueries({ queryKey: ["browseListings"] });
    },
  });
}

// Admin hooks

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["isAdmin", identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useAdminReports() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["adminReports"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.getReports();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useDismissReport() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reportId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.dismissReport(reportId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminReports"] });
    },
  });
}

export function useAdminRemoveListing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listingId: bigint) => {
      if (!actor) throw new Error("Actor not ready");
      await actor.adminRemoveListing(listingId);
    },
    onSuccess: (_data, listingId) => {
      queryClient.invalidateQueries({ queryKey: ["adminReports"] });
      queryClient.invalidateQueries({ queryKey: ["adminAllListings"] });
      queryClient.invalidateQueries({ queryKey: ["browseListings"] });
      queryClient.invalidateQueries({ queryKey: ["savedListings"] });
      queryClient.invalidateQueries({ queryKey: ["myOffers"] });
      queryClient.invalidateQueries({
        queryKey: ["offersForListing", listingId.toString()],
      });
      queryClient.invalidateQueries({
        queryKey: ["listing", listingId.toString()],
      });
    },
  });
}

export function useAdminRemoveRating() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      seller,
      listingId,
    }: {
      seller: string;
      listingId: bigint;
    }) => {
      if (!actor) throw new Error("Actor not ready");
      const { Principal } = await import("@icp-sdk/core/principal");
      await actor.adminRemoveRating(Principal.fromText(seller), listingId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminSellerReviews"] });
      queryClient.invalidateQueries({ queryKey: ["publicProfile"] });
      queryClient.invalidateQueries({ queryKey: ["sellerReviews"] });
    },
  });
}

export function useBanUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userPrincipalText: string) => {
      if (!actor) throw new Error("Actor not ready");
      const { Principal } = await import("@icp-sdk/core/principal");
      await actor.banUser(Principal.fromText(userPrincipalText));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["browseListings"] });
      queryClient.invalidateQueries({ queryKey: ["adminReports"] });
    },
  });
}

export function useUnbanUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userPrincipalText: string) => {
      if (!actor) throw new Error("Actor not ready");
      const { Principal } = await import("@icp-sdk/core/principal");
      await actor.unbanUser(Principal.fromText(userPrincipalText));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["browseListings"] });
    },
  });
}

export function useAdminUsers() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.getUsers();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useAdminAllListings() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["adminAllListings"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not ready");
      return await actor.getAllListings();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useAdminSellerReviews(sellerPrincipalText: string | undefined) {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery({
    queryKey: ["adminSellerReviews", sellerPrincipalText],
    queryFn: async () => {
      if (!actor || !sellerPrincipalText) throw new Error("Actor not ready");
      const { Principal } = await import("@icp-sdk/core/principal");
      return await actor.getSellerReviews(
        Principal.fromText(sellerPrincipalText),
      );
    },
    enabled: !!actor && !isFetching && !!identity && !!sellerPrincipalText,
  });
}
