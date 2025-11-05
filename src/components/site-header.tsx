'use client'

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { SyncButton } from "@/components/sync-button"
import { DebugSyncButton } from "@/components/debug-sync-button"

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center justify-between gap-1 px-2 sm:px-4 lg:gap-2 lg:px-6">
        <div className="flex items-center gap-1">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-1 sm:mx-2 data-[orientation=vertical]:h-4"
          />
          {/* <h1 className="text-base font-medium">Documents</h1> */}
        </div>
        <div className="flex items-center gap-2">
          <DebugSyncButton />
          <SyncButton 
            variant="ghost"
            size="sm"
          />
        </div>
      </div>
    </header>
  )
}
