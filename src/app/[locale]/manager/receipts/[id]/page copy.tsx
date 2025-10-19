/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

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

export default function ReceiptDetailPage() {
  const t = useTranslations('ReceiptDetailPage')
  const params = useParams()
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchReceipt()
  }, [params.id])

  const fetchReceipt = async () => {
    try {
      const response = await fetch(`/api/receipts/${params.id}`)
      if (!response.ok) throw new Error(t('errorFetchReceipt'))
      const data = await response.json()
      setReceipt(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('somethingWentWrong'))
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrint = () => window.print()

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !receipt) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error || t('receiptNotFound')}</p>
        </div>
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

      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="no-print mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">{t('receiptDetails')}</h1>
          <button
            onClick={handlePrint}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            {t('printReceipt')}
          </button>
        </div>

        {/* Receipt Card */}
        <div className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-8">
          {/* Receipt Header */}
          <div className="border-b-2 border-gray-300 pb-6 mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('paymentReceipt')}</h2>
              <p className="text-gray-600">{center?.name || t('yourEducationCenter')}</p>
              <p className="text-sm text-gray-500">{center?.address || t('defaultAddress')}</p>
              {center?.phone && (
                <p className="text-sm text-gray-500">
                  {t('phone')}: {center.phone}
                </p>
              )}
            </div>
            <div className="text-right">
              <div
                className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold mb-2 ${
                  receipt.type === 'STUDENT_PAYMENT' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-orange-100 text-orange-800'
                }`}
              >
                {receipt.type === 'STUDENT_PAYMENT' ? t('studentPayment') : t('teacherPayment')}
              </div>
              <p className="text-sm text-gray-600">{t('receiptNumber')}</p>
              <p className="text-lg font-bold text-gray-900">{receipt.receiptNumber}</p>
            </div>
          </div>

          {/* Payer and Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Payer */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3">{t('paymentFrom')}</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="font-semibold text-gray-900 text-lg">{payer?.name}</p>
                {receipt.student?.grade && (
                  <p className="text-sm text-gray-600">
                    {t('grade')}: {receipt.student.grade}
                  </p>
                )}
                {payer?.email && <p className="text-sm text-gray-600">{payer.email}</p>}
                {payer?.phone && (
                  <p className="text-sm text-gray-600">
                    {t('phone')}: {payer.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Payment Details */}
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-3">{t('paymentDetails')}</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t('date')}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(receipt.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t('method')}</span>
                  <span className="text-sm font-medium text-gray-900">
                    {receipt.paymentMethod || t('na')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t('processedBy')}</span>
                  <span className="text-sm font-medium text-gray-900">{receipt.manager.name}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {receipt.description && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-600 mb-2">{t('description')}</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-900">{receipt.description}</p>
              </div>
            </div>
          )}

          {/* Amount */}
          <div className="border-t-2 border-gray-300 pt-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-semibold text-gray-700">{t('amountPaid')}</span>
              <span 
                className={`text-4xl font-bold ${
                  receipt.type === 'STUDENT_PAYMENT' ? 'text-green-600' : 'text-orange-600'
                }`}
              >
                ${receipt.amount.toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-gray-500 text-right">
              {t('createdOn')}{' '}
              {new Date(receipt.createdAt).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-gray-600 text-sm">
            <p>{t('thankYou')}</p>
            <p className="mt-2 text-xs text-gray-500">
              {t('computerGenerated')}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {t('forQueries')}{' '}
              <a href={`mailto:${receipt.manager.email}`} className="underline hover:text-blue-600">
                {receipt.manager.email}
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}