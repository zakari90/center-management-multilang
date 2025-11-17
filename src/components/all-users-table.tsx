// components/admin/all-users-table.tsx
'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
// import axios from 'axios' // ✅ Commented out - using local DB instead
import { format } from 'date-fns'
import {
  Calendar,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Shield,
  Trash2,
  User,
  Users
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { 
  userActions, 
  centerActions, 
  teacherActions, 
  studentActions,
  teacherSubjectActions,
  studentSubjectActions,
  receiptActions
} from '@/lib/dexie/dexieActions'
import { generateObjectId } from '@/lib/utils/generateObjectId'
import { Role } from '@/lib/dexie/dbSchema'
import { useAuth } from '@/context/authContext'

interface UserData {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MANAGER'
  password?: string
  createdAt: string
  isActive: boolean
  stats: {
    centers: number
    students: number
    teachers: number
  }
}

interface TeacherData {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  createdAt: string
  manager: {
    id: string
    name: string
  }
  stats: {
    subjects: number
    students: number
    receipts: number
  }
}

interface StudentData {
  id: string
  name: string
  email: string | null
  phone: string | null
  parentName: string | null
  parentPhone: string | null
  parentEmail: string | null
  grade: string | null
  createdAt: string
  manager: {
    id: string
    name: string
  }
  stats: {
    subjects: number
    receipts: number
  }
}

interface UserFormData {
  name: string
  email: string
  password: string
  role: 'ADMIN' | 'MANAGER'
}

export default function AllUsersTable() {
  const t = useTranslations('AllUsersTable')
  const { user } = useAuth() // ✅ Get current user from AuthContext
  
  const [activeTab, setActiveTab] = useState('users')
  
  const [users, setUsers] = useState<UserData[]>([])
  const [teachers, setTeachers] = useState<TeacherData[]>([])
  const [students, setStudents] = useState<StudentData[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [searchTerm, setSearchTerm] = useState('')
  const [gradeFilter, setGradeFilter] = useState<string>('all')

  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'user' | 'teacher' | 'student'; name: string } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [userFormData, setUserFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'MANAGER'
  })

  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})

  const fetchAllData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      // ✅ Fetch all data from local DB
      const [allUsers, allTeachers, allStudents, allCenters, allTeacherSubjects, allStudentSubjects, allReceipts] = await Promise.all([
        userActions.getAll(),
        teacherActions.getAll(),
        studentActions.getAll(),
        centerActions.getAll(),
        teacherSubjectActions.getAll(),
        studentSubjectActions.getAll(),
        receiptActions.getAll()
      ])

      // ✅ Filter active entities (exclude deleted)
      const activeUsers = allUsers.filter(u => u.status !== '0')
      const activeTeachers = allTeachers.filter(t => t.status !== '0')
      const activeStudents = allStudents.filter(s => s.status !== '0')
      const activeCenters = allCenters.filter(c => c.status !== '0')
      const activeTeacherSubjects = allTeacherSubjects.filter(ts => ts.status !== '0')
      const activeStudentSubjects = allStudentSubjects.filter(ss => ss.status !== '0')
      const activeReceipts = allReceipts.filter(r => r.status !== '0')

      // ✅ Build users data with stats
      const usersData: UserData[] = activeUsers.map(user => {
        // Count centers for admins
        const centers = user.role === Role.ADMIN 
          ? activeCenters.filter(c => c.adminId === user.id).length
          : 0
        
        // Count students and teachers for managers
        const students = user.role === Role.MANAGER
          ? activeStudents.filter(s => s.managerId === user.id).length
          : 0
        
        const teachers = user.role === Role.MANAGER
          ? activeTeachers.filter(t => t.managerId === user.id).length
          : 0

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as 'ADMIN' | 'MANAGER',
          password: user.password,
          createdAt: new Date(user.createdAt).toISOString(),
          isActive: user.status === '1',
          stats: {
            centers,
            students,
            teachers
          }
        }
      })

      // ✅ Build teachers data with manager and stats
      const teachersData: TeacherData[] = activeTeachers.map(teacher => {
        const manager = activeUsers.find(u => u.id === teacher.managerId)
        
        const teacherSubs = activeTeacherSubjects.filter(ts => ts.teacherId === teacher.id)
        const studentSubs = activeStudentSubjects.filter(ss => ss.teacherId === teacher.id)
        const teacherReceipts = activeReceipts.filter(r => r.teacherId === teacher.id)

        return {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email || null,
          phone: teacher.phone || null,
          address: teacher.address || null,
          createdAt: new Date(teacher.createdAt).toISOString(),
          manager: manager ? {
            id: manager.id,
            name: manager.name
          } : {
            id: teacher.managerId,
            name: 'Unknown Manager'
          },
          stats: {
            subjects: teacherSubs.length,
            students: studentSubs.length,
            receipts: teacherReceipts.length
          }
        }
      })

      // ✅ Build students data with manager and stats
      const studentsData: StudentData[] = activeStudents.map(student => {
        const manager = activeUsers.find(u => u.id === student.managerId)
        
        const studentSubs = activeStudentSubjects.filter(ss => ss.studentId === student.id)
        const studentReceipts = activeReceipts.filter(r => r.studentId === student.id)

        return {
          id: student.id,
          name: student.name,
          email: student.email || null,
          phone: student.phone || null,
          parentName: student.parentName || null,
          parentPhone: student.parentPhone || null,
          parentEmail: student.parentEmail || null,
          grade: student.grade || null,
          createdAt: new Date(student.createdAt).toISOString(),
          manager: manager ? {
            id: manager.id,
            name: manager.name
          } : {
            id: student.managerId,
            name: 'Unknown Manager'
          },
          stats: {
            subjects: studentSubs.length,
            receipts: studentReceipts.length
          }
        }
      })

      setUsers(usersData)
      setTeachers(teachersData)
      setStudents(studentsData)

      // ✅ Commented out API calls
      // const [usersRes, teachersRes, studentsRes] = await Promise.all([
      //   axios.get('/api/admin/users'),
      //   axios.get('/api/admin/teachers'),
      //   axios.get('/api/admin/students')
      // ])
      // setUsers(usersRes.data)
      // setTeachers(teachersRes.data)
      // setStudents(studentsRes.data)
    } catch (err) {
      console.error('Failed to fetch data from local DB:', err)
      setError(t('errorLoadData'))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const handleDelete = async () => {
    if (!itemToDelete) return
    
    setIsProcessing(true)
    try {
      // ✅ Mark for delete in local DB (soft delete)
      if (itemToDelete.type === 'user') {
        await userActions.markForDelete(itemToDelete.id)
        setUsers(prev => prev.filter(u => u.id !== itemToDelete.id))
      } else if (itemToDelete.type === 'teacher') {
        await teacherActions.markForDelete(itemToDelete.id)
        setTeachers(prev => prev.filter(t => t.id !== itemToDelete.id))
      } else {
        await studentActions.markForDelete(itemToDelete.id)
        setStudents(prev => prev.filter(s => s.id !== itemToDelete.id))
      }
      
      toast(`${t(itemToDelete.type)} ${t('deletedSuccess')}`)
      setItemToDelete(null)

      // ✅ Commented out API call
      // const endpoint = itemToDelete.type === 'user' 
      //   ? `/api/admin/users/${itemToDelete.id}`
      //   : itemToDelete.type === 'teacher'
      //   ? `/api/admin/teachers/${itemToDelete.id}`
      //   : `/api/admin/students/${itemToDelete.id}`
      // await axios.delete(endpoint)
    } catch (err) {
      console.error('Failed to delete from local DB:', err)
      toast(`${t('deletedError')} ${t(itemToDelete.type)}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAddUser = async () => {
    if (!userFormData.name.trim() || !userFormData.email.trim() || !userFormData.password.trim()) {
      toast(t('fillAllFields'))
      return
    }

    if (!user) {
      toast('Unauthorized: Please log in again')
      return
    }

    setIsProcessing(true)
    try {
      // ✅ Check if email already exists in local DB
      const existingUser = await userActions.getLocalByEmail?.(userFormData.email)
      if (existingUser) {
        toast('Email is already in use')
        setIsProcessing(false)
        return
      }

      // ✅ Create manager in local DB
      const now = Date.now()
      const managerId = generateObjectId()
      const newManager = {
        id: managerId,
        email: userFormData.email,
        password: userFormData.password, // Store plain password (will be hashed on sync)
        name: userFormData.name,
        role: Role.MANAGER,
        status: 'w' as const, // Waiting for sync
        createdAt: now,
        updatedAt: now,
      }

      await userActions.putLocal(newManager)

      // ✅ Update center to add manager to managers array
      const centers = await centerActions.getAll()
      const adminCenters = centers.filter(c => c.adminId === user.id)
      
      if (adminCenters.length > 0) {
        const center = adminCenters[0] // Get first center
        const updatedManagers = [...(center.managers || []), managerId]
        
        await centerActions.putLocal({
          ...center,
          managers: updatedManagers,
          updatedAt: now,
        })
      }

      setIsAddDialogOpen(false)
      setUserFormData({ name: '', email: '', password: '', role: 'MANAGER' })
      toast(t('userAddedSuccess'))
      
      // ✅ Refresh data to show new manager
      await fetchAllData()

      // ✅ Commented out API calls
      // const response = await axios.post('/api/admin/users', userFormData)
      // Alternative endpoint: await axios.post('/api/manager/register', { 
      //   email: userFormData.email,
      //   password: userFormData.password,
      //   username: userFormData.name,
      //   id: managerId
      // })
    } catch (err) {
      console.error('Failed to add Manager:', err)
      toast(t('userAddedError'))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEditUser = (user: UserData) => {
    setEditingUser({ ...user })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return

    if (!editingUser.name || !editingUser.email) {
      toast(t('nameEmailRequired'))
      return
    }

    setIsProcessing(true)
    try {
      // ✅ Get existing user from local DB
      const existingUser = await userActions.getLocal(editingUser.id)
      if (!existingUser) {
        toast(t('userNotFound') || 'User not found')
        setIsProcessing(false)
        return
      }

      // ✅ Update user in local DB and mark for sync
      const updatedUser = {
        ...existingUser,
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role as Role,
        ...(editingUser.password && { password: editingUser.password }),
        status: 'w' as const, // Mark as waiting for sync
        updatedAt: Date.now()
      }

      await userActions.putLocal(updatedUser)

      // ✅ Refresh data to show updated user
      await fetchAllData()
      
      setIsEditDialogOpen(false)
      setEditingUser(null)
      toast(t('userUpdatedSuccess'))

      // ✅ Commented out API call
      // const response = await axios.put(`/api/admin/users/${editingUser.id}`, {
      //   name: editingUser.name,
      //   email: editingUser.email,
      //   role: editingUser.role,
      //   ...(editingUser.password && { password: editingUser.password })
      // })
      // setUsers(prev =>
      //   prev.map(u => u.id === editingUser.id ? { ...u, ...response.data } : u)
      // )
    } catch (err) {
      console.error('Failed to update user in local DB:', err)
      toast(t('userUpdatedError'))
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = 
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.email && teacher.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (teacher.phone && teacher.phone.includes(searchTerm))

    return matchesSearch
  })

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.phone && student.phone.includes(searchTerm)) ||
      (student.parentName && student.parentName.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter

    return matchesSearch && matchesGrade
  })

  const totalUsers = users.length
  const totalTeachers = teachers.length
  const totalStudents = students.length
  const admins = users.filter(u => u.role === 'ADMIN').length
  const managers = users.filter(u => u.role === 'MANAGER').length

  const uniqueGrades = Array.from(new Set(students.map(s => s.grade).filter(Boolean)))

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm  hidden font-medium">{t('systemUsers')}</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {admins} {t('admins')}, {managers} {t('managers')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('teachers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeachers}</div>
            <p className="text-xs text-muted-foreground">
              {t('totalTeachingStaff')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('students')}</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {t('enrolledStudents')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalPeople')}</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers + totalTeachers + totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              {t('inTheSystem')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>{t('systemOverview')}</CardTitle>
          <CardDescription>{t('systemOverviewDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
 <TabsList className="grid w-full grid-cols-3">
  <TabsTrigger value="users">
    <Shield className="mr-2 h-4 w-4" />
    <span className="hidden sm:inline">{t('users')} ({totalUsers})</span>
    <span className="sm:hidden text-xs">({totalUsers})</span>
  </TabsTrigger>
  <TabsTrigger value="teachers">
    <Users className="mr-2 h-4 w-4" />
    <span className="hidden sm:inline">{t('teachers')} ({totalTeachers})</span>
    <span className="sm:hidden text-xs">({totalTeachers})</span>
  </TabsTrigger>
  <TabsTrigger value="students">
    <GraduationCap className="mr-2 h-4 w-4" />
    <span className="hidden sm:inline">{t('students')} ({totalStudents})</span>
    <span className="sm:hidden text-xs">({totalStudents})</span>
  </TabsTrigger>
</TabsList>

            {/* USERS TAB */}
            <TabsContent value="users" className="space-y-4">
<div className="flex flex-col sm:flex-row justify-between gap-3 items-center sm:items-center">
  <div className="flex-1 w-full sm:w-auto relative">
    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
    <Input
      placeholder={t('searchUsers')}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="pl-10 w-full"
    />
  </div>

  <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
    <Plus className="mr-2 h-4 w-4" />
    <span className="hidden sm:inline">{t('addManager')}</span>
    <span className="sm:hidden">{t('add')}</span>
  </Button>
</div>

              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">{t('noUsersFound')}</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('name')}</TableHead>
                        <TableHead className="hidden md:table-cell">{t('email')}</TableHead>
                        <TableHead>{t('role')}</TableHead>
                        <TableHead>{t('password')}</TableHead>
                        <TableHead className="hidden sm:table-cell">{t('students')}</TableHead>
                        <TableHead className="hidden sm:table-cell">{t('teachers')}</TableHead>
                        <TableHead className="hidden lg:table-cell">{t('joined')}</TableHead>
                        <TableHead className="text-right">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => {
                        const isPasswordVisible = visiblePasswords[user.id] || false
                        return (
                          <TableRow key={user.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback className={
                                    user.role === 'ADMIN' 
                                      ? 'bg-red-100 text-red-700' 
                                      : 'bg-blue-100 text-blue-700'
                                  }>
                                    {user.name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="font-medium">{user.name}</div>
                              </div>
                            </TableCell>

                            <TableCell className="hidden md:table-cell">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {user.email}
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge variant={'default'}>
                                <Shield className="mr-1 h-3 w-3" />
                                {user.role}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              {user.role === 'MANAGER' && user.password ? (
                                <div className="font-mono flex items-center">
                                  <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility(user.id)}
                                    aria-label={isPasswordVisible ? t('hidePassword') : t('showPassword')}
                                    aria-pressed={isPasswordVisible}
                                    className="mr-2 text-muted-foreground"
                                  >
                                    {isPasswordVisible ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </button>
                                  <span className="select-all">
                                    {isPasswordVisible ? user.password : "•".repeat(user.password.length)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>

                            <TableCell className="hidden sm:table-cell">
                              <Badge variant="outline">{user?.stats?.students} {t('studentsCount')}</Badge>
                            </TableCell>

                            <TableCell className="hidden sm:table-cell">
                              <Badge variant="outline">{user?.stats?.teachers} {t('teachersCount')}</Badge>
                            </TableCell>

                            <TableCell className="hidden lg:table-cell">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(user?.createdAt), 'MMM dd, yyyy')}
                              </div>
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditUser(user)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setItemToDelete({ id: user.id, type: 'user', name: user.name })}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* TEACHERS TAB */}
            <TabsContent value="teachers" className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('searchTeachers')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {filteredTeachers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">{t('noTeachersFound')}</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('teacher')}</TableHead>
                        <TableHead>{t('contact')}</TableHead><TableHead>{t('manager')}</TableHead>
                        <TableHead>{t('subjects')}</TableHead>
                        <TableHead>{t('students')}</TableHead>
                        <TableHead>{t('receipts')}</TableHead>
                        <TableHead>{t('joined')}</TableHead>
                        <TableHead className="text-right">{t('actions')}</TableHead>
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
                              {format(new Date(teacher.createdAt), 'MMM dd, yyyy')}
                            </div>
                          </TableCell>

                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setItemToDelete({ id: teacher.id, type: 'teacher', name: teacher.name })}
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
            </TabsContent>

            {/* STUDENTS TAB */}
            <TabsContent value="students" className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('searchStudents')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t('allGrades')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('allGrades')}</SelectItem>
                    {uniqueGrades.map(grade => (
                      <SelectItem key={grade} value={grade!}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">{t('noStudentsFound')}</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('student')}</TableHead>
                        <TableHead>{t('contact')}</TableHead>
                        <TableHead>{t('parent')}</TableHead>
                        <TableHead>{t('grade')}</TableHead>
                        <TableHead>{t('manager')}</TableHead>
                        <TableHead>{t('subjects')}</TableHead>
                        <TableHead>{t('receipts')}</TableHead>
                        <TableHead>{t('enrolled')}</TableHead>
                        <TableHead className="text-right">{t('actions')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback className="bg-purple-100 text-purple-700">
                                  {student.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="font-medium">{student.name}</div>
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
                                <div className="text-sm font-medium">{student.parentName}</div>
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
                            <Badge variant="outline">{student.manager.name}</Badge>
                          </TableCell>

                          <TableCell>{student.stats.subjects}</TableCell>
                          <TableCell>{student.stats.receipts}</TableCell>

                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(student.createdAt), 'MMM dd, yyyy')}
                            </div>
                          </TableCell>

                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setItemToDelete({ id: student.id, type: 'student', name: student.name })}
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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
                    setEditingUser(prev => ({ ...prev!, name: e.target.value }))
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
                    setEditingUser(prev => ({ ...prev!, email: e.target.value }))
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
                    setEditingUser(prev => ({ ...prev!, password: e.target.value }))
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
    </div>
  )
}