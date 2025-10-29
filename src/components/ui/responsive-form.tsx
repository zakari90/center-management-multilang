'use client'

import { cn } from '@/lib/utils'
import { forwardRef, ReactNode } from 'react'
import { Label } from './label'
import { Input } from './input'
import { Textarea } from './textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Checkbox } from './checkbox'
import { Alert, AlertDescription } from './alert'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface ResponsiveFormProps {
  children: ReactNode
  className?: string
  onSubmit?: (e: React.FormEvent) => void
  spacing?: 'sm' | 'md' | 'lg'
}

const spacingClasses = {
  sm: 'space-y-3',
  md: 'space-y-4 sm:space-y-6',
  lg: 'space-y-6 sm:space-y-8'
}

export function ResponsiveForm({
  children,
  className,
  onSubmit,
  spacing = 'md'
}: ResponsiveFormProps) {
  return (
    <form
      className={cn(
        'w-full',
        spacingClasses[spacing],
        className
      )}
      onSubmit={onSubmit}
    >
      {children}
    </form>
  )
}

interface ResponsiveFormFieldProps {
  children: ReactNode
  className?: string
  error?: string
  success?: string
  required?: boolean
  label?: string
  description?: string
  layout?: 'vertical' | 'horizontal'
}

const layoutClasses = {
  vertical: 'flex flex-col space-y-2',
  horizontal: 'flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0'
}

export function ResponsiveFormField({
  children,
  className,
  error,
  success,
  required = false,
  label,
  description,
  layout = 'vertical'
}: ResponsiveFormFieldProps) {
  return (
    <div className={cn('w-full', layoutClasses[layout], className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      <div className="w-full">
        {children}
      </div>
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="mt-2 border-green-200 bg-green-50 text-green-800">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

interface ResponsiveInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  description?: string
  error?: string
  success?: string
  required?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled' | 'outlined'
}

const inputSizeClasses = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-3 text-sm sm:text-base',
  lg: 'h-12 px-4 text-base sm:text-lg'
}

const inputVariantClasses = {
  default: 'border border-input bg-background',
  filled: 'border-0 bg-muted',
  outlined: 'border-2 border-input bg-transparent'
}

export const ResponsiveInput = forwardRef<HTMLInputElement, ResponsiveInputProps>(
  ({
    label,
    description,
    error,
    success,
    required = false,
    leftIcon,
    rightIcon,
    size = 'md',
    variant = 'default',
    className,
    ...props
  }, ref) => {
    return (
      <ResponsiveFormField
        label={label}
        description={description}
        error={error}
        success={success}
        required={required}
      >
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <Input
            ref={ref}
            className={cn(
              'w-full',
              inputSizeClasses[size],
              inputVariantClasses[variant],
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-destructive focus-visible:ring-destructive',
              success && 'border-green-500 focus-visible:ring-green-500',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
      </ResponsiveFormField>
    )
  }
)

ResponsiveInput.displayName = 'ResponsiveInput'

interface ResponsiveTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  description?: string
  error?: string
  success?: string
  required?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled' | 'outlined'
  resize?: 'none' | 'vertical' | 'horizontal' | 'both'
}

const textareaSizeClasses = {
  sm: 'min-h-[80px] px-3 py-2 text-sm',
  md: 'min-h-[100px] px-3 py-2 text-sm sm:text-base',
  lg: 'min-h-[120px] px-4 py-3 text-base sm:text-lg'
}

const textareaResizeClasses = {
  none: 'resize-none',
  vertical: 'resize-y',
  horizontal: 'resize-x',
  both: 'resize'
}

export const ResponsiveTextarea = forwardRef<HTMLTextAreaElement, ResponsiveTextareaProps>(
  ({
    label,
    description,
    error,
    success,
    required = false,
    size = 'md',
    variant = 'default',
    resize = 'vertical',
    className,
    ...props
  }, ref) => {
    return (
      <ResponsiveFormField
        label={label}
        description={description}
        error={error}
        success={success}
        required={required}
      >
        <Textarea
          ref={ref}
          className={cn(
            'w-full',
            textareaSizeClasses[size],
            inputVariantClasses[variant],
            textareaResizeClasses[resize],
            error && 'border-destructive focus-visible:ring-destructive',
            success && 'border-green-500 focus-visible:ring-green-500',
            className
          )}
          {...props}
        />
      </ResponsiveFormField>
    )
  }
)

ResponsiveTextarea.displayName = 'ResponsiveTextarea'

interface ResponsiveSelectProps {
  label?: string
  description?: string
  error?: string
  success?: string
  required?: boolean
  placeholder?: string
  options: Array<{ value: string; label: string; disabled?: boolean }>
  value?: string
  onValueChange?: (value: string) => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'filled' | 'outlined'
  disabled?: boolean
  className?: string
}

const selectSizeClasses = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-3 text-sm sm:text-base',
  lg: 'h-12 px-4 text-base sm:text-lg'
}

export function ResponsiveSelect({
  label,
  description,
  error,
  success,
  required = false,
  placeholder = 'Select an option',
  options,
  value,
  onValueChange,
  size = 'md',
  variant = 'default',
  disabled = false,
  className
}: ResponsiveSelectProps) {
  return (
    <ResponsiveFormField
      label={label}
      description={description}
      error={error}
      success={success}
      required={required}
    >
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          className={cn(
            'w-full',
            selectSizeClasses[size],
            inputVariantClasses[variant],
            error && 'border-destructive focus:ring-destructive',
            success && 'border-green-500 focus:ring-green-500',
            className
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </ResponsiveFormField>
  )
}

interface ResponsiveCheckboxProps {
  label?: string
  description?: string
  error?: string
  success?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  required?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const checkboxSizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6'
}

export function ResponsiveCheckbox({
  label,
  description,
  error,
  success,
  checked,
  onCheckedChange,
  disabled = false,
  required = false,
  size = 'md',
  className
}: ResponsiveCheckboxProps) {
  return (
    <ResponsiveFormField
      error={error}
      success={success}
      required={required}
      layout="horizontal"
    >
      <div className="flex items-start space-x-3">
        <Checkbox
          id={label}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          className={cn(
            checkboxSizeClasses[size],
            error && 'border-destructive',
            success && 'border-green-500',
            className
          )}
        />
        <div className="space-y-1">
          {label && (
            <Label
              htmlFor={label}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </Label>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </ResponsiveFormField>
  )
}

interface ResponsiveFormActionsProps {
  children: ReactNode
  className?: string
  justify?: 'start' | 'end' | 'center' | 'between'
  spacing?: 'sm' | 'md' | 'lg'
}

const justifyClasses = {
  start: 'justify-start',
  end: 'justify-end',
  center: 'justify-center',
  between: 'justify-between'
}

const actionSpacingClasses = {
  sm: 'gap-2',
  md: 'gap-3 sm:gap-4',
  lg: 'gap-4 sm:gap-6'
}

export function ResponsiveFormActions({
  children,
  className,
  justify = 'end',
  spacing = 'md'
}: ResponsiveFormActionsProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row',
        justifyClasses[justify],
        actionSpacingClasses[spacing],
        className
      )}
    >
      {children}
    </div>
  )
}

interface ResponsiveFormGroupProps {
  children: ReactNode
  className?: string
  columns?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  responsive?: boolean
}

const groupColumnsClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
}

const groupGapClasses = {
  sm: 'gap-3',
  md: 'gap-4 sm:gap-6',
  lg: 'gap-6 sm:gap-8'
}

export function ResponsiveFormGroup({
  children,
  className,
  columns = 1,
  gap = 'md',
  responsive = true
}: ResponsiveFormGroupProps) {
  return (
    <div
      className={cn(
        'grid',
        responsive ? groupColumnsClasses[columns] : `grid-cols-${columns}`,
        groupGapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  )
}
