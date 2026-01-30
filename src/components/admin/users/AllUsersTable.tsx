"use client";

import React, { useState } from "react";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { isOnline } from "@/lib/utils/network";
import { generateObjectId } from "@/lib/utils/generateObjectId";
import {
  userActions,
  teacherActions,
  studentActions,
} from "@/lib/dexie/dexieActions";
import ServerActionUsers from "@/lib/dexie/userServerAction";
import ServerActionTeachers from "@/lib/dexie/teacherServerAction";
import ServerActionStudents from "@/lib/dexie/studentServerAction";
import { Role, User, SyncStatus } from "@/lib/dexie/dbSchema";

import { useAllUsers } from "./useAllUsers";
import { ManagersTab } from "./ManagersTab";
import { TeachersTab } from "./TeachersTab";
import { StudentsTab } from "./StudentsTab";
import { UserDialogs } from "./UserDialogs";
import AddStudentDialog from "@/components/AddStudentDialog";
import { OrphanedRecordsDialog } from "./OrphanedRecordsDialog";
import {
  UserData,
  UserFormData,
  ItemToDelete,
  TeacherData,
  StudentData,
} from "./types";
import {
  findOrphanedTeachers,
  findOrphanedStudents,
  getOrphanedRecordsCount,
} from "@/utils/orphanedRecords";
import AddTeacherDialog from "@/components/AddTeacherDialog";

export default function AllUsersTable() {
  const t = useTranslations("AllUsersTable");

  const { users, teachers, students, isLoading, refreshData } = useAllUsers();
  // t("unknownManager"),

  const [activeTab, setActiveTab] = useState("users");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  const [itemToDelete, setItemToDelete] = useState<ItemToDelete | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [userFormData, setUserFormData] = useState<UserFormData>({
    name: "",
    email: "",
    password: "",
    role: "MANAGER",
  });

  // Orphaned Records State
  const [orphanedRecordsDialogOpen, setOrphanedRecordsDialogOpen] =
    useState(false);
  const [orphanedTeachers, setOrphanedTeachers] = useState<
    ReturnType<typeof findOrphanedTeachers>
  >([]);
  const [orphanedStudents, setOrphanedStudents] = useState<
    ReturnType<typeof findOrphanedStudents>
  >([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Detect orphaned records when data loads
  const detectOrphanedRecords = async () => {
    try {
      const fetchedUsers = await userActions.getAll();
      const activeUsers = fetchedUsers.filter((u) => u.status !== "0");
      setAllUsers(activeUsers);

      const orphanedT = findOrphanedTeachers(teachers, activeUsers);
      const orphanedS = findOrphanedStudents(students, activeUsers);

      setOrphanedTeachers(orphanedT);
      setOrphanedStudents(orphanedS);
    } catch (error) {
      console.error("Failed to detect orphaned records:", error);
    }
  };

  // Run detection when teachers or students change
  React.useEffect(() => {
    if (!isLoading && (teachers.length > 0 || students.length > 0)) {
      detectOrphanedRecords();
    }
  }, [teachers, students, isLoading]);

  // Delete Handler
  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsProcessing(true);

    try {
      if (itemToDelete.type === "user") {
        const id = itemToDelete.id;
        await userActions.markForDelete(id);
        if (isOnline()) {
          try {
            await ServerActionUsers.softDeleteUser(id);
          } catch (error) {
            console.error("Failed to strict sync delete to server:", error);
          }
        }
        refreshData();
        toast.success(t("userDeletedSuccess"));
      } else if (itemToDelete.type === "teacher") {
        const id = itemToDelete.id;
        await teacherActions.markForDelete(id);
        if (isOnline()) {
          try {
            await ServerActionTeachers.softDeleteTeacher(id);
          } catch (error) {
            console.error("Failed to strict sync delete to server:", error);
          }
        }
        refreshData();
        toast.success(t("teacherDeletedSuccess"));
      } else if (itemToDelete.type === "student") {
        const id = itemToDelete.id;
        await studentActions.markForDelete(id);
        if (isOnline()) {
          try {
            await ServerActionStudents.softDeleteStudent(id);
          } catch (error) {
            console.error("Failed to strict sync delete to server:", error);
          }
        }
        refreshData();
        toast.success(t("studentDeletedSuccess"));
      }
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error(t("deleteFailed"));
    } finally {
      setIsProcessing(false);
      setItemToDelete(null);
    }
  };

  // Add User Handler
  const handleAddUser = async () => {
    if (!userFormData.name || !userFormData.email || !userFormData.password) {
      toast.error(t("fillAllFields"));
      return;
    }

    setIsProcessing(true);
    try {
      const newUser: User = {
        name: userFormData.name,
        email: userFormData.email,
        password: userFormData.password,
        role: userFormData.role as Role,
        id: generateObjectId(),
        status: "1" as SyncStatus,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await userActions.create(newUser);

      if (isOnline()) {
        try {
          // createOrUpdateUser likely expects the same User type or a compatible one.
          // If ServerActionUsers.createOrUpdateUser expects dates as strings, we might need a transformation.
          // But based on recent conversations, we are standardizing on Dexie types.
          await ServerActionUsers.createOrUpdateUser(newUser);
          await userActions.markSynced(newUser.id);
        } catch (error) {
          console.error("Failed to sync new user to server:", error);
        }
      }

      toast.success(t("userAddedSuccess"));
      setIsAddDialogOpen(false);
      setUserFormData({ name: "", email: "", password: "", role: "MANAGER" });
      refreshData();
    } catch (error) {
      console.error("Failed to add user:", error);
      toast.error(t("userAddFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  // Edit User Handler
  const handleSaveEdit = async () => {
    if (!editingUser) return;

    setIsProcessing(true);
    try {
      const updates: Partial<UserData> = {
        name: editingUser.name,
        email: editingUser.email,
        // Only include password if it was changed (not empty)
        ...(editingUser.password ? { password: editingUser.password } : {}),
      };

      // Convert UserData back to the format Dexie expects (flattened)
      const userToUpdate: Partial<User> = {
        id: editingUser.id,
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role as Role,
        status: (editingUser.isActive ? "1" : "0") as SyncStatus,
        ...(editingUser.password ? { password: editingUser.password } : {}),
        updatedAt: Date.now(),
      };

      await userActions.update(editingUser.id, userToUpdate);

      if (isOnline()) {
        try {
          await ServerActionUsers.createOrUpdateUser(userToUpdate);
          await userActions.markSynced(editingUser.id);
        } catch (error) {
          console.error("Failed to sync update to server:", error);
        }
      }

      toast.success(t("userUpdatedSuccess"));
      setIsEditDialogOpen(false);
      setEditingUser(null);
      refreshData();
    } catch (error) {
      console.error("Failed to update user:", error);
      toast.error(t("userUpdateFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>{t("allUsersTitle")}</CardTitle>
            <CardDescription>{t("allUsersDescription")}</CardDescription>
          </div>
          {activeTab === "students" ? (
            <AddStudentDialog adminMode onStudentAdded={refreshData} />
          ) : activeTab === "teachers" ? (
            <AddTeacherDialog onTeacherAdded={refreshData} adminMode />
          ) : (
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("addManager")}
            </Button>
          )}
        </div>

        {/* Orphaned Records Alert */}
        {(orphanedTeachers.length > 0 || orphanedStudents.length > 0) && (
          <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm text-orange-800 dark:text-orange-200">
                    {t("orphanedRecordsFound")}
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    {orphanedTeachers.length > 0 && (
                      <span>
                        {orphanedTeachers.length} {t("teachers").toLowerCase()}
                      </span>
                    )}
                    {orphanedTeachers.length > 0 &&
                      orphanedStudents.length > 0 && <span> + </span>}
                    {orphanedStudents.length > 0 && (
                      <span>
                        {orphanedStudents.length} {t("students").toLowerCase()}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setOrphanedRecordsDialogOpen(true)}
                className="shrink-0"
              >
                {t("fixNow")}
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList>
            <TabsTrigger value="users">
              {t("managersTab")} ({users.length})
            </TabsTrigger>
            <TabsTrigger value="teachers">
              {t("teachers")} ({teachers.length})
            </TabsTrigger>
            <TabsTrigger value="students">
              {t("students")} ({students.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <ManagersTab
              users={users}
              onEdit={(user) => {
                setEditingUser({ ...user, password: "" }); // Clear password for security/edit form
                setIsEditDialogOpen(true);
              }}
              onDelete={(user) =>
                setItemToDelete({ id: user.id, type: "user", name: user.name })
              }
            />
          </TabsContent>

          <TabsContent value="teachers" className="space-y-4">
            <TeachersTab
              teachers={teachers}
              onDelete={(teacher) =>
                setItemToDelete({
                  id: teacher.id,
                  type: "teacher",
                  name: teacher.name,
                })
              }
            />
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <StudentsTab
              students={students}
              onDelete={(student) =>
                setItemToDelete({
                  id: student.id,
                  type: "student",
                  name: student.name,
                })
              }
            />
          </TabsContent>
        </Tabs>
      </CardContent>

      <UserDialogs
        isAddDialogOpen={isAddDialogOpen}
        setIsAddDialogOpen={setIsAddDialogOpen}
        userFormData={userFormData}
        setUserFormData={setUserFormData}
        handleAddUser={handleAddUser}
        isEditDialogOpen={isEditDialogOpen}
        setIsEditDialogOpen={setIsEditDialogOpen}
        editingUser={editingUser}
        setEditingUser={setEditingUser}
        handleSaveEdit={handleSaveEdit}
        itemToDelete={itemToDelete}
        setItemToDelete={setItemToDelete}
        handleDelete={handleDelete}
        isProcessing={isProcessing}
      />

      <OrphanedRecordsDialog
        open={orphanedRecordsDialogOpen}
        onOpenChange={setOrphanedRecordsDialogOpen}
        orphanedTeachers={orphanedTeachers}
        orphanedStudents={orphanedStudents}
        availableManagers={users}
        onRecordsFixed={() => {
          refreshData();
          detectOrphanedRecords();
        }}
      />
    </Card>
  );
}
