'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Loader2, 
  Search, 
  Plus, 
  Eye, 
  Printer,
  Download,
  MoreVertical,
  DollarSign,
  Calendar,
  User,
  TrendingUp,
  Receipt as ReceiptIcon
} from 'lucide-react'
import { format } from 'date-fns'
import { useTranslations } from 'next-intl'

interface Receipt {
  id: string
  receiptNumber: string
  amount: number
  paymentMethod: string | null
  description: string | null
  date: string
  createdAt: string
  student: {
    id: string
    name: string
    grade: string | null
    email: string | null
  }
}

interface Student {
  id: string
  name: string
  grade: string | null
}

export default function StudentReceiptTable() {
  const t = useTranslations("StudentReceiptTable")
  const router = useRouter()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [studentFilter, setStudentFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all') // all, today, week, month

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [receiptsRes, studentsRes] = await Promise.all([
        axios.get('/api/receipts/student-receipts'),
        axios.get('/api/students')
      ])
      
      setReceipts(receiptsRes.data)
      setStudents(studentsRes.data)
    } catch (err) {
      console.error('Failed to fetch data:', err)
      setError(t("errorLoadReceipts"))
    } finally {
      setIsLoading(false)
    }
  }

  // Filter receipts
  const filteredReceipts = receipts.filter(receipt => {
    // Search filter
    const matchesSearch = 
      receipt.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Student filter
    const matchesStudent = studentFilter === 'all' || receipt.student.id === studentFilter
    
    // Payment method filter
    const matchesMethod = methodFilter === 'all' || receipt.paymentMethod === methodFilter
    
    // Date filter
    let matchesDate = true
    if (dateFilter !== 'all') {
      const receiptDate = new Date(receipt.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      switch (dateFilter) {
        case 'today':
          matchesDate = receiptDate >= today
          break
        case 'week':
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          matchesDate = receiptDate >= weekAgo
          break
        case 'month':
          const monthAgo = new Date(today)
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          matchesDate = receiptDate >= monthAgo
          break
      }
    }

    return matchesSearch && matchesStudent && matchesMethod && matchesDate
  })

  // Calculate statistics
  const totalAmount = filteredReceipts.reduce((sum, r) => sum + r.amount, 0)
  const avgAmount = filteredReceipts.length > 0 ? totalAmount / filteredReceipts.length : 0
  
  // Get this month's receipts
  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)
  const thisMonthReceipts = receipts.filter(r => new Date(r.date) >= thisMonth)
  const thisMonthAmount = thisMonthReceipts.reduce((sum, r) => sum + r.amount, 0)

  // Get unique payment methods
  const paymentMethods = ['all', ...new Set(receipts.map(r => r.paymentMethod).filter(Boolean) as string[])]

  const handlePrint = (receiptId: string) => {
    router.push(`/receipts/${receiptId}`)
  }

  const handleExportCSV = () => {
    const csvContent = [
      [t("receiptNumber"), t('student'), t('grade'), t('amount'), t('method'), t('date'), t('description')],
      ...filteredReceipts.map(r => [
        r.receiptNumber,
        r.student.name,
        r.student.grade || 'N/A',
        r.amount.toFixed(2),
        r.paymentMethod || 'N/A',
        format(new Date(r.date), 'yyyy-MM-dd'),
        r.description || ''
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${t("studentReceipts")}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

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
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            {t("exportCSV")}
          </Button>
          <Button asChild>
            <Link href="/receipts/create">
              <Plus className="mr-2 h-4 w-4" />
              {t("newPayment")}
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalReceipts")}</CardTitle>
            <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredReceipts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {receipts.length} {t("total")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalAmount")}</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("fromFiltered")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("thisMonth")}</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${thisMonthAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {thisMonthReceipts.length} {t("receipts")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("averagePayment")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              ${avgAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("perReceipt")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
<Card>
  <CardHeader>
    <CardTitle>{t("filters")}</CardTitle>
    <CardDescription>{t("refineSearch")}</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("searchReceipts")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Student Filter */}
      <Select value={studentFilter} onValueChange={setStudentFilter}>
        <SelectTrigger>
          <SelectValue placeholder={t("allStudents")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allStudents")}</SelectItem>
          {students.map((student) => (
            <SelectItem key={student.id} value={student.id}>
              {student.name} {student.grade ? `(${student.grade})` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Payment Method Filter */}
      <Select value={methodFilter} onValueChange={setMethodFilter}>
        <SelectTrigger>
          <SelectValue placeholder={t("allMethods")} />
        </SelectTrigger>
        <SelectContent>
          {paymentMethods.map((method) => (
            <SelectItem key={method} value={method}>
              {method === "all" ? t("allMethods") : method}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date Filter */}
      <Select value={dateFilter} onValueChange={setDateFilter}>
        <SelectTrigger>
          <SelectValue placeholder={t("allTime")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allTime")}</SelectItem>
          <SelectItem value="today">{t("today")}</SelectItem>
          <SelectItem value="week">{t("last7Days")}</SelectItem>
          <SelectItem value="month">{t("last30Days")}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Active Filters Summary */}
    {(searchTerm ||
      studentFilter !== "all" ||
      methodFilter !== "all" ||
      dateFilter !== "all") && (
      <div className="flex gap-2 mt-4 flex-wrap">
        <Badge variant="secondary" className="text-xs">
          {t("showing")} {filteredReceipts.length} {t("of")} {receipts.length}{" "}
          {t("receipts")}
        </Badge>

        {searchTerm && (
          <Badge variant="outline" className="text-xs">
            {t("search")}: {searchTerm}
          </Badge>
        )}
        {studentFilter !== "all" && (
          <Badge variant="outline" className="text-xs">
            {t("student")}: {students.find((s) => s.id === studentFilter)?.name}
          </Badge>
        )}
        {methodFilter !== "all" && (
          <Badge variant="outline" className="text-xs">
            {t("method")}: {methodFilter}
          </Badge>
        )}
        {dateFilter !== "all" && (
          <Badge variant="outline" className="text-xs">
            {t("period")}: {dateFilter}
          </Badge>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearchTerm("")
            setStudentFilter("all")
            setMethodFilter("all")
            setDateFilter("all")
          }}
          className="h-6 text-xs"
        >
          {t("clearAll")}
        </Button>
      </div>
    )}
  </CardContent>
</Card>


      {/* Table */}
<Card>
  <CardHeader>
    <CardTitle>{t("paymentRecords")}</CardTitle>
    <CardDescription>{t("completeList")}</CardDescription>
  </CardHeader>
  <CardContent>
    {filteredReceipts.length === 0 ? (
      <div className="text-center py-12">
        <ReceiptIcon className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-muted-foreground">
          {searchTerm || studentFilter !== "all" || methodFilter !== "all" || dateFilter !== "all"
            ? t("noReceiptsFilters")
            : t("noReceiptsYet")}
        </p>
        {!searchTerm && studentFilter === "all" && methodFilter === "all" && dateFilter === "all" && (
          <Button asChild className="mt-4">
            <Link href="/receipts/create">
              <Plus className="mr-2 h-4 w-4" />
              {t("createFirstReceipt")}
            </Link>
          </Button>
        )}
      </div>
    ) : (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("receiptNumber")}</TableHead>
              <TableHead>{t("student")}</TableHead>
              <TableHead>{t("grade")}</TableHead>
              <TableHead>{t("amount")}</TableHead>
              <TableHead>{t("method")}</TableHead>
              <TableHead>{t("date")}</TableHead>
              <TableHead>{t("description")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReceipts.map((receipt) => (
              <TableRow key={receipt.id} className="hover:bg-muted/50">
                <TableCell>
                  <div className="font-mono text-sm font-medium">
                    {receipt.receiptNumber}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(receipt.createdAt), "MMM dd, yyyy HH:mm")}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{receipt.student.name}</div>
                      {receipt.student.email && (
                        <div className="text-xs text-muted-foreground">
                          {receipt.student.email}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  {receipt.student.grade ? (
                    <Badge variant="outline">{receipt.student.grade}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>

                <TableCell>
                  <div className="font-semibold text-green-600">
                    ${receipt.amount.toFixed(2)}
                  </div>
                </TableCell>

                <TableCell>
                  {receipt.paymentMethod ? (
                    <Badge variant="secondary" className="text-xs">
                      {receipt.paymentMethod}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    {format(new Date(receipt.date), "MMM dd, yyyy")}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {receipt.description || "-"}
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/receipts/${receipt.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          {t("viewDetails")}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePrint(receipt.id)}>
                        <Printer className="mr-2 h-4 w-4" />
                        {t("printReceipt")}
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/students/${receipt.student.id}`}>
                          <User className="mr-2 h-4 w-4" />
                          {t("viewStudent")}
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )}
  </CardContent>
</Card>


      {/* Summary Footer */}
      {filteredReceipts.length > 0 && (
<Card>
  <CardContent className="pt-6">
    <div className="flex justify-between items-center">
      <div className="text-sm text-muted-foreground">
        {t("showing")}{" "}
        <span className="font-medium text-foreground">{filteredReceipts.length}</span>{" "}
        {t("receipts")}
      </div>
      <div className="text-right">
        <div className="text-sm text-muted-foreground">
          {t("totalAmountLabel")}
        </div>
        <div className="text-2xl font-bold text-green-600">
          {t("MAD")}{totalAmount.toFixed(2)}
        </div>
      </div>
    </div>
  </CardContent>
</Card>

      )}
    </div>
  )
}