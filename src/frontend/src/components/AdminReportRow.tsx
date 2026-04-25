import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Ban, Loader2, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Report } from "../backend";
import {
  useAdminRemoveListing,
  useBanUser,
  useDismissReport,
  useGetUserProfile,
} from "../hooks/useQueries";
import { REPORT_REASON_LABELS } from "../utils/constants";
import { fromNanoseconds } from "../utils/formatting";

interface AdminReportRowProps {
  report: Report;
}

export function AdminReportRow({ report }: AdminReportRowProps) {
  const [confirmAction, setConfirmAction] = useState<
    "dismiss" | "remove" | "ban" | null
  >(null);

  const { mutate: dismissReport, isPending: isDismissing } = useDismissReport();
  const { mutate: removeListing, isPending: isRemoving } =
    useAdminRemoveListing();
  const { mutate: banUser, isPending: isBanning } = useBanUser();

  const isListing = "listing" in report.target;
  const targetId = isListing
    ? (report.target as { listing: bigint }).listing
    : null;
  const targetPrincipal = !isListing
    ? (
        report.target as { user: import("@icp-sdk/core/principal").Principal }
      ).user.toString()
    : null;

  const { data: reporterProfile } = useGetUserProfile(
    report.reporter.toString(),
  );
  const { data: targetUserProfile } = useGetUserProfile(
    targetPrincipal ?? undefined,
  );

  const isPending = isDismissing || isRemoving || isBanning;

  const handleConfirm = () => {
    if (confirmAction === "dismiss") {
      dismissReport(report.id, {
        onSuccess: () => {
          toast.success("Report dismissed");
          setConfirmAction(null);
        },
        onError: () => toast.error("Failed to dismiss report"),
      });
    } else if (confirmAction === "remove" && targetId !== null) {
      removeListing(targetId, {
        onSuccess: () => {
          toast.success("Listing removed");
          setConfirmAction(null);
        },
        onError: () => toast.error("Failed to remove listing"),
      });
    } else if (confirmAction === "ban" && targetPrincipal) {
      banUser(targetPrincipal, {
        onSuccess: () => {
          toast.success("User banned");
          setConfirmAction(null);
        },
        onError: () => toast.error("Failed to ban user"),
      });
    }
  };

  const confirmLabels = {
    dismiss: {
      title: "Dismiss report?",
      description: "This report will be marked as resolved with no action.",
      action: "Dismiss",
      pendingAction: "Dismissing...",
    },
    remove: {
      title: "Remove listing?",
      description:
        "This listing will be permanently removed and hidden from all feeds.",
      action: "Remove",
      pendingAction: "Removing...",
    },
    ban: {
      title: "Ban user?",
      description:
        "This user will be banned. They won't be able to sign in or have their listings visible.",
      action: "Ban",
      pendingAction: "Banning...",
    },
  };

  const activeLabels = confirmAction ? confirmLabels[confirmAction] : null;

  return (
    <>
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {REPORT_REASON_LABELS[report.reason] ?? report.reason}
              </Badge>
              <Badge variant="secondary">
                {isListing ? "Listing" : "User"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(fromNanoseconds(report.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <p className="text-sm">
              <span className="text-muted-foreground">Reporter:</span>{" "}
              {reporterProfile?.name ??
                `${report.reporter.toString().slice(0, 16)}...`}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Target:</span>{" "}
              {isListing
                ? `Listing #${targetId}`
                : (targetUserProfile?.name ??
                  `${targetPrincipal?.slice(0, 16)}...`)}
            </p>
            {report.description && (
              <p className="text-sm text-muted-foreground italic">
                &ldquo;{report.description}&rdquo;
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => setConfirmAction("dismiss")}
          >
            <XCircle className="mr-1 h-4 w-4" />
            Dismiss
          </Button>
          {isListing && (
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={() => setConfirmAction("remove")}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Remove Listing
            </Button>
          )}
          {!isListing && targetPrincipal && (
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={() => setConfirmAction("ban")}
            >
              <Ban className="mr-1 h-4 w-4" />
              Ban User
            </Button>
          )}
        </div>
      </div>

      <AlertDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{activeLabels?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {activeLabels?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? activeLabels?.pendingAction : activeLabels?.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
