"use client";

import { ItemInputList } from "@/components/freeinUse/itemInputList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Center, Subject, localDb } from "@/freelib/dexie/dbSchema";
import { centerActions, subjectActions } from "@/freelib/dexie/freedexieaction";
import { cn, getItemColor } from "@/freelib/utils";
import { generateObjectId } from "@/freelib/utils/generateObjectId";
import { useLiveQuery } from "dexie-react-hooks";
import {
  BookOpen,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock,
  Home,
  Pencil,
  Plus,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { EditDialog } from "./editDialog";
import { HomePageEditor } from "./HomePageEditor";
import { ShareRegistrationLink } from "./ShareRegistrationLink";
import { SubjectForm } from "./subjectForm";
import { SubjectsTableView } from "./SubjectsTableView";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [tempPaymentStartDay, setTempPaymentStartDay] = useState<number>(1);
  const [tempPaymentEndDay, setTempPaymentEndDay] = useState<number>(30);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCenterDebugSyncing, setIsCenterDebugSyncing] = useState(false);
  const [isAutoSyncing, setIsAutoSyncing] = useState(false);
  const [showHomePageSettings, setShowHomePageSettings] = useState(false);

  // Removed online status and auto-sync logic

  // ✅ Sync temp states when center loads
  useEffect(() => {
    if (center) {
      setTempClassrooms(center.classrooms);

      setTempWorkingDays(center.workingDays);
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
        createdAt: now,
        updatedAt: now,
      };

      await subjectActions.putLocal(newSubject);
      // Server sync removed in local-only mode
      toast(t("subjectAdded") || "Subject added successfully");

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
        updatedAt: Date.now(),
      };

      await subjectActions.putLocal(updatedSubject);
      // Server sync removed in local-only mode
      toast(t("subjectUpdated") || "Subject updated successfully");
    } catch (error) {
      console.error("Error updating subject:", error);
      toast(t("subjectUpdateFailed") || "Failed to update subject");
    }
  };

  // ✅ Delete subject - simplified
  const handleDeleteSubject = async (subjectId: string) => {
    try {
      await subjectActions.deleteLocal(subjectId);

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
        updatedAt: Date.now(),
      };

      await centerActions.putLocal(updatedCenter);
      // Server sync removed in local-only mode
      toast(t("classroomsUpdated") || "Classrooms updated successfully");
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
        updatedAt: Date.now(),
      };

      await centerActions.putLocal(updatedCenter);
      // Server sync removed in local-only mode
      toast(t("workingDaysUpdated") || "Working days updated successfully");
    } catch (error) {
      console.error("Error updating working days:", error);
      toast(t("workingDaysUpdateFailed") || "Failed to update working days");
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
        updatedAt: Date.now(),
      };

      await centerActions.putLocal(updatedCenter);
      // Server sync removed in local-only mode
      toast(t("paymentPeriodUpdated") || "Payment period updated successfully");
    } catch (error) {
      console.error("Error updating payment period:", error);
      toast(
        t("paymentPeriodUpdateFailed") || "Failed to update payment period",
      );
    }
  };

  // Removed handleDebugCenterSync manually logic

  return (
    <main>
      {/* <EntitySyncControls entity="centers" /> */}
      {/* <PageHeader title={center.name} subtitle={t("centerOverview")} /> */}
      <Card className="shadow-lg border border-border bg-background w-full mt-4">
        <CardHeader className="text-center space-y-2 px-4 sm:px-6">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary truncate">
            {center.name}
          </CardTitle>
          {center.address && (
            <p className="text-sm text-muted-foreground whitespace-pre-line wrap-break-word px-2 sm:px-0">
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
            <div className="space-y-6">
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                  {t("tableView") || "Table View"}
                </p>
                <SubjectsTableView
                  subjects={subjects || []}
                  onUpdate={handleUpdateSubject}
                  onDelete={handleDeleteSubject}
                  availableSubjects={availableSubjects}
                  availableGrades={availableGrades}
                />
              </div>
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
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">
                      {t("fromDay")}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={tempPaymentStartDay}
                      onChange={(e: any) =>
                        setTempPaymentStartDay(Number(e.target.value))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">{t("toDay")}</label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={tempPaymentEndDay}
                      onChange={(e: any) =>
                        setTempPaymentEndDay(Number(e.target.value))
                      }
                    />
                  </div>
                </div>
              </EditDialog>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
              <span className="text-sm font-medium">
                {t("fromDay")} {center.paymentStartDay || 1} {t("toDay")}{" "}
                {center.paymentEndDay || 30}
              </span>
            </div>
          </div>
          {/* Homepage Settings Section (Collapsible) */}
          <div className="space-y-2">
            <button
              onClick={() => setShowHomePageSettings(!showHomePageSettings)}
              className="flex w-full items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2 text-muted-foreground font-semibold text-sm uppercase tracking-wide">
                <Home className="h-4 w-4" />
                <span>{t("homePageSettings") || "Homepage Settings"}</span>
              </div>
              {showHomePageSettings ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showHomePageSettings && (
              <div className="space-y-4 pt-2">
                <HomePageEditor
                  centerId={centerId}
                  initialData={{
                    homeTitle: center.homeTitle,
                    homeSubtitle: center.homeSubtitle,
                    homeBadge: center.homeBadge,
                    homeDescription: center.homeDescription,
                    homeCtaText: center.homeCtaText,
                    homePhone: center.homePhone,
                    homeAddress: center.homeAddress,
                    publicRegistrationEnabled: center.publicRegistrationEnabled,
                  }}
                  onSave={() => {
                    // Refresh handled by useLiveQuery
                  }}
                />
                <ShareRegistrationLink />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
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
              variant="outline"
              className={cn(
                "text-sm truncate max-w-xs border-2 font-semibold shadow-sm",
                getItemColor(getItemLabel ? getItemLabel(item) : item),
              )}
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
