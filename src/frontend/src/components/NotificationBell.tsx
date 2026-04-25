import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { NotificationType } from "../backend";
import type { Notification } from "../backend";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from "../hooks/useQueries";
import { fromNanoseconds } from "../utils/formatting";

function getNotificationRoute(notif: Notification): string {
  switch (notif.notifType) {
    case NotificationType.newOffer:
    case NotificationType.savedListingPriceChanged:
    case NotificationType.savedListingSold:
      return notif.relatedId != null
        ? `/listing/${notif.relatedId.toString()}`
        : "/";
    case NotificationType.offerAccepted:
    case NotificationType.offerDeclined:
    case NotificationType.offerCountered:
      return "/offers";
    case NotificationType.newMessage:
      return notif.relatedId != null
        ? `/inbox/${notif.relatedId.toString()}`
        : "/inbox";
    default:
      return "/";
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: notifications, isLoading, isError } = useNotifications();
  const unreadCount = useUnreadNotificationCount();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead, isPending: isMarkingAll } =
    useMarkAllNotificationsRead();

  const handleClick = (notif: Notification) => {
    if (!notif.read) {
      markRead(notif.id, {
        onError: () => toast.error("Failed to mark notification as read"),
      });
    }
    setOpen(false);
    navigate({ to: getNotificationRoute(notif) });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-2 top-2 flex h-2 w-2 items-center justify-center rounded-full bg-primary ring-2 ring-card" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => markAllRead()}
              disabled={isMarkingAll}
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Loading...
            </p>
          )}
          {isError && (
            <p className="py-8 text-center text-sm text-destructive">
              Failed to load notifications.
            </p>
          )}
          {!isLoading &&
            !isError &&
            (!notifications || notifications.length === 0) && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No notifications yet.
              </p>
            )}
          {notifications?.map((notif: Notification) => (
            <button
              key={notif.id.toString()}
              type="button"
              onClick={() => handleClick(notif)}
              className={cn(
                "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent",
                !notif.read && "bg-accent/50",
              )}
            >
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm", !notif.read && "font-medium")}>
                  {notif.message}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatDistanceToNow(fromNanoseconds(notif.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              {!notif.read && (
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
