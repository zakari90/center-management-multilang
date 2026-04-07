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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/authContext";
import {
  receiptActions,
  studentActions,
  teacherActions,
  userActions,
  studentSubjectActions,
  subjectActions,
  centerActions,
} from "@/lib/dexie/dexieActions";
import { checkPaymentStatus, PaymentStatus } from "@/lib/payment-utils";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import {
  Coins,
  Loader2,
  Receipt as ReceiptIcon,
  Search,
  TrendingDown,
  TrendingUp,
  User as UserIcon,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useEffect, useMemo, useState } from "react";
import AddStudentPaymentDialog from "../AddStudentPaymentDialog";
import AddTeacherPaymentDialog from "../AddTeacherPaymentDialog";
import PageHeader from "../page-header";
import { PaginationControls } from "../ui/pagination-controls";

interface Receipt {
  id: string;
  receiptNumber: string;
  amount: number;
  type: "STUDENT_PAYMENT" | "TEACHER_PAYMENT";
  paymentMethod: string | null;
  description: string | null;
  date: string;
  createdAt: string;
  studentId?: string;
  teacherId?: string;
  managerId?: string;
  manager?: {
    id: string;
    name: string;
  };
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

export default function AdminReceiptsTable({ isFree = false }: { isFree?: boolean }) {
  const t = useTranslations("AdminReceiptsTable");
  const { user, isFreeMode: contextIsFree } = useAuth();
  const isFreeMode = isFree || contextIsFree;

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  const [currentPageReceipts, setCurrentPageReceipts] = useState(1);
  const [currentPageStudents, setCurrentPageStudents] = useState(1);
  const [currentPageTeachers, setCurrentPageTeachers] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const queryData = useLiveQuery(async () => {
    try {
      if (!user) return null;

      // ✅ Fetch from local DB (all entities in parallel)
      const [
        allReceipts,
        allStudents,
        allTeachers,
        allUsers,
        allStudentSubjects,
        allSubjects,
        allCenters,
      ] = await Promise.all([
        receiptActions.getAll(),
        studentActions.getAll(),
        teacherActions.getAll(),
        userActions.getAll(),
        studentSubjectActions.getAll(),
        subjectActions.getAll(),
        centerActions.getAll(),
      ]);

      const filteredStudents = allStudents.filter((s) => s.status !== "0");
      const filteredTeachers = allTeachers.filter((t) => t.status !== "0");
      const filteredStudentSubjects = allStudentSubjects.filter(
        (ss) => ss.status !== "0",
      );
      const filteredSubjects = allSubjects.filter((s) => s.status !== "0");
      const filteredCenters = allCenters.filter((c) => c.status !== "0");

      // ✅ Filter receipts by status (exclude deleted)
      const activeReceipts = allReceipts.filter((r) => r.status !== "0");

      // ✅ Build receipts with related data
      const receiptsWithData: Receipt[] = activeReceipts.map((receipt) => {
        const student = receipt.studentId
          ? allStudents.find(
              (s) => s.id === receipt.studentId && s.status !== "0",
            )
          : null;
        const teacher = receipt.teacherId
          ? allTeachers.find(
              (t) => t.id === receipt.teacherId && t.status !== "0",
            )
          : null;
        const manager = allUsers.find(
          (u) => u.id === receipt.managerId && u.status !== "0",
        );

        return {
          id: receipt.id,
          receiptNumber: receipt.receiptNumber,
          amount: receipt.amount,
          type: receipt.type,
          paymentMethod: receipt.paymentMethod ?? null,
          description: receipt.description ?? null,
          date: new Date(receipt.date).toISOString(),
          createdAt: new Date(receipt.createdAt).toISOString(),
          studentId: receipt.studentId,
          teacherId: receipt.teacherId,
          managerId: receipt.managerId,
          manager: manager
            ? {
                id: manager.id,
                name: manager.name,
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

      return {
        receipts: receiptsWithData,
        students: filteredStudents,
        teachers: filteredTeachers,
        studentSubjects: filteredStudentSubjects,
        subjects: filteredSubjects,
        centers: filteredCenters,
      };
    } catch (err) {
      console.error("Error fetching data from local DB:", err);
      return null;
    }
  }, [user?.id]);

  const receipts = queryData?.receipts || [];
  const students = queryData?.students || [];
  const teachers = queryData?.teachers || [];
  const studentSubjects = queryData?.studentSubjects || [];
  const subjects = queryData?.subjects || [];
  const centers = queryData?.centers || [];
  const isLoading = queryData === undefined;
  const [error, setError] = useState("");

  const fetchReceipts = useCallback(async () => {
    // legacy fetchReceipts kept for prop compatibility in dialogs if needed,
    // but data is now reactive via useLiveQuery.
  }, []);

  const filteredReceipts = receipts.filter((receipt) => {
    const matchesSearch =
      receipt.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.teacher?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.manager?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === "all" || receipt.type === typeFilter;
    const matchesMethod =
      methodFilter === "all" || receipt.paymentMethod === methodFilter;

    return matchesSearch && matchesType && matchesMethod;
  });

  const totalPagesReceipts = Math.ceil(
    filteredReceipts.length / ITEMS_PER_PAGE,
  );
  const paginatedReceipts = filteredReceipts.slice(
    (currentPageReceipts - 1) * ITEMS_PER_PAGE,
    currentPageReceipts * ITEMS_PER_PAGE,
  );

  // Aggregated data for students and teachers
  const studentSummaryList = useMemo(() => {
    const aggregated = receipts
      .filter((r) => r.type === "STUDENT_PAYMENT" && r.student)
      .reduce(
        (acc, r) => {
          const id = r.student!.id;
          if (!acc[id]) {
            acc[id] = {
              id,
              name: r.student!.name,
              grade: r.student!.grade,
              totalPaid: 0,
              count: 0,
            };
          }
          acc[id].totalPaid += r.amount;
          acc[id].count += 1;
          return acc;
        },
        {} as Record<
          string,
          {
            id: string;
            name: string;
            grade: string | null;
            totalPaid: number;
            count: number;
          }
        >,
      );

    return students
      .map((student) => {
        const agg = aggregated[student.id] || { totalPaid: 0, count: 0 };

        const targetAmount = studentSubjects
          .filter((ss) => ss.studentId === student.id)
          .reduce((sum, ss) => {
            const subject = subjects.find((s) => s.id === ss.subjectId);
            return sum + (subject?.price || 0);
          }, 0);

        const center =
          centers.find((c) => c.managers.includes(student.managerId)) ||
          centers[0];
        const studentReceipts = receipts.filter(
          (r) => r.studentId === student.id && r.type === "STUDENT_PAYMENT",
        );

        const paymentStatus = checkPaymentStatus(
          studentReceipts,
          center?.paymentStartDay || 1,
          center?.paymentEndDay || 30,
          targetAmount,
        );

        return {
          ...agg,
          id: student.id,
          name: student.name,
          grade: student.grade ?? null,
          paymentStatus,
        };
      })
      .sort((a, b) => b.totalPaid - a.totalPaid);
  }, [receipts, students, studentSubjects, subjects, centers]);

  const totalPagesStudents = Math.ceil(
    studentSummaryList.length / ITEMS_PER_PAGE,
  );
  const paginatedStudents = studentSummaryList.slice(
    (currentPageStudents - 1) * ITEMS_PER_PAGE,
    currentPageStudents * ITEMS_PER_PAGE,
  );

  const teacherSummaryList = useMemo(() => {
    const aggregated = receipts
      .filter((r) => r.type === "TEACHER_PAYMENT" && r.teacher)
      .reduce(
        (acc, r) => {
          const id = r.teacher!.id;
          if (!acc[id]) {
            acc[id] = {
              id,
              name: r.teacher!.name,
              totalEarned: 0,
              count: 0,
            };
          }
          acc[id].totalEarned += r.amount;
          acc[id].count += 1;
          return acc;
        },
        {} as Record<
          string,
          { id: string; name: string; totalEarned: number; count: number }
        >,
      );

    return teachers
      .map((teacher) => {
        const agg = aggregated[teacher.id] || { totalEarned: 0, count: 0 };

        const center =
          centers.find((c) => c.managers.includes(teacher.managerId)) ||
          centers[0];
        const teacherReceipts = receipts.filter(
          (r) => r.teacherId === teacher.id && r.type === "TEACHER_PAYMENT",
        );

        const paymentStatus = checkPaymentStatus(
          teacherReceipts,
          center?.paymentStartDay || 1,
          center?.paymentEndDay || 30,
          0.01, // Simple heuristic
        );

        return {
          ...agg,
          id: teacher.id,
          name: teacher.name,
          paymentStatus,
        };
      })
      .sort((a, b) => b.totalEarned - a.totalEarned);
  }, [receipts, teachers, centers]);

  const totalPagesTeachers = Math.ceil(
    teacherSummaryList.length / ITEMS_PER_PAGE,
  );
  const paginatedTeachers = teacherSummaryList.slice(
    (currentPageTeachers - 1) * ITEMS_PER_PAGE,
    currentPageTeachers * ITEMS_PER_PAGE,
  );

  // Calculate stats
  const studentPayments = receipts.filter((r) => r.type === "STUDENT_PAYMENT");
  const teacherPayments = receipts.filter((r) => r.type === "TEACHER_PAYMENT");
  const totalIncome = studentPayments.reduce((sum, r) => sum + r.amount, 0);
  const totalExpense = teacherPayments.reduce((sum, r) => sum + r.amount, 0);
  const netAmount = totalIncome - totalExpense;

  const paymentMethods = [
    "all",
    ...new Set(
      receipts.map((r) => r.paymentMethod).filter(Boolean) as string[],
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
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <PageHeader title={t("title")} subtitle={t("subtitle")} />
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-4">
          <AddStudentPaymentDialog onPaymentCreated={fetchReceipts} />
          <AddTeacherPaymentDialog onPaymentCreated={fetchReceipts} />
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("totalReceipts")}
            </CardTitle>
            <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receipts.length}</div>
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
            <Coins className="h-4 w-4 text-blue-600" />
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

      <Tabs defaultValue="receipts" className="space-y-2 mt-6">
        <TabsList className="grid w-full grid-cols-3 md:w-[600px]">
          <TabsTrigger value="receipts">
            <ReceiptIcon className="h-4 w-4 mr-2" />
            {t("allReceipts")}
          </TabsTrigger>
          <TabsTrigger value="students">
            <UserIcon className="h-4 w-4 mr-2" />
            {t("studentsSummary") || "Students"}
          </TabsTrigger>
          <TabsTrigger value="teachers">
            <Users className="h-4 w-4 mr-2" />
            {t("teachersSummary") || "Teachers"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="receipts" className="space-y-6">
          {/* Filters */}
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
                      setCurrentPageReceipts(1);
                    }}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={typeFilter}
                  onValueChange={(val) => {
                    setTypeFilter(val);
                    setCurrentPageReceipts(1);
                  }}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
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
                    setCurrentPageReceipts(1);
                  }}
                >
                  <SelectTrigger className="w-full md:w-[180px]">
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

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t("allReceipts")}</CardTitle>
              <CardDescription>
                {t("showing")} {filteredReceipts.length} {t("of")}{" "}
                {receipts.length} {t("receipts")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredReceipts.length === 0 ? (
                <div className="text-center py-12">
                  <ReceiptIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">
                    {searchTerm ||
                    typeFilter !== "all" ||
                    methodFilter !== "all"
                      ? t("noReceiptsFound")
                      : t("noReceiptsYet")}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("manager")}</TableHead>
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
                              {receipt.manager?.name || "-"}
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
                    currentPage={currentPageReceipts}
                    totalPages={totalPagesReceipts}
                    onPageChange={setCurrentPageReceipts}
                    totalCount={filteredReceipts.length}
                    pageSize={ITEMS_PER_PAGE}
                    entityName={t("receipts").toLowerCase()}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>
                {t("studentsSummary") || "Students Summary"}
              </CardTitle>
              <CardDescription>
                {t("showing")} {studentSummaryList.length}{" "}
                {t("students") || "students"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {studentSummaryList.length === 0 ? (
                <div className="text-center py-12">
                  <UserIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">
                    {t("noReceiptsYet")}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("studentName") || "Student"}</TableHead>
                        <TableHead>{t("grade") || "Grade"}</TableHead>
                        <TableHead className="text-center">
                          {t("paymentState") || "Payment State"}
                        </TableHead>
                        <TableHead className="text-right">
                          {t("receiptsCount") || "Receipts"}
                        </TableHead>
                        <TableHead className="text-right">
                          {t("totalPaid") || "Total Paid"}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            {student.name}
                          </TableCell>
                          <TableCell>{student.grade || "-"}</TableCell>
                          <TableCell className="text-center">
                            <PaymentStatusBadge
                              status={student.paymentStatus}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            {student.count}
                          </TableCell>
                          <TableCell className="text-right font-bold text-green-600">
                            MAD {student.totalPaid.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {studentSummaryList.length > 0 && (
                <div className="mt-4">
                  <PaginationControls
                    currentPage={currentPageStudents}
                    totalPages={totalPagesStudents}
                    onPageChange={setCurrentPageStudents}
                    totalCount={studentSummaryList.length}
                    pageSize={ITEMS_PER_PAGE}
                    entityName={t("students").toLowerCase()}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teachers">
          <Card>
            <CardHeader>
              <CardTitle>
                {t("teachersSummary") || "Teachers Summary"}
              </CardTitle>
              <CardDescription>
                {t("showing")} {teacherSummaryList.length}{" "}
                {t("teachers") || "teachers"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teacherSummaryList.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">
                    {t("noReceiptsYet")}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("teacherName") || "Teacher"}</TableHead>
                        <TableHead className="text-center">
                          {t("paymentState") || "Payment State"}
                        </TableHead>
                        <TableHead className="text-right">
                          {t("receiptsCount") || "Receipts"}
                        </TableHead>
                        <TableHead className="text-right">
                          {t("totalEarned") || "Total Earned"}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTeachers.map((teacher) => (
                        <TableRow key={teacher.id}>
                          <TableCell className="font-medium">
                            {teacher.name}
                          </TableCell>
                          <TableCell className="text-center">
                            <PaymentStatusBadge
                              status={teacher.paymentStatus}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            {teacher.count}
                          </TableCell>
                          <TableCell className="text-right font-bold text-orange-600">
                            MAD {teacher.totalEarned.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {teacherSummaryList.length > 0 && (
                <div className="mt-4">
                  <PaginationControls
                    currentPage={currentPageTeachers}
                    totalPages={totalPagesTeachers}
                    onPageChange={setCurrentPageTeachers}
                    totalCount={teacherSummaryList.length}
                    pageSize={ITEMS_PER_PAGE}
                    entityName={t("teachers").toLowerCase()}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
