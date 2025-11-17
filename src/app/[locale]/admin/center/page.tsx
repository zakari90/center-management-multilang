"use client";

import CenterPresentation from "@/components/centerPresentation";
import { NewCenterForm } from "@/components/newCenterForm";
import { centerActions } from "@/lib/dexie/dexieActions";
import { useAuth } from "@/context/authContext";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

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
      const adminCenters = centers.filter(c => c.adminId === user.id && c.status !== '0');
      
      if (adminCenters.length === 0) {
        setCenterId(null);
      } else {
        // ✅ CenterPresentation uses useLiveQuery, so we only need the ID
        setCenterId(adminCenters[0].id);
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
        <NewCenterForm onCenterCreated={handleCenterCreated} />
      )}
    </div>
  );
}

export default Page;
