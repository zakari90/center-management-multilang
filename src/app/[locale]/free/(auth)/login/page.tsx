// src/app/[locale]/(auth)/login/page.tsx

import { FreeLoginForm } from "@/components/free-login-form";

// Disable static generation for this page since it uses client-side auth
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-1 md:p-4">
      <div className="w-full lg:max-w-sm">
        <FreeLoginForm />
      </div>
    </div>
  );
}
