import { useState, useCallback, useEffect } from 'react'
import { 
  userActions, 
  teacherActions, 
  studentActions, 
  centerActions,
  teacherSubjectActions,
  studentSubjectActions,
  receiptActions 
} from '@/lib/dexie/dexieActions'
import { Role } from '@/lib/dexie/dbSchema'
import { useAuth } from '@/context/authContext'
import { UserData, TeacherData, StudentData } from './types'

export function useAllUsers(unknownManagerText: string = 'Unknown Manager') {
  const { user } = useAuth()
  
  const [users, setUsers] = useState<UserData[]>([])
  const [teachers, setTeachers] = useState<TeacherData[]>([])
  const [students, setStudents] = useState<StudentData[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAllData = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [allUsers, allTeachers, allStudents, allCenters, allTeacherSubjects, allStudentSubjects, allReceipts] = await Promise.all([
        userActions.getAll(),
        teacherActions.getAll(),
        studentActions.getAll(),
        centerActions.getAll(),
        teacherSubjectActions.getAll(),
        studentSubjectActions.getAll(),
        receiptActions.getAll()
      ])

      const activeUsers = allUsers.filter(u => u.status !== '0')
      const activeTeachers = allTeachers.filter(t => t.status !== '0')
      const activeStudents = allStudents.filter(s => s.status !== '0')
      const activeCenters = allCenters.filter(c => c.status !== '0')
      const activeTeacherSubjects = allTeacherSubjects.filter(ts => ts.status !== '0')
      const activeStudentSubjects = allStudentSubjects.filter(ss => ss.status !== '0')
      const activeReceipts = allReceipts.filter(r => r.status !== '0')

      const usersData: UserData[] = activeUsers.map(userItem => {
        const centers = userItem.role === Role.ADMIN 
          ? activeCenters.filter(c => c.adminId === userItem.id).length
          : 0
        
        const studentsCount = userItem.role === Role.MANAGER
          ? activeStudents.filter(s => s.managerId === userItem.id).length
          : 0
        
        const teachersCount = userItem.role === Role.MANAGER
          ? activeTeachers.filter(t => t.managerId === userItem.id).length
          : 0

        return {
          id: userItem.id,
          name: userItem.name,
          email: userItem.email,
          role: userItem.role as 'ADMIN' | 'MANAGER',
          password: userItem.password,
          createdAt: new Date(userItem.createdAt).toISOString(),
          isActive: userItem.status === '1',
          stats: {
            centers,
            students: studentsCount,
            teachers: teachersCount
          }
        }
      })

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
            name: unknownManagerText
          },
          stats: {
            subjects: teacherSubs.length,
            students: studentSubs.length,
            receipts: teacherReceipts.length
          }
        }
      })

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
            name: unknownManagerText
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
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('Failed to load data from local database')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  return {
    users,
    teachers,
    students,
    isLoading,
    error,
    refreshData: fetchAllData
  }
}
