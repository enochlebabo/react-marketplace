import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Bell, CheckCheck } from "lucide-react";
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

export function NotificationsPage() {
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
    navigate({ to: getNotificationRoute(notif) });
  };

  return (
    <div className="py-4 md:py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllRead()}
            disabled={isMarkingAll}
          >
            <CheckCheck className="h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      <div className="mt-4 divide-y rounded-md border">
        {isLoading && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Loading...
          </p>
        )}
        {isError && (
          <p className="py-12 text-center text-sm text-destructive">
            Failed to load notifications.
          </p>
        )}
        {!isLoading &&
          !isError &&
          (!notifications || notifications.length === 0) && (
            <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
              <Bell className="h-10 w-10" />
              <p className="text-sm">No notifications yet.</p>
            </div>
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
            <div className="min-w-0 flex-1">
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
      </div>
    </div>
  );
}
