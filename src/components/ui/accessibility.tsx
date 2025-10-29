'use client'

import { cn } from '@/lib/utils'
import { Contrast, Eye, EyeOff, Keyboard, MousePointer, Type } from 'lucide-react'
import { ReactNode, useEffect, useState } from 'react'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'

interface AccessibilityProviderProps {
  children: ReactNode
  className?: string
}

interface AccessibilitySettings {
  highContrast: boolean
  largeText: boolean
  reducedMotion: boolean
  focusVisible: boolean
  screenReader: boolean
  keyboardNavigation: boolean
  colorBlind: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
  fontSize: 'small' | 'medium' | 'large' | 'extra-large'
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  focusVisible: true,
  screenReader: false,
  keyboardNavigation: false,
  colorBlind: 'none',
  fontSize: 'medium'
}

export function AccessibilityProvider({ children, className }: AccessibilityProviderProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('accessibility-settings')
    if (savedSettings) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) })
      } catch (error) {
        console.error('Error loading accessibility settings:', error)
      }
    }
  }, [])

  useEffect(() => {
    // Apply settings to document
    const root = document.documentElement
    
    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Large text
    if (settings.largeText) {
      root.classList.add('large-text')
    } else {
      root.classList.remove('large-text')
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('motion-reduce')
    } else {
      root.classList.remove('motion-reduce')
    }

    // Focus visible
    if (settings.focusVisible) {
      root.classList.add('focus-visible')
    } else {
      root.classList.remove('focus-visible')
    }

    // Color blind support
    root.classList.remove('protanopia', 'deuteranopia', 'tritanopia')
    if (settings.colorBlind !== 'none') {
      root.classList.add(settings.colorBlind)
    }

    // Font size
    root.classList.remove('text-small', 'text-medium', 'text-large', 'text-extra-large')
    root.classList.add(`text-${settings.fontSize}`)

    // Save settings to localStorage
    localStorage.setItem('accessibility-settings', JSON.stringify(settings))
  }, [settings])

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
  }

  return (
    <div className={cn('relative', className)}>
      {children}
      
      {/* Accessibility Panel */}
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full h-12 w-12 shadow-lg"
          aria-label="Open accessibility settings"
        >
          <Eye className="h-5 w-5" />
        </Button>
        
        {isOpen && (
          <Card className="absolute bottom-16 left-0 w-80 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Accessibility Settings
              </CardTitle>
              <CardDescription>
                Customize your experience for better accessibility
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* High Contrast */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Contrast className="h-4 w-4" />
                  <span className="text-sm font-medium">High Contrast</span>
                </div>
                <Button
                  variant={settings.highContrast ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateSetting('highContrast', !settings.highContrast)}
                >
                  {settings.highContrast ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </div>

              {/* Large Text */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  <span className="text-sm font-medium">Large Text</span>
                </div>
                <Button
                  variant={settings.largeText ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateSetting('largeText', !settings.largeText)}
                >
                  {settings.largeText ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </div>

              {/* Reduced Motion */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MousePointer className="h-4 w-4" />
                  <span className="text-sm font-medium">Reduced Motion</span>
                </div>
                <Button
                  variant={settings.reducedMotion ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateSetting('reducedMotion', !settings.reducedMotion)}
                >
                  {settings.reducedMotion ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </div>

              {/* Focus Visible */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Keyboard className="h-4 w-4" />
                  <span className="text-sm font-medium">Focus Indicators</span>
                </div>
                <Button
                  variant={settings.focusVisible ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateSetting('focusVisible', !settings.focusVisible)}
                >
                  {settings.focusVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  <span className="text-sm font-medium">Font Size</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['small', 'medium', 'large', 'extra-large'] as const).map((size) => (
                    <Button
                      key={size}
                      variant={settings.fontSize === size ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSetting('fontSize', size)}
                      className="text-xs"
                    >
                      {size.replace('-', ' ')}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Color Blind Support */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  <span className="text-sm font-medium">Color Blind Support</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {(['none', 'protanopia', 'deuteranopia', 'tritanopia'] as const).map((type) => (
                    <Button
                      key={type}
                      variant={settings.colorBlind === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateSetting('colorBlind', type)}
                      className="text-xs"
                    >
                      {type === 'none' ? 'None' : type}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Reset Button */}
              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetSettings}
                  className="w-full"
                >
                  Reset Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

interface SkipLinkProps {
  href: string
  children: ReactNode
  className?: string
}

export function SkipLink({ href, children, className }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4',
        'bg-primary text-primary-foreground px-4 py-2 rounded-md',
        'z-50 focus:outline-none focus:ring-2 focus:ring-ring',
        className
      )}
    >
      {children}
    </a>
  )
}

interface ScreenReaderOnlyProps {
  children: ReactNode
  className?: string
}

export function ScreenReaderOnly({ children, className }: ScreenReaderOnlyProps) {
  return (
    <span className={cn('sr-only', className)}>
      {children}
    </span>
  )
}

interface FocusTrapProps {
  children: ReactNode
  className?: string
  active?: boolean
}

export function FocusTrap({ children, className, active = true }: FocusTrapProps) {
  useEffect(() => {
    if (!active) return

    const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const firstFocusableElement = document.querySelector(focusableElements) as HTMLElement
    const focusableContent = document.querySelectorAll(focusableElements)
    const lastFocusableElement = focusableContent[focusableContent.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusableElement) {
            lastFocusableElement.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === lastFocusableElement) {
            firstFocusableElement.focus()
            e.preventDefault()
          }
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    firstFocusableElement?.focus()

    return () => {
      document.removeEventListener('keydown', handleTabKey)
    }
  }, [active])

  return (
    <div className={cn(active && 'focus-trap', className)}>
      {children}
    </div>
  )
}

interface ARIAButtonProps {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  pressed?: boolean
  expanded?: boolean
  controls?: string
  describedBy?: string
  className?: string
  'aria-label'?: string
  'aria-labelledby'?: string
}

export function ARIAButton({
  children,
  onClick,
  disabled = false,
  pressed = false,
  expanded = false,
  controls,
  describedBy,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy
}: ARIAButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      aria-pressed={pressed}
      aria-expanded={expanded}
      aria-controls={controls}
      aria-describedby={describedBy}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      {children}
    </button>
  )
}

interface ARIALiveRegionProps {
  children: ReactNode
  className?: string
  politeness?: 'off' | 'polite' | 'assertive'
}

export function ARIALiveRegion({
  children,
  className,
  politeness = 'polite'
}: ARIALiveRegionProps) {
  return (
    <div
      className={cn('sr-only', className)}
      aria-live={politeness}
      aria-atomic="true"
    >
      {children}
    </div>
  )
}

interface ARIAProgressBarProps {
  value: number
  max?: number
  className?: string
  'aria-label'?: string
  'aria-labelledby'?: string
}

export function ARIAProgressBar({
  value,
  max = 100,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy
}: ARIAProgressBarProps) {
  const percentage = Math.round((value / max) * 100)

  return (
    <div
      className={cn('w-full bg-muted rounded-full h-2', className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
    >
      <div
        className="bg-primary h-2 rounded-full transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
      <ScreenReaderOnly>
        {percentage}% complete
      </ScreenReaderOnly>
    </div>
  )
}

interface ARIAStatusProps {
  status: 'success' | 'error' | 'warning' | 'info'
  message: string
  className?: string
}

export function ARIAStatus({ status, message, className }: ARIAStatusProps) {
  const statusIcons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  }

  const statusColors = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-yellow-600',
    info: 'text-blue-600'
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-3 rounded-md border',
        statusColors[status],
        className
      )}
      role="status"
      aria-live="polite"
    >
      <span className="font-bold">{statusIcons[status]}</span>
      <span>{message}</span>
    </div>
  )
}
