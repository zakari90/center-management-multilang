'use client'

import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full'
}

const paddingClasses = {
  none: '',
  sm: 'p-4 sm:p-6',
  md: 'p-6 sm:p-8',
  lg: 'p-8 sm:p-12'
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full'
}

export function ResponsiveContainer({
  children,
  className,
  size = 'lg',
  padding = 'md',
  maxWidth = '7xl'
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full',
        sizeClasses[size],
        paddingClasses[padding],
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </div>
  )
}

interface ResponsiveGridProps {
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

const gapClasses = {
  sm: 'gap-2 sm:gap-4',
  md: 'gap-4 sm:gap-6',
  lg: 'gap-6 sm:gap-8',
  xl: 'gap-8 sm:gap-12'
}

export function ResponsiveGrid({
  children,
  className,
  cols = 3,
  gap = 'md',
  responsive = true
}: ResponsiveGridProps) {
  return (
    <div
      className={cn(
        'grid',
        responsive ? gridColsClasses[cols] : `grid-cols-${cols}`,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  )
}

interface ResponsiveFlexProps {
  children: ReactNode
  className?: string
  direction?: 'row' | 'col' | 'responsive'
  wrap?: boolean
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch'
  gap?: 'sm' | 'md' | 'lg' | 'xl'
}

const directionClasses = {
  row: 'flex-row',
  col: 'flex-col',
  responsive: 'flex-col sm:flex-row'
}

const justifyClasses = {
  start: 'justify-start',
  end: 'justify-end',
  center: 'justify-center',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly'
}

const alignClasses = {
  start: 'items-start',
  end: 'items-end',
  center: 'items-center',
  baseline: 'items-baseline',
  stretch: 'items-stretch'
}

const flexGapClasses = {
  sm: 'gap-2 sm:gap-4',
  md: 'gap-4 sm:gap-6',
  lg: 'gap-6 sm:gap-8',
  xl: 'gap-8 sm:gap-12'
}

export function ResponsiveFlex({
  children,
  className,
  direction = 'responsive',
  wrap = false,
  justify = 'start',
  align = 'start',
  gap = 'md'
}: ResponsiveFlexProps) {
  return (
    <div
      className={cn(
        'flex',
        directionClasses[direction],
        wrap && 'flex-wrap',
        justifyClasses[justify],
        alignClasses[align],
        flexGapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  )
}

interface ResponsiveTextProps {
  children: ReactNode
  className?: string
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl'
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold'
  color?: 'default' | 'muted' | 'primary' | 'secondary' | 'accent' | 'destructive'
  align?: 'left' | 'center' | 'right' | 'justify'
  responsive?: boolean
}

const textSizeClasses = {
  xs: 'text-xs sm:text-sm',
  sm: 'text-sm sm:text-base',
  base: 'text-base sm:text-lg',
  lg: 'text-lg sm:text-xl md:text-2xl',
  xl: 'text-xl sm:text-2xl md:text-3xl',
  '2xl': 'text-2xl sm:text-3xl md:text-4xl',
  '3xl': 'text-3xl sm:text-4xl md:text-5xl',
  '4xl': 'text-4xl sm:text-5xl md:text-6xl',
  '5xl': 'text-5xl sm:text-6xl md:text-7xl'
}

const textWeightClasses = {
  light: 'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold'
}

const textColorClasses = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
  secondary: 'text-secondary',
  accent: 'text-accent',
  destructive: 'text-destructive'
}

const textAlignClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
  justify: 'text-justify'
}

export function ResponsiveText({
  children,
  className,
  size = 'base',
  weight = 'normal',
  color = 'default',
  align = 'left',
  responsive = true
}: ResponsiveTextProps) {
  return (
    <div
      className={cn(
        responsive ? textSizeClasses[size] : `text-${size}`,
        textWeightClasses[weight],
        textColorClasses[color],
        textAlignClasses[align],
        className
      )}
    >
      {children}
    </div>
  )
}

interface ResponsiveSpacingProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  responsive?: boolean
}

const paddingSpacingClasses = {
  none: '',
  sm: 'p-2 sm:p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8',
  xl: 'p-8 sm:p-12'
}

const marginSpacingClasses = {
  none: '',
  sm: 'm-2 sm:m-4',
  md: 'm-4 sm:m-6',
  lg: 'm-6 sm:m-8',
  xl: 'm-8 sm:m-12'
}

export function ResponsiveSpacing({
  children,
  className,
  padding = 'md',
  margin = 'none',
  responsive = true
}: ResponsiveSpacingProps) {
  return (
    <div
      className={cn(
        responsive ? paddingSpacingClasses[padding] : `p-${padding}`,
        responsive ? marginSpacingClasses[margin] : `m-${margin}`,
        className
      )}
    >
      {children}
    </div>
  )
}
