"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar } from "@radix-ui/react-avatar"
import { AvatarFallback, AvatarImage } from "./ui/avatar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: string
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md w-full font-semibold",
                    isActive ? "bg-primary text-black " : ""
                  )}
                >
                  <Link href={item.url} className="flex items-center gap-2">
                    {item.icon && <Avatar className="h-4 w-4 rounded-lg grayscale">
                  <AvatarImage className={ isActive ? "bg-primary text-black " : ""} src={item.icon} alt={item.title} />
                  <AvatarFallback className="rounded-lg">{item.title[0]}</AvatarFallback>
                </Avatar>
                } 
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
