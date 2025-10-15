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
import axios from 'axios'
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
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

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
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('users')
  
  // Users state
  const [users, setUsers] = useState<UserData[]>([])
  const [teachers, setTeachers] = useState<TeacherData[]>([])
  const [students, setStudents] = useState<StudentData[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [gradeFilter, setGradeFilter] = useState<string>('all')

  // Delete state
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'user' | 'teacher' | 'student'; name: string } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Add/Edit User state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [userFormData, setUserFormData] = useState<UserFormData>({
    name: '',
    email: '',
    password: '',
    role: 'MANAGER'
  })

  // Password visibility state
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setIsLoading(true)
    try {
      const [usersRes, teachersRes, studentsRes] = await Promise.all([
        axios.get('/api/admin/users'),
        axios.get('/api/admin/teachers'),
        axios.get('/api/admin/students')
      ])
      
      setUsers(usersRes.data)
      setTeachers(teachersRes.data)
      setStudents(studentsRes.data)
    } catch (err) {
      console.error('Failed to fetch data:', err)
      setError('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle password visibility
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
      const endpoint = itemToDelete.type === 'user' 
        ? `/api/admin/users/${itemToDelete.id}`
        : itemToDelete.type === 'teacher'
        ? `/api/admin/teachers/${itemToDelete.id}`
        : `/api/admin/students/${itemToDelete.id}`
      
      await axios.delete(endpoint)
      
      if (itemToDelete.type === 'user') {
        setUsers(prev => prev.filter(u => u.id !== itemToDelete.id))
      } else if (itemToDelete.type === 'teacher') {
        setTeachers(prev => prev.filter(t => t.id !== itemToDelete.id))
      } else {
        setStudents(prev => prev.filter(s => s.id !== itemToDelete.id))
      }
      
      toast.success(`${itemToDelete.type} deleted successfully`)
      setItemToDelete(null)
    } catch (err) {
      console.error('Failed to delete:', err)
      toast.error(`Failed to delete ${itemToDelete.type}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Add Manager Handler
const handleAddUser = async () => {
  if (!userFormData.name.trim() || !userFormData.email.trim() || !userFormData.password.trim()) {
    toast.error('Please fill in all fields')
    return
  }

  setIsProcessing(true)
  try {
    console.log("Sending userFormData:", userFormData)
    const response = await axios.post('/api/admin/users', userFormData)
    setUsers(prev => [...prev, response.data])
    setIsAddDialogOpen(false)
    setUserFormData({ name: '', email: '', password: '', role: 'MANAGER' })
    toast('User added successfully')
  } catch (err: any) {
    setIsAddDialogOpen(false)

    console.error('Failed to add Manager:', err)
    const msg = err.response?.data?.error || 'Failed to add Manager'
    toast(msg)
  } finally {
    setIsProcessing(false)
  }
}


  // Edit User Handlers
  const handleEditUser = (user: UserData) => {
    setEditingUser({ ...user })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingUser) return

    if (!editingUser.name || !editingUser.email) {
      toast.error('Name and email are required')
      return
    }

    setIsProcessing(true)
    try {
      const response = await axios.put(`/api/admin/users/${editingUser.id}`, {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        ...(editingUser.password && { password: editingUser.password })
      })

      setUsers(prev =>
        prev.map(u => u.id === editingUser.id ? { ...u, ...response.data } : u)
      )
      
      setIsEditDialogOpen(false)
      setEditingUser(null)
      toast.success('User updated successfully')
    } catch (err: any) {
      console.error('Failed to update user:', err)
      toast("Failed to update user")
    } finally {
      setIsProcessing(false)
    }
  }

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter

    return matchesSearch && matchesRole
  })

  // Filter teachers
  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = 
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (teacher.email && teacher.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (teacher.phone && teacher.phone.includes(searchTerm))

    return matchesSearch
  })

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (student.phone && student.phone.includes(searchTerm)) ||
      (student.parentName && student.parentName.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter

    return matchesSearch && matchesGrade
  })

  // Calculate stats
  const totalUsers = users.length
  const totalTeachers = teachers.length
  const totalStudents = students.length
  const admins = users.filter(u => u.role === 'ADMIN').length
  const managers = users.filter(u => u.role === 'MANAGER').length

  // Get unique grades
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
 <Button
      variant="outline"
      onClick={() =>
        toast("Event has been created", {
          description: "Sunday, December 03, 2023 at 9:00 AM",
          action: {
            label: "Undo",
            onClick: () => console.log("Undo"),
          },
        })
      }
    >
      Show Toast
    </Button>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Users</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {admins} admins, {managers} managers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTeachers}</div>
            <p className="text-xs text-muted-foreground">
              Total teaching staff
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total People</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers + totalTeachers + totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              In the system
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
          <CardDescription>Manage all users, teachers, and students</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">
                <Shield className="mr-2 h-4 w-4" />
                Users ({totalUsers})
              </TabsTrigger>
              <TabsTrigger value="teachers">
                <Users className="mr-2 h-4 w-4" />
                Teachers ({totalTeachers})
              </TabsTrigger>
              <TabsTrigger value="students">
                <GraduationCap className="mr-2 h-4 w-4" />
                Students ({totalStudents})
              </TabsTrigger>
            </TabsList>

            {/* USERS TAB */}
 {/* USERS TAB */}
            <TabsContent value="users" className="space-y-4">
              <div className="flex justify-between gap-3 items-center">

                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>


                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Manager
                </Button>
              </div>

              {/* Users Table */}
              {filteredUsers.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">No users found</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Password</TableHead>
                        <TableHead className="hidden sm:table-cell">Students</TableHead>
                        <TableHead className="hidden sm:table-cell">Teachers</TableHead>
                        <TableHead className="hidden lg:table-cell">Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
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
                                    aria-label={isPasswordVisible ? "Hide password" : "Show password"}
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
                              <Badge variant="outline">{user?.stats?.students} students</Badge>
                            </TableCell>

                            <TableCell className="hidden sm:table-cell">
                              <Badge variant="outline">{user?.stats?.teachers} teachers</Badge>
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
                    placeholder="Search teachers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {filteredTeachers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">No teachers found</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead>Subjects</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Receipts</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
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
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Grades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {uniqueGrades.map(grade => (
                      <SelectItem key={grade} value={grade!}>{grade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-muted-foreground">No students found</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Parent</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Manager</TableHead>
                        <TableHead>Subjects</TableHead>
                        <TableHead>Receipts</TableHead>
                        <TableHead>Enrolled</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
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
            <DialogTitle>Add New Maager</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="add-name">Name</Label>
              <Input
                id="add-name"
                value={userFormData.name}
                onChange={(e) =>
                  setUserFormData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter full name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                value={userFormData.email}
                onChange={(e) =>
                  setUserFormData(prev => ({ ...prev, email: e.target.value }))
                }
                placeholder="Enter email address"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-password">Password</Label>
              <Input
                id="add-password"
                type="text"
                value={userFormData.password}
                onChange={(e) =>
                  setUserFormData(prev => ({ ...prev, password: e.target.value }))
                }
                placeholder="Enter password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Manager
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Make changes to user details. Leave password blank to keep current password.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editingUser.name}
                  onChange={(e) =>
                    setEditingUser(prev => ({ ...prev!, name: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
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
                <Label htmlFor="edit-password">Password (optional)</Label>
                <Input
                  id="edit-password"
                  type="text"
                  value={editingUser.password || ''}
                  onChange={(e) =>
                    setEditingUser(prev => ({ ...prev!, password: e.target.value }))
                  }
                  placeholder="Leave blank to keep current password"
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
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {itemToDelete?.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{itemToDelete?.name}</strong>? 
              This will permanently delete this {itemToDelete?.type} and all associated data. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete {itemToDelete?.type}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}