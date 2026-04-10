import { Button } from "@/freecomponents/ui/button";
import { Input } from "@/freecomponents/ui/input";
import { Label } from "@/freecomponents/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/freecomponents/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/freecomponents/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { UserData, UserFormData, ItemToDelete } from "./types";

interface UserDialogsProps {
  isAddDialogOpen: boolean;
  setIsAddDialogOpen: (open: boolean) => void;
  userFormData: UserFormData;
  setUserFormData: (
    data: UserFormData | ((prev: UserFormData) => UserFormData),
  ) => void;
  handleAddUser: () => void;

  isEditDialogOpen: boolean;
  setIsEditDialogOpen: (open: boolean) => void;
  editingUser: UserData | null;
  setEditingUser: (
    user: UserData | null | ((prev: UserData | null) => UserData | null),
  ) => void;
  handleSaveEdit: () => void;

  itemToDelete: ItemToDelete | null;
  setItemToDelete: (item: ItemToDelete | null) => void;
  handleDelete: () => void;

  isProcessing: boolean;
}

export function UserDialogs({
  isAddDialogOpen,
  setIsAddDialogOpen,
  userFormData,
  setUserFormData,
  handleAddUser,

  isEditDialogOpen,
  setIsEditDialogOpen,
  editingUser,
  setEditingUser,
  handleSaveEdit,

  itemToDelete,
  setItemToDelete,
  handleDelete,

  isProcessing,
}: UserDialogsProps) {
  const t = useTranslations("AllUsersTable");

  return (
    <>
      {/* Add Admin Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl bg-linear-to-br from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              {t("addNewAdmin") || "Add New Administrator"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="grid gap-2">
              <Label
                htmlFor="add-name"
                className="text-sm font-semibold text-muted-foreground ml-1"
              >
                {t("fullName")}
              </Label>
              <Input
                id="add-name"
                value={userFormData.name}
                onChange={(e) =>
                  setUserFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder={t("enterFullName")}
                className="rounded-xl border-muted/20 bg-muted/30 focus:bg-background transition-all"
              />
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="add-email"
                className="text-sm font-semibold text-muted-foreground ml-1"
              >
                {t("email")}
              </Label>
              <Input
                id="add-email"
                type="email"
                value={userFormData.email}
                onChange={(e) =>
                  setUserFormData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                placeholder={t("enterEmail")}
                className="rounded-xl border-muted/20 bg-muted/30 focus:bg-background transition-all"
              />
            </div>
            <div className="grid gap-2">
              <Label
                htmlFor="add-password"
                className="text-sm font-semibold text-muted-foreground ml-1"
              >
                {t("password")}
              </Label>
              <Input
                id="add-password"
                type="text"
                value={userFormData.password}
                onChange={(e) =>
                  setUserFormData((prev) => ({
                    ...prev,
                    password: e.target.value,
                  }))
                }
                placeholder={t("enterPassword")}
                className="rounded-xl border-muted/20 bg-muted/30 focus:bg-background transition-all"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isProcessing}
              className="rounded-xl hover:bg-muted"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={isProcessing}
              className="rounded-xl bg-linear-to-r from-primary to-blue-600 shadow-md hover:shadow-lg transition-all"
            >
              {isProcessing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("addAdmin") || "Add Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[425px] max-h-[90vh] overflow-y-auto rounded-3xl border-none shadow-2xl bg-linear-to-br from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {t("editUser")}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground font-medium">
              {t("editUserDescription")}
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-6 py-6">
              <div className="grid gap-2">
                <Label
                  htmlFor="edit-name"
                  className="text-sm font-semibold text-muted-foreground ml-1"
                >
                  {t("fullName")}
                </Label>
                <Input
                  id="edit-name"
                  value={editingUser.name}
                  onChange={(e) =>
                    setEditingUser((prev) =>
                      prev ? { ...prev, name: e.target.value } : null,
                    )
                  }
                  className="rounded-xl border-muted/20 bg-muted/30 focus:bg-background transition-all"
                />
              </div>
              <div className="grid gap-2">
                <Label
                  htmlFor="edit-email"
                  className="text-sm font-semibold text-muted-foreground ml-1"
                >
                  {t("email")}
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser((prev) =>
                      prev ? { ...prev, email: e.target.value } : null,
                    )
                  }
                  className="rounded-xl border-muted/20 bg-muted/30 focus:bg-background transition-all"
                />
              </div>
              <div className="grid gap-2">
                <Label
                  htmlFor="edit-password"
                  className="text-sm font-semibold text-muted-foreground ml-1"
                >
                  {t("passwordOptional")}
                </Label>
                <Input
                  id="edit-password"
                  type="text"
                  value={editingUser.password || ""}
                  onChange={(e) =>
                    setEditingUser((prev) =>
                      prev ? { ...prev, password: e.target.value } : null,
                    )
                  }
                  placeholder={t("keepCurrentPassword")}
                  className="rounded-xl border-muted/20 bg-muted/30 focus:bg-background transition-all"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingUser(null);
              }}
              disabled={isProcessing}
              className="rounded-xl hover:bg-muted"
            >
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={isProcessing}
              className="rounded-xl bg-linear-to-r from-primary to-blue-600 shadow-md hover:shadow-lg transition-all"
            >
              {isProcessing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!itemToDelete}
        onOpenChange={() => setItemToDelete(null)}
      >
        <AlertDialogContent className="rounded-3xl border-none shadow-2xl bg-linear-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-destructive flex items-center gap-2">
              {t("deleteConfirmTitle")} {itemToDelete && t(itemToDelete.type)}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium">
              {t("deleteConfirmDescription")}{" "}
              <span className="font-bold text-foreground underline decoration-destructive/30 decoration-2">
                {itemToDelete?.name}
              </span>
              ?
              <br />
              <span className="text-xs mt-2 block bg-destructive/5 text-destructive p-2 rounded-lg border border-destructive/10">
                {t("deleteConfirmWarning")}{" "}
                {itemToDelete && t(itemToDelete.type)}{" "}
                {t("deleteConfirmWarning2")}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel
              disabled={isProcessing}
              className="rounded-xl border-muted/20"
            >
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isProcessing}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md hover:shadow-lg transition-all"
            >
              {isProcessing && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("delete")} {itemToDelete && t(itemToDelete.type)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
