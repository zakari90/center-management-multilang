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
import { Mail, Phone, Trash2, Calendar, Search, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { TeacherData } from "./types";
import { useState } from "react";
import AddTeacherDialog from "@/components/AddTeacherDialog";

interface TeachersTabProps {
  teachers: TeacherData[];
  onDelete: (teacher: TeacherData) => void;
  onTeacherAdded?: () => void;
}

export function TeachersTab({
  teachers,
  onDelete,
  onTeacherAdded,
}: TeachersTabProps) {
  const t = useTranslations("AllUsersTable");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.email &&
        teacher.email.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchTeachers")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <AddTeacherDialog onTeacherAdded={onTeacherAdded} />
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
              {filteredTeachers.map((teacher) => (
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDelete(teacher)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
