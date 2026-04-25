import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Camera, Check, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import {
  useIsUsernameAvailable,
  useProfile,
  useSetProfile,
} from "../hooks/useQueries";
import { DEFAULT_CURRENCY, validateUsernameFormat } from "../utils/constants";
import { CurrencyCombobox } from "./CurrencyCombobox";
import { type LocationData, LocationPicker } from "./LocationPicker";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileDialog({
  open,
  onOpenChange,
}: EditProfileDialogProps) {
  const { data: profile } = useProfile();
  const { mutate: setProfile, isPending } = useSetProfile();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [location, setLocation] = useState<LocationData | null>(null);
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [profilePhoto, setProfilePhoto] = useState<ExternalBlob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && profile) {
      setName(profile.name);
      setUsername(profile.username);
      setLocation(
        profile.location || profile.latitude != null
          ? {
              name: profile.location,
              latitude: profile.latitude ?? null,
              longitude: profile.longitude ?? null,
            }
          : null,
      );
      setCurrency(profile.currency || DEFAULT_CURRENCY);
      setProfilePhoto(profile.profilePhoto ?? null);
      setPhotoPreview(
        profile.profilePhoto ? profile.profilePhoto.getDirectURL() : null,
      );
      setError(null);
    }
  }, [open, profile]);

  const normalizedUsername = username.trim().toLowerCase();
  const usernameFormatError = username
    ? validateUsernameFormat(username)
    : null;
  const usernameChanged =
    profile != null && normalizedUsername !== profile.username;
  const { data: isAvailable, isFetching: isCheckingAvailability } =
    useIsUsernameAvailable(
      usernameChanged && usernameFormatError === null ? normalizedUsername : "",
    );

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Photo must be under 5MB");
      return;
    }
    const arrayBuffer = await file.arrayBuffer();
    const blob = ExternalBlob.fromBytes(new Uint8Array(arrayBuffer));
    setProfilePhoto(blob);
    setPhotoPreview(URL.createObjectURL(file));
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const formatErr = validateUsernameFormat(username);
    if (formatErr) {
      setError(formatErr);
      return;
    }
    if (usernameChanged && isAvailable === false) {
      setError("Username is already taken");
      return;
    }
    setError(null);
    setProfile(
      {
        name: trimmed,
        username: normalizedUsername,
        profilePhoto,
        location: location?.name.trim() ?? "",
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
        currency,
      },
      {
        onSuccess: () => {
          toast.success("Profile updated");
          onOpenChange(false);
        },
        onError: (err) => {
          setError(
            err instanceof Error ? err.message : "Failed to update profile",
          );
        },
      },
    );
  };

  const showUsernameStatus =
    username.length > 0 && usernameFormatError === null && usernameChanged;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="group relative"
                disabled={isPending}
              >
                <Avatar className="h-20 w-20">
                  {photoPreview && (
                    <AvatarImage src={photoPreview} className="object-cover" />
                  )}
                  <AvatarFallback className="bg-muted text-2xl font-semibold">
                    {name ? name.charAt(0).toUpperCase() : "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-5 w-5 text-white" />
                </div>
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <p className="text-xs text-muted-foreground">
                Click to change photo
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Display name</Label>
              <Input
                id="edit-name"
                placeholder="Enter your name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-username">Username</Label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  @
                </span>
                <Input
                  id="edit-username"
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
                    : usernameChanged && isAvailable === false
                      ? "text-destructive"
                      : "text-muted-foreground",
                )}
              >
                {usernameFormatError ??
                  (usernameChanged && isAvailable === false
                    ? "Username is already taken"
                    : "Lowercase letters, digits, underscore, hyphen. 3-30 chars.")}
              </p>
            </div>
            <div className="grid gap-2">
              <Label>Default currency</Label>
              <CurrencyCombobox
                value={currency}
                onValueChange={setCurrency}
                disabled={isPending}
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
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Used to show distance to nearby listings.
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !name.trim() ||
                isPending ||
                usernameFormatError !== null ||
                (usernameChanged && isAvailable === false) ||
                (usernameChanged && isCheckingAvailability)
              }
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
