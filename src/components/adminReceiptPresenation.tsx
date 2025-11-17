'use client'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
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
import { receiptActions, studentActions, teacherActions, userActions } from '@/lib/dexie/dexieActions'
import {
  Coins,
  Loader2,
  Receipt as ReceiptIcon,
  Search,
  TrendingDown,
  TrendingUp
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

interface Receipt {
  manager?: {
    id: string
    name: string
  }
  id: string
  receiptNumber: string
  amount: number
  type: 'STUDENT_PAYMENT' | 'TEACHER_PAYMENT'
  paymentMethod: string | null
  description: string | null
  date: string
  createdAt: string
  student?: {
    id: string
    name: string
    grade: string | null
  }
  teacher?: {
    id: string
    name: string
  }
}

export default function AdminReceiptsTable() {
  const t = useTranslations('AdminReceiptsTable')
  
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')

  const fetchReceipts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')

      // ✅ Fetch from local DB (all entities in parallel)
      const [allReceipts, allStudents, allTeachers, allUsers] = await Promise.all([
        receiptActions.getAll(),
        studentActions.getAll(),
        teacherActions.getAll(),
        userActions.getAll()
      ])

      // ✅ Filter receipts by status (exclude deleted)
      const activeReceipts = allReceipts.filter(r => r.status !== '0')

      // ✅ Build receipts with related data (admin view - show all receipts)
      const receiptsWithData: Receipt[] = activeReceipts.map(receipt => {
        const student = receipt.studentId 
          ? allStudents.find(s => s.id === receipt.studentId && s.status !== '0')
          : null
        const teacher = receipt.teacherId
          ? allTeachers.find(t => t.id === receipt.teacherId && t.status !== '0')
          : null
        const manager = allUsers.find(u => u.id === receipt.managerId && u.status !== '0')

        return {
          id: receipt.id,
          receiptNumber: receipt.receiptNumber,
          amount: receipt.amount,
          type: receipt.type,
          paymentMethod: receipt.paymentMethod ?? null,
          description: receipt.description ?? null,
          date: new Date(receipt.date).toISOString(),
          createdAt: new Date(receipt.createdAt).toISOString(),
          manager: manager ? {
            id: manager.id,
            name: manager.name,
          } : undefined,
          student: student ? {
            id: student.id,
            name: student.name,
            grade: student.grade ?? null,
          } : undefined,
          teacher: teacher ? {
            id: teacher.id,
            name: teacher.name,
          } : undefined,
        }
      })
      // const { data } = await axios.get('/api/receipts')

      setReceipts(receiptsWithData)
    } catch (err) {
      console.error('Error fetching receipts from local DB:', err)
      setError(t('errorFetchReceipts'))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    fetchReceipts()
  }, [fetchReceipts])

  const filteredReceipts = receipts.filter(receipt => {
    const matchesSearch = 
      receipt.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.teacher?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || receipt.type === typeFilter
    const matchesMethod = methodFilter === 'all' || receipt.paymentMethod === methodFilter

    return matchesSearch && matchesType && matchesMethod
  })

  // Calculate stats
  const studentPayments = receipts.filter(r => r.type === 'STUDENT_PAYMENT')
  const teacherPayments = receipts.filter(r => r.type === 'TEACHER_PAYMENT')
  const totalIncome = studentPayments.reduce((sum, r) => sum + r.amount, 0)
  const totalExpense = teacherPayments.reduce((sum, r) => sum + r.amount, 0)
  const netAmount = totalIncome - totalExpense

  const paymentMethods = ['all', ...new Set(receipts.map(r => r.paymentMethod).filter(Boolean) as string[])]

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalReceipts')}</CardTitle>
            <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receipts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalIncome')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalIncome.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {studentPayments.length} {t('receipts')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalExpenses')}</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${totalExpense.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {teacherPayments.length} {t('receipts')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('netAmount')}</CardTitle>
            <Coins className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netAmount >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ${netAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {netAmount >= 0 ? t('profit') : t('loss')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('allTypes')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allTypes')}</SelectItem>
                <SelectItem value="STUDENT_PAYMENT">{t('studentPayments')}</SelectItem>
                <SelectItem value="TEACHER_PAYMENT">{t('teacherPayments')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('allMethods')} />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map(method => (
                  <SelectItem key={method} value={method}>
                    {method === 'all' ? t('allMethods') : method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('allReceipts')}</CardTitle>
          <CardDescription>
            {t('showing')} {filteredReceipts.length} {t('of')} {receipts.length} {t('receipts')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReceipts.length === 0 ? (
            <div className="text-center py-12">
              <ReceiptIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                {searchTerm || typeFilter !== 'all' || methodFilter !== 'all' 
                  ? t('noReceiptsFound')
                  : t('noReceiptsYet')}
              </p>
              {!searchTerm && typeFilter === 'all' && methodFilter === 'all' && (
                <Button asChild className="mt-4">
                  <Link href="/receipts/create">
                    {t('createFirstReceipt')}
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('manager')}</TableHead>
                  <TableHead>{t('receiptNumber')}</TableHead>
                  <TableHead>{t('type')}</TableHead>
                  <TableHead>{t('for')}</TableHead>
                  <TableHead>{t('amount')}</TableHead>
                  <TableHead>{t('method')}</TableHead>
                  <TableHead>{t('date')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell>
                      <div className="font-medium">{receipt.manager?.name || '-'}</div>
                      {receipt.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {receipt.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{receipt.receiptNumber}</div>
                      {receipt.description && (
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {receipt.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={receipt.type === 'STUDENT_PAYMENT' ? 'default' : 'secondary'}>
                        {receipt.type === 'STUDENT_PAYMENT' ? t('income') : t('expense')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {receipt.student?.name || receipt.teacher?.name || '-'}
                      </div>
                      {receipt.student?.grade && (
                        <div className="text-xs text-muted-foreground">
                          {receipt.student.grade}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className={`font-semibold ${
                        receipt.type === 'STUDENT_PAYMENT' ? 'text-green-600' : 'text-orange-600'
                      }`}>
                        ${receipt.amount.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {receipt.paymentMethod ? (
                        <Badge variant="outline">{receipt.paymentMethod}</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(receipt.date).toLocaleDateString()}
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