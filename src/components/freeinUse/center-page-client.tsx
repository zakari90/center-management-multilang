"use client";

import CenterPresentation from "@/components/freeinUse/centerPresentation";
import { NewCenterForm } from "@/components/freeinUse/newCenterForm";
import { useAuth } from "@/freelib/context/freeauthContext";
import { centerActions } from "@/freelib/dexie/freedexieaction";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export default function CenterPageClient() {
  const [centerId, setCenterId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchCenterId = useCallback(async () => {
    try {
      setIsLoading(true);

      if (!user) {
        setCenterId(null);
        setIsLoading(false);
        return;
      }

      const centers = await centerActions.getAll();

      // Debug logging (only in development)

      // Filter: For admin users, show centers where adminId matches OR if no adminId, show first active center
      // This handles cases where adminId might not be set correctly during sync
      const activeCenters = centers;
      const adminCenters = activeCenters.filter((c) => c.adminId === user.id);

      // If no exact match but user is admin, use first active center
      // This helps when centers exist but adminId wasn't synced correctly
      const isAdmin = user.role?.toUpperCase() === "ADMIN";
      const centerToShow =
        adminCenters.length > 0
          ? adminCenters[0]
          : isAdmin && activeCenters.length > 0
            ? activeCenters[0]
            : null;

      if (centerToShow) {
        setCenterId(centerToShow.id);
      } else {
        // Only log in development to reduce console noise

        setCenterId(null);
      }
    } catch (error) {
      setCenterId(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCenterId();
  }, [fetchCenterId]);

  // ✅ Callback to refresh after center creation
  const handleCenterCreated = useCallback(() => {
    fetchCenterId();
  }, [fetchCenterId]);

  return (
    <div>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : centerId ? (
        <CenterPresentation centerId={centerId} />
      ) : (
        <NewCenterForm onCenterCreated={handleCenterCreated} />
      )}
    </div>
  );
}
