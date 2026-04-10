import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/freecomponents/ui/table";
import { Button } from "@/freecomponents/ui/button";
import { Badge } from "@/freecomponents/ui/badge";
import { Avatar, AvatarFallback } from "@/freecomponents/ui/avatar";
import { Mail, Trash2, Calendar, Edit } from "lucide-react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { UserData } from "./types";

interface AdminsTabProps {
  users: UserData[];
  onEdit: (user: UserData) => void;
  onDelete: (user: UserData) => void;
}

export function AdminsTab({ users, onEdit, onDelete }: AdminsTabProps) {
  const t = useTranslations("AllUsersTable");

  return (
    <div className="rounded-xl border border-white/20 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="font-bold py-4">
              {t("admin") || "Administrator"}
            </TableHead>
            <TableHead className="font-bold">{t("email")}</TableHead>
            <TableHead className="text-center font-bold px-4">
              {t("centers")}
            </TableHead>
            <TableHead className="text-center font-bold px-4">
              {t("teachers")}
            </TableHead>
            <TableHead className="text-center font-bold px-4">
              {t("students")}
            </TableHead>
            <TableHead className="font-bold">{t("joined")}</TableHead>
            <TableHead className="text-right font-bold pr-6">
              {t("actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow
              key={user.id}
              className="hover:bg-muted/20 transition-colors border-b last:border-0"
            >
              <TableCell className="py-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-primary/10 shadow-sm">
                    <AvatarFallback className="bg-linear-to-br from-blue-500 to-indigo-600 text-white font-bold">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">
                      {user.name}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                      System Admin
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <div className="p-1 rounded-full bg-muted/50">
                    <Mail className="h-3 w-3" />
                  </div>
                  {user.email}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  variant="secondary"
                  className="bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-bold px-2.5"
                >
                  {user.stats.centers}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  variant="secondary"
                  className="bg-green-100/50 text-green-700 dark:bg-green-900/30 dark:text-green-300 font-bold px-2.5"
                >
                  {user.stats.teachers}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  variant="secondary"
                  className="bg-purple-100/50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-bold px-2.5"
                >
                  {user.stats.students}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3 opacity-60" />
                  {format(new Date(user.createdAt), "MMM dd, yyyy")}
                </div>
              </TableCell>
              <TableCell className="text-right pr-6">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-all rounded-full"
                    onClick={() => onEdit(user)}
                    title={t("edit") || "Edit"}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all rounded-full"
                    onClick={() => onDelete(user)}
                    title={t("delete") || "Delete"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
