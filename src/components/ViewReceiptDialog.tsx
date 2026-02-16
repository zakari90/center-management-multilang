"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Eye, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import PdfExporter from "./pdfExporter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  receiptActions,
  studentActions,
  teacherActions,
  userActions,
  centerActions,
} from "@/lib/dexie/dexieActions";

interface Receipt {
  id: string;
  receiptNumber: string;
  amount: number;
  type: "STUDENT_PAYMENT" | "TEACHER_PAYMENT";
  paymentMethod: string | null;
  description: string | null;
  date: string;
  createdAt: string;
  student?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    grade: string | null;
  };
  teacher?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
  manager: {
    name: string;
    email: string;
  };
  center?: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
  };
}

interface ViewReceiptDialogProps {
  receiptId: string;
  trigger?: React.ReactNode;
}

export default function ViewReceiptDialog({
  receiptId,
  trigger,
}: ViewReceiptDialogProps) {
  const t = useTranslations("ReceiptDetailPage");
  const [open, setOpen] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReceipt = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [allReceipts, allStudents, allTeachers, allUsers, allCenters] =
        await Promise.all([
          receiptActions.getAll(),
          studentActions.getAll(),
          teacherActions.getAll(),
          userActions.getAll(),
          centerActions.getAll(),
        ]);

      const receiptData = allReceipts.find(
        (r) => r.id === receiptId && r.status !== "0",
      );
      if (!receiptData) {
        throw new Error(t("receiptNotFound"));
      }

      const student = receiptData.studentId
        ? allStudents.find(
            (s) => s.id === receiptData.studentId && s.status !== "0",
          )
        : null;
      const teacher = receiptData.teacherId
        ? allTeachers.find(
            (t) => t.id === receiptData.teacherId && t.status !== "0",
          )
        : null;
      const manager = allUsers.find(
        (u) => u.id === receiptData.managerId && u.status !== "0",
      );
      const center = allCenters.find(
        (c) =>
          (c.managers || []).includes(receiptData.managerId) &&
          c.status !== "0",
      );

      setReceipt({
        id: receiptData.id,
        receiptNumber: receiptData.receiptNumber,
        amount: receiptData.amount,
        type: receiptData.type,
        paymentMethod: receiptData.paymentMethod ?? null,
        description: receiptData.description ?? null,
        date: new Date(receiptData.date).toISOString(),
        createdAt: new Date(receiptData.createdAt).toISOString(),
        student: student
          ? {
              id: student.id,
              name: student.name,
              email: student.email ?? null,
              phone: student.phone ?? null,
              grade: student.grade ?? null,
            }
          : undefined,
        teacher: teacher
          ? {
              id: teacher.id,
              name: teacher.name,
              email: teacher.email ?? null,
              phone: teacher.phone ?? null,
            }
          : undefined,
        manager: manager
          ? {
              name: manager.name,
              email: manager.email,
            }
          : { name: "Unknown", email: "" },
        center: center
          ? {
              id: center.id,
              name: center.name,
              address: center.address ?? null,
              phone: center.phone ?? null,
            }
          : undefined,
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : t("somethingWentWrong"));
    } finally {
      setIsLoading(false);
    }
  }, [receiptId, t]);

  useEffect(() => {
    if (open && receiptId) {
      fetchReceipt();
    }
  }, [open, receiptId, fetchReceipt]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const payer = receipt?.student || receipt?.teacher;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Eye className="h-4 w-4" />
            <span className="sr-only">{t("viewDetails")}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
        {/* <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{t("receiptDetails")}</span>
            {receipt && (
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                {t("printReceipt")}
              </Button>
            )}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t("receiptDetails")}
          </DialogDescription>
        </DialogHeader> */}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error || !receipt ? (
          <Alert variant="destructive">
            <AlertDescription>{error || t("receiptNotFound")}</AlertDescription>
          </Alert>
        ) : (
          <PdfExporter
            fileName={`${receipt.student?.name || receipt.teacher?.name || "receipt"} ${receipt.receiptNumber}`}
            buttonText={t("printReceipt") || "Export as PDF"}
          >
            <div className="space-y-4 p-4 bg-background">
              {/* Receipt Header */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-primary">
                    {receipt.center?.name || t("yourEducationCenter")}
                  </p>
                  {receipt.center?.address && (
                    <p className="text-xs text-muted-foreground">
                      {receipt.center.address}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      receipt.type === "STUDENT_PAYMENT"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {receipt.type === "STUDENT_PAYMENT"
                      ? t("studentPayment")
                      : t("teacherPayment")}
                  </Badge>
                  <p className="text-lg font-bold mt-1">
                    #{receipt.receiptNumber}
                  </p>
                </div>
              </div>

              {/* Payer Info */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2 p-4">
                    <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
                      {t("paymentFrom")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 p-4 pt-0">
                    <p className="font-bold">{payer?.name}</p>
                    {receipt.student?.grade && (
                      <p className="text-xs text-muted-foreground">
                        {t("grade")}: {receipt.student.grade}
                      </p>
                    )}
                    {payer?.email && (
                      <p className="text-xs text-muted-foreground truncate">
                        {payer.email}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 p-4">
                    <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
                      {t("paymentDetails")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 p-4 pt-0">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{t("date")}</span>
                      <span>{new Date(receipt.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {t("method")}
                      </span>
                      <span>{receipt.paymentMethod || t("na")}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Description */}
              {receipt.description && (
                <Card>
                  <CardHeader className="pb-1 p-4">
                    <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
                      {t("description")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-xs italic">{receipt.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Amount */}
              <div className="border-t border-dashed pt-4 flex justify-between items-end">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("processedBy")}: {receipt.manager.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {t("createdOn")}{" "}
                    {new Date(receipt.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold block uppercase tracking-tighter">
                    {t("amountPaid")}
                  </span>
                  <span
                    className={`text-3xl font-black ${
                      receipt.type === "STUDENT_PAYMENT"
                        ? "text-green-600"
                        : "text-orange-600"
                    }`}
                  >
                    MAD {receipt.amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center text-muted-foreground text-[10px] pt-4 border-t border-dashed">
                <p>{t("thankYou")}</p>
                <p className="mt-1 opacity-50">
                  Authorized Signature Not Required
                </p>
              </div>
            </div>
          </PdfExporter>
        )}
      </DialogContent>
    </Dialog>
  );
}
