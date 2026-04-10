"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/freelib/context/freeauthContext";
import {
  receiptActions,
  studentActions,
  teacherActions,
  userActions,
} from "@/freelib/dexie/freedexieaction";
import {
  Loader2,
  Receipt as ReceiptIcon,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import AddStudentPaymentDialog from "./AddStudentPaymentDialog";
import PageHeader from "./page-header";
import AddTeacherPaymentDialog from "./AddTeacherPaymentDialog";
import { PaginationControls } from "@/components/ui/pagination-controls";

interface Receipt {
  admin?: {
    id: string;
    name: string;
  };
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
    grade: string | null;
  };
  teacher?: {
    id: string;
    name: string;
  };
}

export default function ReceiptsTable() {
  const t = useTranslations("ReceiptsTable");
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const receipts = useLiveQuery(async () => {
    try {
      if (!user) return [];

      const [allReceipts, allStudents, allTeachers, allUsers] =
        await Promise.all([
          receiptActions.getAll(),
          studentActions.getAll(),
          teacherActions.getAll(),
          userActions.getAll(),
        ]);

      // ✅ Build receipts with related data in local-first mode
      const receiptsWithData: Receipt[] = allReceipts.map((receipt: any) => {
        const student = receipt.studentId
          ? allStudents.find((s: any) => s.id === receipt.studentId)
          : null;
        const teacher = receipt.teacherId
          ? allTeachers.find((t: any) => t.id === receipt.teacherId)
          : null;
        const admin =
          allUsers.find((u: any) => u.id === receipt.adminId) || allUsers[0];

        return {
          id: receipt.id,
          receiptNumber: receipt.receiptNumber,
          amount: receipt.amount,
          type: receipt.type,
          paymentMethod: receipt.paymentMethod ?? null,
          description: receipt.description ?? null,
          date: new Date(receipt.date).toISOString(),
          createdAt: new Date(receipt.createdAt).toISOString(),
          admin: admin
            ? {
                id: admin.id,
                name: admin.name,
              }
            : undefined,
          student: student
            ? {
                id: student.id,
                name: student.name,
                grade: student.grade ?? null,
              }
            : undefined,
          teacher: teacher
            ? {
                id: teacher.id,
                name: teacher.name,
              }
            : undefined,
        };
      });

      return receiptsWithData;
    } catch (err) {
      console.error(t("errorFetchReceipts"), err);
      return [];
    }
  }, [user, t]);

  const isLoading = receipts === undefined;

  const filteredReceipts = (receipts || []).filter((receipt) => {
    const matchesSearch =
      receipt.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (receipt.admin?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (receipt.student?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (receipt.teacher?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (receipt.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || receipt.type === typeFilter;
    const matchesMethod =
      methodFilter === "all" || receipt.paymentMethod === methodFilter;

    return matchesSearch && matchesType && matchesMethod;
  });

  const totalPages = Math.ceil(filteredReceipts.length / ITEMS_PER_PAGE);
  const paginatedReceipts = filteredReceipts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const studentPayments = (receipts || []).filter(
    (r) => r.type === "STUDENT_PAYMENT",
  );
  const teacherPayments = (receipts || []).filter(
    (r) => r.type === "TEACHER_PAYMENT",
  );
  const totalIncome = studentPayments.reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = teacherPayments.reduce((sum, r) => sum + r.amount, 0);
  const netAmount = totalIncome - totalExpense;

  const paymentMethods = [
    "all",
    ...new Set(
      (receipts || []).map((r) => r.paymentMethod).filter(Boolean) as string[],
    ),
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <PageHeader title={t("title")} subtitle={t("subtitle")} />
        <div className="flex flex-col md:flex-row gap-4">
          <AddStudentPaymentDialog />
          <AddTeacherPaymentDialog />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalReceipts")}
            </CardTitle>
            <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(receipts || []).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalIncome")}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              MAD {totalIncome.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {studentPayments.length} {t("receipts")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalExpenses")}
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              MAD {totalExpense.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {teacherPayments.length} {t("receipts")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("netAmount")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${netAmount >= 0 ? "text-blue-600" : "text-red-600"}`}
            >
              MAD {netAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {netAmount >= 0 ? t("profit") : t("loss")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("filters")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(val) => {
                setTypeFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("allTypes")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allTypes")}</SelectItem>
                <SelectItem value="STUDENT_PAYMENT">
                  {t("studentPayments")}
                </SelectItem>
                <SelectItem value="TEACHER_PAYMENT">
                  {t("teacherPayments")}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={methodFilter}
              onValueChange={(val) => {
                setMethodFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t("allMethods")} />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method === "all" ? t("allMethods") : method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("allReceipts")}</CardTitle>
          <CardDescription>
            {t("showing")} {filteredReceipts.length} {t("of")}{" "}
            {(receipts || []).length} {t("receipts")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReceipts.length === 0 ? (
            <div className="text-center py-12">
              <ReceiptIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                {searchTerm || typeFilter !== "all" || methodFilter !== "all"
                  ? t("noReceiptsFound")
                  : t("noReceiptsYet")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin")}</TableHead>
                    <TableHead>{t("receiptNumber")}</TableHead>
                    <TableHead>{t("type")}</TableHead>
                    <TableHead>{t("for")}</TableHead>
                    <TableHead>{t("amount")}</TableHead>
                    <TableHead>{t("method")}</TableHead>
                    <TableHead>{t("date")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedReceipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell>
                        <div className="font-medium">
                          {receipt?.admin?.name || "-"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {receipt.receiptNumber}
                        </div>
                        {receipt.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {receipt.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            receipt.type === "STUDENT_PAYMENT"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {receipt.type === "STUDENT_PAYMENT"
                            ? t("income")
                            : t("expense")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {receipt.student?.name ||
                            receipt.teacher?.name ||
                            "-"}
                        </div>
                        {receipt.student?.grade && (
                          <div className="text-xs text-muted-foreground">
                            {receipt.student.grade}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div
                          className={`font-semibold ${
                            receipt.type === "STUDENT_PAYMENT"
                              ? "text-green-600"
                              : "text-orange-600"
                          }`}
                        >
                          MAD {receipt.amount.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {receipt.paymentMethod ? (
                          <Badge variant="outline">
                            {receipt.paymentMethod}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(receipt.date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredReceipts.length > 0 && (
            <div className="mt-4">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalCount={filteredReceipts.length}
                pageSize={ITEMS_PER_PAGE}
                entityName={t("receipts").toLowerCase()}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
