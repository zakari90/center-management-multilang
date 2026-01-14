// manager/students/[id]/card/page.tsx
"use client"

import { useParams, useSearchParams } from "next/navigation"
import { StudentCardContent } from "@/components/student-card-content"
import { ModalContentWrapper } from "@/components/modal-content-wrapper"

export default function StudentCardPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const isModal = searchParams.get("modal") === "true"
  const studentId = params.id as string

  const content = <StudentCardContent studentId={studentId} isModal={isModal} />

  // If modal query param is present, wrap in modal
  // Otherwise, render as full page (supports deep linking)
  if (isModal) {
    return <ModalContentWrapper className="max-w-3xl">{content}</ModalContentWrapper>
  }

  return <div className="min-h-screen">{content}</div>
}