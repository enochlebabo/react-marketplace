import { cn } from "@/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Home, MessageCircle, Plus, User } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUnreadNotificationCount } from "../hooks/useQueries";

interface MobileBottomNavProps {
  onSellClick: () => void;
}

function useIsActive(path: string) {
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  if (path === "/browse")
    return currentPath === "/" || currentPath === "/browse";
  return currentPath.startsWith(path);
}

export function MobileBottomNav({ onSellClick }: MobileBottomNavProps) {
  const { identity, login, isLoggingIn } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const unreadCount = useUnreadNotificationCount();

  const browseActive = useIsActive("/browse");
  const inboxActive = useIsActive("/inbox");
  const notificationsActive = useIsActive("/notifications");
  const profileActive = useIsActive("/my-listings");

  const handleSell = () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    onSellClick();
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-background md:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        <Link
          to="/browse"
          className={cn(
            "flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px]",
            browseActive
              ? "font-semibold text-primary"
              : "text-muted-foreground",
          )}
        >
          <Home className={cn("h-5 w-5", browseActive && "stroke-[2.5px]")} />
          <span>Home</span>
        </Link>

        {isAuthenticated ? (
          <Link
            to="/inbox"
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px]",
              inboxActive
                ? "font-semibold text-primary"
                : "text-muted-foreground",
            )}
          >
            <MessageCircle
              className={cn("h-5 w-5", inboxActive && "stroke-[2.5px]")}
            />
            <span>Inbox</span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        <button
          type="button"
          onClick={handleSell}
          disabled={isLoggingIn}
          aria-label="Sell"
          className="relative -mt-6 flex flex-1 flex-col items-center"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
            <Plus className="h-6 w-6" />
          </span>
          <span className="mt-0.5 text-[10px] text-muted-foreground">Sell</span>
        </button>

        {isAuthenticated ? (
          <Link
            to="/notifications"
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px]",
              notificationsActive
                ? "font-semibold text-primary"
                : "text-muted-foreground",
            )}
          >
            <span className="relative">
              <Bell
                className={cn(
                  "h-5 w-5",
                  notificationsActive && "stroke-[2.5px]",
                )}
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </span>
            <span>Notifications</span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        {isAuthenticated ? (
          <Link
            to="/my-listings"
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[10px]",
              profileActive
                ? "font-semibold text-primary"
                : "text-muted-foreground",
            )}
          >
            <User
              className={cn("h-5 w-5", profileActive && "stroke-[2.5px]")}
            />
            <span>Me</span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
