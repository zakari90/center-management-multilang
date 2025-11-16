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
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (!user) {
        setCenterData(null);
        setIsLoading(false);
        return;
      }

      const centers = await centerActions.getAll();
      const adminCenters = centers.filter(c => c.adminId === user.id && c.status !== '0');
      
      if (adminCenters.length === 0) {
        setCenterData(null);
      } else {
        const center = adminCenters[0];
        
        const allSubjects = await subjectActions.getAll();
        const centerSubjects = allSubjects
          .filter(s => s.centerId === center.id && s.status !== '0')
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
    } catch (error) {
      console.error("Error fetching center data from local DB:", error);
      setCenterData(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return (
    <div className="max-w-3xl mx-auto p-6">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : centerData ? (
        <CenterPresentation centerId={centerData.id} />
      ) : (
        <NewCenterForm />
      )}
    </div>
  );
}

export default Page;
