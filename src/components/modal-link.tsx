/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { usePathname } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { ComponentProps } from "react"

// Routes that should NOT open in modals
// Note: Most routes now support modal mode, exclude only if truly incompatible
const EXCLUDE_ROUTES = [
  /\/new$/,
]

// Generic pattern to match any dynamic route with [id], [slug], etc.
// Matches paths like: /manager/students/[id], /manager/students/[id]/card, etc.
// But excludes edit/create routes
function shouldOpenInModal(href: string): boolean {
  // First check if route should be excluded
  if (EXCLUDE_ROUTES.some((pattern) => pattern.test(href))) {
    return false
  }
  
  // Match any manager route with at least 2 path segments after /manager/
  // This matches dynamic routes and create routes:
  // - /manager/students/[id]
  // - /manager/students/[id]/card
  // - /manager/receipts/create
  // - /manager/receipts/create-teacher-payment
  const dynamicRoutePattern = /\/manager\/[^\/]+\/[^\/]+(\/[^\/]+)*$/
  
  return dynamicRoutePattern.test(href)
}

interface ModalLinkProps extends ComponentProps<typeof Link> {
  forceFullPage?: boolean
}

/**
 * A Link component that automatically opens routes in modals when navigating
 * from list pages. Use forceFullPage to always navigate to a full page.
 * 
 * This component uses the i18n-aware Link from next-intl to properly handle
 * locale routing while adding the modal query parameter when needed.
 */
export function ModalLink({ href, forceFullPage = false, ...props }: ModalLinkProps) {
  const pathname = usePathname()
  // Check if we're on a manager page (dashboard or list page)
  const isManagerPage = pathname.match(/\/manager(\/[^\/]+)?$/)
  const hrefStr = href.toString()
  const shouldModal = !forceFullPage && isManagerPage && shouldOpenInModal(hrefStr)

  // Construct the href with modal query param if needed
  // Note: next-intl Link will handle locale automatically
  const modalHref = shouldModal
    ? `${hrefStr}${hrefStr.includes("?") ? "&" : "?"}modal=true`
    : href

  return <Link href={modalHref as any} {...props} />
}

