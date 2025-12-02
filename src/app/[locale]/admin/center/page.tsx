"use client";

import CenterPresentation from "@/components/centerPresentation";
import { NewCenterForm } from "@/components/newCenterForm";
import { useAuth } from "@/context/authContext";
import { centerActions } from "@/lib/dexie/dexieActions";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function Page() {
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

        console.log("🔍 Center Debug:", {
          userId: user.id,
          userRole: user.role,
          totalCenters: centers.length,
          centers: centers.map(c => ({
            id: c.id,
            name: c.name,
            adminId: c.adminId,
            status: c.status,
            matches: c.adminId === user.id
          }))
        });
    

      // Filter: For admin users, show centers where adminId matches OR if no adminId, show first active center
      // This handles cases where adminId might not be set correctly during sync
      const activeCenters = centers.filter(c => c.status !== '0');
      const adminCenters = activeCenters.filter(c => c.adminId === user.id);
      
      // If no exact match but user is admin, use first active center
      // This helps when centers exist but adminId wasn't synced correctly
      const isAdmin = user.role?.toUpperCase() === 'ADMIN';
      const centerToShow = adminCenters.length > 0 
        ? adminCenters[0] 
        : (isAdmin && activeCenters.length > 0)
          ? activeCenters[0]
          : null;
      
      if (centerToShow) {
        if (process.env.NODE_ENV === 'development') {
          console.log("✅ Using center:", centerToShow.id, centerToShow.name);
        }
        setCenterId(centerToShow.id);
      } else {
        // Only log in development to reduce console noise
        if (process.env.NODE_ENV === 'development') {
          console.log("❌ No center found");
        }
        setCenterId(null);
      }
    } catch (error) {
      console.error("Error fetching center data from local DB:", error);
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
    <div className="max-w-3xl mx-auto p-6">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : centerId ? (
        <CenterPresentation centerId={centerId} />
      ) : (
        <div className="space-y-4">
          <NewCenterForm onCenterCreated={handleCenterCreated} />
        </div>
      )}
    </div>
  );
}

export default Page;