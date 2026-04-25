import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import type { PublicProfile } from "../backend";
import { fromNanoseconds } from "../utils/formatting";
import { StarRating } from "./StarRating";

export function ProfileHeader({ profile }: { profile: PublicProfile }) {
  const initials = profile.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20">
        {profile.profilePhoto && (
          <AvatarImage
            src={profile.profilePhoto.getDirectURL()}
            alt={profile.name}
            className="object-cover"
          />
        )}
        <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
      </Avatar>
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">{profile.name}</h1>
        {profile.username && (
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        )}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          <span>
            Joined {format(fromNanoseconds(profile.joinDate), "MMM yyyy")}
          </span>
        </div>
        <StarRating
          avgRating={Number(profile.avgRating) / 10}
          totalRatings={Number(profile.totalRatings)}
        />
      </div>
    </div>
  );
}
