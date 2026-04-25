import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ImagePlus, X } from "lucide-react";
import { useRef } from "react";
import { ExternalBlob } from "../backend";

const MAX_PHOTOS = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface PhotoUploadGridProps {
  photos: ExternalBlob[];
  onAdd: (blobs: ExternalBlob[]) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

export function PhotoUploadGrid({
  photos,
  onAdd,
  onRemove,
  disabled,
}: PhotoUploadGridProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const remaining = MAX_PHOTOS - photos.length;
    const filesToProcess = Array.from(files).slice(0, remaining);

    const blobs: ExternalBlob[] = [];
    for (const file of filesToProcess) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_FILE_SIZE) continue;

      const arrayBuffer = await file.arrayBuffer();
      const blob = ExternalBlob.fromBytes(new Uint8Array(arrayBuffer));
      blobs.push(blob);
    }

    if (blobs.length > 0) {
      onAdd(blobs);
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const canAddMore = photos.length < MAX_PHOTOS;

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo, index) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: stable list
              key={index}
              className="group relative aspect-square"
            >
              <img
                src={photo.getDirectURL()}
                alt={`Upload ${index + 1}`}
                className="h-full w-full rounded-md border object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -right-1.5 -top-1.5 h-6 w-6 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
                onClick={() => onRemove(index)}
                disabled={disabled}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {canAddMore && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-muted-foreground transition-colors hover:border-primary hover:text-primary",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <ImagePlus className="h-8 w-8" />
          <p className="text-sm">
            {photos.length === 0
              ? "Click or drag photos here"
              : `Add more photos (${photos.length}/${MAX_PHOTOS})`}
          </p>
        </div>
      )}
    </div>
  );
}
