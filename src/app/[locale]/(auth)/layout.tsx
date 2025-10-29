/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSession } from "@/lib/authentication";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
    const session : any = await getSession();
  
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

                    {children}
            </div>
          </div>
        </div>

  );
}
