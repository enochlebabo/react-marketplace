import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { useProfile } from "../hooks/useQueries";
import { DEFAULT_CURRENCY } from "../utils/constants";
import { CurrencyCombobox } from "./CurrencyCombobox";

interface BrowseSearchParams {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  priceCurrency?: string;
  sort?: string;
}

export function PriceFilter() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as BrowseSearchParams;
  const { data: profile } = useProfile();
  const fallbackCurrency = profile?.currency || DEFAULT_CURRENCY;

  const [open, setOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(search.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(search.maxPrice ?? "");
  const [currency, setCurrency] = useState(
    search.priceCurrency ?? fallbackCurrency,
  );

  useEffect(() => {
    setMinPrice(search.minPrice ?? "");
    setMaxPrice(search.maxPrice ?? "");
    setCurrency(search.priceCurrency ?? fallbackCurrency);
  }, [
    search.minPrice,
    search.maxPrice,
    search.priceCurrency,
    fallbackCurrency,
  ]);

  const commit = (min: string, max: string, curr: string) => {
    navigate({
      to: "/browse",
      search: (prev: BrowseSearchParams) => {
        const hasRange = !!(min || max);
        const next: BrowseSearchParams = {
          ...prev,
          minPrice: min || undefined,
          maxPrice: max || undefined,
          // Currency is only meaningful when a range is set
          priceCurrency: hasRange ? curr : undefined,
        };
        for (const k of Object.keys(next) as Array<keyof BrowseSearchParams>) {
          if (!next[k]) delete next[k];
        }
        return next;
      },
    });
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      const changed =
        minPrice !== (search.minPrice ?? "") ||
        maxPrice !== (search.maxPrice ?? "") ||
        ((minPrice || maxPrice) &&
          currency !== (search.priceCurrency ?? fallbackCurrency));
      if (changed) {
        commit(minPrice, maxPrice, currency);
      }
    }
    setOpen(next);
  };

  const handleClear = () => {
    setMinPrice("");
    setMaxPrice("");
    setCurrency(fallbackCurrency);
    commit("", "", fallbackCurrency);
    setOpen(false);
  };

  const hasActive = !!(search.minPrice || search.maxPrice);
  const activeCurrency = search.priceCurrency ?? fallbackCurrency;

  const label = hasActive
    ? `${activeCurrency} ${search.minPrice || "0"}${
        search.maxPrice ? ` – ${search.maxPrice}` : "+"
      }`
    : "Price";

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant={hasActive ? "secondary" : "outline"}
          size="sm"
          className="h-9 gap-1 text-sm"
        >
          {label}
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3">
        <p className="mb-2 text-sm font-semibold">Price</p>
        <div className="space-y-2">
          <CurrencyCombobox
            value={currency}
            onValueChange={setCurrency}
            triggerClassName="h-9 w-full text-sm"
          />
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  commit(minPrice, maxPrice, currency);
                  setOpen(false);
                }
              }}
              className="h-9 text-sm"
              min={0}
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  commit(minPrice, maxPrice, currency);
                  setOpen(false);
                }
              }}
              className="h-9 text-sm"
              min={0}
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Only listings priced in {currency} match this range. Clear to see all
          currencies.
        </p>
        {hasActive && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="mt-3 h-auto px-0 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
