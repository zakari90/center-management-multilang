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
import axios from 'axios'
import {
  Coins,
  Loader2,
  Receipt as ReceiptIcon,
  Search,
  TrendingDown,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface Receipt {
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
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')

  useEffect(() => {
    fetchReceipts()
  }, [])

  const fetchReceipts = async () => {
    try {
      const { data } = await axios.get('/api/receipts')
      setReceipts(data)
    } catch (err) {
      setError('Failed to fetch receipts')
    } finally {
      setIsLoading(false)
    }
  }

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
          <h1 className="text-3xl font-bold">Receipts</h1>
          <p className="text-muted-foreground mt-1">Track all payments and transactions</p>
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
            <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
            <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receipts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${totalIncome.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {studentPayments.length} receipts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${totalExpense.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {teacherPayments.length} receipts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Amount</CardTitle>
            <Coins className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netAmount >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ${netAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {netAmount >= 0 ? 'Profit' : 'Loss'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by receipt number, person, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="STUDENT_PAYMENT">Student Payments</SelectItem>
                <SelectItem value="TEACHER_PAYMENT">Teacher Payments</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map(method => (
                  <SelectItem key={method} value={method}>
                    {method === 'all' ? 'All Methods' : method}
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
          <CardTitle>All Receipts</CardTitle>
          <CardDescription>
            Showing {filteredReceipts.length} of {receipts.length} receipts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReceipts.length === 0 ? (
            <div className="text-center py-12">
              <ReceiptIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                {searchTerm || typeFilter !== 'all' || methodFilter !== 'all' 
                  ? 'No receipts found matching your criteria' 
                  : 'No receipts yet'}
              </p>
              {!searchTerm && typeFilter === 'all' && methodFilter === 'all' && (
                <Button asChild className="mt-4">
                  <Link href="/receipts/create">
                    Create Your First Receipt
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Manager</TableHead>
                  <TableHead>Receipt #</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>For</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
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
                        {receipt.type === 'STUDENT_PAYMENT' ? 'Income' : 'Expense'}
                      </Badge>
                    </TableCell>
                    <TableCell
                    >
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