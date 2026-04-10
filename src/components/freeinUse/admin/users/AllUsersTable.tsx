"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Role, User } from "@/freelib/dexie/dbSchema";
import {
  studentActions,
  teacherActions,
  userActions,
} from "@/freelib/dexie/freedexieaction";
import { generateObjectId } from "@/freelib/utils/generateObjectId";
import { Loader2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import AddStudentDialog from "@/components/freeinUse/AddStudentDialog";
import AddTeacherDialog from "@/components/freeinUse/AddTeacherDialog";
import PageHeader from "@/components/freeinUse/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StudentsTab } from "./StudentsTab";
import { TeachersTab } from "./TeachersTab";
import { ItemToDelete, UserData, UserFormData } from "./types";
import { useAllUsers } from "./useAllUsers";
import { UserDialogs } from "./UserDialogs";
import { AdminsTab } from "./AdminsTab";

export default function AllUsersTable() {
  const t = useTranslations("AllUsersTable");

  const { users, teachers, students, isLoading, refreshData } = useAllUsers(
    t("unknownAdmin"),
  );

  const [activeTab, setActiveTab] = useState("admins");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  const [itemToDelete, setItemToDelete] = useState<ItemToDelete | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [userFormData, setUserFormData] = useState<UserFormData>({
    name: "",
    email: "",
    password: "",
    role: Role.ADMIN,
  });

  // Delete Handler
  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsProcessing(true);

    try {
      if (itemToDelete.type === "user") {
        const id = itemToDelete.id;
        await userActions.deleteLocal(id);
        refreshData();
        toast.success(t("userDeletedSuccess"));
      } else if (itemToDelete.type === "teacher") {
        const id = itemToDelete.id;
        await teacherActions.deleteLocal(id);
        refreshData();
        toast.success(t("teacherDeletedSuccess"));
      } else if (itemToDelete.type === "student") {
        const id = itemToDelete.id;
        await studentActions.deleteLocal(id);
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
      // Check for duplicate email
      const existingUser = await userActions.getLocalByEmail?.(
        userFormData.email,
      );
      if (existingUser) {
        toast.error(t("emailAlreadyInUse") || "Email already in use");
        setIsProcessing(false);
        return;
      }

      const now = Date.now();
      const newUser: User = {
        name: userFormData.name,
        email: userFormData.email,
        password: userFormData.password,
        role: userFormData.role as Role,
        id: generateObjectId(),
        createdAt: now,
        updatedAt: now,
      };
      await userActions.create(newUser);

      toast.success(t("userAddedSuccess"));
      setIsAddDialogOpen(false);
      setUserFormData({ name: "", email: "", password: "", role: Role.ADMIN });
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
      const userToUpdate: Partial<User> = {
        id: editingUser.id,
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role as Role,
      };
      await userActions.update(editingUser.id, userToUpdate);

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
    <div>
      <PageHeader
        title={t("allUsersTitle")}
        subtitle={t("allUsersDescription")}
      />
      <Card className="w-full shadow-xl border-none overflow-hidden bg-linear-to-br from-white to-gray-50/50 dark:from-gray-950 dark:to-gray-900/50">
        <CardHeader>
          <div className="flex justify-between items-center">
            {activeTab === "students" ? (
              <AddStudentDialog onStudentAdded={refreshData} />
            ) : activeTab === "teachers" ? (
              <AddTeacherDialog onTeacherAdded={refreshData} />
            ) : (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                {t("addAdmin") || "Add Admin"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger
                value="admins"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                {t("adminsTab") || "Administrators"} ({users.length})
              </TabsTrigger>
              <TabsTrigger
                value="teachers"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                {t("teachers")} ({teachers.length})
              </TabsTrigger>
              <TabsTrigger
                value="students"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                {t("students")} ({students.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="admins" className="space-y-4">
              <AdminsTab
                users={users}
                onEdit={(user: UserData) => {
                  setEditingUser({ ...user, password: "" });
                  setIsEditDialogOpen(true);
                }}
                onDelete={(user: UserData) =>
                  setItemToDelete({
                    id: user.id,
                    type: "user",
                    name: user.name,
                  })
                }
              />
            </TabsContent>

            <TabsContent value="teachers" className="space-y-4">
              <TeachersTab
                teachers={teachers}
                onUpdate={refreshData}
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
                onUpdate={refreshData}
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
      </Card>
    </div>
  );
}
