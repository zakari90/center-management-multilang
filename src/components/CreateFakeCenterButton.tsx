"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/authContext";
import { createFakeCenter } from "@/lib/utils/createFakeCenter";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CreateFakeCenterButtonProps {
  onCenterCreated?: () => void;
  className?: string;
}

export function CreateFakeCenterButton({ 
  onCenterCreated,
  className 
}: CreateFakeCenterButtonProps) {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateFakeCenter = async () => {
    if (!user || user.role !== "ADMIN") {
      toast.error("Only admins can create centers");
      return;
    }

    setIsCreating(true);
    try {
     await createFakeCenter(user.id, {
        syncToServer: true, // Try to sync if online
      });

      toast("Fake center created successfully!");
      
      // Refresh parent component
      if (onCenterCreated) {
        onCenterCreated();
      }
    } catch (error) {
      console.error("Error creating fake center:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create fake center");
    } finally {
      setIsCreating(false);
    }
  };

  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <Button
      onClick={handleCreateFakeCenter}
      disabled={isCreating}
      variant="outline"
      className={className}
    >
      {isCreating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Creating...
        </>
      ) : (
        "Create Fake Center (Test)"
      )}
    </Button>
  );
}

