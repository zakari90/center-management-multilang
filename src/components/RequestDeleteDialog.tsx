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
import { useState } from "react";
import { toast } from "sonner";

interface RequestDeleteDialogProps {
  entityId: string;
  entityType: "teacher" | "student";
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
      const res = await fetch("/api/manager/delete-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId,
          entityType,
          entityName,
          reason,
          requestedBy: user.id,
          managerName: user.name,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit request");

      toast.success("Request Submitted", {
        description: "Admin will review your request.",
      });
      setOpen(false);
      setReason("");
    } catch (error) {
      console.error("Delete request error:", error);
      toast.error("Error", {
        description: "Failed to submit delete request.",
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
