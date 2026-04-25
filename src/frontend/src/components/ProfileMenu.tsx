import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  Bookmark,
  HandCoins,
  LogIn,
  LogOut,
  MessageCircle,
  Moon,
  Package,
  Pencil,
  ShieldCheck,
  ShieldOff,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsAdmin, useProfile } from "../hooks/useQueries";
import { EditProfileDialog } from "./EditProfileDialog";

export function ProfileMenu() {
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { identity, login, isLoggingIn, clear } = useInternetIdentity();
  const { data: profile } = useProfile();
  const { data: isAdmin } = useIsAdmin();
  const { theme, setTheme } = useTheme();
  const isAuthenticated = !!identity;

  if (!isAuthenticated) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => login()}
        disabled={isLoggingIn}
        className="text-xs"
      >
        <LogIn className="h-4 w-4" />
        <span className="hidden sm:inline">
          {isLoggingIn ? "Signing in..." : "Sign in"}
        </span>
      </Button>
    );
  }

  const initials = profile?.name ? profile.name.charAt(0).toUpperCase() : "?";

  const handleLogout = () => {
    queryClient.clear();
    clear();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full transition-opacity hover:opacity-80"
            aria-label="Profile menu"
          >
            <Avatar className="h-10 w-10">
              {profile?.profilePhoto && (
                <AvatarImage
                  src={profile.profilePhoto.getDirectURL()}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[200px]">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">
              Welcome back, {profile?.name}!
            </p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate({ to: "/my-listings" })}>
            <Package />
            My Listings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ to: "/inbox" })}>
            <MessageCircle />
            Inbox
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ to: "/offers" })}>
            <HandCoins />
            Offers
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ to: "/saved" })}>
            <Bookmark />
            Saved
          </DropdownMenuItem>
          {isAdmin && (
            <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
              <ShieldCheck />
              Admin
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() =>
              navigate({
                to: "/profile/$id",
                params: { id: identity!.getPrincipal().toString() },
              })
            }
          >
            <User />
            View My Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditProfileOpen(true)}>
            <Pencil />
            Edit Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ to: "/blocked" })}>
            <ShieldOff />
            Blocked Users
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="dark:hidden" />
            <Moon className="hidden dark:block" />
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <EditProfileDialog
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
      />
    </>
  );
}
