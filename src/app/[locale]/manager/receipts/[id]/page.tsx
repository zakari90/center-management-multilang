"use client"

import { useParams, useSearchParams } from "next/navigation"
import { ReceiptDetailContent } from "@/components/receipt-detail-content"
import { ModalContentWrapper } from "@/components/modal-content-wrapper"

export default function ReceiptDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const isModal = searchParams.get("modal") === "true"
  const receiptId = params.id as string

  const content = <ReceiptDetailContent receiptId={receiptId} isModal={isModal} />

  // If modal query param is present, wrap in modal
  // Otherwise, render as full page (supports deep linking)
  if (isModal) {
    return <ModalContentWrapper>{content}</ModalContentWrapper>
  }

  return <div className="min-h-screen">{content}</div>
}
