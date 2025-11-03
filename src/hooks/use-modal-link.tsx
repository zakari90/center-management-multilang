"use client"

import { useRouter, usePathname } from "next/navigation"
import { useCallback } from "react"

// Routes that should open in modals
const MODAL_ROUTES = [
  /^\/[a-z]{2}\/manager\/students\/([^\/]+)$/,
  /^\/[a-z]{2}\/manager\/receipts\/([^\/]+)$/,
  /^\/[a-z]{2}\/manager\/teachers\/([^\/]+)$/,
]

function shouldOpenInModal(path: string): boolean {
  return MODAL_ROUTES.some((pattern) => pattern.test(path))
}

/**
 * Hook that returns a navigation function that opens routes in modals
 * when navigating from list pages, but allows direct navigation otherwise
 */
export function useModalLink() {
  const router = useRouter()
  const pathname = usePathname()

  const navigate = useCallback(
    (href: string, options?: { forceFullPage?: boolean }) => {
      const isListPage = pathname.match(/\/manager\/(students|receipts|teachers)$/)
      const shouldModal = !options?.forceFullPage && isListPage && shouldOpenInModal(href)

      if (shouldModal) {
        // Add modal query param for intercepting routes
        const url = new URL(href, window.location.origin)
        url.searchParams.set("modal", "true")
        router.push(url.pathname + url.search)
      } else {
        router.push(href)
      }
    },
    [router, pathname]
  )

  return { navigate, shouldOpenInModal }
}

