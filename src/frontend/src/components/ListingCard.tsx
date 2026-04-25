import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { ImageIcon, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { STATUS_LABELS } from "../utils/constants";
import { formatPrice, fromNanoseconds } from "../utils/formatting";

interface ListingCardProps {
  listing: {
    id: bigint;
    title: string;
    price: bigint;
    currency: string;
    status: string;
    photos: Array<{ hash: { getDirectURL: () => string } }>;
    createdAt: bigint;
  };
  onEdit: () => void;
  onDelete: () => void;
}

const STATUS_BADGE: Record<string, string> = {
  available: "bg-secondary text-secondary-foreground",
  reserved: "bg-primary text-primary-foreground",
  sold: "bg-foreground/85 text-background",
};

export function ListingCard({ listing, onEdit, onDelete }: ListingCardProps) {
  const primaryPhoto = listing.photos[0];
  const timeAgo = formatDistanceToNow(fromNanoseconds(listing.createdAt), {
    addSuffix: true,
  });

  const statusLabel =
    STATUS_LABELS[listing.status as keyof typeof STATUS_LABELS] ??
    listing.status;
  const statusClass = STATUS_BADGE[listing.status] ?? STATUS_BADGE.available;

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
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}

        <span
          className={cn(
            "absolute left-2 top-2 rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
            statusClass,
          )}
        >
          {statusLabel}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Listing actions"
              onClick={(e) => e.preventDefault()}
              className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-background/85 backdrop-blur-sm transition-colors hover:bg-background"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.preventDefault()}>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={onDelete}>
              <Trash2 />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="px-0.5">
        <p className="truncate text-sm font-medium">{listing.title}</p>
        <p className="text-base font-extrabold tracking-tight">
          {formatPrice(listing.price, listing.currency)}
        </p>
        <div className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
          <span className="truncate">{timeAgo}</span>
        </div>
      </div>
    </Link>
  );
}
