import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, UserX } from "lucide-react";
import { toast } from "sonner";
import { useGetUserProfile, useUnblockUser } from "../hooks/useQueries";

interface BlockedUserRowProps {
  principalText: string;
}

export function BlockedUserRow({ principalText }: BlockedUserRowProps) {
  const { data: profile } = useGetUserProfile(principalText);
  const { mutate: unblockUser, isPending } = useUnblockUser();

  const name = profile?.name ?? `${principalText.slice(0, 12)}...`;
  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          {profile?.profilePhoto && (
            <AvatarImage
              src={profile.profilePhoto.getDirectURL()}
              className="object-cover"
            />
          )}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">
            {principalText.slice(0, 20)}...
          </p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => {
          unblockUser(principalText, {
            onSuccess: () => toast.success(`Unblocked ${name}`),
            onError: () => toast.error("Failed to unblock user"),
          });
        }}
      >
        {isPending ? (
          <Loader2 className="mr-1 h-4 w-4 animate-spin" />
        ) : (
          <UserX className="mr-1 h-4 w-4" />
        )}
        Unblock
      </Button>
    </div>
  );
}
