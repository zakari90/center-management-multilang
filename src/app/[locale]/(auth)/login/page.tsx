// src/app/[locale]/(auth)/login/page.tsx
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-1 md:p-10">
      <div className="w-full lg:max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
