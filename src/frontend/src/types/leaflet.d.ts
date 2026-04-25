// Minimal Leaflet type declarations for CDN usage
declare namespace L {
  interface LatLngExpression {
    lat: number;
    lng: number;
  }

  interface MapOptions {
    center?: [number, number];
    zoom?: number;
    zoomControl?: boolean;
  }

  interface TileLayerOptions {
    attribution?: string;
    maxZoom?: number;
  }

  interface MarkerOptions {
    icon?: Icon;
    draggable?: boolean;
  }

  interface IconOptions {
    iconUrl?: string;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
    popupAnchor?: [number, number];
    className?: string;
    html?: string;
  }

  interface PopupOptions {
    maxWidth?: number;
    className?: string;
  }

  interface FitBoundsOptions {
    padding?: [number, number];
    maxZoom?: number;
  }

  // biome-ignore lint/suspicious/noShadowRestrictedNames: Leaflet's actual class name
  class Map {
    setView(center: [number, number], zoom: number): this;
    addLayer(layer: Layer): this;
    removeLayer(layer: Layer): this;
    remove(): void;
    on(event: string, handler: (e: unknown) => void): this;
    getCenter(): { lat: number; lng: number };
    getZoom(): number;
    fitBounds(bounds: LatLngBounds, options?: FitBoundsOptions): this;
    getContainer(): HTMLElement;
  }

  class Layer {
    addTo(map: Map): this;
    remove(): this;
  }

  class TileLayer extends Layer {
    constructor(urlTemplate: string, options?: TileLayerOptions);
  }

  class Marker extends Layer {
    constructor(latlng: [number, number], options?: MarkerOptions);
    bindPopup(content: string | HTMLElement, options?: PopupOptions): this;
    openPopup(): this;
    closePopup(): this;
    getLatLng(): { lat: number; lng: number };
    setLatLng(latlng: [number, number]): this;
    on(event: string, handler: (e: unknown) => void): this;
  }

  class Icon {
    constructor(options: IconOptions);
  }

  class DivIcon extends Icon {
    constructor(options: IconOptions);
  }

  class LatLngBounds {
    extend(latlng: [number, number]): this;
  }

  function map(element: HTMLElement | string, options?: MapOptions): Map;
  function tileLayer(
    urlTemplate: string,
    options?: TileLayerOptions,
  ): TileLayer;
  function marker(latlng: [number, number], options?: MarkerOptions): Marker;
  function icon(options: IconOptions): Icon;
  function divIcon(options: IconOptions): DivIcon;
  function latLngBounds(latlngs?: [number, number][]): LatLngBounds;
}

declare global {
  interface Window {
    L: typeof L;
  }
}
