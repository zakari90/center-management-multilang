"use client"

import { useParams, useSearchParams } from "next/navigation"
import { TeacherDetailContent } from "@/components/teacher-detail-content"
import { ModalContentWrapper } from "@/components/modal-content-wrapper"

export default function TeacherProfilePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const isModal = searchParams.get("modal") === "true"
  const teacherId = params.id as string

  const content = <TeacherDetailContent teacherId={teacherId} isModal={isModal} />

  // If modal query param is present, wrap in modal
  // Otherwise, render as full page (supports deep linking)
  if (isModal) {
    return <ModalContentWrapper>{content}</ModalContentWrapper>
  }

  return <div className="min-h-screen">{content}</div>
}
