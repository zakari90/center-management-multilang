"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ViewStudentDialog from "@/components/ViewStudentDialog";
import ViewStudentCardDialog from "@/components/ViewStudentCardDialog";
import EditStudentDialog from "@/components/EditStudentDialog";
import AddStudentPaymentDialog from "@/components/AddStudentPaymentDialog";
import { Student } from "../studentsPresentation";
import { useState } from "react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Button } from "@/components/ui/button";
import { ReceiptText } from "lucide-react";
import { RequestDeleteDialog } from "@/components/RequestDeleteDialog";
import { DirectDeleteDialog } from "@/components/DirectDeleteDialog";

interface StudentsTableViewProps {
  students: Student[];
  columnVisibility: {
    name: boolean;
    contact: boolean;
    parent: boolean;
    subjects: boolean;
    monthlyFee: boolean;
    payment: boolean;
    actions: boolean;
  };
  getTotalRevenue: (student: Student) => number;
  onUpdate: () => void;
  adminMode?: boolean;
}

export function StudentsTableView({
  students,
  columnVisibility,
  getTotalRevenue,
  onUpdate,
  adminMode = false,
}: StudentsTableViewProps) {
  const t = useTranslations("StudentsTable");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const totalPages = Math.ceil(students.length / ITEMS_PER_PAGE);
  const paginatedStudents = students.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <Card className="hidden md:block">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {columnVisibility.name && (
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider border-x">
                  {t("name")}
                </th>
              )}
              {columnVisibility.contact && (
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider border-x">
                  {t("contact")}
                </th>
              )}
              {columnVisibility.parent && (
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider border-x">
                  {t("parent")}
                </th>
              )}
              {columnVisibility.subjects && (
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider border-x">
                  {t("subjects")}
                </th>
              )}
              {columnVisibility.monthlyFee && (
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider border-x">
                  {t("monthlyFee")}
                </th>
              )}
              {columnVisibility.payment && (
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider border-x">
                  {t("payment")}
                </th>
              )}
              {columnVisibility.actions && (
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider border-x">
                  {t("actions")}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {students.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-muted-foreground"
                >
                  {t("noStudents")}
                </td>
              </tr>
            ) : (
              paginatedStudents.map((student) => (
                <tr
                  key={student.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  {columnVisibility.name && (
                    <td className="px-6 py-4 whitespace-nowrap border-x">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback className="bg-green-100 text-green-600">
                            {student.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">
                            {student.name}
                          </div>
                          {student.grade && (
                            <div className="text-sm text-muted-foreground">
                              {student.grade}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  )}
                  {columnVisibility.contact && (
                    <td className="px-6 py-4 border-x">
                      <div className="text-sm">{student.email || "-"}</div>
                      <div className="text-sm text-muted-foreground">
                        {student.phone || "-"}
                      </div>
                    </td>
                  )}
                  {columnVisibility.parent && (
                    <td className="px-6 py-4 border-x">
                      <div className="text-sm">{student.parentName || "-"}</div>
                      <div className="text-sm text-muted-foreground">
                        {student.parentPhone || "-"}
                      </div>
                    </td>
                  )}
                  {columnVisibility.subjects && (
                    <td className="px-6 py-4 border-x">
                      <Badge variant="secondary">
                        {student.studentSubjects?.length || 0} {t("subjects")}
                      </Badge>
                    </td>
                  )}
                  {columnVisibility.monthlyFee && (
                    <td className="px-6 py-4 whitespace-nowrap border-x text-center">
                      <div className="text-sm font-medium">
                        {t("MAD")} {getTotalRevenue(student).toFixed(2)}
                      </div>
                    </td>
                  )}
                  {columnVisibility.payment && (
                    <td className="px-6 py-4 whitespace-nowrap border-x text-center">
                      <Badge
                        variant={
                          student.paymentStatus.status === "PAID"
                            ? "default"
                            : student.paymentStatus.status === "PARTIAL"
                              ? "secondary"
                              : "destructive"
                        }
                        className={
                          student.paymentStatus.status === "PAID"
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : student.paymentStatus.status === "PARTIAL"
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                              : "bg-red-100 text-red-700 hover:bg-red-100"
                        }
                      >
                        {t(student.paymentStatus.status.toLowerCase())}
                      </Badge>
                    </td>
                  )}
                  {columnVisibility.actions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right border-x">
                      <div className="flex gap-1 justify-end">
                        <AddStudentPaymentDialog
                          studentId={student.id}
                          onPaymentCreated={onUpdate}
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                              title={t("addPayment")}
                            >
                              <ReceiptText className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <ViewStudentDialog studentId={student.id} />
                        <ViewStudentCardDialog studentId={student.id} />
                        <EditStudentDialog
                          studentId={student.id}
                          onStudentUpdated={onUpdate}
                          adminMode={adminMode}
                        />
                        {!adminMode ? (
                          <RequestDeleteDialog
                            entityId={student.id}
                            entityType="student"
                            entityName={student.name}
                          />
                        ) : (
                          <DirectDeleteDialog
                            entityId={student.id}
                            entityType="student"
                            entityName={student.name}
                            onDelete={onUpdate}
                          />
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalCount={students.length}
        pageSize={ITEMS_PER_PAGE}
        entityName={t("students").toLowerCase()}
      />
    </Card>
  );
}
