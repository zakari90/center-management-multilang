"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Check,
  X,
  Trash2,
  Loader2,
  AlertCircle,
  Clock,
  User,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/authContext";
import { isOnline } from "@/lib/utils/network";
import { cn } from "@/lib/utils";

interface DeleteRequest {
  id: string;
  entityType: string;
  entityId: string;
  entityName: string;
  reason?: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedBy: string;
  reviewedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export default function DeleteRequestsPanel() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<DeleteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    if (!isOnline()) return;
    try {
      const res = await fetch("/api/admin/delete-requests?status=PENDING");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch delete requests:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (
    requestId: string,
    action: "APPROVED" | "REJECTED",
  ) => {
    if (!user?.id) return;
    setProcessingId(requestId);
    try {
      const res = await fetch("/api/admin/delete-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: requestId,
          action,
          reviewedBy: user.id,
        }),
      });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== requestId));
      }
    } catch (err) {
      console.error(`Failed to ${action.toLowerCase()} request:`, err);
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return null; // Don't show anything if no pending requests
  }

  return (
    <Card className="border-orange-200 dark:border-orange-800">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" />
          <CardTitle className="text-base">Delete Requests</CardTitle>
          <Badge variant="secondary" className="ml-auto">
            {requests.length} pending
          </Badge>
        </div>
        <CardDescription className="text-sm">
          Managers have requested to delete these records
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {requests.map((request) => {
          const isProcessing = processingId === request.id;
          const EntityIcon =
            request.entityType === "teacher" ? User : GraduationCap;

          return (
            <div
              key={request.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border bg-muted/20 transition-opacity",
                isProcessing && "opacity-50",
              )}
            >
              <EntityIcon className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {request.entityName}
                  </span>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {request.entityType}
                  </Badge>
                </div>
                {request.reason && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    Reason: {request.reason}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(request.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0 text-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950"
                  onClick={() => handleAction(request.id, "APPROVED")}
                  disabled={isProcessing}
                  title="Approve deletion"
                >
                  {isProcessing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 w-7 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                  onClick={() => handleAction(request.id, "REJECTED")}
                  disabled={isProcessing}
                  title="Reject deletion"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
