import { Card, CardContent } from "@/components/ui/card";
import { Package, ShoppingBag } from "lucide-react";
import type { PublicProfile } from "../backend";

export function ProfileStats({ profile }: { profile: PublicProfile }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <ShoppingBag className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {profile.totalRatings.toString()}
            </p>
            <p className="text-sm text-muted-foreground">Total ratings</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              {profile.activeListings.toString()}
            </p>
            <p className="text-sm text-muted-foreground">Active listings</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
