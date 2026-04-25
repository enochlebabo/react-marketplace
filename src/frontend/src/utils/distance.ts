const EARTH_RADIUS_KM = 6371;

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}

export interface HasListingCoordinates {
  latitude: number | null;
  longitude: number | null;
}

export function filterByRadius<T extends HasListingCoordinates>(
  items: T[] | undefined,
  userLat: number | null | undefined,
  userLng: number | null | undefined,
  radiusKm: string,
  sort?: boolean,
): T[] | undefined {
  if (!items) return undefined;
  if (radiusKm === "anywhere" || userLat == null || userLng == null) {
    return sort ? sortByDistance(items, userLat, userLng) : items;
  }
  const maxKm = Number.parseFloat(radiusKm);
  const filtered = items.filter((item) => {
    if (item.latitude == null || item.longitude == null) return true;
    return (
      calculateDistance(userLat, userLng, item.latitude, item.longitude) <=
      maxKm
    );
  });
  return sort ? sortByDistance(filtered, userLat, userLng) : filtered;
}

function sortByDistance<T extends HasListingCoordinates>(
  items: T[],
  userLat: number | null | undefined,
  userLng: number | null | undefined,
): T[] {
  if (userLat == null || userLng == null) return items;
  return [...items].sort((a, b) => {
    const distA =
      a.latitude != null && a.longitude != null
        ? calculateDistance(userLat, userLng, a.latitude, a.longitude)
        : Number.POSITIVE_INFINITY;
    const distB =
      b.latitude != null && b.longitude != null
        ? calculateDistance(userLat, userLng, b.latitude, b.longitude)
        : Number.POSITIVE_INFINITY;
    return distA - distB;
  });
}
