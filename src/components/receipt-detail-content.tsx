"use client"

import { useTranslations } from "next-intl"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Printer } from "lucide-react"

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

interface ReceiptDetailContentProps {
  receiptId: string
  isModal?: boolean
}

export function ReceiptDetailContent({ receiptId, isModal = false }: ReceiptDetailContentProps) {
  const t = useTranslations("ReceiptDetailPage")
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchReceipt()
  }, [receiptId])

  const fetchReceipt = async () => {
    try {
      const response = await fetch(`/api/receipts/${receiptId}`)
      if (!response.ok) throw new Error(t("errorFetchReceipt"))
      const data = await response.json()
      setReceipt(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("somethingWentWrong"))
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print()
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !receipt) {
    return (
      <div className={isModal ? "p-4" : "max-w-4xl mx-auto p-6"}>
        <Alert variant="destructive">
          <AlertDescription>{error || t("receiptNotFound")}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const payer = receipt.student || receipt.teacher
  const center = receipt.center

  return (
    <>
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>

      <div className={isModal ? "p-2" : "max-w-4xl mx-auto p-6"}>
        {/* Header */}
        <div className="no-print mb-6 flex justify-between items-center">
          <h1 className={isModal ? "text-2xl font-bold" : "text-3xl font-bold"}>{t("receiptDetails")}</h1>
          <Button onClick={handlePrint} className="gap-2" size={isModal ? "sm" : "default"}>
            <Printer className="w-5 h-5" />
            {t("printReceipt")}
          </Button>
        </div>

        {/* Receipt Card */}
        <Card className="border-2">
          <CardHeader className="border-b pb-6">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className={isModal ? "text-2xl mb-2" : "text-3xl mb-2"}>{t("paymentReceipt")}</CardTitle>
                <CardDescription className="text-base">{center?.name || t("yourEducationCenter")}</CardDescription>
                <p className="text-sm text-muted-foreground">{center?.address || t("defaultAddress")}</p>
                {center?.phone && (
                  <p className="text-sm text-muted-foreground">
                    {t("phone")}: {center.phone}
                  </p>
                )}
              </div>
              <div className="text-right">
                <Badge variant={receipt.type === "STUDENT_PAYMENT" ? "default" : "secondary"} className="mb-2">
                  {receipt.type === "STUDENT_PAYMENT" ? t("studentPayment") : t("teacherPayment")}
                </Badge>
                <p className="text-sm text-muted-foreground">{t("receiptNumber")}</p>
                <p className="text-lg font-bold">{receipt.receiptNumber}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {/* Payer and Payment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Payer */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">{t("paymentFrom")}</h3>
                <Card className="bg-muted">
                  <CardContent className="pt-6 space-y-2">
                    <p className="font-semibold text-lg">{payer?.name}</p>
                    {receipt.student?.grade && (
                      <p className="text-sm text-muted-foreground">
                        {t("grade")}: {receipt.student.grade}
                      </p>
                    )}
                    {payer?.email && <p className="text-sm text-muted-foreground">{payer.email}</p>}
                    {payer?.phone && (
                      <p className="text-sm text-muted-foreground">
                        {t("phone")}: {payer.phone}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Payment Details */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">{t("paymentDetails")}</h3>
                <Card className="bg-muted">
                  <CardContent className="pt-6 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t("date")}</span>
                      <span className="text-sm font-medium">
                        {new Date(receipt.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t("method")}</span>
                      <span className="text-sm font-medium">{receipt.paymentMethod || t("na")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">{t("processedBy")}</span>
                      <span className="text-sm font-medium">{receipt.manager.name}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Description */}
            {receipt.description && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">{t("description")}</h3>
                <Card className="bg-muted">
                  <CardContent className="pt-6">
                    <p>{receipt.description}</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Amount */}
            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-semibold">{t("amountPaid")}</span>
                <span
                  className={`text-4xl font-bold ${
                    receipt.type === "STUDENT_PAYMENT" ? "text-green-600" : "text-orange-600"
                  }`}
                >
                  ${receipt.amount.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground text-right">
                {t("createdOn")}{" "}
                {new Date(receipt.createdAt).toLocaleString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t text-center text-muted-foreground text-sm">
              <p>{t("thankYou")}</p>
              <p className="mt-2 text-xs text-muted-foreground">{t("computerGenerated")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("forQueries")}{" "}
                <a href={`mailto:${receipt.manager.email}`} className="underline hover:text-primary">
                  {receipt.manager.email}
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

