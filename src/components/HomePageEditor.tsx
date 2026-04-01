"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Save, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface HomePageEditorProps {
  centerId: string;
  initialData: {
    homeTitle?: string | null;
    homeSubtitle?: string | null;
    homeBadge?: string | null;
    homeDescription?: string | null;
    homeCtaText?: string | null;
    homePhone?: string | null;
    homeAddress?: string | null;
    publicRegistrationEnabled?: boolean;
  };
  onSave?: () => void;
}

export function HomePageEditor({
  centerId,
  initialData,
  onSave,
}: HomePageEditorProps) {
  const t = useTranslations("homePageEditor");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [formData, setFormData] = useState({
    homeTitle: initialData.homeTitle || "",
    homeSubtitle: initialData.homeSubtitle || "",
    homeBadge: initialData.homeBadge || "",
    homeDescription: initialData.homeDescription || "",
    homeCtaText: initialData.homeCtaText || "",
    homePhone: initialData.homePhone || "",
    homeAddress: initialData.homeAddress || "",
    publicRegistrationEnabled: initialData.publicRegistrationEnabled ?? true,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/centers`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          centerId,
          ...formData,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update homepage content");
      }

      toast.success(t("saveSuccess") || "Homepage content saved successfully!");
      onSave?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : t("saveFailed") || "Failed to save";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
              {t("title") || "Homepage Settings"}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {t("description") || "Customize your public homepage content"}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="w-full sm:w-auto h-9"
          >
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                {t("hidePreview") || "Hide Preview"}
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                {t("preview") || "Preview"}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Preview Section */}
          {showPreview && (
            <div className="p-6 bg-linear-to-br from-blue-50 to-orange-50 rounded-xl border-2 border-dashed border-blue-200">
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold text-[#1a237e]">
                  {formData.homeTitle || "الاولى اعدادي"}
                </h1>
                <h2 className="text-2xl font-bold text-[#4c8bf5] uppercase">
                  {formData.homeSubtitle || "FRANCAIS - MATH"}
                </h2>
                <div className="inline-block px-6 py-2 rounded-full border-2 border-[#1a237e] bg-blue-50/50">
                  <span className="text-xl font-bold text-[#1a237e]">
                    {formData.homeBadge || "التسجيل مفتوح"}
                  </span>
                </div>
                <p className="text-lg text-gray-700 max-w-md mx-auto">
                  {formData.homeDescription || "مركز دروس الدعم و التقوية"}
                </p>
                <Button className="bg-orange-400 hover:bg-orange-500 text-black font-bold rounded-full px-8">
                  {formData.homeCtaText || "سارعوا للتسجيل"}
                </Button>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>{formData.homePhone || "0770275193"}</p>
                  <p>{formData.homeAddress || "روض عبلة حي وريدة تازة"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Main Title */}
            <div className="space-y-2">
              <Label htmlFor="homeTitle">
                {t("homeTitle") || "Main Heading"}
              </Label>
              <Input
                id="homeTitle"
                name="homeTitle"
                value={formData.homeTitle}
                onChange={handleInputChange}
                placeholder="الاولى اعدادي"
                disabled={isSubmitting}
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-2">
              <Label htmlFor="homeSubtitle">
                {t("homeSubtitle") || "Secondary Heading"}
              </Label>
              <Input
                id="homeSubtitle"
                name="homeSubtitle"
                value={formData.homeSubtitle}
                onChange={handleInputChange}
                placeholder="FRANCAIS - MATH"
                disabled={isSubmitting}
              />
            </div>

            {/* Badge */}
            <div className="space-y-2">
              <Label htmlFor="homeBadge">
                {t("homeBadge") || "Badge Text"}
              </Label>
              <Input
                id="homeBadge"
                name="homeBadge"
                value={formData.homeBadge}
                onChange={handleInputChange}
                placeholder="التسجيل مفتوح"
                disabled={isSubmitting}
              />
            </div>

            {/* CTA Button Text */}
            <div className="space-y-2">
              <Label htmlFor="homeCtaText">
                {t("homeCtaText") || "CTA Button Text"}
              </Label>
              <Input
                id="homeCtaText"
                name="homeCtaText"
                value={formData.homeCtaText}
                onChange={handleInputChange}
                placeholder="سارعوا للتسجيل"
                disabled={isSubmitting}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="homePhone">
                {t("homePhone") || "Contact Phone"}
              </Label>
              <Input
                id="homePhone"
                name="homePhone"
                value={formData.homePhone}
                onChange={handleInputChange}
                placeholder="0770275193"
                disabled={isSubmitting}
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="homeAddress">
                {t("homeAddress") || "Contact Address"}
              </Label>
              <Input
                id="homeAddress"
                name="homeAddress"
                value={formData.homeAddress}
                onChange={handleInputChange}
                placeholder="روض عبلة حي وريدة تازة"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Description (full width) */}
          <div className="space-y-2">
            <Label htmlFor="homeDescription">
              {t("homeDescription") || "Description"}
            </Label>
            <Textarea
              id="homeDescription"
              name="homeDescription"
              value={formData.homeDescription}
              onChange={handleInputChange}
              placeholder="مركز دروس الدعم و التقوية يقدم لكم عرض..."
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          {/* Public Registration Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/50 rounded-lg gap-4">
            <div className="space-y-1 flex-1">
              <Label
                htmlFor="publicRegistration"
                className="text-base font-semibold"
              >
                {t("publicRegistration") || "Public Registration"}
              </Label>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t("publicRegistrationDesc") ||
                  "Allow visitors to register from the homepage"}
              </p>
            </div>
            <div className="flex items-center gap-6 shrink-0 bg-background/50 p-2 sm:p-0 rounded-md sm:bg-transparent justify-center sm:justify-end">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="publicRegistrationEnabled"
                  name="publicRegistrationEnabled"
                  checked={formData.publicRegistrationEnabled === true}
                  onChange={() =>
                    setFormData((prev) => ({
                      ...prev,
                      publicRegistrationEnabled: true,
                    }))
                  }
                  disabled={isSubmitting}
                  className="h-5 w-5 sm:h-4 sm:w-4 text-primary border-gray-300 focus:ring-primary cursor-pointer"
                />
                <Label
                  htmlFor="publicRegistrationEnabled"
                  className="font-medium cursor-pointer"
                >
                  {t("enabled") || "Enabled"}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="publicRegistrationDisabled"
                  name="publicRegistrationEnabled"
                  checked={formData.publicRegistrationEnabled === false}
                  onChange={() =>
                    setFormData((prev) => ({
                      ...prev,
                      publicRegistrationEnabled: false,
                    }))
                  }
                  disabled={isSubmitting}
                  className="h-5 w-5 sm:h-4 sm:w-4 text-primary border-gray-300 focus:ring-primary cursor-pointer"
                />
                <Label
                  htmlFor="publicRegistrationDisabled"
                  className="font-medium cursor-pointer"
                >
                  {t("disabled") || "Disabled"}
                </Label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("saving") || "Saving..."}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t("saveChanges") || "Save Changes"}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
