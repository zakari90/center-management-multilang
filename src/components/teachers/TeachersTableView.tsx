"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ViewTeacherDialog from "@/components/ViewTeacherDialog";
import EditTeacherDialog from "@/components/EditTeacherDialog";
import { Teacher } from "../teachersPresentation";
import { useState } from "react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Button } from "@/components/ui/button";
import { ReceiptText } from "lucide-react";
import AddTeacherPaymentDialog from "../AddTeacherPaymentDialog";
import { RequestDeleteDialog } from "@/components/RequestDeleteDialog";

interface TeachersTableViewProps {
  teachers: Teacher[];
  columnVisibility: {
    teacher: boolean;
    contact: boolean;
    subjects: boolean;
    schedule: boolean;
    joined: boolean;
    actions: boolean;
    payment?: boolean;
  };
  onUpdate: () => void;
  adminMode?: boolean;
}

export function TeachersTableView({
  teachers,
  columnVisibility,
  onUpdate,
  adminMode = false,
}: TeachersTableViewProps) {
  const t = useTranslations("TeachersTable");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const totalPages = Math.ceil(teachers.length / ITEMS_PER_PAGE);
  const paginatedTeachers = teachers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const getAvailableDays = (schedule: any) => {
    if (!schedule || !Array.isArray(schedule)) return t("notSet");
    return schedule.map((s: any) => s.day).join(", ") || t("notSet");
  };

  return (
    <Card className="hidden md:block">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              {columnVisibility.teacher && (
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider border-x">
                  {t("teacher")}
                </th>
              )}
              {columnVisibility.contact && (
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider border-x">
                  {t("contact")}
                </th>
              )}
              {columnVisibility.subjects && (
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider border-x">
                  {t("subjects")}
                </th>
              )}
              {columnVisibility.schedule && (
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider border-x">
                  {t("schedule")}
                </th>
              )}
              {columnVisibility.joined && (
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider border-x">
                  {t("joined")}
                </th>
              )}
              {/* Added Payment Column */}
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider border-x">
                Payment Status
              </th>
              {columnVisibility.actions && (
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider border-x">
                  {t("actions")}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {teachers.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-8 text-center text-muted-foreground"
                >
                  {t("noTeachersFound")}
                </td>
              </tr>
            ) : (
              paginatedTeachers.map((teacher) => (
                <tr
                  key={teacher.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  {columnVisibility.teacher && (
                    <td className="px-6 py-4 whitespace-nowrap border-x">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {teacher.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{teacher.name}</p>
                          {teacher.address && (
                            <p className="text-xs text-muted-foreground">
                              {teacher.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                  )}
                  {columnVisibility.contact && (
                    <td className="px-6 py-4 border-x">
                      <p className="text-sm">{teacher.email || "-"}</p>
                      <p className="text-xs text-muted-foreground">
                        {teacher.phone || "-"}
                      </p>
                    </td>
                  )}
                  {columnVisibility.subjects && (
                    <td className="px-6 py-4 border-x">
                      {teacher.teacherSubjects.length === 0 ? (
                        <span className="text-xs text-muted-foreground italic">
                          {t("noSubjectsAssigned")}
                        </span>
                      ) : (
                        <div className="space-y-1">
                          {teacher.teacherSubjects.slice(0, 2).map((ts) => (
                            <div
                              key={ts.id}
                              className="flex items-center gap-2"
                            >
                              <Badge variant="outline" className="text-xs">
                                {ts.subject.name}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {ts.percentage
                                  ? `${ts.percentage}%`
                                  : `$${ts.hourlyRate}/hr`}
                              </span>
                            </div>
                          ))}
                          {teacher.teacherSubjects.length > 2 && (
                            <p className="text-xs text-muted-foreground">
                              +{teacher.teacherSubjects.length - 2} more
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                  {columnVisibility.schedule && (
                    <td className="px-6 py-4 border-x text-sm">
                      {getAvailableDays(teacher.weeklySchedule)}
                    </td>
                  )}
                  {columnVisibility.joined && (
                    <td className="px-6 py-4 text-sm text-muted-foreground border-x text-center">
                      {new Date(teacher.createdAt).toLocaleDateString()}
                    </td>
                  )}

                  {/* Payment Status Column */}
                  <td className="px-6 py-4 whitespace-nowrap border-x text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Badge
                        variant={
                          teacher.paymentStatus?.status === "PAID"
                            ? "default"
                            : teacher.paymentStatus?.status === "PARTIAL"
                              ? "secondary"
                              : "destructive"
                        }
                        className={
                          teacher.paymentStatus?.status === "PAID"
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : teacher.paymentStatus?.status === "PARTIAL"
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                              : "bg-red-100 text-red-700 hover:bg-red-100"
                        }
                      >
                        {teacher.paymentStatus?.status || "UNPAID"}
                      </Badge>
                      {teacher.estimatedIncome !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          Est: MAD {teacher.estimatedIncome.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </td>

                  {columnVisibility.actions && (
                    <td className="px-6 py-4 whitespace-nowrap text-right border-x">
                      <div className="flex justify-end gap-2">
                        <AddTeacherPaymentDialog
                          onPaymentCreated={onUpdate}
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 border border-transparent hover:border-green-200"
                              title={t("addPayment") || "Add Payment"}
                            >
                              <ReceiptText className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <ViewTeacherDialog teacherId={teacher.id} />
                        <EditTeacherDialog
                          teacherId={teacher.id}
                          onTeacherUpdated={onUpdate}
                          adminMode={adminMode}
                        />
                        {!adminMode && (
                          <RequestDeleteDialog
                            entityId={teacher.id}
                            entityType="teacher"
                            entityName={teacher.name}
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
        totalCount={teachers.length}
        pageSize={ITEMS_PER_PAGE}
        entityName={t("teachers" as any) || "teachers"}
      />
    </Card>
  );
}
