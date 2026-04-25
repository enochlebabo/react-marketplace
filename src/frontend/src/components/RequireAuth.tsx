import { Button } from "@/components/ui/button";
import { Loader2, LogIn } from "lucide-react";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useProfile } from "../hooks/useQueries";
import { ProfileSetupDialog } from "./ProfileSetupDialog";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { identity, isInitializing, login, isLoggingIn } =
    useInternetIdentity();
  const { isFetching, actor } = useActor();

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
        <LogIn className="h-10 w-10 text-muted-foreground" />
        <p className="text-lg font-medium">Sign in to continue</p>
        <p className="text-sm text-muted-foreground max-w-sm">
          You need to be signed in to access this page.
        </p>
        <Button onClick={() => login()} disabled={isLoggingIn} size="lg">
          {isLoggingIn && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {isLoggingIn ? "Signing in..." : "Sign in with Internet Identity"}
        </Button>
      </div>
    );
  }

  if (!actor || isFetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <RequireProfile>{children}</RequireProfile>;
}

function RequireProfile({ children }: { children: React.ReactNode }) {
  const {
    data: profile,
    isLoading: isLoadingProfile,
    isError: isProfileError,
  } = useProfile();

  const hasProfile = !!profile?.name;

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isProfileError) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-destructive">Failed to load profile.</p>
      </div>
    );
  }

  if (!hasProfile) {
    return <ProfileSetupDialog open />;
  }

  return <>{children}</>;
}
