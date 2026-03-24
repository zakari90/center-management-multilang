"use client";

import { ItemInputList } from "@/components/itemInputList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { centerActions, subjectActions } from "@/lib/dexie/dexieActions";
import { Center, Subject } from "@/lib/dexie/dbSchema";
import { generateObjectId } from "@/lib/utils/generateObjectId";
import { Separator } from "@radix-ui/react-separator";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { SubjectFormMultipleChoices } from "./subjectForm";
import { useLocalizedConstants } from "./useLocalizedConstants";
import { useAuth } from "@/context/authContext";
import ServerActionCenters from "@/lib/dexie/centerServerAction";
import ServerActionSubjects from "@/lib/dexie/subjectServerAction";
import { isOnline } from "@/lib/utils/network";

// ✅ Form-only subject data (before creating Subject entity)
type SubjectFormData = {
  id: string; // Temporary ID for React keys
  name: string;
  grade: string;
  price: number;
  duration?: number;
};

interface NewCenterFormProps {
  onCenterCreated?: () => void; // ✅ Callback to refresh parent component
}

export const NewCenterForm = ({ onCenterCreated }: NewCenterFormProps) => {
  const t = useTranslations("NewCenterForm");
  const {
    daysOfWeek,
    monthsOfYear,
    availableSubjects,
    availableGrades,
    availableClassrooms,
  } = useLocalizedConstants();
  // const router = useRouter() // ✅ Commented out - not used
  const { user } = useAuth(); // ✅ Use AuthContext instead of getSession()

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    workingDays: [] as string[],
    paymentStartDay: 1,
    paymentEndDay: 30,
    classrooms: [] as string[],
    subjects: [] as SubjectFormData[],
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);
  const [step, setStep] = useState(1);

  // ✅ Reset form to initial state
  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      phone: "",
      subjects: [],
      classrooms: [],
      workingDays: [],
      paymentStartDay: 1,
      paymentEndDay: 30,
    });
    setStep(1);
    setMessage(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const updateClassrooms = (newClassrooms: string[]) => {
    setFormData((prev) => ({ ...prev, classrooms: newClassrooms }));
  };

  const addSubject = (
    subjectName: string,
    grade: string,
    price: number,
    duration?: number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      subjects: [
        ...prev.subjects,
        {
          id: generateObjectId(), // ✅ Unique ID for React key
          name: subjectName,
          grade,
          price,
          duration,
        },
      ],
    }));
  };

  const removeSubject = (subjectId: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s.id !== subjectId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const centerId = generateObjectId();
    const now = Date.now();

    try {
      if (!user) {
        const errorMsg = "Unauthorized: Please log in again";
        setMessage({ text: errorMsg, type: "error" });
        toast.error(errorMsg);
        setLoading(false);
        return;
      }

      // ✅ Step 1: Save center (normalized storage)
      const newCenter: Center = {
        id: centerId,
        name: formData.name,
        address: formData.address || "",
        phone: formData.phone || "",
        classrooms: formData.classrooms,
        workingDays: formData.workingDays,
        paymentStartDay: Number(formData.paymentStartDay) || 1,
        paymentEndDay: Number(formData.paymentEndDay) || 30,
        managers: [],
        adminId: user.id,
        status: "w",
        createdAt: now,
        updatedAt: now,
      };
      await centerActions.putLocal(newCenter);

      // ✅ Step 2: Create subject entities separately (normalized)
      const subjectEntities: Subject[] = formData.subjects.map((subject) => ({
        id: generateObjectId(),
        name: subject.name,
        grade: subject.grade,
        price: subject.price,
        duration: subject.duration,
        centerId: centerId,
        status: "w",
        createdAt: now,
        updatedAt: now,
      }));

      // Save all subjects in parallel
      if (subjectEntities.length > 0) {
        await Promise.all(
          subjectEntities.map((subject) => subjectActions.putLocal(subject)),
        );
      }

      // ✅ Attempt to sync to server if online
      if (isOnline()) {
        try {
          // Sync center first
          await ServerActionCenters.SaveToServer(newCenter);
          await centerActions.markSynced(centerId);

          // Sync all subjects
          if (subjectEntities.length > 0) {
            await Promise.all(
              subjectEntities.map(async (subject) => {
                await ServerActionSubjects.SaveToServer(subject);
                await subjectActions.markSynced(subject.id);
              }),
            );
          }

          toast.success(
            t("syncedToServer") || "Center synced to server successfully!",
          );
        } catch (syncError) {
          // Sync failed, but local save succeeded - that's okay for offline-first
          console.warn(
            "Failed to sync center to server (will sync later):",
            syncError,
          );
          toast.info(
            t("savedLocally") || "Center saved locally. Will sync when online.",
          );
        }
      } else {
        toast.info(
          t("savedLocally") || "Center saved locally. Will sync when online.",
        );
      }

      // ✅ Success feedback
      const successMsg =
        t("centerCreatedSuccess") || "Center created successfully!";
      toast.success(successMsg);
      setMessage({ text: successMsg, type: "success" });

      // Reset form
      resetForm();

      // ✅ Trigger refresh in parent component
      if (onCenterCreated) {
        onCenterCreated();
      }
    } catch (error) {
      console.error("Form submission error:", error);
      const errorMsg =
        t("errorMessage") || "Failed to create center. Please try again.";
      setMessage({ text: errorMsg, type: "error" });
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of your component remains the same
  return (
    <Card className="md:max-w-2xl md:mx-auto mt-4">
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <>
              <div className="space-y-4">
                <div className="relative my-4 flex items-center justify-center overflow-hidden">
                  <Separator className="flex-1 h-px bg-border" />
                  <div className="py-1 px-2 border rounded-full text-center bg-muted text-xs mx-1">
                    <span className="font-medium text-foreground">
                      {t("basicInformation")}
                    </span>
                  </div>
                  <Separator className="flex-1 h-px bg-border" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">{t("centerNameRequired")}</Label>
                  <Input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder={t("centerNamePlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">{t("address")}</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder={t("addressPlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t("phone")}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t("phonePlaceholder")}
                  />
                </div>
              </div>

              <div className="relative my-4 flex items-center justify-center overflow-hidden">
                <Separator className="flex-1 h-px bg-border" />
                <div className="py-1 px-2 border rounded-full text-center bg-muted text-xs mx-1">
                  <span className="font-medium text-foreground">
                    {t("classrooms")}
                  </span>
                </div>
                <Separator className="flex-1 h-px bg-border" />
              </div>
              <ItemInputList
                label={t("classrooms")}
                placeholder={t("classroomPlaceholder")}
                items={formData.classrooms}
                onChange={updateClassrooms}
                suggestions={availableClassrooms}
              />

              <div className="relative my-4 flex items-center justify-center overflow-hidden">
                <Separator className="flex-1 h-px bg-border" />
                <div className="py-1 px-2 border rounded-full text-center bg-muted text-xs mx-1">
                  <span className="font-medium text-foreground">
                    {t("workingDays")}
                  </span>
                </div>
                <Separator className="flex-1 h-px bg-border" />
              </div>
              <div className="space-y-3">
                {daysOfWeek.map((day) => (
                  <div key={day.key} className="border rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={day.key}
                        checked={formData.workingDays.includes(day.key)}
                        onCheckedChange={(checked) => {
                          setFormData((prev) => ({
                            ...prev,
                            workingDays: checked
                              ? [...prev.workingDays, day.key]
                              : prev.workingDays.filter((d) => d !== day.key),
                          }));
                        }}
                      />
                      <Label htmlFor={day.key} className="font-medium">
                        {day.label}
                      </Label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative my-4 flex items-center justify-center overflow-hidden">
                <Separator className="flex-1 h-px bg-border" />
                <div className="py-1 px-2 border rounded-full text-center bg-muted text-xs mx-1">
                  <span className="font-medium text-foreground">
                    {t("paymentPeriod")}
                  </span>
                </div>
                <Separator className="flex-1 h-px bg-border" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentStartDay">
                    {t("paymentStartDay")}
                  </Label>
                  <Input
                    id="paymentStartDay"
                    type="number"
                    name="paymentStartDay"
                    min="1"
                    max="31"
                    value={formData.paymentStartDay}
                    onChange={handleChange}
                    placeholder="1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentEndDay">{t("paymentEndDay")}</Label>
                  <Input
                    id="paymentEndDay"
                    type="number"
                    name="paymentEndDay"
                    min="1"
                    max="31"
                    value={formData.paymentEndDay}
                    onChange={handleChange}
                    placeholder="30"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={() => setStep(2)}
                className="w-full"
                disabled={!formData.name.trim()}
              >
                {t("nextAddSubjects")}
              </Button>
            </>
          )}

          {/* Step 2: Subjects */}
          {step === 2 && (
            <>
              <div className="relative my-4 flex items-center justify-center overflow-hidden">
                <Separator className="flex-1 h-px bg-border" />
                <div className="py-1 px-2 border rounded-full text-center bg-muted text-xs mx-1">
                  <span className="font-medium text-foreground">
                    {t("subjectsPricing")}
                  </span>
                </div>
                <Separator className="flex-1 h-px bg-border" />
              </div>

              <SubjectFormMultipleChoices
                onAddSubject={addSubject}
                availableSubjects={availableSubjects}
                availableGrades={availableGrades}
              />

              {formData.subjects.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {t("addedSubjects")} ({formData.subjects.length}):
                  </span>
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {formData.subjects.map((subject) => (
                      <div
                        key={subject.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-muted/20"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{subject.name}</span>
                            <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                              {subject.grade}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {t("price")}: {subject.price} MAD
                            {subject.duration &&
                              ` • ${t("duration")}: ${subject.duration} ${t("minutes")}`}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeSubject(subject.id)}
                          className="ml-2"
                        >
                          {t("remove")}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  {t("back")}
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? t("creatingCenter") : t("createCenter")}
                </Button>
              </div>
            </>
          )}

          {message && (
            <Alert
              className={
                message.type === "error"
                  ? "border-destructive"
                  : "border-green-500"
              }
            >
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
