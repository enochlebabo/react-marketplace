import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ImageIcon } from "lucide-react";

interface PhotoGalleryProps {
  listing: {
    title: string;
    photos: Array<{ hash: { getDirectURL: () => string } }>;
  };
}

export function PhotoGallery({ listing }: PhotoGalleryProps) {
  if (listing.photos.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-md bg-muted">
        <ImageIcon className="h-16 w-16 text-muted-foreground/40" />
      </div>
    );
  }

  if (listing.photos.length === 1) {
    return (
      <div className="overflow-hidden rounded-md">
        <img
          src={listing.photos[0].hash.getDirectURL()}
          alt={listing.title}
          className="aspect-video w-full object-cover"
        />
      </div>
    );
  }

  return (
    <Carousel className="group relative w-full">
      <CarouselContent>
        {listing.photos.map((photo, i) => (
          <CarouselItem
            // biome-ignore lint/suspicious/noArrayIndexKey: stable list
            key={i}
          >
            <div className="overflow-hidden rounded-md">
              <img
                src={photo.hash.getDirectURL()}
                alt={`${listing.title} ${i + 1}`}
                className="aspect-video w-full object-cover"
              />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="left-2" />
      <CarouselNext className="right-2" />
    </Carousel>
  );
}
