import { getSession } from "@/lib/authentication";
import { Building, Building2, PenLine } from "lucide-react";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const session = await getSession();
  
    if (session?.user?.role === "ADMIN") {
      redirect("/admin");
    }
  
    if (session?.user?.role === "MANAGER") {
      redirect("/manager");
    }
  return (
        <div className="max-w-3xl mx-auto p-6">
          <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <div className="flex items-center gap-2 self-center font-medium">
                  <Building2 className="size-12 text-blue-500 " />
                </div>
  
                    {children}
      <div className="text-muted-foreground text-center text-xs text-balance">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
      </div>
            </div>
          </div>
        </div>

  );
}
