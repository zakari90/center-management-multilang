"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type BottomNavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

export default function MobileBottomNav({
  items,
  menu,
  ariaLabel,
}: {
  items: BottomNavItem[];
  menu: React.ReactNode;
  ariaLabel: string;
}) {
  const pathname = usePathname();

  return (
    <nav
      className="app-bottom-nav"
      aria-label={ariaLabel}
      role="navigation"
    >
      <div className="app-bottom-nav__inner">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "app-bottom-nav__item",
                isActive ? "app-bottom-nav__item--active" : "",
              )}
            >
              <span className="app-bottom-nav__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="app-bottom-nav__label">{item.label}</span>
            </Link>
          );
        })}
        <div className="app-bottom-nav__item app-bottom-nav__item--menu max-w-[12px]">{menu}</div>
      </div>
    </nav>
  );
}
