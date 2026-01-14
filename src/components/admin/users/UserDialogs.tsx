import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { UserData, UserFormData, ItemToDelete } from './types'

interface UserDialogsProps {
  isAddDialogOpen: boolean
  setIsAddDialogOpen: (open: boolean) => void
  userFormData: UserFormData
  setUserFormData: (data: UserFormData | ((prev: UserFormData) => UserFormData)) => void
  handleAddUser: () => void
  
  isEditDialogOpen: boolean
  setIsEditDialogOpen: (open: boolean) => void
  editingUser: UserData | null
  setEditingUser: (user: UserData | null | ((prev: UserData | null) => UserData | null)) => void
  handleSaveEdit: () => void
  
  itemToDelete: ItemToDelete | null
  setItemToDelete: (item: ItemToDelete | null) => void
  handleDelete: () => void
  
  isProcessing: boolean
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
  
  isProcessing
}: UserDialogsProps) {
  const t = useTranslations('AllUsersTable')

  return (
    <>
      {/* Add Manager Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('addNewManager')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="add-name">{t('fullName')}</Label>
              <Input
                id="add-name"
                value={userFormData.name}
                onChange={(e) =>
                  setUserFormData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder={t('enterFullName')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-email">{t('email')}</Label>
              <Input
                id="add-email"
                type="email"
                value={userFormData.email}
                onChange={(e) =>
                  setUserFormData(prev => ({ ...prev, email: e.target.value }))
                }
                placeholder={t('enterEmail')}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-password">{t('password')}</Label>
              <Input
                id="add-password"
                type="text"
                value={userFormData.password}
                onChange={(e) =>
                  setUserFormData(prev => ({ ...prev, password: e.target.value }))
                }
                placeholder={t('enterPassword')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isProcessing}
            >
              {t('cancel')}
            </Button>
            <Button onClick={handleAddUser} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('addManager')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('editUser')}</DialogTitle>
            <DialogDescription>
              {t('editUserDescription')}
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">{t('fullName')}</Label>
                <Input
                  id="edit-name"
                  value={editingUser.name}
                  onChange={(e) =>
                    setEditingUser(prev => prev ? ({ ...prev, name: e.target.value }) : null)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">{t('email')}</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser(prev => prev ? ({ ...prev, email: e.target.value }) : null)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-password">{t('passwordOptional')}</Label>
                <Input
                  id="edit-password"
                  type="text"
                  value={editingUser.password || ''}
                  onChange={(e) =>
                    setEditingUser(prev => prev ? ({ ...prev, password: e.target.value }) : null)
                  }
                  placeholder={t('keepCurrentPassword')}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                setEditingUser(null)
              }}
              disabled={isProcessing}
            >
              {t('cancel')}
            </Button>
            <Button onClick={handleSaveEdit} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('saveChanges')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('deleteConfirmTitle')} {itemToDelete && t(itemToDelete.type)}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirmDescription')} <strong>{itemToDelete?.name}</strong>? 
              {t('deleteConfirmWarning')} {itemToDelete && t(itemToDelete.type)} {t('deleteConfirmWarning2')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('delete')} {itemToDelete && t(itemToDelete.type)}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
