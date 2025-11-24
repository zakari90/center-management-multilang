"use client";

import CenterPresentation from "@/components/centerPresentation";
import { NewCenterForm } from "@/components/newCenterForm";
import { CreateFakeCenterButton } from "@/components/CreateFakeCenterButton";
import { centerActions } from "@/lib/dexie/dexieActions";
import { useAuth } from "@/context/authContext";
import { Loader2 } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import ServerActionCenters from "@/lib/dexie/centerServerAction";
import { generateObjectId } from "@/lib/utils/generateObjectId";
import { toast } from "sonner";
import db from "@/lib/db";

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
      if (process.env.NODE_ENV === 'development') {
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
      }

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

  // Manual sync with server - Test button
  const syncTodos = async () => {
    try {
      if (!user) {
        toast("Please log in first");
        return;
      }

      // Create a test center in local DB first
      const centerId = generateObjectId();
      const now = Date.now();
      
      const testCenter = {
        id: centerId,
        name: 'Test Center ' + new Date().toLocaleTimeString(),
        address: '123 Test Street',
        phone: '1234567890',
        classrooms: ['Room 1', 'Room 2', 'Room 3'],
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        adminId: user.id,
        status: 'w' as const, // Mark as waiting for sync
        createdAt: now,
        updatedAt: now,
        managers: [],
      };

      // Save to local DB
      await centerActions.putLocal(testCenter);
      toast("Test center saved locally");

      // Try to sync to server
      try {
        const result = await ServerActionCenters.SaveToServer(testCenter);
        await centerActions.markSynced(centerId);
        toast("Test center synced to server successfully!");
        console.log("✅ Sync result:", result);
        
        // Refresh the page to show the new center
        fetchCenterId();
      } catch (syncError: unknown) {
        const errorMessage = syncError instanceof Error ? syncError.message : "Unknown error";
        console.error("❌ Sync failed:", syncError);
        toast("Sync failed: " + errorMessage);
        toast("Center saved locally, will sync when online");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("❌ Error creating test center:", err);
      toast("Failed to create test center: " + errorMessage);
    }
  };

  // Import todos from server
  // const importTodos = async () => {
  //   setLoading(true);
  //   try {
  //     await ServerAction.ImportFromServer();
  //     setTodos(await ServerActionCenters.());
  //     alert("Imported todos from server.");
  //   } catch (err) {
  //     alert("Import failed: " + err);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button onClick={syncTodos}>
        Sync Centers
      </button>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : centerId ? (
        <CenterPresentation centerId={centerId} />
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <CreateFakeCenterButton onCenterCreated={handleCenterCreated} />
          </div>
          <NewCenterForm onCenterCreated={handleCenterCreated} />
        </div>
      )}
    </div>
  );
}

export default Page;





function getFakeCenter() {
  return {
    name: faker.company.name(),
    address: faker.location.streetAddress(),
    phone: faker.phone.number(),
    classrooms: Array.from({ length: 5 }, () => faker.string.alpha(5)),
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    managers: [faker.string.uuid()],
    adminId: faker.string.uuid(), // Replace with real ObjectId if possible
  };
}

 const CenterFakeButton = () => {
  const [result, setResult] = useState("");

  async function handleSend() {
    const data = getFakeCenter();
    try {
      const res = await db.center.create({ data });
      setResult("Success: " + JSON.stringify(res));
    } catch (err) {
      setResult("Error: " + (err instanceof Error ? err.message : "Unknown"));
    }
  }

  return (
    <div>
      <button onClick={handleSend}>Send Direct Fake Center</button>
      {result && <pre>{result}</pre>}
    </div>
  );
};
