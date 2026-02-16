import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination-controls";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import {
  Calendar,
  Mail,
  Phone,
  Search,
  Trash2,
  Users,
  ReceiptText,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { TeacherData } from "./types";
import ViewTeacherDialog from "@/components/ViewTeacherDialog";
import EditTeacherDialog from "@/components/EditTeacherDialog";
import AddTeacherPaymentDialog from "@/components/AddTeacherPaymentDialog";

interface TeachersTabProps {
  teachers: TeacherData[];
  onDelete: (teacher: TeacherData) => void;
  onUpdate?: () => void;
  onTeacherAdded?: () => void;
}

export function TeachersTab({
  teachers,
  onDelete,
  onUpdate,
  onTeacherAdded,
}: TeachersTabProps) {
  const t = useTranslations("AllUsersTable");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.email &&
        teacher.email.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const totalPages = Math.ceil(filteredTeachers.length / ITEMS_PER_PAGE);
  const paginatedTeachers = filteredTeachers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchTeachers")}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset page on search
            }}
            className="pl-10"
          />
        </div>
        {/* <AddTeacherDialog onTeacherAdded={onTeacherAdded} /> */}
      </div>

      {filteredTeachers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">{t("noTeachersFound")}</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">{t("teacher")}</TableHead>
                <TableHead className="text-center">{t("contact")}</TableHead>
                <TableHead className="text-center">{t("manager")}</TableHead>
                <TableHead className="text-center">{t("subjects")}</TableHead>
                <TableHead className="text-center">{t("students")}</TableHead>
                <TableHead className="text-center">{t("receipts")}</TableHead>
                <TableHead className="text-center">{t("joined")}</TableHead>
                <TableHead className="text-center">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTeachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-green-100 text-green-700">
                          {teacher.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{teacher.name}</div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {teacher.email && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {teacher.email}
                        </div>
                      )}
                      {teacher.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {teacher.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="outline">{teacher.manager.name}</Badge>
                  </TableCell>

                  <TableCell>{teacher.stats.subjects}</TableCell>
                  <TableCell>{teacher.stats.students}</TableCell>
                  <TableCell>{teacher.stats.receipts}</TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(teacher.createdAt), "MMM dd, yyyy")}
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <AddTeacherPaymentDialog
                        onPaymentCreated={onUpdate || (() => {})}
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
                        onTeacherUpdated={onUpdate || (() => {})}
                        adminMode
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onDelete(teacher)}
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
            totalCount={filteredTeachers.length}
            pageSize={ITEMS_PER_PAGE}
            entityName={t("teachers").toLowerCase()}
          />
        </div>
      )}
    </div>
  );
}
