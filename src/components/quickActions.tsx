"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Calendar,
  GraduationCap,
  Receipt,
  ReceiptText,
  UserPlus,
} from "lucide-react";
import { ModalLink } from "@/components/modal-link";
import { useTranslations } from "next-intl";
import AddStudentDialog from "./AddStudentDialog";
import AddStudentPaymentDialog from "./AddStudentPaymentDialog";
import AddTeacherDialog from "./AddTeacherDialog";
import AddTeacherPaymentDialog from "./AddTeacherPaymentDialog";

export default function QuickActions() {
  const t = useTranslations("QuickActions");

  // const actions = [
  //   {
  //     title: t('actions.addStudent.title'),
  //     description: t('actions.addStudent.description'),
  //     icon: UserPlus,
  //     href: '/manager/students/create',
  //     color: 'text-blue-600 bg-blue-100'
  //   },
  //   {
  //     title: t('actions.addTeacher.title'),
  //     description: t('actions.addTeacher.description'),
  //     icon: GraduationCap,
  //     href: '/manager/teachers/create',
  //     color: 'text-purple-600 bg-purple-100'
  //   },
  //   {
  //     title: t('actions.newReceipt.title'),
  //     description: t('actions.newReceipt.description'),
  //     icon: Receipt,
  //     href: '/manager/receipts/create',
  //     color: 'text-orange-600 bg-orange-100'
  //   },
  //   {
  //     title: t('actions.schedule.title'),
  //     description: t('actions.schedule.description'),
  //     icon: Calendar,
  //     href: '/manager/schedule',
  //     color: 'text-pink-600 bg-pink-100'
  //   }
  // ]

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center`}
              >
                <UserPlus className="h-6 w-6" />
              </div>
              <AddTeacherDialog adminMode={user?.role === "ADMIN"} />
            </div>
          </div>
          <div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center`}
              >
                <GraduationCap className="h-6 w-6" />
              </div>
              <AddStudentDialog adminMode={user?.role === "ADMIN"} />
            </div>
          </div>
          <div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center`}
              >
                +<ReceiptText className="h-6 w-6" />
              </div>
              <AddStudentPaymentDialog />
            </div>
          </div>
          <div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center`}
              >
                - <ReceiptText className="h-6 w-6" />
              </div>
              <AddTeacherPaymentDialog />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
