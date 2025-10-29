'use client'

import { cn } from '@/lib/utils'
import { Button } from './button'
import { ComponentProps } from 'react'
import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

interface ResponsiveButtonProps extends Omit<ComponentProps<'button'>, 'size'> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon'
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'gradient'
  loading?: boolean
  loadingText?: string
  fullWidth?: boolean
  responsive?: boolean
  touch?: boolean
}

const sizeClasses = {
  xs: 'h-8 px-2 text-xs',
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 py-2 text-sm sm:text-base',
  lg: 'h-11 px-8 text-base sm:text-lg',
  xl: 'h-12 px-10 text-lg sm:text-xl',
  icon: 'h-10 w-10'
}

const responsiveSizeClasses = {
  xs: 'h-8 px-2 text-xs',
  sm: 'h-9 px-3 text-sm sm:text-base',
  md: 'h-10 px-4 py-2 text-sm sm:text-base min-h-[44px] sm:min-h-[40px]',
  lg: 'h-11 px-6 sm:px-8 text-base sm:text-lg min-h-[48px]',
  xl: 'h-12 px-8 sm:px-10 text-lg sm:text-xl min-h-[52px]',
  icon: 'h-10 w-10 sm:h-11 sm:w-11 min-h-[44px] min-w-[44px]'
}

const variantClasses = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  ghost: 'hover:bg-accent hover:text-accent-foreground',
  link: 'text-primary underline-offset-4 hover:underline',
  gradient: 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70'
}

const touchClasses = {
  true: 'min-h-[44px] min-w-[44px] touch-manipulation',
  false: ''
}

export const ResponsiveButton = forwardRef<HTMLButtonElement, ResponsiveButtonProps>(
  ({
    children,
    className,
    size = 'md',
    variant = 'default',
    loading = false,
    loadingText,
    fullWidth = false,
    responsive = true,
    touch = true,
    disabled,
    ...props
  }, ref) => {
    const isDisabled = disabled || loading

    return (
      <Button
        ref={ref}
        className={cn(
          // Base classes
          'relative inline-flex items-center justify-center whitespace-nowrap rounded-md font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          
          // Size classes
          responsive ? responsiveSizeClasses[size as keyof typeof responsiveSizeClasses] : sizeClasses[size as keyof typeof sizeClasses],
          
          // Variant classes
          variantClasses[variant as keyof typeof variantClasses],
          
          // Touch classes
          touch && touchClasses.true,
          
          // Full width
          fullWidth && 'w-full',
          
          // Loading state
          loading && 'cursor-wait',
          
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {loading ? (loadingText || 'Loading...') : children}
      </Button>
    )
  }
)

ResponsiveButton.displayName = 'ResponsiveButton'

interface ResponsiveButtonGroupProps {
  children: React.ReactNode
  className?: string
  orientation?: 'horizontal' | 'vertical'
  variant?: 'default' | 'outline'
  spacing?: 'none' | 'sm' | 'md' | 'lg'
  responsive?: boolean
}

const groupOrientationClasses = {
  horizontal: 'flex-row',
  vertical: 'flex-col'
}


const groupSpacingClasses = {
  none: 'gap-0',
  sm: 'gap-1',
  md: 'gap-2',
  lg: 'gap-4'
}

const groupVariantClasses = {
  default: '[&>button]:rounded-none [&>button:first-child]:rounded-l-md [&>button:last-child]:rounded-r-md [&>button:not(:first-child)]:border-l-0',
  outline: '[&>button]:rounded-none [&>button:first-child]:rounded-l-md [&>button:last-child]:rounded-r-md [&>button:not(:first-child)]:border-l-0'
}

export function ResponsiveButtonGroup({
  children,
  className,
  orientation = 'horizontal',
  variant = 'default',
  spacing = 'md',
  responsive = true
}: ResponsiveButtonGroupProps) {
  return (
    <div
      className={cn(
        'inline-flex',
        groupOrientationClasses[orientation],
        groupSpacingClasses[spacing],
        groupVariantClasses[variant],
        responsive && 'flex-col sm:flex-row',
        className
      )}
      role="group"
    >
      {children}
    </div>
  )
}

interface ResponsiveIconButtonProps extends Omit<ResponsiveButtonProps, 'children'> {
  icon: React.ReactNode
  label: string
  'aria-label'?: string
}

export function ResponsiveIconButton({
  icon,
  label,
  'aria-label': ariaLabel,
  className,
  ...props
}: ResponsiveIconButtonProps) {
  return (
    <ResponsiveButton
      size="icon"
      className={cn('aspect-square', className)}
      aria-label={ariaLabel || label}
      {...props}
    >
      {icon}
    </ResponsiveButton>
  )
}

interface ResponsiveFloatingActionButtonProps extends Omit<ResponsiveButtonProps, 'size'> {
  icon: React.ReactNode
  label: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  fixed?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const fabPositionClasses = {
  'bottom-right': 'fixed bottom-4 right-4 sm:bottom-6 sm:right-6',
  'bottom-left': 'fixed bottom-4 left-4 sm:bottom-6 sm:left-6',
  'top-right': 'fixed top-4 right-4 sm:top-6 sm:right-6',
  'top-left': 'fixed top-4 left-4 sm:top-6 sm:left-6'
}

export function ResponsiveFloatingActionButton({
  icon,
  label,
  position = 'bottom-right',
  fixed = true,
  className,
  size = 'lg',
  variant = 'default',
  ...props
}: ResponsiveFloatingActionButtonProps) {
  return (
    <ResponsiveButton
      size={size}
      variant={variant}
      className={cn(
        fixed && fabPositionClasses[position],
        'z-50 shadow-lg hover:shadow-xl transition-shadow',
        className
      )}
      aria-label={label}
      {...props}
    >
      {icon}
    </ResponsiveButton>
  )
}

interface ResponsiveToggleButtonProps extends Omit<ResponsiveButtonProps, 'variant'> {
  pressed?: boolean
  onPressedChange?: (pressed: boolean) => void
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'gradient'
}

export function ResponsiveToggleButton({
  pressed = false,
  onPressedChange,
  className,
  variant = 'outline',
  ...props
}: ResponsiveToggleButtonProps) {
  return (
    <ResponsiveButton
      variant={pressed ? 'default' : variant}
      className={cn(
        'data-[state=on]:bg-primary data-[state=on]:text-primary-foreground',
        className
      )}
      onClick={() => onPressedChange?.(!pressed)}
      aria-pressed={pressed}
      {...props}
    />
  )
}

interface ResponsiveSplitButtonProps {
  primaryAction: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  secondaryAction: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline'
  disabled?: boolean
}

export function ResponsiveSplitButton({
  primaryAction,
  secondaryAction,
  className,
  size = 'md',
  variant = 'default',
  disabled = false
}: ResponsiveSplitButtonProps) {
  return (
    <ResponsiveButtonGroup className={className} variant={variant}>
      <ResponsiveButton
        size={size}
        variant={variant}
        disabled={disabled}
        onClick={primaryAction.onClick}
        className="flex-1"
      >
        {primaryAction.icon && <span className="mr-2">{primaryAction.icon}</span>}
        {primaryAction.label}
      </ResponsiveButton>
      <ResponsiveButton
        size={size}
        variant={variant}
        disabled={disabled}
        onClick={secondaryAction.onClick}
        className="px-2"
      >
        {secondaryAction.icon || '▼'}
      </ResponsiveButton>
    </ResponsiveButtonGroup>
  )
}
