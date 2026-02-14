import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/authContext";
import { Trash2 } from "lucide-react";
import { deleteRequestActions } from "@/lib/dexie/dexieActions";
import { ServerActionDeleteRequests } from "@/lib/dexie/serverActions";
import { DeleteRequestStatus } from "@/lib/dexie/dbSchema";
import { useState } from "react";
import { toast } from "sonner";

interface RequestDeleteDialogProps {
  entityId: string;
  entityType:
    | "teacher"
    | "student"
    | "subject"
    | "schedule"
    | "receipt"
    | "teacherSubject"
    | "studentSubject";
  entityName: string;
  trigger?: React.ReactNode;
}

export function RequestDeleteDialog({
  entityId,
  entityType,
  entityName,
  trigger,
}: RequestDeleteDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Reason is required", {
        description: "Please provide a reason for the deletion request.",
      });
      return;
    }

    if (!user) {
      toast.error("Unauthorized");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Save to local Dexie DB first (Offline-First)
      const requestId = await deleteRequestActions.create({
        id: crypto.randomUUID(), // Generate a temporary ID
        entityId,
        entityType,
        entityName,
        reason,
        requestedBy: user.id,
        requestStatus: DeleteRequestStatus.PENDING,
        status: "w", // Waiting to sync
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // 2. Try to sync immediately
      toast.info("Saving request...", {
        description: "Attempting to sync with server.",
      });

      const syncResult = await ServerActionDeleteRequests.Sync();

      if (syncResult.successCount > 0) {
        toast.success("Request Sent", {
          description: "Admin will review your request.",
        });
      } else {
        toast.success("Saved Offline", {
          description: "Request will be sent when online.",
        });
      }

      setOpen(false);
      setReason("");
    } catch (error) {
      console.error("Delete request error:", error);
      toast.error("Error", {
        description: "Failed to save delete request.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200"
            title="Request Delete"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Request Deletion</AlertDialogTitle>
          <AlertDialogDescription>
            You are requesting to delete <strong>{entityName}</strong>. This
            action requires admin approval.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4 space-y-2">
          <Label htmlFor="reason">Reason for deletion</Label>
          <Input
            id="reason"
            placeholder="e.g., Left the center, Duplicate entry..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
