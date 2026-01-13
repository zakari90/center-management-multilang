// src/app/[locale]/(auth)/login/page.tsx
import { LoginForm } from "@/components/login-form";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ModeToggle } from "@/components/ModeToggle";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-1 md:p-10">
      {/* Language and Theme Switchers */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageSwitcher />
        <ModeToggle />
      </div>
      
      {/* Login Form */}
      <div className="w-full lg:max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
