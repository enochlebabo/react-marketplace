import { Star } from "lucide-react";

interface StarRatingProps {
  avgRating: number;
  totalRatings: number;
}

export function StarRating({ avgRating, totalRatings }: StarRatingProps) {
  if (totalRatings === 0) {
    return <p className="text-sm text-muted-foreground">No ratings yet</p>;
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => {
          const fill = Math.max(0, Math.min(1, avgRating - i));
          return (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: stable list
              key={i}
              className="relative inline-block h-4 w-4"
              aria-hidden="true"
            >
              <Star className="absolute inset-0 h-4 w-4 text-muted-foreground/30" />
              {fill > 0 && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                </span>
              )}
            </span>
          );
        })}
      </div>
      <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
      <span className="text-sm text-muted-foreground">
        ({totalRatings} {totalRatings === 1 ? "rating" : "ratings"})
      </span>
    </div>
  );
}
