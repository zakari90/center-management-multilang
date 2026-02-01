"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Copy,
  Check,
  Share2,
  Users,
  GraduationCap,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";

interface ShareRegistrationLinkProps {
  className?: string;
}

export function ShareRegistrationLink({
  className,
}: ShareRegistrationLinkProps) {
  const t = useTranslations("shareRegistration");
  const locale = useLocale();
  const [copiedType, setCopiedType] = useState<"student" | "teacher" | null>(
    null,
  );

  const getRegistrationLink = (type: "student" | "teacher") => {
    if (typeof window !== "undefined") {
      const baseUrl = window.location.origin;
      return `${baseUrl}/${locale}?register=${type}`;
    }
    return `/${locale}?register=${type}`;
  };

  const copyToClipboard = async (type: "student" | "teacher") => {
    const link = getRegistrationLink(type);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedType(type);
      toast.success(t("copied") || "Link copied!");
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const shareViaWhatsApp = (type: "student" | "teacher") => {
    const link = getRegistrationLink(type);
    const message = encodeURIComponent(
      type === "student"
        ? `${t("studentInvite") || "Register as a student:"} ${link}`
        : `${t("teacherInvite") || "Register as a teacher:"} ${link}`,
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          {t("title") || "Share Registration Link"}
        </CardTitle>
        <CardDescription>
          {t("description") ||
            "Generate links to share with students or teachers"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Student Registration Link */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            {t("student") || "Student Registration"}
          </Label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={getRegistrationLink("student")}
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard("student")}
            >
              {copiedType === "student" ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => shareViaWhatsApp("student")}>
                  WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => copyToClipboard("student")}>
                  {t("copyLink") || "Copy Link"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Teacher Registration Link */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t("teacher") || "Teacher Registration"}
          </Label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={getRegistrationLink("teacher")}
              className="font-mono text-sm"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard("teacher")}
            >
              {copiedType === "teacher" ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => shareViaWhatsApp("teacher")}>
                  WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => copyToClipboard("teacher")}>
                  {t("copyLink") || "Copy Link"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Quick Copy Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => copyToClipboard("student")}
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            {t("copyStudentLink") || "Copy Student Link"}
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => copyToClipboard("teacher")}
          >
            <LinkIcon className="h-4 w-4 mr-2" />
            {t("copyTeacherLink") || "Copy Teacher Link"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
