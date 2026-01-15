import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Mail, Phone, Trash2, Calendar, Search, GraduationCap } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { StudentData } from './types'
import { useState } from 'react'

interface StudentsTabProps {
  students: StudentData[]
  onDelete: (student: StudentData) => void
}

export function StudentsTab({ students, onDelete }: StudentsTabProps) {
  const t = useTranslations('AllUsersTable')
  const [searchTerm, setSearchTerm] = useState('')
  const [gradeFilter, setGradeFilter] = useState<string>('all')

  const uniqueGrades = Array.from(new Set(students.map(s => s.grade).filter(Boolean)))

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesGrade = gradeFilter === 'all' || student.grade === gradeFilter

    return matchesSearch && matchesGrade
  })

  return (
    <div className="space-y-4">
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
                <TableHead className="text-center">{t('student')}</TableHead>
                <TableHead className="text-center">{t('contact')}</TableHead>
                <TableHead className="text-center">{t('parent')}</TableHead>
                <TableHead className="text-center">{t('grade')}</TableHead>
                <TableHead className="text-center">{t('manager')}</TableHead>
                <TableHead className="text-center">{t('subjects')}</TableHead>
                <TableHead className="text-center">{t('receipts')}</TableHead>
                <TableHead className="text-center">{t('enrolled')}</TableHead>
                <TableHead className="text-center">{t('actions')}</TableHead>
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
                      onClick={() => onDelete(student)}
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
    </div>
  )
}
