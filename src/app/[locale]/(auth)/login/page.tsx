// src/app/[locale]/(auth)/login/page.tsx
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { LoginForm } from "@/components/login-form";
import { ModeToggle } from "@/components/ModeToggle";
import OfflineNotificationBanner from "@/components/offline-notification-banner";

// Disable static generation for this page since it uses client-side auth
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-1 md:p-4">
      <OfflineNotificationBanner />

      <div className="w-full lg:max-w-sm">
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <LanguageSwitcher />
          <ModeToggle />
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
