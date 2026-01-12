"use client"

import { useSearchParams } from "next/navigation"
import CreateTeacherPaymentFormClient from "@/components/create-teacher-payment-client"
import { ModalContentWrapper } from "@/components/modal-content-wrapper"

export default function CreateTeacherPaymentPage() {
  const searchParams = useSearchParams()
  const isModal = searchParams.get("modal") === "true"

  const content = <CreateTeacherPaymentFormClient isModal={isModal} />

  if (isModal) {
    return <ModalContentWrapper className="max-w-4xl">{content}</ModalContentWrapper>
  }

  return content
}