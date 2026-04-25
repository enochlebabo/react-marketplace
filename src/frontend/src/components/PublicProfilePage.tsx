import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Ban, Flag, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { PublicProfile } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useBlockUser,
  useBlockedUsers,
  usePublicProfile,
} from "../hooks/useQueries";
import { ActiveListingsGrid } from "./ActiveListingsGrid";
import { ProfileHeader } from "./ProfileHeader";
import { ProfileSkeleton } from "./ProfileSkeleton";
import { ProfileStats } from "./ProfileStats";
import { ReportDialog } from "./ReportDialog";
import { ReviewsSection } from "./ReviewsSection";

interface PublicProfilePageProps {
  id: string;
}

export function PublicProfilePage({ id }: PublicProfilePageProps) {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { data: profile, isLoading, isError } = usePublicProfile(id);
  const { mutate: blockUser, isPending: isBlocking } = useBlockUser();
  const { data: blockedUsers } = useBlockedUsers();
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const currentUserPrincipal = identity?.getPrincipal().toString();
  const isSelf = currentUserPrincipal === id;
  const isAlreadyBlocked = blockedUsers?.some((p) => p.toString() === id);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (isError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <p className="text-lg font-medium">Profile not found</p>
        <p className="text-sm text-muted-foreground">
          This user may not exist or hasn&apos;t set up their profile.
        </p>
        <Button variant="outline" onClick={() => navigate({ to: "/" })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to browse
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-4 md:py-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate({ to: "/" })}
        className="-ml-2"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back
      </Button>

      <ProfileHeader profile={profile} />

      {!isSelf && identity && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              blockUser(id, {
                onSuccess: () =>
                  toast.success(
                    isAlreadyBlocked
                      ? `Already blocked ${profile.name}`
                      : `Blocked ${profile.name}`,
                  ),
                onError: () => toast.error("Failed to block user"),
              });
            }}
            disabled={isBlocking || isAlreadyBlocked}
          >
            {isBlocking ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Ban className="mr-1 h-4 w-4" />
            )}
            {isAlreadyBlocked ? "Blocked" : "Block"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setReportDialogOpen(true)}
          >
            <Flag className="mr-1 h-4 w-4" />
            Report
          </Button>
          <ReportDialog
            open={reportDialogOpen}
            onOpenChange={setReportDialogOpen}
            target={{ type: "user", principal: id }}
          />
        </div>
      )}

      <ProfileStats profile={profile} />
      <ReviewsSection sellerPrincipal={id} />
      <ActiveListingsGrid sellerPrincipal={id} />
    </div>
  );
}
