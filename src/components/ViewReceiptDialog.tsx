"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Eye, Loader2, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  receiptActions,
  studentActions,
  teacherActions,
  userActions,
  centerActions
} from "@/lib/dexie/dexieActions"

interface Receipt {
  id: string
  receiptNumber: string
  amount: number
  type: "STUDENT_PAYMENT" | "TEACHER_PAYMENT"
  paymentMethod: string | null
  description: string | null
  date: string
  createdAt: string
  student?: {
    id: string
    name: string
    email: string | null
    phone: string | null
    grade: string | null
  }
  teacher?: {
    id: string
    name: string
    email: string | null
    phone: string | null
  }
  manager: {
    name: string
    email: string
  }
  center?: {
    id: string
    name: string
    address: string | null
    phone: string | null
  }
}

interface ViewReceiptDialogProps {
  receiptId: string
  trigger?: React.ReactNode
}

export default function ViewReceiptDialog({ receiptId, trigger }: ViewReceiptDialogProps) {
  const t = useTranslations("ReceiptDetailPage")
  const [open, setOpen] = useState(false)
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchReceipt = useCallback(async () => {
    setIsLoading(true)
    setError("")
    try {
      const [allReceipts, allStudents, allTeachers, allUsers, allCenters] = await Promise.all([
        receiptActions.getAll(),
        studentActions.getAll(),
        teacherActions.getAll(),
        userActions.getAll(),
        centerActions.getAll()
      ])

      const receiptData = allReceipts.find(r => r.id === receiptId && r.status !== '0')
      if (!receiptData) {
        throw new Error(t("receiptNotFound"))
      }

      const student = receiptData.studentId
        ? allStudents.find(s => s.id === receiptData.studentId && s.status !== '0')
        : null
      const teacher = receiptData.teacherId
        ? allTeachers.find(t => t.id === receiptData.teacherId && t.status !== '0')
        : null
      const manager = allUsers.find(u => u.id === receiptData.managerId && u.status !== '0')
      const center = allCenters.find(c =>
        (c.managers || []).includes(receiptData.managerId) && c.status !== '0'
      )

      setReceipt({
        id: receiptData.id,
        receiptNumber: receiptData.receiptNumber,
        amount: receiptData.amount,
        type: receiptData.type,
        paymentMethod: receiptData.paymentMethod ?? null,
        description: receiptData.description ?? null,
        date: new Date(receiptData.date).toISOString(),
        createdAt: new Date(receiptData.createdAt).toISOString(),
        student: student ? {
          id: student.id,
          name: student.name,
          email: student.email ?? null,
          phone: student.phone ?? null,
          grade: student.grade ?? null,
        } : undefined,
        teacher: teacher ? {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email ?? null,
          phone: teacher.phone ?? null,
        } : undefined,
        manager: manager ? {
          name: manager.name,
          email: manager.email,
        } : { name: 'Unknown', email: '' },
        center: center ? {
          id: center.id,
          name: center.name,
          address: center.address ?? null,
          phone: center.phone ?? null,
        } : undefined
      })
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : t("somethingWentWrong"))
    } finally {
      setIsLoading(false)
    }
  }, [receiptId, t])

  useEffect(() => {
    if (open && receiptId) {
      fetchReceipt()
    }
  }, [open, receiptId, fetchReceipt])

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print()
    }
  }

  const payer = receipt?.student || receipt?.teacher

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" title={t("receiptDetails")}>
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{t("receiptDetails")}</span>
            {receipt && (
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                {t("printReceipt")}
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error || !receipt ? (
          <Alert variant="destructive">
            <AlertDescription>{error || t("receiptNotFound")}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {/* Receipt Header */}
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">{receipt.center?.name || t("yourEducationCenter")}</p>
                {receipt.center?.address && (
                  <p className="text-xs text-muted-foreground">{receipt.center.address}</p>
                )}
              </div>
              <div className="text-right">
                <Badge variant={receipt.type === "STUDENT_PAYMENT" ? "default" : "secondary"}>
                  {receipt.type === "STUDENT_PAYMENT" ? t("studentPayment") : t("teacherPayment")}
                </Badge>
                <p className="text-lg font-bold mt-1">#{receipt.receiptNumber}</p>
              </div>
            </div>

            {/* Payer Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{t("paymentFrom")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="font-semibold">{payer?.name}</p>
                {receipt.student?.grade && (
                  <p className="text-sm text-muted-foreground">{t("grade")}: {receipt.student.grade}</p>
                )}
                {payer?.email && <p className="text-sm text-muted-foreground">{payer.email}</p>}
                {payer?.phone && <p className="text-sm text-muted-foreground">{payer.phone}</p>}
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">{t("paymentDetails")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("date")}</span>
                  <span>{new Date(receipt.date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("method")}</span>
                  <span>{receipt.paymentMethod || t("na")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("processedBy")}</span>
                  <span>{receipt.manager.name}</span>
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {receipt.description && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">{t("description")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{receipt.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Amount */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">{t("amountPaid")}</span>
                <span className={`text-3xl font-bold ${
                  receipt.type === "STUDENT_PAYMENT" ? "text-green-600" : "text-orange-600"
                }`}>
                  MAD {receipt.amount.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground text-right mt-1">
                {t("createdOn")} {new Date(receipt.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Footer */}
            <div className="text-center text-muted-foreground text-xs pt-4 border-t">
              <p>{t("thankYou")}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
