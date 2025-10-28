"use client";

import type { Center } from "@/components/centerPresentation";
import CenterPresentation from "@/components/centerPresentation"; // Remove "copy" if not needed
import { NewCenterForm } from "@/components/newCenterForm";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

function Page() {
  const [centerData, setCenterData] = useState<Center | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/api/center`, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.data.length === 0) {
          setCenterData(null);
        } else {
          setCenterData(response.data[0]);
        }
        
      } catch (error) {
        console.error("Error fetching center data:", error);
        setCenterData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
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
        <NewCenterForm />
      )}
    </div>
  );
}

export default Page;
