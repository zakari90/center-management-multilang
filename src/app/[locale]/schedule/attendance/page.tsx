"use client";

import { AttendanceModule } from "./components/AttendanceModule";
import { PublicHeader } from "@/components/PublicHeader";

export default function AttendancePage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <PublicHeader />
      <AttendanceModule />
    </main>
  );
}
