/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import axios from 'axios'
import { Eye, Loader2, Pencil } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

interface TeacherSubject {
  id: string
  percentage: number | null
  hourlyRate: number | null
  subject: {
    id: string
    name: string
    grade: string
    price: number
  }
}

interface Teacher {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  weeklySchedule: any
  createdAt: string
  teacherSubjects: TeacherSubject[]
}

export default function TeachersTable() {
  const t = useTranslations('TeachersTable')
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchTeachers()
  }, [])

  const fetchTeachers = async () => {
    try {
      const response = await axios.get('/api/teachers')
      setTeachers(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'))
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.phone?.includes(searchTerm)
  )

  const getAvailableDays = (schedule: any) => {
    if (!schedule || !Array.isArray(schedule)) return t('notSet')
    return schedule.map((s: any) => s.day).join(', ') || t('notSet')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button asChild>
          <Link href="/manager/teachers/create">{t('addTeacher')}</Link>
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="text-destructive pt-4">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t('totalTeachers')}</p>
            <p className="text-3xl font-bold">{teachers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t('activeTeachers')}</p>
            <p className="text-3xl font-bold text-green-600">
              {teachers.filter(t => t.teacherSubjects.length > 0).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">{t('subjectsCovered')}</p>
            <p className="text-3xl font-bold text-blue-600">
              {new Set(teachers.flatMap(t => t.teacherSubjects.map(ts => ts.subject.id))).size}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table Section */}
      <Card>
        <CardHeader className="flex justify-between gap-4 mb-2">
          <div className="w-1/3">
            <CardTitle>{t('teachersList')}</CardTitle>
            <CardDescription>
              {filteredTeachers.length > 0
                ? t('showing', {
                    count: filteredTeachers.length,
                    total: teachers.length,
                  })
                : t('noTeachersFound')}
            </CardDescription>
          </div>

          {/* Search Input */}
          <Input
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardHeader>

        <CardContent>
          {filteredTeachers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {t('noTeachersFound')}{' '}
              <Link href="/manager/teachers/create" className="text-primary underline">
                {t('addYourFirstTeacher')}
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('teacher')}</TableHead>
                  <TableHead>{t('contact')}</TableHead>
                  <TableHead>{t('subjects')}</TableHead>
                  <TableHead>{t('schedule')}</TableHead>
                  <TableHead>{t('joined')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                          {teacher.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{teacher.name}</p>
                          {teacher.address && (
                            <p className="text-sm text-muted-foreground">{teacher.address}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p>{teacher.email || '-'}</p>
                      <p className="text-sm text-muted-foreground">{teacher.phone || '-'}</p>
                    </TableCell>
                    <TableCell>
                      {teacher.teacherSubjects.length === 0 ? (
                        <span className="text-sm text-muted-foreground italic">
                          {t('noSubjectsAssigned')}
                        </span>
                      ) : (
                        <div className="space-y-1">
                          {teacher.teacherSubjects.slice(0, 2).map(ts => (
                            <div key={ts.id} className="flex items-center gap-2">
                              <span className="inline-flex px-2 py-1 rounded-md bg-primary/10 text-xs text-primary">
                                {ts.subject.name} ({ts.subject.grade})
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {ts.percentage ? `${ts.percentage}%` : `$${ts.hourlyRate}/hr`}
                              </span>
                            </div>
                          ))}
                          {teacher.teacherSubjects.length > 2 && (
                            <p className="text-xs text-muted-foreground">
                              {t('moreSubjects', {
                                count: teacher.teacherSubjects.length - 2,
                              })}
                            </p>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getAvailableDays(teacher.weeklySchedule)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(teacher.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/manager/teachers/${teacher.id}`}>
                          <Button variant="ghost" size="icon" title="View">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/manager/teachers/${teacher.id}/edit`}>
                          <Button variant="ghost" size="icon" title="Edit">
                            <Pencil className="w-4 h-4 text-green-600" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
