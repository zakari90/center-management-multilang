/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

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
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock, Coins, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { EditDialog } from "./editDialog";
import { ItemInputList } from "./itemInputList";
import { SubjectFormSchema } from "@/lib/validations/schemas";
import { z } from "zod";

interface SubjectCardProps {
  subject: any;
  onUpdate: (id: string, data: Partial<any>) => void;
  onDelete: (id: string) => void;
  availableSubjects: string[];
  availableGrades: string[];
}

export function EditSubjectCard({
  subject,
  onUpdate,
  onDelete,
  availableSubjects,
  availableGrades,
}: SubjectCardProps) {
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
        // Since we don't have a direct error display in this small card,
        // we log it and potentially the user will see it in the form inputs
        console.error("Validation error:", err.issues);
      }
    }
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3 px-3 py-1.5 border rounded-lg bg-muted/30 w-full sm:w-fit group hover:border-primary/50 transition-colors shadow-sm min-w-0">
      {/* Subject Info */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 min-w-0 flex-1 overflow-hidden">
        <h4 className="font-bold text-sm sm:text-base leading-tight truncate">
          {subject.name}
        </h4>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground min-w-0">
          <Badge
            variant="secondary"
            className="text-[10px] px-2 py-0 h-5 font-bold uppercase tracking-wider truncate max-w-[100px] sm:max-w-none"
          >
            {subject.grade}
          </Badge>
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1 font-medium text-primary whitespace-nowrap">
              <Coins className="h-3.5 w-3.5 shrink-0" />
              {subject.price} MAD
            </span>
            {subject.duration && (
              <span className="flex items-center gap-1 font-medium text-orange-600 dark:text-orange-400 whitespace-nowrap">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                {subject.duration}h
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-1.5 shrink-0 items-center border-s ps-2 sm:ps-3 ms-auto self-stretch">
        <EditDialog
          title={t("editSubject")}
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-muted/40 rounded-full"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          }
          onSave={handleUpdateSubject}
        >
          <div className="border rounded-lg p-3 sm:p-4 space-y-4 bg-muted/10 max-h-[80vh] overflow-y-auto">
            {/* No changes to the dialog content size, keeping it usable */}
            <div className="space-y-4">
              {/* Subject Selection */}
              <div className="space-y-2">
                <Label
                  className="text-xs sm:text-sm"
                  htmlFor="edit-select-subject"
                >
                  {t("selectSubject")} {t("requiredField")}
                </Label>
                <ItemInputList
                  id="edit-select-subject"
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
                  htmlFor="edit-select-grade"
                >
                  {t("selectGrade")} {t("requiredField")}
                </Label>
                <ItemInputList
                  id="edit-select-grade"
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
                  <Label htmlFor="editPrice" className="text-xs sm:text-sm">
                    {t("price")} {t("requiredField")}
                  </Label>
                  <Input
                    id="editPrice"
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
                  <Label htmlFor="editDuration" className="text-xs sm:text-sm">
                    {t("duration")}
                  </Label>
                  <Input
                    id="editDuration"
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
              className="h-8 w-8 p-0 hover:bg-destructive/10 rounded-full"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="w-[90vw] max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg sm:text-xl">
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
    </div>
  );
}
