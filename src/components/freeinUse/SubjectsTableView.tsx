"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/freecomponents/ui/card";
import { Badge } from "@/freecomponents/ui/badge";
import { Button } from "@/freecomponents/ui/button";
import { Input } from "@/freecomponents/ui/input";
import { Search, Pencil, Trash2, Coins, Clock } from "lucide-react";
import { useState, useMemo } from "react";
import { Subject } from "@/freelib/dexie/dbSchema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/freecomponents/ui/alert-dialog";
import { Label } from "@/freecomponents/ui/label";
import { EditDialog } from "./editDialog";
import { ItemInputList } from "./itemInputList";
import { SubjectFormSchema } from "@/freelib/validations/schemas";
import { z } from "zod";

interface SubjectsTableViewProps {
  subjects: Subject[];
  onUpdate: (id: string, data: Partial<any>) => void;
  onDelete: (id: string) => void;
  availableSubjects: string[];
  availableGrades: string[];
}

export function SubjectsTableView({
  subjects,
  onUpdate,
  onDelete,
  availableSubjects,
  availableGrades,
}: SubjectsTableViewProps) {
  const t = useTranslations("CenterPresentation");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSubjects = useMemo(() => {
    if (!searchQuery) return subjects;
    const lowerQuery = searchQuery.toLowerCase();
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(lowerQuery) ||
        s.grade.toLowerCase().includes(lowerQuery),
    );
  }, [subjects, searchQuery]);

  return (
    <div className="space-y-4">
      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder") || "Search subjects or grades..."}
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Card className="overflow-hidden border border-border shadow-sm text-center">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3 border-b">{t("subjectName")}</th>
                <th className="px-4 py-3 border-b">{t("grade")}</th>
                <th className="px-4 py-3 border-b">{t("price")}</th>
                <th className="px-4 py-3 border-b">{t("durationHeader")}</th>
                <th className="px-4 py-3 border-b text-right">
                  {t("actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-background">
              {filteredSubjects.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground italic"
                  >
                    {t("noSubjects") || "No subjects found"}
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((subject) => (
                  <tr
                    key={subject.id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {subject.name}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="secondary"
                        className="font-bold whitespace-nowrap"
                      >
                        {subject.grade}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-primary font-semibold whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        {subject.price} MAD
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {subject.duration ? (
                        <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-medium">
                          <Clock className="h-3 w-3" />
                          {subject.duration} min
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end items-center scale-90 origin-right">
                        <SubjectRowActions
                          subject={subject}
                          onUpdate={onUpdate}
                          onDelete={onDelete}
                          availableSubjects={availableSubjects}
                          availableGrades={availableGrades}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function SubjectRowActions({
  subject,
  onUpdate,
  onDelete,
  availableSubjects,
  availableGrades,
}: {
  subject: Subject;
  onUpdate: (id: string, data: Partial<any>) => void;
  onDelete: (id: string) => void;
  availableSubjects: string[];
  availableGrades: string[];
}) {
  const t = useTranslations("StudentCard.subjects");
  const [tempSubject, setTempSubject] = useState({
    selectedSubject: subject.name,
    selectedGrade: subject.grade,
    price: subject.price.toString(),
    duration: subject.duration?.toString() || "",
  });

  const handleUpdateSubject = () => {
    try {
      const validated = SubjectFormSchema.parse({
        name: tempSubject.selectedSubject,
        grade: tempSubject.selectedGrade,
        price: tempSubject.price,
        duration: tempSubject.duration || null,
      });

      onUpdate(subject.id, {
        name: validated.name,
        grade: validated.grade,
        price: validated.price,
        duration: validated.duration,
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.error("Validation error:", err.issues);
      }
    }
  };

  return (
    <div className="flex gap-1">
      <EditDialog
        title={t("editSubject")}
        trigger={
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-muted/40 rounded-full shrink-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
        }
        onSave={handleUpdateSubject}
      >
        <div className="border rounded-lg p-3 sm:p-4 space-y-4 bg-muted/10 max-h-[80vh] overflow-y-auto">
          <div className="space-y-4 text-left">
            {/* Subject Selection */}
            <div className="space-y-2">
              <Label
                className="text-xs sm:text-sm"
                htmlFor={`edit-subject-${subject.id}`}
              >
                {t("selectSubject")} {t("requiredField")}
              </Label>
              <ItemInputList
                id={`edit-subject-${subject.id}`}
                label={t("labels.subject")}
                placeholder={t("placeholders.subject")}
                items={
                  tempSubject.selectedSubject
                    ? [tempSubject.selectedSubject]
                    : []
                }
                onChange={(items) => {
                  const single = items[0] || "";
                  setTempSubject((prev) => ({
                    ...prev,
                    selectedSubject: single,
                  }));
                }}
                suggestions={availableSubjects}
              />
            </div>

            {/* Grade Selection */}
            <div className="space-y-2">
              <Label
                className="text-xs sm:text-sm"
                htmlFor={`edit-grade-${subject.id}`}
              >
                {t("selectGrade")} {t("requiredField")}
              </Label>
              <ItemInputList
                id={`edit-grade-${subject.id}`}
                label={t("labels.grade")}
                placeholder={t("placeholders.grade")}
                items={
                  tempSubject.selectedGrade ? [tempSubject.selectedGrade] : []
                }
                onChange={(items) => {
                  const single = items[0] || "";
                  setTempSubject((prev) => ({
                    ...prev,
                    selectedGrade: single,
                  }));
                }}
                suggestions={availableGrades}
              />
            </div>

            {/* Price and Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor={`edit-price-${subject.id}`}
                  className="text-xs sm:text-sm"
                >
                  {t("price")} {t("requiredField")}
                </Label>
                <Input
                  id={`edit-price-${subject.id}`}
                  type="number"
                  step="0.01"
                  value={tempSubject.price}
                  onChange={(e) =>
                    setTempSubject((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                  placeholder={t("placeholders.price")}
                  className="text-sm h-10 sm:h-11"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor={`edit-duration-${subject.id}`}
                  className="text-xs sm:text-sm"
                >
                  {t("duration")}
                </Label>
                <Input
                  id={`edit-duration-${subject.id}`}
                  type="number"
                  value={tempSubject.duration}
                  onChange={(e) =>
                    setTempSubject((prev) => ({
                      ...prev,
                      duration: e.target.value,
                    }))
                  }
                  placeholder={t("placeholders.duration")}
                  className="text-sm h-10 sm:h-11"
                />
              </div>
            </div>
          </div>
        </div>
      </EditDialog>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-destructive/10 rounded-full shrink-0"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="w-[90vw] max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              {t("deleteSubject")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              {t("deleteConfirmation", { subjectName: subject.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 flex-col-reverse sm:flex-row">
            <AlertDialogCancel className="w-full sm:w-auto">
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete(subject.id)}
              className="w-full sm:w-auto"
            >
              {t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
