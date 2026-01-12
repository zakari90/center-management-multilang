// /manager/students/[id]/page.tsx
"use client"

import { useParams, useSearchParams } from "next/navigation"
import { StudentDetailContent } from "@/components/student-detail-content"
import { ModalContentWrapper } from "@/components/modal-content-wrapper"

export default function StudentDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const isModal = searchParams.get("modal") === "true"
  const studentId = params.id as string

  const content = <StudentDetailContent studentId={studentId} isModal={isModal} />

  // If modal query param is present, wrap in modal
  // Otherwise, render as full page (supports deep linking)
  if (isModal) {
    return <ModalContentWrapper>{content}</ModalContentWrapper>
  }

  return <div className="min-h-screen">{content}</div>
}
