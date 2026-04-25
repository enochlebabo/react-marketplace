import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Ban, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { UserInfo } from "../backend";
import { UserRole } from "../backend";
import {
  useBanUser,
  useGetUserProfile,
  useUnbanUser,
} from "../hooks/useQueries";
import { fromNanoseconds } from "../utils/formatting";

const ROLE_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  admin: "default",
  user: "secondary",
  guest: "destructive",
};

interface AdminUserRowProps {
  user: UserInfo;
}

export function AdminUserRow({ user }: AdminUserRowProps) {
  const [confirmAction, setConfirmAction] = useState<"ban" | "unban" | null>(
    null,
  );
  const { data: userProfile } = useGetUserProfile(user.principal.toString());
  const { mutate: banUser, isPending: isBanning } = useBanUser();
  const { mutate: unbanUser, isPending: isUnbanning } = useUnbanUser();

  const isPending = isBanning || isUnbanning;
  const isBanned = user.role === UserRole.guest;
  const isAdmin = user.role === UserRole.admin;

  const name = user.name || `${user.principal.toString().slice(0, 16)}...`;
  const initials = user.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const handleConfirm = () => {
    const principalText = user.principal.toString();
    if (confirmAction === "ban") {
      banUser(principalText, {
        onSuccess: () => {
          toast.success(`Banned ${name}`);
          setConfirmAction(null);
        },
        onError: () => toast.error("Failed to ban user"),
      });
    } else if (confirmAction === "unban") {
      unbanUser(principalText, {
        onSuccess: () => {
          toast.success(`Unbanned ${name}`);
          setConfirmAction(null);
        },
        onError: () => toast.error("Failed to unban user"),
      });
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {userProfile?.profilePhoto && (
              <AvatarImage
                src={userProfile.profilePhoto.getDirectURL()}
                className="object-cover"
              />
            )}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{name}</p>
              <Badge variant={ROLE_VARIANT[user.role] ?? "outline"}>
                {user.role}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {user.principal.toString().slice(0, 20)}...
              {user.joinDate > 0n && (
                <>
                  {" "}
                  &middot; Joined{" "}
                  {format(fromNanoseconds(user.joinDate), "MMM d, yyyy")}
                </>
              )}
            </p>
          </div>
        </div>
        {!isAdmin && (
          <Button
            variant={isBanned ? "outline" : "destructive"}
            size="sm"
            disabled={isPending}
            onClick={() => setConfirmAction(isBanned ? "unban" : "ban")}
          >
            {isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : isBanned ? (
              <ShieldCheck className="mr-1 h-4 w-4" />
            ) : (
              <Ban className="mr-1 h-4 w-4" />
            )}
            {isBanned ? "Unban" : "Ban"}
          </Button>
        )}
      </div>

      <AlertDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "ban" ? "Ban user?" : "Unban user?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "ban"
                ? `${name} will be banned. They won't be able to sign in and their listings will be hidden.`
                : `${name} will be unbanned and can use the platform again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending
                ? confirmAction === "ban"
                  ? "Banning..."
                  : "Unbanning..."
                : confirmAction === "ban"
                  ? "Ban"
                  : "Unban"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
