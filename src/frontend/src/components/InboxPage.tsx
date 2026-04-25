import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle } from "lucide-react";
import type { Conversation } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useConversations,
  useGetListing,
  useGetUserProfile,
} from "../hooks/useQueries";
import { fromNanoseconds } from "../utils/formatting";

export function InboxPage() {
  const { data: conversations, isLoading, isError } = useConversations();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-2 py-4 md:py-6">
        <h1 className="mb-4 text-2xl font-bold">Inbox</h1>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton
            // biome-ignore lint/suspicious/noArrayIndexKey: stable list
            key={i}
            className="h-20 w-full rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-4 md:py-6 text-destructive">
        Failed to load conversations.
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <MessageCircle className="h-12 w-12 text-muted-foreground/40" />
        <h1 className="text-xl font-semibold">No conversations yet</h1>
        <p className="text-sm text-muted-foreground">
          Start a conversation by messaging a seller from a listing.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-4 md:py-6">
      <h1 className="mb-4 text-2xl font-bold">Inbox</h1>
      <div className="divide-y rounded-lg border">
        {conversations.map((conversation) => (
          <ConversationRow
            key={conversation.id.toString()}
            conversation={conversation}
          />
        ))}
      </div>
    </div>
  );
}

function ConversationRow({ conversation }: { conversation: Conversation }) {
  const { identity } = useInternetIdentity();
  const currentPrincipal = identity?.getPrincipal().toString();
  const isBuyer = currentPrincipal === conversation.buyer.toString();
  const otherPartyPrincipal = isBuyer
    ? conversation.seller.toString()
    : conversation.buyer.toString();

  const { data: otherProfile } = useGetUserProfile(otherPartyPrincipal);
  const { data: listing } = useGetListing(conversation.listingId.toString());

  const otherName = otherProfile?.name ?? "Unknown";
  const timeAgo = formatDistanceToNow(
    fromNanoseconds(conversation.lastMessageAt),
    { addSuffix: true },
  );

  return (
    <Link
      to="/inbox/$id"
      params={{ id: conversation.id.toString() }}
      className="flex items-center gap-3 p-3 transition-colors hover:bg-muted/50"
    >
      {listing && listing.photos.length > 0 ? (
        <img
          src={listing.photos[0].hash.getDirectURL()}
          alt={listing.title}
          className="h-12 w-12 shrink-0 rounded-md object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted">
          <MessageCircle className="h-5 w-5 text-muted-foreground/40" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-medium">{otherName}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {timeAgo}
          </span>
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {listing?.title ?? "Listing"}
        </p>
      </div>
    </Link>
  );
}
