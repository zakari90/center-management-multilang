import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Mail, Shield, Trash2, Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { UserData } from './types'

interface ManagersTabProps {
  users: UserData[]
  onEdit: (user: UserData) => void
  onDelete: (user: UserData) => void
}

export function ManagersTab({ users, onEdit, onDelete }: ManagersTabProps) {
  const t = useTranslations('AllUsersTable')

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">{t('noUsersFound')}</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('user')}</TableHead>
            <TableHead>{t('role')}</TableHead>
            <TableHead>{t('managedCenters')}</TableHead>
            <TableHead>{t('students')}</TableHead>
            <TableHead>{t('teachers')}</TableHead>
            <TableHead>{t('created')}</TableHead>
            <TableHead className="text-right">{t('actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <div className="font-medium">{user.name}</div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      {user.email}
                    </div>
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                  {user.role}
                </Badge>
              </TableCell>
              
              <TableCell>
                {user.role === 'ADMIN' ? (
                  <Badge variant="outline">{user.stats.centers}</Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              
              <TableCell>{user.stats.students}</TableCell>
              <TableCell>{user.stats.teachers}</TableCell>
              
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                </span>
              </TableCell>
              
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(user)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(user)}
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
  )
}
