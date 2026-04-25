import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Check, Loader2, X } from "lucide-react";
import { useState } from "react";
import { useIsUsernameAvailable, useSetProfile } from "../hooks/useQueries";
import { DEFAULT_CURRENCY, validateUsernameFormat } from "../utils/constants";
import { CurrencyCombobox } from "./CurrencyCombobox";
import { type LocationData, LocationPicker } from "./LocationPicker";

interface ProfileSetupDialogProps {
  open: boolean;
}

export function ProfileSetupDialog({ open }: ProfileSetupDialogProps) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [location, setLocation] = useState<LocationData | null>(null);
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [error, setError] = useState<string | null>(null);
  const { mutate: setProfile, isPending: isSettingProfile } = useSetProfile();

  const normalizedUsername = username.trim().toLowerCase();
  const usernameFormatError = username
    ? validateUsernameFormat(username)
    : null;
  const { data: isAvailable, isFetching: isCheckingAvailability } =
    useIsUsernameAvailable(
      usernameFormatError === null ? normalizedUsername : "",
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const formatErr = validateUsernameFormat(username);
    if (formatErr) {
      setError(formatErr);
      return;
    }
    if (isAvailable === false) {
      setError("Username is already taken");
      return;
    }
    setError(null);
    setProfile(
      {
        name: name.trim(),
        username: normalizedUsername,
        location: location?.name.trim() ?? "",
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        currency,
      },
      {
        onError: (err: unknown) => {
          setError(
            err instanceof Error ? err.message : "Failed to save profile",
          );
        },
      },
    );
  };

  const showUsernameStatus =
    username.length > 0 && usernameFormatError === null;

  return (
    <Dialog open={open}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Welcome to Marketplace!</DialogTitle>
            <DialogDescription>
              Set up your profile to start buying and selling.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Display name</Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  @
                </span>
                <Input
                  id="username"
                  placeholder="yourname"
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUsername(e.target.value.toLowerCase())
                  }
                  className="pl-7 pr-8"
                  maxLength={30}
                />
                {showUsernameStatus && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isCheckingAvailability ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : isAvailable === true ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : isAvailable === false ? (
                      <X className="h-4 w-4 text-destructive" />
                    ) : null}
                  </div>
                )}
              </div>
              <p
                className={cn(
                  "text-xs",
                  usernameFormatError
                    ? "text-destructive"
                    : isAvailable === false
                      ? "text-destructive"
                      : "text-muted-foreground",
                )}
              >
                {usernameFormatError ??
                  (isAvailable === false
                    ? "Username is already taken"
                    : "Lowercase letters, digits, underscore, hyphen. 3-30 chars.")}
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Default currency</Label>
              <CurrencyCombobox
                value={currency}
                onValueChange={setCurrency}
                disabled={isSettingProfile}
                triggerClassName="w-full"
              />
              <p className="text-xs text-muted-foreground">
                New listings default to this currency.
              </p>
            </div>
            <div className="grid gap-2">
              <Label>
                Your location{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <LocationPicker
                value={location}
                onChange={setLocation}
                disabled={isSettingProfile}
              />
              <p className="text-xs text-muted-foreground">
                Used to show distance to nearby listings. You can change this
                later.
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={
                !name.trim() ||
                isSettingProfile ||
                usernameFormatError !== null ||
                isAvailable === false ||
                isCheckingAvailability
              }
            >
              {isSettingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSettingProfile ? "Saving..." : "Get Started"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
