'use client'

import { cn } from '@/lib/utils'
import { ReactNode, useState, useEffect } from 'react'
import { Button } from './button'
import { Sheet, SheetContent, SheetTrigger } from './sheet'
import { Menu, ChevronDown, ChevronRight } from 'lucide-react'

interface ResponsiveNavigationProps {
  children: ReactNode
  className?: string
  brand?: ReactNode
  actions?: ReactNode
  mobileMenu?: ReactNode
  breakpoint?: 'sm' | 'md' | 'lg'
}

export function ResponsiveNavigation({
  children,
  className,
  brand,
  actions,
  mobileMenu,
  breakpoint = 'md'
}: ResponsiveNavigationProps) {
  const [isOpen, setIsOpen] = useState(false)

  const breakpointClasses = {
    sm: 'sm:hidden',
    md: 'md:hidden',
    lg: 'lg:hidden'
  }

  return (
    <nav className={cn('w-full border-b border-border bg-background', className)}>
      <div className="container-responsive mx-auto">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          {brand && (
            <div className="flex items-center">
              {brand}
            </div>
          )}

          {/* Desktop Navigation */}
          <div className={cn('hidden items-center space-x-6', breakpointClasses[breakpoint])}>
            {children}
          </div>

          {/* Actions */}
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}

          {/* Mobile Menu Button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn('md:hidden')}
                aria-label="Toggle menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col space-y-4">
                {brand && (
                  <div className="border-b border-border pb-4">
                    {brand}
                  </div>
                )}
                <div className="flex flex-col space-y-2">
                  {mobileMenu || children}
                </div>
                {actions && (
                  <div className="border-t border-border pt-4">
                    {actions}
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  )
}

interface ResponsiveNavItemProps {
  children: ReactNode
  href?: string
  active?: boolean
  disabled?: boolean
  className?: string
  onClick?: () => void
}

export function ResponsiveNavItem({
  children,
  href,
  active = false,
  disabled = false,
  className,
  onClick
}: ResponsiveNavItemProps) {
  const baseClasses = 'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors'
  const activeClasses = active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent hover:text-accent-foreground'
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'

  if (href) {
    return (
      <a
        href={href}
        className={cn(
          baseClasses,
          activeClasses,
          disabledClasses,
          className
        )}
        onClick={onClick}
      >
        {children}
      </a>
    )
  }

  return (
    <button
      className={cn(
        baseClasses,
        activeClasses,
        disabledClasses,
        'w-full text-left',
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

interface ResponsiveNavDropdownProps {
  children: ReactNode
  label: string
  icon?: ReactNode
  className?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ResponsiveNavDropdown({
  children,
  label,
  icon,
  className,
  open = false,
  onOpenChange
}: ResponsiveNavDropdownProps) {
  const [isOpen, setIsOpen] = useState(open)

  useEffect(() => {
    setIsOpen(open)
  }, [open])

  const handleToggle = () => {
    const newOpen = !isOpen
    setIsOpen(newOpen)
    onOpenChange?.(newOpen)
  }

  return (
    <div className={cn('relative', className)}>
      <button
        className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
        onClick={handleToggle}
      >
        <div className="flex items-center space-x-2">
          {icon}
          <span>{label}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      {isOpen && (
        <div className="mt-1 space-y-1 pl-4">
          {children}
        </div>
      )}
    </div>
  )
}

interface ResponsiveBreadcrumbProps {
  items: Array<{
    label: string
    href?: string
    current?: boolean
  }>
  className?: string
  separator?: ReactNode
}

export function ResponsiveBreadcrumb({
  items,
  className,
  separator = '/'
}: ResponsiveBreadcrumbProps) {
  return (
    <nav className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <span className="mx-2 text-muted-foreground">
              {separator}
            </span>
          )}
          {item.href && !item.current ? (
            <a
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span className={cn(
              item.current ? 'text-foreground font-medium' : 'text-muted-foreground'
            )}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  )
}

interface ResponsiveTabsProps {
  children: ReactNode
  className?: string
  orientation?: 'horizontal' | 'vertical'
}

export function ResponsiveTabs({
  children,
  className,
  orientation = 'horizontal'
}: ResponsiveTabsProps) {
  return (
    <div
      className={cn(
        'w-full',
        orientation === 'vertical' ? 'flex flex-col sm:flex-row' : 'flex flex-col',
        className
      )}
    >
      {children}
    </div>
  )
}

interface ResponsiveTabListProps {
  children: ReactNode
  className?: string
  orientation?: 'horizontal' | 'vertical'
}

export function ResponsiveTabList({
  children,
  className,
  orientation = 'horizontal'
}: ResponsiveTabListProps) {
  return (
    <div
      className={cn(
        'flex',
        orientation === 'horizontal' 
          ? 'flex-row border-b border-border' 
          : 'flex-col border-r border-border',
        className
      )}
      role="tablist"
    >
      {children}
    </div>
  )
}

interface ResponsiveTabProps {
  children: ReactNode
  active?: boolean
  disabled?: boolean
  className?: string
  onClick?: () => void
}

export function ResponsiveTab({
  children,
  active = false,
  disabled = false,
  className,
  onClick
}: ResponsiveTabProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 text-sm font-medium transition-colors',
        'border-b-2 border-transparent',
        active 
          ? 'border-primary text-primary' 
          : 'text-muted-foreground hover:text-foreground hover:border-muted-foreground',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onClick={onClick}
      disabled={disabled}
      role="tab"
      aria-selected={active}
    >
      {children}
    </button>
  )
}

interface ResponsiveTabContentProps {
  children: ReactNode
  active?: boolean
  className?: string
}

export function ResponsiveTabContent({
  children,
  active = false,
  className
}: ResponsiveTabContentProps) {
  if (!active) return null

  return (
    <div
      className={cn('p-4', className)}
      role="tabpanel"
    >
      {children}
    </div>
  )
}

interface ResponsivePaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  showFirstLast?: boolean
  showPrevNext?: boolean
  maxVisiblePages?: number
}

export function ResponsivePagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  showFirstLast = true,
  showPrevNext = true,
  maxVisiblePages = 5
}: ResponsivePaginationProps) {
  const getVisiblePages = () => {
    const pages: (number | string)[] = []
    const half = Math.floor(maxVisiblePages / 2)
    let start = Math.max(1, currentPage - half)
    const end = Math.min(totalPages, start + maxVisiblePages - 1)

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1)
    }

    if (start > 1) {
      pages.push(1)
      if (start > 2) {
        pages.push('...')
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('...')
      }
      pages.push(totalPages)
    }

    return pages
  }

  const visiblePages = getVisiblePages()

  return (
    <nav className={cn('flex items-center justify-center space-x-1', className)}>
      {showFirstLast && currentPage > 1 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          className="hidden sm:flex"
        >
          First
        </Button>
      )}
      
      {showPrevNext && currentPage > 1 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
      )}

      <div className="flex items-center space-x-1">
        {visiblePages.map((page, index) => (
          <div key={index}>
            {typeof page === 'number' ? (
              <Button
                variant={page === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(page)}
                className="min-w-[40px]"
              >
                {page}
              </Button>
            ) : (
              <span className="px-3 py-2 text-sm text-muted-foreground">
                {page}
              </span>
            )}
          </div>
        ))}
      </div>

      {showPrevNext && currentPage < totalPages && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      )}

      {showFirstLast && currentPage < totalPages && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          className="hidden sm:flex"
        >
          Last
        </Button>
      )}
    </nav>
  )
}
