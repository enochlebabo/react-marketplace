import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useState } from "react";
import { toast } from "sonner";
import type { ReportReason } from "../backend";
import {
  useReportListing,
  useReportRating,
  useReportUser,
} from "../hooks/useQueries";
import { REPORT_REASON_LABELS } from "../utils/constants";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target:
    | { type: "listing"; id: bigint }
    | { type: "user"; principal: string }
    | { type: "rating"; seller: string; listingId: bigint };
}

export function ReportDialog({
  open,
  onOpenChange,
  target,
}: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const { mutate: reportListing, isPending: isReportingListing } =
    useReportListing();
  const { mutate: reportUser, isPending: isReportingUser } = useReportUser();
  const { mutate: reportRating, isPending: isReportingRating } =
    useReportRating();

  const isPending = isReportingListing || isReportingUser || isReportingRating;

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (open) {
      setReason("");
      setDescription("");
      setError("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError("Please select a reason");
      return;
    }
    const desc = description.trim() || null;
    const callbacks = {
      onSuccess: () => {
        toast.success("Report submitted. Thank you.");
        onOpenChange(false);
      },
      onError: (err: Error) => {
        setError(err.message || "Failed to submit report");
      },
    };
    if (target.type === "listing") {
      reportListing(
        { listingId: target.id, reason, description: desc },
        callbacks,
      );
    } else if (target.type === "user") {
      reportUser(
        { user: target.principal, reason, description: desc },
        callbacks,
      );
    } else {
      reportRating(
        {
          seller: target.seller,
          listingId: target.listingId,
          reason,
          description: desc,
        },
        callbacks,
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              Report {target.type === "rating" ? "review" : target.type}
            </DialogTitle>
            <DialogDescription>
              Let us know why you&apos;re reporting this{" "}
              {target.type === "rating" ? "review" : target.type}.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Select
                value={reason}
                onValueChange={(v) => {
                  setReason(v as ReportReason);
                  setError("");
                }}
              >
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REPORT_REASON_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Details (optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide additional details..."
                maxLength={1000}
                rows={3}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
