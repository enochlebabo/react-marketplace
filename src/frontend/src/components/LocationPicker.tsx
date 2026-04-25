import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ChevronDown, Loader2, LocateFixed, MapPin, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export interface LocationData {
  name: string;
  latitude: number | null;
  longitude: number | null;
}

interface LocationPickerProps {
  value: LocationData | null;
  onChange: (location: LocationData | null) => void;
  disabled?: boolean;
}

interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

const DEFAULT_CENTER: [number, number] = [20, 0];
const DEFAULT_ZOOM = 2;
const SELECTED_ZOOM = 13;

async function reverseGeocodeNominatim(
  lat: number,
  lng: number,
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=14&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "en",
        },
      },
    );
    if (!response.ok) return null;
    const data = await response.json();
    const addr = data.address;
    if (addr) {
      const neighbourhood =
        addr.suburb || addr.neighbourhood || addr.city_district || "";
      const city = addr.city || addr.town || addr.village || "";
      const country = addr.country || "";
      const parts = [neighbourhood, city, country].filter(Boolean);
      if (parts.length > 0) return parts.join(", ");
    }
  } catch {
    return null;
  }
  return null;
}

async function reverseGeocodeOpenMeteo(
  lat: number,
  lng: number,
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${lat.toFixed(1)},${lng.toFixed(1)}&count=1&language=en&format=json`,
    );
    if (!response.ok) return null;
    const data = await response.json();
    const r = data.results?.[0];
    if (r) {
      return r.admin1
        ? `${r.name}, ${r.admin1}, ${r.country}`
        : `${r.name}, ${r.country}`;
    }
  } catch {
    return null;
  }
  return null;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  return (
    (await reverseGeocodeNominatim(lat, lng)) ??
    (await reverseGeocodeOpenMeteo(lat, lng)) ??
    `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  );
}

export function LocationPicker({
  value,
  onChange,
  disabled = false,
}: LocationPickerProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [apiError, setApiError] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const initialValueRef = useRef(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setResults([]);
      return;
    }

    const fetchResults = async () => {
      setIsSearching(true);
      setApiError(false);
      try {
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(debouncedSearch)}&count=5&language=en&format=json`,
        );
        if (!response.ok) throw new Error("API error");
        const data = await response.json();
        setResults(
          data.results?.map((r: GeocodingResult) => ({
            id: r.id,
            name: r.name,
            latitude: r.latitude,
            longitude: r.longitude,
            country: r.country,
            admin1: r.admin1,
          })) ?? [],
        );
      } catch {
        setResults([]);
        setApiError(true);
      } finally {
        setIsSearching(false);
      }
    };

    fetchResults();
  }, [debouncedSearch]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const L = window.L;
    if (!L) return;

    const initValue = initialValueRef.current;
    const hasCoords =
      initValue?.latitude != null && initValue?.longitude != null;
    const center: [number, number] = hasCoords
      ? [initValue.latitude!, initValue.longitude!]
      : DEFAULT_CENTER;
    const zoom = hasCoords ? SELECTED_ZOOM : DEFAULT_ZOOM;

    const map = L.map(mapContainerRef.current, { zoomControl: true }).setView(
      center,
      zoom,
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    const handleDragEnd = (marker: L.Marker) => {
      const pos = marker.getLatLng();
      reverseGeocode(pos.lat, pos.lng).then((name) => {
        onChangeRef.current({ name, latitude: pos.lat, longitude: pos.lng });
      });
    };

    map.on("click", (e: unknown) => {
      const event = e as { latlng: { lat: number; lng: number } };
      const { lat, lng } = event.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const m = L.marker([lat, lng], { draggable: true }).addTo(map);
        m.on("dragend", () => handleDragEnd(m));
        markerRef.current = m;
      }
      map.setView([lat, lng], SELECTED_ZOOM);
      reverseGeocode(lat, lng).then((name) => {
        onChangeRef.current({ name, latitude: lat, longitude: lng });
      });
    });

    mapRef.current = map;

    if (hasCoords) {
      const marker = L.marker([initValue.latitude!, initValue.longitude!], {
        draggable: true,
      }).addTo(map);
      marker.on("dragend", () => handleDragEnd(marker));
      markerRef.current = marker;
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  const placeMarker = useCallback((lat: number, lng: number) => {
    const L = window.L;
    const map = mapRef.current;
    if (!L || !map) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        reverseGeocode(pos.lat, pos.lng).then((name) => {
          onChangeRef.current({ name, latitude: pos.lat, longitude: pos.lng });
        });
      });
      markerRef.current = marker;
    }

    map.setView([lat, lng], SELECTED_ZOOM);
  }, []);

  const handleSelect = (result: GeocodingResult) => {
    const name = result.admin1
      ? `${result.name}, ${result.admin1}, ${result.country}`
      : `${result.name}, ${result.country}`;
    onChange({
      name,
      latitude: result.latitude,
      longitude: result.longitude,
    });
    placeMarker(result.latitude, result.longitude);
    setSearch("");
    setPopoverOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setSearch("");
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    mapRef.current?.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        placeMarker(latitude, longitude);
        const name = await reverseGeocode(latitude, longitude);
        onChange({ name, latitude, longitude });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const hasResults = results.length > 0;
  const noResults = !isSearching && !hasResults && debouncedSearch.length >= 2;
  const showDropdown = hasResults || noResults;

  useEffect(() => {
    if (showDropdown) {
      setPopoverOpen(true);
    }
  }, [showDropdown]);

  const handleUseCustomName = () => {
    onChange({ name: search.trim(), latitude: null, longitude: null });
    setSearch("");
    setPopoverOpen(false);
  };

  const searchInput = value ? (
    <div className="relative">
      <Input value={value.name} readOnly className="pr-8" disabled={disabled} />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
        onClick={handleClear}
        disabled={disabled}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  ) : (
    <Popover open={popoverOpen && showDropdown}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Input
            placeholder={
              apiError
                ? "Search unavailable — place your pin on the map"
                : "Search for a neighbourhood or city..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => {
              if (showDropdown) setPopoverOpen(true);
            }}
            onBlur={() => {
              setTimeout(() => setPopoverOpen(false), 200);
            }}
            disabled={disabled}
            className={showDropdown ? "pr-8" : ""}
          />
          {isSearching ? (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : showDropdown ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setPopoverOpen((prev) => !prev);
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  popoverOpen && "rotate-180",
                )}
              />
            </Button>
          ) : null}
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0 z-[1100]"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-64 overflow-y-auto">
          {hasResults ? (
            results.map((result) => (
              <button
                key={result.id}
                type="button"
                className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-accent transition-colors"
                onClick={() => handleSelect(result)}
              >
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex flex-col min-w-0">
                  <span className="font-medium truncate">{result.name}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {result.admin1
                      ? `${result.admin1}, ${result.country}`
                      : result.country}
                  </span>
                </div>
              </button>
            ))
          ) : (
            <div className="px-3 py-3 space-y-2">
              <p className="text-sm text-muted-foreground">
                No results found for &quot;{debouncedSearch}&quot;
              </p>
              <button
                type="button"
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-left text-sm hover:bg-accent transition-colors"
                onClick={handleUseCustomName}
              >
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>
                  Use &quot;<span className="font-medium">{search.trim()}</span>
                  &quot; as your location
                </span>
              </button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="space-y-2">
      {searchInput}

      <div className="relative">
        <div
          ref={mapContainerRef}
          className="h-48 rounded-lg border overflow-hidden"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="absolute top-2 right-2 z-[1000] gap-1.5 shadow-sm"
          onClick={handleUseMyLocation}
          disabled={disabled || isLocating}
        >
          {isLocating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <LocateFixed className="h-3.5 w-3.5" />
          )}
          {isLocating ? "Locating..." : "Use my location"}
        </Button>
      </div>

      {apiError && !value && (
        <p className="text-xs text-muted-foreground">
          Search unavailable — click the map to place your pin manually.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Use a neighbourhood or city — do not share your exact address.
      </p>
    </div>
  );
}
