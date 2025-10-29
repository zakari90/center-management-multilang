/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { cn } from '@/lib/utils'
import React, { ReactNode, Suspense, lazy, ComponentType, useEffect, useState, useMemo, useRef, ErrorInfo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Button } from './button'
import { Badge } from './badge'
import { Skeleton } from './skeleton'
import { Loader2, Zap, Wifi, WifiOff } from 'lucide-react'
import { ErrorBoundary } from './error-handling'

// Lazy loading wrapper with error boundary
interface LazyWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  errorFallback?: ComponentType<ErrorFallbackProps>
  delay?: number
  className?: string
}

interface ErrorFallbackProps {
  error: Error
  errorInfo: ErrorInfo
  errorId: string
  resetError: () => void
  retry: () => void
}

export function LazyWrapper({
  children,
  fallback = <DefaultFallback />,
  errorFallback,
  delay = 200,
  className
}: LazyWrapperProps) {
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  if (!showContent) {
    return <div className={className}>{fallback}</div>
  }

  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>
        <div className={className}>{children}</div>
      </Suspense>
    </ErrorBoundary>
  )
}

// Default loading fallback
function DefaultFallback() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

// Skeleton fallback for different content types
interface SkeletonFallbackProps {
  type?: 'card' | 'list' | 'table' | 'form' | 'chart'
  count?: number
  className?: string
}

export function SkeletonFallback({
  type = 'card',
  count = 1,
  className
}: SkeletonFallbackProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <Card className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          </Card>
        )
      case 'list':
        return (
          <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )
      case 'table':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            ))}
          </div>
        )
      case 'form':
        return (
          <div className="space-y-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        )
      case 'chart':
        return (
          <div className="space-y-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-64 w-full" />
            <div className="flex justify-center space-x-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        )
      default:
        return <Skeleton className="h-20 w-full" />
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{renderSkeleton()}</div>
      ))}
    </div>
  )
}

// Performance monitoring component
interface PerformanceMonitorProps {
  className?: string
  showMetrics?: boolean
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void
}

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  memoryUsage: number
  networkStatus: 'online' | 'offline'
  connectionType: string
  effectiveType: string
  downlink: number
  rtt: number
}

export function PerformanceMonitor({
  className,
  showMetrics = false,
  onMetricsUpdate
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    networkStatus: 'online',
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0
  })

  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const startTime = performance.now()

    // Measure load time
    const measureLoadTime = () => {
      const loadTime = performance.now() - startTime
      setMetrics(prev => ({ ...prev, loadTime }))
    }

    // Measure render time
    const measureRenderTime = () => {
      const renderTime = performance.now() - startTime
      setMetrics(prev => ({ ...prev, renderTime }))
    }

    // Get memory usage
    const getMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as Record<string, any>).memory
        const memoryUsage = memory.usedJSHeapSize / 1024 / 1024 // MB
        setMetrics(prev => ({ ...prev, memoryUsage }))
      }
    }

    // Get network information
    const getNetworkInfo = () => {
      const connection = (navigator as Record<string, any>).connection || 
                       (navigator as Record<string, any>).mozConnection || 
                       (navigator as Record<string, any>).webkitConnection

      if (connection) {
        setMetrics(prev => ({
          ...prev,
          connectionType: connection.type || 'unknown',
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0
        }))
      }
    }

    // Listen for online/offline events
    const handleOnline = () => {
      setMetrics(prev => ({ ...prev, networkStatus: 'online' }))
    }

    const handleOffline = () => {
      setMetrics(prev => ({ ...prev, networkStatus: 'offline' }))
    }

    // Initial measurements
    measureLoadTime()
    measureRenderTime()
    getMemoryUsage()
    getNetworkInfo()

    // Set up event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Update metrics periodically
    const interval = setInterval(() => {
      getMemoryUsage()
      getNetworkInfo()
    }, 5000)

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    onMetricsUpdate?.(metrics)
  }, [metrics, onMetricsUpdate])

  if (!showMetrics) return null

  return (
    <div className={cn('fixed bottom-4 right-4 z-50', className)}>
      <Button
        onClick={() => setIsVisible(!isVisible)}
        className="rounded-full h-12 w-12 shadow-lg"
        aria-label="Toggle performance metrics"
      >
        <Zap className="h-5 w-5" />
      </Button>

      {isVisible && (
        <Card className="absolute bottom-16 right-0 w-80 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
            <CardDescription>
              Real-time performance monitoring
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Load Time:</span>
                <Badge variant="secondary" className="ml-2">
                  {metrics.loadTime.toFixed(2)}ms
                </Badge>
              </div>
              <div>
                <span className="font-medium">Render Time:</span>
                <Badge variant="secondary" className="ml-2">
                  {metrics.renderTime.toFixed(2)}ms
                </Badge>
              </div>
              <div>
                <span className="font-medium">Memory:</span>
                <Badge variant="secondary" className="ml-2">
                  {metrics.memoryUsage.toFixed(2)}MB
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Network:</span>
                {metrics.networkStatus === 'online' ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <Badge variant={metrics.networkStatus === 'online' ? 'default' : 'destructive'}>
                  {metrics.networkStatus}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Connection:</span>
                <Badge variant="outline" className="ml-2">
                  {metrics.connectionType}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Speed:</span>
                <Badge variant="outline" className="ml-2">
                  {metrics.downlink}Mbps
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Virtual scrolling component for large lists
interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => ReactNode
  className?: string
  overscan?: number
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
  overscan = 5
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight)
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    )
    return { start, end }
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length])

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end)
  }, [items, visibleRange])

  const totalHeight = items.length * itemHeight
  const offsetY = visibleRange.start * itemHeight

  return (
    <div
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={visibleRange.start + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Image lazy loading component
interface LazyImageProps {
  src: string
  alt: string
  className?: string
  placeholder?: string
  fallback?: string
  onLoad?: () => void
  onError?: () => void
}

export function LazyImage({
  src,
  alt,
  className,
  placeholder,
  fallback,
  onLoad,
  onError
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setIsError(true)
    onError?.()
  }

  return (
    <div ref={imgRef} className={cn('relative overflow-hidden', className)}>
      {!isInView && placeholder && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      {isInView && (
        <img
          src={isError ? fallback : src}
          alt={alt}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      
      {!isLoaded && !isError && isInView && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
    </div>
  )
}

// Code splitting utility
export function createLazyComponent<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: ReactNode
) {
  const LazyComponent = lazy(importFunc)
  
  return function WrappedLazyComponent(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <DefaultFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

// Memoized component wrapper
export function withMemo<T extends ComponentType<any>>(
  Component: T,
  areEqual?: (prevProps: Readonly<React.ComponentProps<T>>, nextProps: Readonly<React.ComponentProps<T>>) => boolean
) {
  return React.memo(Component, areEqual)
}

// Debounced hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Throttled hook
export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastExecuted = useRef<number>(Date.now())

  useEffect(() => {
    if (Date.now() >= lastExecuted.current + delay) {
      lastExecuted.current = Date.now()
      setThrottledValue(value)
    } else {
      const timer = setTimeout(() => {
        lastExecuted.current = Date.now()
        setThrottledValue(value)
      }, delay)

      return () => clearTimeout(timer)
    }
  }, [value, delay])

  return throttledValue
}

// Intersection observer hook
export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      options
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [elementRef, options])

  return isIntersecting
}

// Performance optimization hook
export function usePerformanceOptimization() {
  const [isSlowConnection, setIsSlowConnection] = useState(false)
  const [isLowEndDevice, setIsLowEndDevice] = useState(false)

  useEffect(() => {
    // Check connection speed
    const connection = (navigator as Record<string, any>).connection
    if (connection) {
      const isSlow = connection.effectiveType === 'slow-2g' || 
                    connection.effectiveType === '2g' ||
                    connection.downlink < 1
      setIsSlowConnection(isSlow)
    }

    // Check device capabilities
    const isLowEnd = (navigator as Record<string, any>).deviceMemory < 4 || 
                     (navigator as Record<string, any>).hardwareConcurrency < 4
    setIsLowEndDevice(isLowEnd)
  }, [])

  return {
    isSlowConnection,
    isLowEndDevice,
    shouldReduceAnimations: isSlowConnection || isLowEndDevice,
    shouldLazyLoad: isSlowConnection || isLowEndDevice,
    shouldReduceQuality: isSlowConnection
  }
}
