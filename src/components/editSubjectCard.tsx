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
    onUpdate(subject.id, {
      name: tempSubject.selectedSubject,
      grade: tempSubject.selectedGrade,
      price: parseFloat(tempSubject.price),
      duration: tempSubject.duration ? parseInt(tempSubject.duration) : null,
    });
  };

  return (
    <Card className="p-2 sm:p-3">
      <div className="flex items-center justify-between gap-2">
        {/* Subject Info */}
        <div className="space-y-0.5 min-w-0 flex-1">
          <h4 className="font-semibold text-xs sm:text-sm leading-tight line-clamp-1">
            {subject.name}
          </h4>
          <div className="flex flex-wrap gap-1 text-[10px] sm:text-xs text-muted-foreground">
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
              {subject.grade}
            </Badge>
            <span className="flex items-center gap-0.5 whitespace-nowrap">
              <Coins className="h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0" />
              {subject.price} MAD
            </span>
            {subject.duration && (
              <span className="flex items-center gap-0.5 whitespace-nowrap">
                <Clock className="h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0" />
                {subject.duration}h
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-0.5 shrink-0 items-center">
          <EditDialog
            title={t("editSubject")}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <Pencil className="h-3.5 w-3.5" />
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
                      tempSubject.selectedGrade
                        ? [tempSubject.selectedGrade]
                        : []
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
                    <Label
                      htmlFor="editDuration"
                      className="text-xs sm:text-sm"
                    >
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
                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
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
    </Card>
  );
}
