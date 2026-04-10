import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Phone,
  Trash2,
  Calendar,
  Search,
  GraduationCap,
  ReceiptText,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { StudentData } from "./types";
import { useState } from "react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import ViewStudentDialog from "@/components/freeinUse/ViewStudentDialog";
import ViewStudentCardDialog from "@/components/freeinUse/ViewStudentCardDialog";
import EditStudentDialog from "@/components/freeinUse/EditStudentDialog";
import AddStudentPaymentDialog from "@/components/freeinUse/AddStudentPaymentDialog";

interface StudentsTabProps {
  students: StudentData[];
  onDelete: (student: StudentData) => void;
  onUpdate?: () => void;
}

export function StudentsTab({
  students,
  onDelete,
  onUpdate,
}: StudentsTabProps) {
  const t = useTranslations("AllUsersTable");
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const uniqueGrades = Array.from(
    new Set(students.map((s) => s.grade).filter(Boolean)),
  );

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.email &&
        student.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesGrade = gradeFilter === "all" || student.grade === gradeFilter;

    return matchesSearch && matchesGrade;
  });

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchStudents")}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>

        <Select
          value={gradeFilter}
          onValueChange={(val) => {
            setGradeFilter(val);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t("allGrades")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allGrades")}</SelectItem>
            {uniqueGrades.map((grade) => (
              <SelectItem key={grade} value={grade!}>
                {grade}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredStudents.length === 0 ? (
        <div className="text-center py-12">
          <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">{t("noStudentsFound")}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/20 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="font-bold py-4">{t("student")}</TableHead>
                <TableHead className="font-bold">{t("contact")}</TableHead>
                <TableHead className="font-bold">{t("parent")}</TableHead>
                <TableHead className="text-center font-bold px-4">
                  {t("grade")}
                </TableHead>
                <TableHead className="text-center font-bold">
                  {t("admin") || "Admin"}
                </TableHead>
                <TableHead className="text-center font-bold px-4">
                  {t("subjects")}
                </TableHead>
                <TableHead className="text-center font-bold px-4">
                  {t("receipts")}
                </TableHead>
                <TableHead className="font-bold">{t("enrolled")}</TableHead>
                <TableHead className="text-right font-bold pr-6">
                  {t("actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.map((student) => (
                <TableRow
                  key={student.id}
                  className="hover:bg-muted/20 transition-colors border-b last:border-0"
                >
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-primary/10 shadow-sm">
                        <AvatarFallback className="bg-linear-to-br from-purple-500 to-pink-600 text-white font-bold">
                          {student.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-semibold text-foreground">
                        {student.name}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {student.email && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {student.email}
                        </div>
                      )}
                      {student.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {student.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    {student.parentName ? (
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {student.parentName}
                        </div>
                        {student.parentPhone && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {student.parentPhone}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  <TableCell>
                    {student.grade ? (
                      <Badge variant="outline">{student.grade}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline">{student.admin.name}</Badge>
                  </TableCell>

                  <TableCell>{student.stats.subjects}</TableCell>
                  <TableCell>{student.stats.receipts}</TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(student.createdAt), "MMM dd, yyyy")}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <AddStudentPaymentDialog
                        studentId={student.id}
                        onPaymentCreated={onUpdate || (() => {})}
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                            title="Add Payment"
                          >
                            <ReceiptText className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <ViewStudentDialog studentId={student.id} />
                      <ViewStudentCardDialog studentId={student.id} />
                      <EditStudentDialog
                        studentId={student.id}
                        onStudentUpdated={onUpdate || (() => {})}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onDelete(student)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalCount={filteredStudents.length}
            pageSize={ITEMS_PER_PAGE}
            entityName={t("students").toLowerCase()}
          />
        </div>
      )}
    </div>
  );
}
