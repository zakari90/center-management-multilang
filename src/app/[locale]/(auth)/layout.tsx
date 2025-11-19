"use client"

import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === "ADMIN") {
        router.push("/admin");
      } else if (user.role === "MANAGER") {
        router.push("/manager");
      }
    }
  }, [user, isLoading, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
          <div className="flex w-full max-w-sm flex-col gap-6">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if user is authenticated (redirect will happen)
  if (user) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col gap-6">
          {children}
        </div>
      </div>
    </div>
  );
}
