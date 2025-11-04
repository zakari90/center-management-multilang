/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { usePathname } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { ComponentProps } from "react"

// Routes that should NOT open in modals (forms, create pages, etc.)
const EXCLUDE_ROUTES = [
  /\/edit$/,
  /\/create$/,
  /\/create-/,
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
  
  // Match any route with dynamic segments (like [id], [slug])
  // Pattern: /manager/.../[something]/...
  // This will match:
  // - /manager/students/[id]
  // - /manager/students/[id]/card
  // - /manager/receipts/[id]
  // - Any other [id] route
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
  // Check if we're on a manager list page (any resource type)
  const isListPage = pathname.match(/\/manager\/[^\/]+$/)
  const hrefStr = href.toString()
  const shouldModal = !forceFullPage && isListPage && shouldOpenInModal(hrefStr)

  // Construct the href with modal query param if needed
  // Note: next-intl Link will handle locale automatically
  const modalHref = shouldModal
    ? `${hrefStr}${hrefStr.includes("?") ? "&" : "?"}modal=true`
    : href

  return <Link href={modalHref as any} {...props} />
}

