"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Avatar } from "@radix-ui/react-avatar";
import { AvatarFallback, AvatarImage } from "./ui/avatar";

import { CacheStatusDot } from "./cache-status-indicator";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: string;
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-1">
        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url;

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  className={cn(
                    "relative flex items-center px-3 py-2 rounded-md w-full font-medium transition-all duration-200 ease-out",
                    "hover:translate-x-0.5 hover:bg-accent/60",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold hover:bg-primary/15 hover:translate-x-0"
                      : "",
                  )}
                >
                  <Link href={item.url} className="flex items-center gap-2.5">
                    {/* Active accent bar */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary transition-all" />
                    )}
                    {item.icon && (
                      <Avatar className="h-4 w-4 rounded-lg grayscale">
                        <AvatarImage
                          className={
                            isActive ? "brightness-110 grayscale-0" : ""
                          }
                          src={item.icon}
                          alt={item.title}
                        />
                        <AvatarFallback className="rounded-lg">
                          {item.title[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <span>{item.title}</span>
                    <div className="ml-auto">
                      <CacheStatusDot href={item.url} />
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
