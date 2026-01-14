import { User } from '@/lib/dexie/dbSchema'
import { TeacherData, StudentData } from '@/components/admin/users/types'

export interface OrphanedRecord {
  id: string
  name: string
  email: string | null
  currentManagerId: string
  type: 'teacher' | 'student'
  grade?: string | null
}

/**
 * Find teachers whose managerId doesn't match any existing user
 */
export function findOrphanedTeachers(
  teachers: TeacherData[],
  users: User[]
): OrphanedRecord[] {
  const validUserIds = new Set(users.map(u => u.id))
  
  return teachers
    .filter(teacher => !validUserIds.has(teacher.manager.id))
    .map(teacher => ({
      id: teacher.id,
      name: teacher.name,
      email: teacher.email,
      currentManagerId: teacher.manager.id,
      type: 'teacher' as const
    }))
}

/**
 * Find students whose managerId doesn't match any existing user
 */
export function findOrphanedStudents(
  students: StudentData[],
  users: User[]
): OrphanedRecord[] {
  const validUserIds = new Set(users.map(u => u.id))
  
  return students
    .filter(student => !validUserIds.has(student.manager.id))
    .map(student => ({
      id: student.id,
      name: student.name,
      email: student.email,
      currentManagerId: student.manager.id,
      type: 'student' as const,
      grade: student.grade
    }))
}

/**
 * Get total count of orphaned records
 */
export function getOrphanedRecordsCount(
  teachers: TeacherData[],
  students: StudentData[],
  users: User[]
): { teachers: number; students: number; total: number } {
  const orphanedTeachers = findOrphanedTeachers(teachers, users)
  const orphanedStudents = findOrphanedStudents(students, users)
  
  return {
    teachers: orphanedTeachers.length,
    students: orphanedStudents.length,
    total: orphanedTeachers.length + orphanedStudents.length
  }
}
