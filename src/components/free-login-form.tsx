"use client";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ModeToggle } from "@/components/ModeToggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/authContext";
import { freeLocalActions } from "@/lib/dexie/freeLocalActions";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Building2,
  UserCog,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function FreeLoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const t = useTranslations("login");
  const locale = useLocale();
  const { login } = useAuth(); // If they use authContext for global state

  const [centerName, setCenterName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setCheckingAdmin(true);
    freeLocalActions.hasAdmin()
      .then((exists) => {
        setHasAdmin(exists);
      })
      .catch((err) => {
        console.error("Failed to check local admin:", err);
        setHasAdmin(null);
      })
      .finally(() => {
        setCheckingAdmin(false);
      });
  }, []);

  const handleSetupOrLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsPending(true);
    setError(null);
    setSuccess(false);

    try {
      if (!hasAdmin) {
        if (!centerName || !adminName) {
          setError("الرجاء إدخال اسم المركز واسم المدير"); // Should be localized ideally
          setIsPending(false);
          return;
        }
        await freeLocalActions.initFreeSetup(centerName, adminName);
      }
      
      const adminRaw = await freeLocalActions.getLocalAdmin();
      if (adminRaw) {
        // Log them into the app context
        // local admin doesn't have an epoch or passwordHash worth sending over network,
        // but it satisfies the AuthContext
        login(adminRaw, undefined, "", "");
        setSuccess(true);
        // Redirect to local dashboard
        window.location.href = `/${locale}/free`;
      } else {
        setError("فشل في إعداد المدير المحلي");
      }
    } catch (err) {
      console.error(err);
      setError("An error occurred during local setup.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <div>
        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-2 pb-4 text-center sm:pb-6">
            <div className="inline-flex items-center justify-center rounded-lg bg-muted p-1 text-sm font-medium">
              <span className="px-6 py-1.5 text-foreground">
                نسخة مجانية (محلي فقط)
              </span>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-6 pb-6">
            {checkingAdmin ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : hasAdmin ? (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50 text-green-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <AlertDescription className="text-xs sm:text-sm font-medium ml-2">
                    المركز جاهز للعمل محلياً
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={() => handleSetupOrLogin()}
                  className="w-full h-11 text-sm font-medium"
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
                  ) : null}
                  الدخول إلى لوحة التحكم
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSetupOrLogin} className="space-y-5">
                <div className="space-y-4">
                  {error && (
                    <Alert variant="destructive" aria-live="assertive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <AlertDescription className="text-xs sm:text-sm font-medium ml-2">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}
                  {success && (
                    <Alert className="border-green-200 bg-green-50 text-green-800">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <AlertDescription className="text-xs sm:text-sm font-medium ml-2">
                        تم الإعداد بنجاح
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="centerName" className="text-sm font-semibold">
                    اسم المركز (مطلوب للنسخة المجانية)
                  </Label>
                  <div className="relative group">
                    <Building2 className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors pointer-events-none" />
                    <Input
                      id="centerName"
                      value={centerName}
                      onChange={(e) => setCenterName(e.target.value)}
                      placeholder="أدخل اسم المركز"
                      className="ps-9 h-11 w-full transition-colors"
                      required
                      disabled={isPending}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminName" className="text-sm font-semibold">
                    اسم المدير
                  </Label>
                  <div className="relative group">
                    <UserCog className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-foreground transition-colors pointer-events-none" />
                    <Input
                      id="adminName"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="أدخل اسم المدير"
                      className="ps-9 h-11 w-full transition-colors"
                      required
                      disabled={isPending}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-medium mt-2"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
                      جاري الإعداد...
                    </>
                  ) : (
                    "ابدأ النسخة المجانية"
                  )}
                </Button>
              </form>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <ModeToggle />
              <LanguageSwitcher />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
