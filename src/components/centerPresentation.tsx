"use client";

import { EntitySyncControls } from "@/components/EntitySyncControls";
import { ItemInputList } from "@/components/itemInputList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { centerActions, subjectActions } from "@/lib/dexie/dexieActions";
import {
  ServerActionCenters,
  ServerActionSubjects,
} from "@/lib/dexie/serverActions";
import { Center, Subject, localDb } from "@/lib/dexie/dbSchema";
import { generateObjectId } from "@/lib/utils/generateObjectId";
import { useLiveQuery } from "dexie-react-hooks";
import {
  BookOpen,
  Building2,
  CalendarDays,
  Loader2,
  Pencil,
  Plus,
  CalendarRange,
  Clock,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { isOnline } from "@/lib/utils/network";
import { useIsOnline } from "@/hooks/useOnlineStatus";
import { EditDialog } from "./editDialog";
import { EditSubjectCard } from "./editSubjectCard";
import { SubjectForm } from "./subjectForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { useLocalizedConstants } from "./useLocalizedConstants";

interface CenterPresentationProps {
  centerId: string;
}

export default function CenterPresentation({
  centerId,
}: CenterPresentationProps) {
  const t = useTranslations("CenterPresentation");
  const {
    availableSubjects,
    availableGrades,
    availableClassrooms,
    daysOfWeek,
    monthsOfYear,
  } = useLocalizedConstants();

  // ✅ Use useLiveQuery for real-time updates from IndexedDB
  const center = useLiveQuery(
    () => centerActions.getLocal(centerId),
    [centerId],
  );

  // ✅ Optimized: Use Dexie indexed query directly to prevent duplicates
  const subjects = useLiveQuery(async () => {
    if (!centerId) return [];

    // Query subjects by centerId and exclude deleted ones (status !== '0')
    // Use indexed query for efficient filtering
    const allSubjects = await localDb.subjects
      .where("centerId")
      .equals(centerId)
      .filter((s) => s.status !== "0")
      .toArray();

    // Deduplicate by ID (in case of any duplicates in DB)
    const uniqueSubjects = Array.from(
      new Map(allSubjects.map((s) => [s.id, s])).values(),
    );

    // Debug: Log if duplicates were found
    if (allSubjects.length !== uniqueSubjects.length) {
      console.warn(
        `[CenterPresentation] Found ${allSubjects.length - uniqueSubjects.length} duplicate subjects for center ${centerId}`,
      );
    }

    // Sort by updatedAt descending
    return uniqueSubjects.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [centerId]);

  const [tempClassrooms, setTempClassrooms] = useState<string[]>([]);
  const [tempWorkingDays, setTempWorkingDays] = useState<string[]>([]);
  const [tempWorkingMonths, setTempWorkingMonths] = useState<string[]>([]);
  const [tempWorkingYears, setTempWorkingYears] = useState<string[]>([]);
  const [tempPaymentStartDay, setTempPaymentStartDay] = useState<number>(1);
  const [tempPaymentEndDay, setTempPaymentEndDay] = useState<number>(30);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCenterDebugSyncing, setIsCenterDebugSyncing] = useState(false);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const onlineStatus = useIsOnline();
  const hasSyncedOnOnline = useRef(false);
  const previousOnlineStatus = useRef<boolean | null>(null);

  // ✅ Auto-sync function when online
  const syncWhenOnline = useCallback(async () => {
    if (!isOnline() || isAutoSyncing) {
      return;
    }

    setIsAutoSyncing(true);
    try {
      console.log("[AutoSync] Starting automatic sync when online...");

      // Sync centers and subjects (relevant to this component)
      const [centerResult, subjectResult] = await Promise.allSettled([
        ServerActionCenters.Sync(),
        ServerActionSubjects.Sync(),
      ]);

      const centerSuccess = centerResult.status === "fulfilled";
      const subjectSuccess = subjectResult.status === "fulfilled";

      if (centerSuccess && subjectSuccess) {
        const centerData =
          centerResult.status === "fulfilled" ? centerResult.value : null;
        const subjectData =
          subjectResult.status === "fulfilled" ? subjectResult.value : null;

        const totalSuccess = (centerData as any)?.successCount || 0;
        const totalFail = (centerData as any)?.failCount || 0;
        const subjectSuccessCount = (subjectData as any)?.successCount || 0;
        const subjectFailCount = (subjectData as any)?.failCount || 0;

        const totalSynced = totalSuccess + subjectSuccessCount;
        const totalFailed = totalFail + subjectFailCount;

        if (totalSynced > 0 || totalFailed > 0) {
          toast.success(
            `Synced ${totalSynced} item(s)${totalFailed > 0 ? `, ${totalFailed} failed` : ""}`,
            { duration: 3000 },
          );
        }
        console.log("[AutoSync] Sync completed successfully");
      } else {
        const errors = [
          centerResult.status === "rejected" ? centerResult.reason : null,
          subjectResult.status === "rejected" ? subjectResult.reason : null,
        ].filter(Boolean);

        console.error("[AutoSync] Sync failed:", errors);
        toast.error("Auto-sync failed. You can sync manually.", {
          duration: 4000,
        });
      }
    } catch (error) {
      console.error("[AutoSync] Error during sync:", error);
      toast.error("Auto-sync error. You can sync manually.", {
        duration: 4000,
      });
    } finally {
      setIsAutoSyncing(false);
    }
  }, [isAutoSyncing]);

  // ✅ Listen for online status and auto-sync
  useEffect(() => {
    // Skip on initial mount
    if (previousOnlineStatus.current === null) {
      previousOnlineStatus.current = onlineStatus;
      return;
    }

    // Only sync when transitioning from offline to online
    const wasOffline = previousOnlineStatus.current === false;
    const isNowOnline = onlineStatus === true;

    if (isNowOnline && wasOffline && !hasSyncedOnOnline.current) {
      // Small delay to ensure network is stable
      const timeoutId = setTimeout(() => {
        if (isOnline()) {
          syncWhenOnline();
          hasSyncedOnOnline.current = true;
        }
      }, 1500); // Increased delay for network stability

      previousOnlineStatus.current = onlineStatus;
      return () => clearTimeout(timeoutId);
    }

    // Reset flag when going offline
    if (!onlineStatus) {
      hasSyncedOnOnline.current = false;
    }

    // Update previous status
    previousOnlineStatus.current = onlineStatus;
  }, [onlineStatus, syncWhenOnline]);

  // ✅ Sync temp states when center loads
  useEffect(() => {
    if (center) {
      setTempClassrooms(center.classrooms);

      setTempWorkingDays(center.workingDays);
      setTempWorkingMonths(center.workingMonths || []);
      setTempWorkingYears(center.workingYears || []);
      setTempPaymentStartDay(center.paymentStartDay || 1);
      setTempPaymentEndDay(center.paymentEndDay || 30);
    }
  }, [center]);

  // ✅ Show loading state
  if (!center) {
    return (
      <main className="max-w-3xl mx-auto p-4 sm:p-6">
        <Card className="shadow-lg border border-border bg-background">
          <CardContent className="p-8">
            <p className="text-center text-muted-foreground">
              {t("loading") || "Loading..."}
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  const handleAddSubject = () => {
    setIsAddDialogOpen(true);
  };

  // ✅ Add subject - simplified, useLiveQuery handles state updates
  const addSubject = async (
    subjectName: string,
    grade: string,
    price: number,
    duration?: number,
  ) => {
    try {
      const now = Date.now();
      const subjectId = generateObjectId();

      const newSubject: Subject = {
        id: subjectId,
        name: subjectName,
        grade,
        price,
        duration: duration ?? undefined,
        centerId: centerId,
        status: "w",
        createdAt: now,
        updatedAt: now,
      };

      await subjectActions.putLocal(newSubject);

      // ✅ Auto-sync to server if online
      if (isOnline()) {
        try {
          await ServerActionSubjects.SaveToServer(newSubject);
          await subjectActions.markSynced(subjectId);
          toast(t("subjectAdded") || "Subject added and synced successfully");
        } catch (syncError) {
          console.error("Subject sync failed, will retry later:", syncError);
          toast(t("subjectAdded") || "Subject added (will sync when online)");
        }
      } else {
        toast(t("subjectAdded") || "Subject added (will sync when online)");
      }

      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding subject:", error);
      toast(t("subjectAddFailed") || "Failed to add subject");
    }
  };

  // ✅ Update subject - simplified
  const handleUpdateSubject = async (
    subjectId: string,
    updatedData: Partial<
      Pick<Subject, "name" | "grade" | "price" | "duration">
    >,
  ) => {
    try {
      const existingSubject = await subjectActions.getLocal(subjectId);

      if (!existingSubject) {
        toast(t("subjectNotFound") || "Subject not found");
        return;
      }

      const updatedSubject: Subject = {
        ...existingSubject,
        name: updatedData.name ?? existingSubject.name,
        grade: updatedData.grade ?? existingSubject.grade,
        price: updatedData.price ?? existingSubject.price,
        duration:
          updatedData.duration !== undefined
            ? updatedData.duration === null
              ? undefined
              : updatedData.duration
            : existingSubject.duration,
        status: "w", // Mark as waiting for sync
        updatedAt: Date.now(),
      };

      await subjectActions.putLocal(updatedSubject);

      // ✅ Auto-sync to server if online
      if (isOnline()) {
        try {
          await ServerActionSubjects.SaveToServer(updatedSubject);
          await subjectActions.markSynced(subjectId);
          toast(
            t("subjectUpdated") || "Subject updated and synced successfully",
          );
        } catch (syncError) {
          console.error("Subject sync failed, will retry later:", syncError);
          toast(
            t("subjectUpdated") || "Subject updated (will sync when online)",
          );
        }
      } else {
        toast(t("subjectUpdated") || "Subject updated (will sync when online)");
      }
    } catch (error) {
      console.error("Error updating subject:", error);
      toast(t("subjectUpdateFailed") || "Failed to update subject");
    }
  };

  // ✅ Delete subject - simplified
  const handleDeleteSubject = async (subjectId: string) => {
    try {
      await subjectActions.markForDelete(subjectId);

      // ✅ No need to update local state - useLiveQuery auto-updates
      toast(t("subjectDeleted") || "Subject deleted successfully");
    } catch (error) {
      console.error("Error deleting subject:", error);
      toast(t("subjectDeleteFailed") || "Failed to delete subject");
    }
  };

  // ✅ Update classrooms - simplified
  const handleSaveClassrooms = async () => {
    if (!center) return;

    try {
      const updatedCenter: Center = {
        ...center,
        classrooms: tempClassrooms,
        status: "w",
        updatedAt: Date.now(),
      };

      await centerActions.putLocal(updatedCenter);

      // ✅ Auto-sync to server if online
      if (isOnline()) {
        try {
          await ServerActionCenters.SaveToServer(updatedCenter);
          await centerActions.markSynced(updatedCenter.id);
          toast(
            t("classroomsUpdated") ||
              "Classrooms updated and synced successfully",
          );
        } catch (syncError) {
          console.error("Center sync failed, will retry later:", syncError);
          toast(
            t("classroomsUpdated") ||
              "Classrooms updated (will sync when online)",
          );
        }
      } else {
        toast(
          t("classroomsUpdated") ||
            "Classrooms updated (will sync when online)",
        );
      }
    } catch (error) {
      console.error("Error updating classrooms:", error);
      toast(t("classroomsUpdateFailed") || "Failed to update classrooms");
    }
  };

  // ✅ Update working days - simplified
  const handleSaveWorkingDays = async () => {
    if (!center) return;

    try {
      const updatedCenter: Center = {
        ...center,
        workingDays: tempWorkingDays,
        status: "w",
        updatedAt: Date.now(),
      };

      await centerActions.putLocal(updatedCenter);

      // ✅ Auto-sync to server if online
      if (isOnline()) {
        try {
          await ServerActionCenters.SaveToServer(updatedCenter);
          await centerActions.markSynced(updatedCenter.id);
          toast(
            t("workingDaysUpdated") ||
              "Working days updated and synced successfully",
          );
        } catch (syncError) {
          console.error("Center sync failed, will retry later:", syncError);
          toast(
            t("workingDaysUpdated") ||
              "Working days updated (will sync when online)",
          );
        }
      } else {
        toast(
          t("workingDaysUpdated") ||
            "Working days updated (will sync when online)",
        );
      }
    } catch (error) {
      console.error("Error updating working days:", error);
      toast(t("workingDaysUpdateFailed") || "Failed to update working days");
    }
  };

  // ✅ Update working months
  const handleSaveWorkingMonths = async () => {
    if (!center) return;

    try {
      const updatedCenter: Center = {
        ...center,
        workingMonths: tempWorkingMonths,
        status: "w",
        updatedAt: Date.now(),
      };

      await centerActions.putLocal(updatedCenter);

      if (isOnline()) {
        try {
          await ServerActionCenters.SaveToServer(updatedCenter);
          await centerActions.markSynced(updatedCenter.id);
          toast(
            t("workingMonthsUpdated") ||
              "Working months updated and synced successfully",
          );
        } catch (syncError) {
          console.error("Center sync failed, will retry later:", syncError);
          toast(
            t("workingMonthsUpdated") ||
              "Working months updated (will sync when online)",
          );
        }
      } else {
        toast(
          t("workingMonthsUpdated") ||
            "Working months updated (will sync when online)",
        );
      }
    } catch (error) {
      console.error("Error updating working months:", error);
      toast(
        t("workingMonthsUpdateFailed") || "Failed to update working months",
      );
    }
  };

  // ✅ Update working years
  const handleSaveWorkingYears = async () => {
    if (!center) return;

    try {
      const updatedCenter: Center = {
        ...center,
        workingYears: tempWorkingYears,
        status: "w",
        updatedAt: Date.now(),
      };

      await centerActions.putLocal(updatedCenter);

      if (isOnline()) {
        try {
          await ServerActionCenters.SaveToServer(updatedCenter);
          await centerActions.markSynced(updatedCenter.id);
          toast(
            t("workingYearsUpdated") ||
              "Working years updated and synced successfully",
          );
        } catch (syncError) {
          console.error("Center sync failed, will retry later:", syncError);
          toast(
            t("workingYearsUpdated") ||
              "Working years updated (will sync when online)",
          );
        }
      } else {
        toast(
          t("workingYearsUpdated") ||
            "Working years updated (will sync when online)",
        );
      }
    } catch (error) {
      console.error("Error updating working years:", error);
      toast(t("workingYearsUpdateFailed") || "Failed to update working years");
    }
  };

  // ✅ Update payment period
  const handleSavePaymentPeriod = async () => {
    if (!center) return;

    try {
      const updatedCenter: Center = {
        ...center,
        paymentStartDay: Number(tempPaymentStartDay),
        paymentEndDay: Number(tempPaymentEndDay),
        status: "w",
        updatedAt: Date.now(),
      };

      await centerActions.putLocal(updatedCenter);

      if (isOnline()) {
        try {
          await ServerActionCenters.SaveToServer(updatedCenter);
          await centerActions.markSynced(updatedCenter.id);
          toast(
            t("paymentPeriodUpdated") ||
              "Payment period updated and synced successfully",
          );
        } catch (syncError) {
          console.error("Center sync failed, will retry later:", syncError);
          toast(
            t("paymentPeriodUpdated") ||
              "Payment period updated (will sync when online)",
          );
        }
      } else {
        toast(
          t("paymentPeriodUpdated") ||
            "Payment period updated (will sync when online)",
        );
      }
    } catch (error) {
      console.error("Error updating payment period:", error);
      toast(
        t("paymentPeriodUpdateFailed") || "Failed to update payment period",
      );
    }
  };

  // 🔍 Debug sync button for center entity
  const handleDebugCenterSync = async () => {
    setIsCenterDebugSyncing(true);
    try {
      const result = await ServerActionCenters.Sync();
      console.log("[CenterSync Debug] Result:", result);
      toast(
        result?.message || "Center sync completed. See console for details.",
      );
    } catch (error) {
      console.error("[CenterSync Debug] Error:", error);
      toast("Center sync failed. Check console for details.");
    } finally {
      setIsCenterDebugSyncing(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-4 sm:p-6">
      <Card className="shadow-lg border border-border bg-background">
        <CardHeader className="text-center space-y-2 px-4 sm:px-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary truncate">
            {center.name}
          </CardTitle>
          <p className="text-muted-foreground text-sm">{t("centerOverview")}</p>
          {center.address && (
            <p className="text-sm text-muted-foreground whitespace-pre-line break-words px-2 sm:px-0">
              {center.address}
            </p>
          )}
          {center.phone && (
            <p className="text-sm text-muted-foreground px-2 sm:px-0">
              {t("phone")} {center.phone}
            </p>
          )}

          {/* Center sync controls */}
          {/* <div className="mt-3 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
            <EntitySyncControls entity="centers" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleDebugCenterSync}
              disabled={isCenterDebugSyncing || isAutoSyncing}
            >
              {isCenterDebugSyncing || isAutoSyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isAutoSyncing ? (t('autoSyncing') || 'Auto-syncing...') : (t('debugSyncing') || 'Debug syncing...')}
                </>
              ) : (
                <>
                  <Loader2 className="mr-2 h-4 w-4" />
                  {t('debugSync') || 'Debug Center Sync'}
                </>
              )}
            </Button>
          </div> */}
        </CardHeader>

        <Separator className="my-2" />

        <CardContent className="space-y-6 px-4 sm:px-6">
          {/* Subjects Section */}
          <div className="space-y-2">
            <div className="flex flex-wrap justify-between items-center gap-2 text-muted-foreground font-semibold text-sm uppercase tracking-wide">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <BookOpen className="h-4 w-4" />
                <span>{t("subjectsOffered")}</span>
              </div>
              <Button onClick={handleAddSubject} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                {t("addSubject")}
              </Button>
            </div>

            {/* ✅ Single subject list rendering */}
            <div className="space-y-3">
              {subjects && subjects.length > 0 ? (
                subjects.map((subject) => (
                  <EditSubjectCard
                    key={subject.id}
                    subject={{
                      id: subject.id,
                      name: subject.name,
                      grade: subject.grade,
                      price: subject.price,
                      duration: subject.duration ?? null,
                      onUpdate: new Date(subject.updatedAt).toISOString(),
                      centerId: subject.centerId,
                    }}
                    onUpdate={handleUpdateSubject}
                    onDelete={handleDeleteSubject}
                    availableSubjects={availableSubjects}
                    availableGrades={availableGrades}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  {t("noSubjects") || "No subjects added"}
                </p>
              )}
            </div>
          </div>

          {/* Classrooms Section */}
          <Section
            title={t("availableClassrooms")}
            icon={<Building2 className="h-4 w-4 text-muted-foreground" />}
            items={center.classrooms}
            onEditButton={
              <EditDialog
                title={t("editClassrooms")}
                trigger={
                  <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4 mr-1" /> {t("edit")}
                  </Button>
                }
                onSave={handleSaveClassrooms}
              >
                <ItemInputList
                  label={t("classroomsLabel")}
                  placeholder={t("classroomPlaceholder")}
                  items={tempClassrooms}
                  onChange={setTempClassrooms}
                  suggestions={availableClassrooms}
                />
              </EditDialog>
            }
            noDataText={t("noData")}
          />

          {/* Working Days Section */}
          <Section
            title={t("workingDays")}
            icon={<CalendarDays className="h-4 w-4 text-muted-foreground" />}
            items={center.workingDays}
            getItemLabel={(value) =>
              daysOfWeek.find((d) => d.key === value)?.label ?? value
            }
            onEditButton={
              <EditDialog
                title={t("editWorkingDays")}
                trigger={
                  <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4 mr-1" /> {t("edit")}
                  </Button>
                }
                onSave={handleSaveWorkingDays}
              >
                <ItemInputList
                  label={t("workingDaysLabel")}
                  placeholder={t("dayPlaceholder")}
                  items={tempWorkingDays}
                  onChange={setTempWorkingDays}
                  suggestions={daysOfWeek.map((day) => ({
                    value: day.key,
                    label: day.label,
                  }))}
                />
              </EditDialog>
            }
            noDataText={t("noData")}
          />

          {/* Working Months Section */}
          <Section
            title={t("workingMonths")}
            icon={<CalendarRange className="h-4 w-4 text-muted-foreground" />}
            items={center.workingMonths || []}
            getItemLabel={(value) =>
              monthsOfYear.find((m) => m.key === value)?.label ?? value
            }
            onEditButton={
              <EditDialog
                title={t("editWorkingMonths")}
                trigger={
                  <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4 mr-1" /> {t("edit")}
                  </Button>
                }
                onSave={handleSaveWorkingMonths}
              >
                <ItemInputList
                  label={t("workingMonthsLabel")}
                  placeholder={t("monthPlaceholder")}
                  items={tempWorkingMonths}
                  onChange={setTempWorkingMonths}
                  suggestions={monthsOfYear.map((m) => ({
                    value: m.key,
                    label: m.label,
                  }))}
                />
              </EditDialog>
            }
            noDataText={t("noData")}
          />

          {/* Working Years Section */}
          <Section
            title={t("workingYears")}
            icon={<CalendarRange className="h-4 w-4 text-muted-foreground" />}
            items={center.workingYears || []}
            onEditButton={
              <EditDialog
                title={t("editWorkingYears")}
                trigger={
                  <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4 mr-1" /> {t("edit")}
                  </Button>
                }
                onSave={handleSaveWorkingYears}
              >
                <ItemInputList
                  label={t("workingYearsLabel")}
                  placeholder={t("yearPlaceholder")}
                  items={tempWorkingYears}
                  onChange={setTempWorkingYears}
                  suggestions={[
                    "2023",
                    "2024",
                    "2025",
                    "2026",
                    "2023-2024",
                    "2024-2025",
                    "2025-2026",
                  ]}
                />
              </EditDialog>
            }
            noDataText={t("noData")}
          />

          {/* Payment Period Section */}
          <div className="space-y-2">
            <div className="flex flex-wrap justify-between items-center">
              <div className="flex items-center gap-2 text-muted-foreground font-semibold text-sm uppercase tracking-wide">
                <Clock className="h-4 w-4" />
                <span className="truncate">{t("paymentPeriod")}</span>
              </div>
              <EditDialog
                title={t("editPaymentPeriod")}
                trigger={
                  <Button variant="ghost" size="sm">
                    <Pencil className="h-4 w-4 mr-1" /> {t("edit")}
                  </Button>
                }
                onSave={handleSavePaymentPeriod}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t("paymentStartDay")}
                    </label>
                    <input
                      type="number"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      min="1"
                      max="31"
                      value={tempPaymentStartDay}
                      onChange={(e) =>
                        setTempPaymentStartDay(Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t("paymentEndDay")}
                    </label>
                    <input
                      type="number"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      min="1"
                      max="31"
                      value={tempPaymentEndDay}
                      onChange={(e) =>
                        setTempPaymentEndDay(Number(e.target.value))
                      }
                    />
                  </div>
                </div>
              </EditDialog>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-sm">
                {t("fromDay")} {center.paymentStartDay || 1} {t("toDay")}{" "}
                {center.paymentEndDay || 30}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{t("addNewSubject")}</DialogTitle>
            <DialogDescription>{t("addSubjectDescription")}</DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 py-4 px-1">
            <SubjectForm
              onAddSubject={addSubject}
              availableSubjects={availableSubjects}
              availableGrades={availableGrades}
            />
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

type SectionProps = {
  title: string;
  icon: React.ReactNode;
  items: string[];
  onEditButton?: React.ReactNode;
  noDataText?: string;
  getItemLabel?: (value: string) => string;
};

function Section({
  title,
  icon,
  items,
  onEditButton,
  noDataText = "No data",
  getItemLabel,
}: SectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-between items-center">
        <div className="flex items-center gap-2 text-muted-foreground font-semibold text-sm uppercase tracking-wide">
          {icon}
          <span className="truncate">{title}</span>
        </div>
        {onEditButton}
      </div>

      <div className="flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <Badge
              key={item}
              variant="secondary"
              className="text-sm truncate max-w-xs"
            >
              {getItemLabel ? getItemLabel(item) : item}
            </Badge>
          ))
        ) : (
          <p className="text-sm text-muted-foreground italic truncate">
            {noDataText}
          </p>
        )}
      </div>
    </div>
  );
}
