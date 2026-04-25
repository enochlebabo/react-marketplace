import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ImageIcon } from "lucide-react";
import type { Conversation } from "../backend";

interface ChatHeaderProps {
  conversation: Conversation;
  otherName: string;
  otherPrincipal?: string;
  listing:
    | { title: string; photos: Array<{ hash: { getDirectURL: () => string } }> }
    | null
    | undefined;
}

export function ChatHeader({
  conversation,
  otherName,
  otherPrincipal,
  listing,
}: ChatHeaderProps) {
  return (
    <div className="mb-4 flex items-center gap-3 border-b pb-3">
      <Link to="/inbox" className="shrink-0">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>
      {listing && listing.photos.length > 0 ? (
        <Link
          to="/listing/$id"
          params={{ id: conversation.listingId.toString() }}
          className="shrink-0"
        >
          <img
            src={listing.photos[0].hash.getDirectURL()}
            alt={listing.title}
            className="h-10 w-10 rounded-md object-cover"
          />
        </Link>
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
          <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
        </div>
      )}
      <div className="flex min-w-0 flex-col">
        {otherPrincipal ? (
          <Link
            to="/profile/$id"
            params={{ id: otherPrincipal }}
            className="truncate font-medium hover:underline"
          >
            {otherName}
          </Link>
        ) : (
          <p className="truncate font-medium">{otherName}</p>
        )}
        {listing && (
          <Link
            to="/listing/$id"
            params={{ id: conversation.listingId.toString() }}
            className="truncate text-sm text-muted-foreground hover:underline"
          >
            {listing.title}
          </Link>
        )}
      </div>
    </div>
  );
}
