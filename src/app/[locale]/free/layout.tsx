"use client";

import { AuthProvider, useAuth } from "@/freelib/context/freeauthContext";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Role } from "@/freelib/dexie/dbSchema";

function AuthLayoutInner({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only redirect after component has mounted and auth is loaded
    if (!mounted || isLoading) return;

    if (user?.role === Role.ADMIN) {
      if (!pathname.startsWith(`/${locale}/free/admin`)) {
        router.push(`/${locale}/free/admin`);
      }
      return;
    }
  }, [user, isLoading, mounted, router, locale, pathname]);

  // Show loading state while checking authentication
  if (!mounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{/* Loading... */}</p>
        </div>
      </div>
    );
  }

  return <div className="w-full h-full min-h-svh">{children}</div>;
}

export default function FreeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <AuthLayoutInner>{children}</AuthLayoutInner>
    </AuthProvider>
  );
}
