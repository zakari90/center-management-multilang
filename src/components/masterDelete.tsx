"use client";
import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash } from "lucide-react";

export function DeleteAllDataButton() {
  const [confirm, setConfirm] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleDelete = async () => {
    setStatus(null);
    try {
      await axios.post("/api/admin/delete-all");
      setStatus("All data deleted successfully!");
    } catch {
      setStatus("Failed to delete data!");
    } finally {
      setConfirm(false);
    }
  };

  return (
    <div className="my-6">
      {status && (
        <Alert className="mb-4">
          <AlertDescription>{status}</AlertDescription>
        </Alert>
      )}
      {confirm ? (
        <div>
          <p className="mb-2">Are you sure you want to <strong>delete ALL data</strong>? This cannot be undone.</p>
          <Button onClick={handleDelete} variant="destructive" className="mr-2">
            <Trash className="inline w-4 h-4 mr-1" />
            Yes, delete everything
          </Button>
          <Button onClick={() => setConfirm(false)} variant="outline">
            Cancel
          </Button>
        </div>
      ) : (
        <Button onClick={() => setConfirm(true)} variant="destructive">
          <Trash className="inline w-4 h-4 mr-1" />
          Delete All Data
        </Button>
      )}
    </div>
  );
}
