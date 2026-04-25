import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Category, ExternalBlob } from "../backend";
import { useCreateListing, useProfile } from "../hooks/useQueries";
import { CATEGORY_LABELS, DEFAULT_CURRENCY } from "../utils/constants";
import { CurrencyCombobox } from "./CurrencyCombobox";
import { PhotoUploadGrid } from "./PhotoUploadGrid";

interface CreateListingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateListingDialog({
  open,
  onOpenChange,
}: CreateListingDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [category, setCategory] = useState<Category | "">("");
  const [photos, setPhotos] = useState<ExternalBlob[]>([]);
  const [error, setError] = useState("");

  const { mutate: createListing, isPending } = useCreateListing();
  const { data: profile } = useProfile();
  const profileCurrency = profile?.currency || DEFAULT_CURRENCY;

  useEffect(() => {
    if (open) {
      setCurrency(profileCurrency);
    }
  }, [open, profileCurrency]);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (nextOpen) {
      setTitle("");
      setDescription("");
      setPrice("");
      setCurrency(profileCurrency);
      setCategory("");
      setPhotos([]);
      setError("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!category) {
      setError("Category is required");
      return;
    }
    const priceNum = Number(price);
    if (!price || Number.isNaN(priceNum) || priceNum < 0) {
      setError("Price must be a non-negative number");
      return;
    }
    if (photos.length === 0) {
      setError("At least one photo is required");
      return;
    }

    createListing(
      {
        title: title.trim(),
        description: description.trim(),
        price: BigInt(Math.floor(priceNum)),
        currency,
        category,
        photos,
      },
      {
        onSuccess: () => {
          toast.success("Listing created");
          handleOpenChange(false);
        },
        onError: (err) => {
          setError(err.message || "Failed to create listing");
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Listing</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you selling?"
              maxLength={200}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price</Label>
            <div className="flex gap-2">
              <Input
                id="price"
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                disabled={isPending}
                className="flex-1"
              />
              <CurrencyCombobox
                value={currency}
                onValueChange={setCurrency}
                disabled={isPending}
                compact
                align="end"
                triggerClassName="w-[110px]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={category}
              onValueChange={(val) => setCategory(val as Category)}
              disabled={isPending}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your item..."
              rows={3}
              maxLength={5000}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label>Photos</Label>
            <PhotoUploadGrid
              photos={photos}
              onAdd={(newPhotos) =>
                setPhotos((prev) => [...prev, ...newPhotos].slice(0, 10))
              }
              onRemove={(index) =>
                setPhotos((prev) => prev.filter((_, i) => i !== index))
              }
              disabled={isPending}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Creating..." : "Create Listing"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
