import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useConversations,
  useGetListing,
  useGetUserProfile,
  useMessages,
} from "../hooks/useQueries";
import { ChatHeader } from "./ChatHeader";
import { MessageInput } from "./MessageInput";
import { MessageThread } from "./MessageThread";

interface ChatViewProps {
  id: string;
}

export function ChatView({ id }: ChatViewProps) {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const currentPrincipal = identity?.getPrincipal().toString();

  const { data: conversations, isLoading: convsLoading } = useConversations();
  const conversation = conversations?.find((c) => c.id.toString() === id);

  const { data: messages, isLoading: msgsLoading, isError } = useMessages(id);

  const { data: listing } = useGetListing(
    conversation?.listingId.toString() ?? "",
  );

  const isBuyer = currentPrincipal === conversation?.buyer.toString();
  const otherPartyPrincipal = conversation
    ? isBuyer
      ? conversation.seller.toString()
      : conversation.buyer.toString()
    : undefined;
  const { data: otherProfile } = useGetUserProfile(otherPartyPrincipal);

  if (convsLoading || msgsLoading) {
    return (
      <div className="flex h-full flex-col py-4 md:py-6">
        <Skeleton className="mb-4 h-8 w-40" />
        <Skeleton className="mb-2 h-16 w-full rounded-lg" />
        <div className="flex-1 space-y-3 py-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              // biome-ignore lint/suspicious/noArrayIndexKey: stable list
              key={i}
              className="h-10 w-2/3 rounded-lg"
            />
          ))}
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (isError || !conversation) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-lg font-medium">Conversation not found</p>
        <Button variant="outline" onClick={() => navigate({ to: "/inbox" })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to inbox
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-7.5rem)] max-w-2xl flex-col py-4 md:py-6 md:h-[calc(100vh-4rem)]">
      <ChatHeader
        conversation={conversation}
        otherName={otherProfile?.name ?? "Unknown"}
        otherPrincipal={otherPartyPrincipal}
        listing={listing}
      />
      <MessageThread
        messages={messages ?? []}
        currentPrincipal={currentPrincipal ?? ""}
      />
      <MessageInput conversationId={conversation.id} />
    </div>
  );
}
