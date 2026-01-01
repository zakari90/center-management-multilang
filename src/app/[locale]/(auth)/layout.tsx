"use client";

import { useAuth } from "@/context/authContext";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only redirect after component has mounted and auth is loaded
    if (!mounted || isLoading) return;

    if (user?.role === "ADMIN") {
      router.push(`/${locale}/admin`);
      return;
    }

    if (user?.role === "MANAGER") {
      router.push(`/${locale}/manager`);
      return;
    }
  }, [user, isLoading, mounted, router, locale]);

  // Show loading state while checking authentication
  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
        <div className="flex w-full max-w-sm flex-col md:gap-6">
          {children}
        </div>
      </div>
    </div>
  );
}
