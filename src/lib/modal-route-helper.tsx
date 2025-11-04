/**
 * Helper utilities for modal routing
 * 
 * This file provides utilities to easily convert any [id] route page
 * to support modal dialogs.
 */

import { ReactNode } from "react"
import { ModalContentWrapper } from "@/components/modal-content-wrapper"

/**
 * Generic wrapper component for any detail page
 * Use this pattern to quickly convert any [id] route to support modals
 */
export function createModalPageWrapper<T = string>(ContentComponent: (props: { itemId: T; isModal?: boolean }) => ReactNode) {
  return function ModalPageWrapper({ 
    searchParams, 
    params 
  }: { 
    searchParams: { get: (key: string) => string | null }
    params: { id: string | string[] }
  }) {
    const isModal = searchParams.get("modal") === "true"
    const itemId = (Array.isArray(params.id) ? params.id[0] : params.id) as T

    const content = ContentComponent({ itemId, isModal })

    if (isModal) {
      return <ModalContentWrapper>{content}</ModalContentWrapper>
    }

    return <div className="min-h-screen">{content}</div>
  }
}

/**
 * Pattern to follow for converting ANY [id] route:
 * 
 * 1. Extract content logic to a component with isModal prop
 * 2. Update page.tsx to check for ?modal=true
 * 3. Wrap in ModalContentWrapper if modal, otherwise render full page
 * 
 * Example:
 * 
 * // Before (full page only):
 * export default function ItemPage() {
 *   const { id } = useParams()
 *   return <ItemContent id={id} />
 * }
 * 
 * // After (modal + full page):
 * export default function ItemPage() {
 *   const params = useParams()
 *   const searchParams = useSearchParams()
 *   const isModal = searchParams.get("modal") === "true"
 *   const itemId = params.id as string
 * 
 *   const content = <ItemContent id={itemId} isModal={isModal} />
 * 
 *   if (isModal) {
 *     return <ModalContentWrapper>{content}</ModalContentWrapper>
 *   }
 *   return <div className="min-h-screen">{content}</div>
 * }
 */

