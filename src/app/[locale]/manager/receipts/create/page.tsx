"use client"

import { useSearchParams } from "next/navigation"
import CreateStudentPaymentForm from "@/components/studentPaymentForm2"
import { ModalContentWrapper } from "@/components/modal-content-wrapper"

export default function CreateReceiptPage() {
  const searchParams = useSearchParams()
  const isModal = searchParams.get("modal") === "true"

  const content = <CreateStudentPaymentForm isModal={isModal} />

  if (isModal) {
    return <ModalContentWrapper className="max-w-4xl">{content}</ModalContentWrapper>
  }

  return content
}