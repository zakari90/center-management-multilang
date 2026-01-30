"use client";

import StudentReceiptTable from "@/components/studentReceiptTable";
import StudentsTable from "@/components/studentsPresentation";

export default function ManagerStudentsClient() {
  return (
    <>
      <StudentsTable />
      <StudentReceiptTable />
    </>
  );
}
