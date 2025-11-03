"use client"

import { ReactNode, useEffect, useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface ModalContentWrapperProps {
  children: ReactNode
  onClose?: () => void
  className?: string
}

export function ModalContentWrapper({ children, onClose, className }: ModalContentWrapperProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    // Open modal when route changes to a modal route
    const isModalRoute = searchParams.get("modal") === "true"
    setIsOpen(isModalRoute)
  }, [pathname, searchParams])

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const isModalRoute = searchParams.get("modal") === "true"
      setIsOpen(isModalRoute)
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [searchParams])

  const handleClose = () => {
    setIsOpen(false)
    if (onClose) {
      onClose()
    }

    // Remove modal query param and navigate back to list
    const pathParts = pathname.split("/")
    const locale = pathParts[1]
    
    // Generic approach: Extract the resource type from path
    // Path format: /[locale]/manager/[resource]/[id]/...
    // We want to go back to: /[locale]/manager/[resource]
    let listPath = ""
    
    // Check for manager routes
    if (pathname.includes("/manager/")) {
      const managerIndex = pathParts.indexOf("manager")
      if (managerIndex >= 0 && pathParts.length > managerIndex + 1) {
        const resource = pathParts[managerIndex + 1]
        listPath = `/${locale}/manager/${resource}`
      }
    }
    
    // Fallback: use browser back if we can't determine the list path
    if (!listPath) {
      router.back()
      return
    }

    // Use replace to avoid adding to history stack
    router.replace(listPath)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        className={className || "max-w-4xl max-h-[90vh] overflow-y-auto"} 
        showCloseButton={true}
        onEscapeKeyDown={handleClose}
        onPointerDownOutside={handleClose}
        onInteractOutside={handleClose}
      >
        {children}
      </DialogContent>
    </Dialog>
  )
}

