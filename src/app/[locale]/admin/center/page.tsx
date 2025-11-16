/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import CenterPresentation from "@/components/centerPresentation";
import { NewCenterForm } from "@/components/newCenterForm";
import { centerActions, subjectActions } from "@/lib/dexie/dexieActions";
import { useAuth } from "@/context/authContext";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";

function Page() {
  const [centerData, setCenterData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0); // ✅ Add refresh trigger
  const { user } = useAuth(); // ✅ Use AuthContext instead of getSession

  // ✅ Extract fetch function so it can be called after center creation
  const fetchData = useCallback(async () => {
      try {
      setIsLoading(true);
      // ✅ Use AuthContext user instead of getSession (which can't read httpOnly cookies)
      if (!user) {
        setCenterData(null);
        setIsLoading(false);
        return;
      }

      // Get all centers for this admin
      const centers = await centerActions.getAll();
      const adminCenters = centers.filter(c => c.adminId === user.id);
      
      if (adminCenters.length === 0) {
          setCenterData(null);
        } else {
        // Get the first center (most recent)
        const center = adminCenters[0];
        
        // ✅ Get subjects for this center from local DB
        const allSubjects = await subjectActions.getAll();
        const centerSubjects = allSubjects
          .filter(s => s.centerId === center.id && s.status !== '0') // Exclude deleted
          .map(s => ({
            id: s.id,
            name: s.name,
            grade: s.grade,
            price: s.price,
            duration: s.duration ?? null,
            createdAt: new Date(s.createdAt).toISOString(),
            updatedAt: new Date(s.updatedAt).toISOString(),
            centerId: s.centerId,
          }));

        // Combine center with subjects to match API structure
        const centerWithSubjects: any = {
          id: center.id,
          name: center.name,
          address: center.address,
          phone: center.phone,
          classrooms: center.classrooms,
          workingDays: center.workingDays,
          subjects: centerSubjects,
          createdAt: new Date(center.createdAt).toISOString(),
          updatedAt: new Date(center.updatedAt).toISOString(),
          adminId: center.adminId,
        };

        setCenterData(centerWithSubjects);
      }
      
      // ✅ Commented out online fetch
      // try {
      //   const response = await axios.get(`/api/center`, {
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //   });
      //   if (response.data.length === 0) {
      //     setCenterData(null);
      //   } else {
      //     setCenterData(response.data[0]);
      //   }
      // } catch (error) {
      //   console.error("Error fetching center data:", error);
      //   setCenterData(null);
      // }
        
      } catch (error) {
      console.error("Error fetching center data from local DB:", error);
        setCenterData(null);
      } finally {
        setIsLoading(false);
      }
  }, [user]); // ✅ Add user as dependency

  // ✅ Fetch on mount and when refreshKey changes
  useEffect(() => {
    fetchData();
  }, [fetchData, refreshKey]);

  // ✅ Function to trigger refresh (can be passed to NewCenterForm)
  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);
  
  return (
    <div className="max-w-3xl mx-auto p-6">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : centerData ? (
        <CenterPresentation {...centerData} />
      ) : (
        <NewCenterForm onCenterCreated={handleRefresh} />
      )}
    </div>
  );
}
export default Page;
