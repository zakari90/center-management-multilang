'use client'

import { cn } from '@/lib/utils'
import React, { ReactNode, ErrorInfo, ComponentType, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Alert, AlertDescription, AlertTitle } from './alert'
import { Badge } from './badge'
import { AlertTriangle, RefreshCw, Home, X, CheckCircle, Info, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number>
}

interface ErrorFallbackProps {
  error: Error
  errorInfo: ErrorInfo
  errorId: string
  resetError: () => void
  retry: () => void
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Call custom error handler
    this.props.onError?.(error, errorInfo)

    // Log error to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.logErrorToService(error, errorInfo)
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetOnPropsChange) {
        this.resetError()
      }
    }
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }
  }

  resetError = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId)
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    })
  }

  retry = () => {
    this.resetError()
    // Force a re-render by updating a key or calling a parent method
    window.location.reload()
  }

  logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // In a real application, you would send this to an error reporting service
    // like Sentry, LogRocket, or Bugsnag
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    // Example: Send to your error reporting service
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorReport)
    // }).catch(console.error)
    
    // Suppress unused variable warning
    console.log('Error report prepared:', errorReport)
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback

      return (
        <FallbackComponent
          error={this.state.error!}
          errorInfo={this.state.errorInfo!}
          errorId={this.state.errorId}
          resetError={this.resetError}
          retry={this.retry}
        />
      )
    }

    return this.props.children
  }
}

function DefaultErrorFallback({
  error,
  errorInfo,
  errorId,
  resetError,
  retry
}: ErrorFallbackProps) {
  const t = useTranslations('ErrorHandling')

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle>{t('title')}</CardTitle>
          </div>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="destructive">Error ID: {errorId}</Badge>
            </div>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('errorTitle')}</AlertTitle>
              <AlertDescription className="mt-2">
                <code className="text-sm bg-muted px-2 py-1 rounded">
                  {error.message}
                </code>
              </AlertDescription>
            </Alert>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="space-y-2">
              <summary className="cursor-pointer text-sm font-medium">
                {t('technicalDetails')}
              </summary>
              <div className="space-y-2">
                <div>
                  <h4 className="text-sm font-medium">{t('errorStack')}</h4>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                </div>
                <div>
                  <h4 className="text-sm font-medium">{t('componentStack')}</h4>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              </div>
            </details>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={retry} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('retry')}
            </Button>
            <Button variant="outline" onClick={resetError} className="flex-1">
              <X className="h-4 w-4 mr-2" />
              {t('dismiss')}
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/'} className="flex-1">
              <Home className="h-4 w-4 mr-2" />
              {t('goHome')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface ErrorToastProps {
  error: Error
  onDismiss: () => void
  onRetry?: () => void
  className?: string
}

export function ErrorToast({ error, onDismiss, onRetry, className }: ErrorToastProps) {
  const t = useTranslations('ErrorHandling')

  return (
    <Alert variant="destructive" className={cn('w-full max-w-md', className)}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{t('errorOccurred')}</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="text-sm">{error.message}</p>
        <div className="flex gap-2 mt-3">
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RefreshCw className="h-3 w-3 mr-1" />
              {t('retry')}
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={onDismiss}>
            <X className="h-3 w-3 mr-1" />
            {t('dismiss')}
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

interface ErrorStateProps {
  error: Error | null
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
  title?: string
  description?: string
  showDetails?: boolean
}

export function ErrorState({
  error,
  onRetry,
  onDismiss,
  className,
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  showDetails = false
}: ErrorStateProps) {
  const t = useTranslations('ErrorHandling')

  if (!error) return null

  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            
            {showDetails && (
              <details className="text-left">
                <summary className="cursor-pointer text-sm font-medium">
                  {t('technicalDetails')}
                </summary>
                <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                  {error.message}
                </pre>
              </details>
            )}

            <div className="flex gap-2">
              {onRetry && (
                <Button onClick={onRetry} className="flex-1">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {t('retry')}
                </Button>
              )}
              {onDismiss && (
                <Button variant="outline" onClick={onDismiss} className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  {t('dismiss')}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface LoadingStateProps {
  message?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingState({
  message = 'Loading...',
  className,
  size = 'md'
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className="text-center space-y-4">
        <div className="mx-auto">
          <div className={cn(
            'animate-spin rounded-full border-2 border-primary border-t-transparent',
            sizeClasses[size]
          )} />
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

interface EmptyStateProps {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className="text-center space-y-4">
        {icon && (
          <div className="mx-auto w-12 h-12 text-muted-foreground">
            {icon}
          </div>
        )}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  )
}

interface SuccessStateProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function SuccessState({
  title,
  description,
  action,
  className
}: SuccessStateProps) {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-6 w-6 text-green-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-green-900">{title}</h3>
          {description && (
            <p className="text-sm text-green-700">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  )
}

interface InfoStateProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function InfoState({
  title,
  description,
  action,
  className
}: InfoStateProps) {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className="text-center space-y-4">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Info className="h-6 w-6 text-blue-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-blue-900">{title}</h3>
          {description && (
            <p className="text-sm text-blue-700">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  )
}

// Hook for error handling
export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null)

  const handleError = (error: Error) => {
    setError(error)
    console.error('Error caught by useErrorHandler:', error)
  }

  const clearError = () => {
    setError(null)
  }

  const resetError = () => {
    setError(null)
    window.location.reload()
  }

  return {
    error,
    handleError,
    clearError,
    resetError
  }
}

// Hook for async operations with error handling
export function useAsyncOperation<T>() {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const execute = async (operation: () => Promise<T>) => {
    try {
      setLoading(true)
      setError(null)
      const result = await operation()
      setData(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unknown error occurred')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setData(null)
    setError(null)
    setLoading(false)
  }

  return {
    data,
    loading,
    error,
    execute,
    reset
  }
}
