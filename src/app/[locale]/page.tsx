/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSession } from "@/lib/authentication";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const t = await getTranslations('homePage');
  const session :any = await getSession();

  if (session?.user?.role === "ADMIN") {
    redirect("/admin");
  }

  if (session?.user?.role === "MANAGER") {
    redirect("/manager");
  }

  return (
    <main className="flex flex-col items-center justify-center h-screen bg-gray-50 gap-6">
      <h1 className="text-4xl font-bold">{t('title')}</h1>
      <p className="text-gray-600">{t('description')}</p>
      <div className="flex gap-4">
        <Link href="/login">
          <button className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700">
            {t('ownerDashboard')}
          </button>
        </Link>
        <Link href="/managerLogin">
          <button className="px-6 py-3 bg-green-600 text-white rounded hover:bg-green-700">
            {t('managerDashboard')}
          </button>
        </Link>
      </div>
    </main>
  );
}