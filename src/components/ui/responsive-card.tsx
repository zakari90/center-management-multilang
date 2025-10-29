'use client'

import { cn } from '@/lib/utils'
import { ReactNode, forwardRef } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card'

interface ResponsiveCardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'outlined' | 'elevated' | 'flat'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  clickable?: boolean
}

const variantClasses = {
  default: 'bg-card border border-border',
  outlined: 'bg-transparent border-2 border-border',
  elevated: 'bg-card border border-border shadow-lg',
  flat: 'bg-card border-0 shadow-none'
}

const sizeClasses = {
  sm: 'rounded-md',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  xl: 'rounded-2xl'
}

const paddingClasses = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8'
}

export const ResponsiveCard = forwardRef<HTMLDivElement, ResponsiveCardProps>(
  ({ children, className, variant = 'default', size = 'md', padding = 'md', hover = false, clickable = false, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          variantClasses[variant],
          sizeClasses[size],
          paddingClasses[padding],
          hover && 'hover:shadow-md transition-shadow duration-200',
          clickable && 'cursor-pointer hover:scale-[1.02] transition-transform duration-200',
          className
        )}
        {...props}
      >
        {children}
      </Card>
    )
  }
)

ResponsiveCard.displayName = 'ResponsiveCard'

interface ResponsiveCardHeaderProps {
  children?: ReactNode
  className?: string
  title?: string
  description?: string
  action?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const headerSizeClasses = {
  sm: 'pb-2',
  md: 'pb-4',
  lg: 'pb-6'
}

export function ResponsiveCardHeader({
  children,
  className,
  title,
  description,
  action,
  size = 'md'
}: ResponsiveCardHeaderProps) {
  return (
    <CardHeader className={cn(headerSizeClasses[size], className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          {title && (
            <CardTitle className="text-lg sm:text-xl font-semibold">
              {title}
            </CardTitle>
          )}
          {description && (
            <CardDescription className="text-sm sm:text-base text-muted-foreground">
              {description}
            </CardDescription>
          )}
        </div>
        {action && <div className="ml-4">{action}</div>}
      </div>
      {children}
    </CardHeader>
  )
}

interface ResponsiveCardContentProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const contentPaddingClasses = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8'
}

export function ResponsiveCardContent({
  children,
  className,
  padding = 'md'
}: ResponsiveCardContentProps) {
  return (
    <CardContent className={cn(contentPaddingClasses[padding], className)}>
      {children}
    </CardContent>
  )
}

interface ResponsiveCardFooterProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  justify?: 'start' | 'end' | 'center' | 'between' | 'around'
}

const footerPaddingClasses = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8'
}

const footerJustifyClasses = {
  start: 'justify-start',
  end: 'justify-end',
  center: 'justify-center',
  between: 'justify-between',
  around: 'justify-around'
}

export function ResponsiveCardFooter({
  children,
  className,
  padding = 'md',
  justify = 'end'
}: ResponsiveCardFooterProps) {
  return (
    <CardFooter className={cn(
      footerPaddingClasses[padding],
      footerJustifyClasses[justify],
      'flex flex-wrap gap-2 sm:gap-4',
      className
    )}>
      {children}
    </CardFooter>
  )
}

interface ResponsiveCardGridProps {
  children: ReactNode
  className?: string
  cols?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: 'sm' | 'md' | 'lg' | 'xl'
  responsive?: boolean
}

const gridColsClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6'
}

const gridGapClasses = {
  sm: 'gap-2 sm:gap-4',
  md: 'gap-4 sm:gap-6',
  lg: 'gap-6 sm:gap-8',
  xl: 'gap-8 sm:gap-12'
}

export function ResponsiveCardGrid({
  children,
  className,
  cols = 3,
  gap = 'md',
  responsive = true
}: ResponsiveCardGridProps) {
  return (
    <div
      className={cn(
        'grid',
        responsive ? gridColsClasses[cols] : `grid-cols-${cols}`,
        gridGapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  )
}

interface ResponsiveCardListProps {
  children: ReactNode
  className?: string
  spacing?: 'sm' | 'md' | 'lg'
  dividers?: boolean
}

const listSpacingClasses = {
  sm: 'space-y-2',
  md: 'space-y-4',
  lg: 'space-y-6'
}

export function ResponsiveCardList({
  children,
  className,
  spacing = 'md',
  dividers = false
}: ResponsiveCardListProps) {
  return (
    <div className={cn(
      'flex flex-col',
      listSpacingClasses[spacing],
      dividers && 'divide-y divide-border',
      className
    )}>
      {children}
    </div>
  )
}

interface ResponsiveCardItemProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  clickable?: boolean
}

const itemPaddingClasses = {
  none: '',
  sm: 'p-2 sm:p-3',
  md: 'p-3 sm:p-4',
  lg: 'p-4 sm:p-6'
}

export function ResponsiveCardItem({
  children,
  className,
  padding = 'md',
  hover = false,
  clickable = false
}: ResponsiveCardItemProps) {
  return (
    <div
      className={cn(
        itemPaddingClasses[padding],
        hover && 'hover:bg-muted/50 transition-colors duration-200',
        clickable && 'cursor-pointer hover:bg-muted/50 transition-colors duration-200',
        className
      )}
    >
      {children}
    </div>
  )
}

interface ResponsiveCardStatsProps {
  title: string
  value: string | number
  description?: string
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
  icon?: ReactNode
  className?: string
}

export function ResponsiveCardStats({
  title,
  value,
  description,
  trend,
  icon,
  className
}: ResponsiveCardStatsProps) {
  return (
    <ResponsiveCard className={cn('relative overflow-hidden', className)}>
      <ResponsiveCardContent padding="md">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold">{value}</p>
            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground">{description}</p>
            )}
            {trend && (
              <div className={cn(
                'flex items-center text-xs sm:text-sm',
                trend.positive ? 'text-green-600' : 'text-red-600'
              )}>
                <span className="font-medium">
                  {trend.positive ? '+' : ''}{trend.value}%
                </span>
                <span className="ml-1 text-muted-foreground">{trend.label}</span>
              </div>
            )}
          </div>
          {icon && (
            <div className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
      </ResponsiveCardContent>
    </ResponsiveCard>
  )
}

interface ResponsiveCardFeatureProps {
  title: string
  description: string
  icon?: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const featureSizeClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8'
}

export function ResponsiveCardFeature({
  title,
  description,
  icon,
  className,
  size = 'md'
}: ResponsiveCardFeatureProps) {
  return (
    <ResponsiveCard className={cn('text-center', className)}>
      <ResponsiveCardContent className={cn(featureSizeClasses[size])}>
        {icon && (
          <div className="mx-auto mb-4 h-12 w-12 sm:h-16 sm:w-16 text-primary">
            {icon}
          </div>
        )}
        <h3 className="mb-2 text-lg sm:text-xl font-semibold">{title}</h3>
        <p className="text-sm sm:text-base text-muted-foreground">{description}</p>
      </ResponsiveCardContent>
    </ResponsiveCard>
  )
}
