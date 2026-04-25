import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useProfile } from "../hooks/useQueries";
import { RADIUS_OPTIONS } from "../utils/constants";
import { PriceFilter } from "./PriceFilter";

interface BrowseSearchParams {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  radius?: string;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "priceAsc", label: "Price: Low to High" },
  { value: "priceDesc", label: "Price: High to Low" },
];

interface BrowseFilterBarProps {
  resultCount: number;
}

export function BrowseFilterBar({ resultCount }: BrowseFilterBarProps) {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as BrowseSearchParams;
  const { identity } = useInternetIdentity();
  const { data: profile } = useProfile();
  const hasUserCoords = profile?.latitude != null && profile?.longitude != null;

  const setSort = (value: string) => {
    navigate({
      to: "/browse",
      search: (prev: BrowseSearchParams) => {
        const next = { ...prev };
        if (value && value !== "newest") next.sort = value;
        else next.sort = undefined;
        return next;
      },
    });
  };

  const setRadius = (value: string) => {
    navigate({
      to: "/browse",
      search: (prev: BrowseSearchParams) => {
        const next = { ...prev };
        if (value && value !== "anywhere") next.radius = value;
        else next.radius = undefined;
        return next;
      },
    });
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 sm:gap-3">
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">
          {resultCount.toLocaleString()}
        </span>{" "}
        {resultCount === 1 ? "listing" : "listings"}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <PriceFilter />
        {identity && hasUserCoords && (
          <Select value={search.radius ?? "anywhere"} onValueChange={setRadius}>
            <SelectTrigger className="h-9 w-auto min-w-[110px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RADIUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={search.sort ?? "newest"} onValueChange={setSort}>
          <SelectTrigger className="h-9 w-auto min-w-[130px] text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
