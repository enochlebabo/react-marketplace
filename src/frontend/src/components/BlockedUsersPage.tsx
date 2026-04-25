import { Skeleton } from "@/components/ui/skeleton";
import { ShieldOff } from "lucide-react";
import { useBlockedUsers } from "../hooks/useQueries";
import { BlockedUserRow } from "./BlockedUserRow";

export function BlockedUsersPage() {
  const { data: blockedUsers, isLoading, isError } = useBlockedUsers();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-4 md:py-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-sm text-destructive">
        Failed to load blocked users.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 py-4 md:py-6">
      <div>
        <h1 className="text-2xl font-bold">Blocked Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Blocked users can&apos;t see your listings, message you, or make
          offers.
        </p>
      </div>

      {!blockedUsers || blockedUsers.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <ShieldOff className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">No blocked users</p>
        </div>
      ) : (
        <div className="space-y-2">
          {blockedUsers.map((principal) => (
            <BlockedUserRow
              key={principal.toString()}
              principalText={principal.toString()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
