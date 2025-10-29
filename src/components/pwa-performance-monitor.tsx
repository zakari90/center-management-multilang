/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, Clock, Database, Wifi, WifiOff, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

interface PerformanceMetrics {
  isOnline: boolean
  connectionType: string
  effectiveType: string
  downlink: number
  rtt: number
  cacheSize: number
  lastSync: Date | null
  pendingOperations: number
  memoryUsage: number
  storageQuota: number
  storageUsage: number
}

export default function PWAPerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    isOnline: true,
    connectionType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    cacheSize: 0,
    lastSync: null,
    pendingOperations: 0,
    memoryUsage: 0,
    storageQuota: 0,
    storageUsage: 0
  })
  const [isVisible, setIsVisible] = useState(false)

    const collectMetrics = async () => {
    try {
      // Network information
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      
      // Memory information
      const memory = (performance as any).memory
      
      // Storage information
      const storage = await getStorageInfo()
      
      // Cache information
      const cacheInfo = await getCacheInfo()
      
      // Sync information
      const syncInfo = await getSyncInfo()

      setMetrics({
        isOnline: navigator.onLine,
        connectionType: connection?.type || 'unknown',
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 0,
        rtt: connection?.rtt || 0,
        cacheSize: cacheInfo.size,
        lastSync: syncInfo.lastSync,
        pendingOperations: syncInfo.pendingOperations,
        memoryUsage: memory?.usedJSHeapSize || 0,
        storageQuota: storage.quota,
        storageUsage: storage.usage
      })
    } catch (error) {
      console.error('Error collecting performance metrics:', error)
    }
  }
  useEffect(() => {
    // Check if we're in development mode
    const isDev = process.env.NODE_ENV === 'development'
    if (!isDev) return

    // Initial metrics collection
    collectMetrics()

    // Set up periodic updates
    const interval = setInterval(collectMetrics, 5000)

    // Listen for online/offline events
    const handleOnline = () => {
      setMetrics(prev => ({ ...prev, isOnline: true }))
      collectMetrics()
    }

    const handleOffline = () => {
      setMetrics(prev => ({ ...prev, isOnline: false }))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [collectMetrics])



  const getStorageInfo = async (): Promise<{ quota: number; usage: number }> => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        return {
          quota: estimate.quota || 0,
          usage: estimate.usage || 0
        }
      }
    } catch (error) {
      console.error('Error getting storage info:', error)
    }
    return { quota: 0, usage: 0 }
  }

  const getCacheInfo = async (): Promise<{ size: number }> => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        let totalSize = 0
        
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName)
          const keys = await cache.keys()
          totalSize += keys.length
        }
        
        return { size: totalSize }
      }
    } catch (error) {
      console.error('Error getting cache info:', error)
    }
    return { size: 0 }
  }

  const getSyncInfo = async (): Promise<{ lastSync: Date | null; pendingOperations: number }> => {
    try {
      // This would typically read from IndexedDB
      // For now, return mock data
      return {
        lastSync: new Date(),
        pendingOperations: 0
      }
    } catch (error) {
      console.error('Error getting sync info:', error)
      return { lastSync: null, pendingOperations: 0 }
    }
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatTime = (date: Date | null): string => {
    if (!date) return 'Never'
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const getConnectionQuality = (): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (metrics.effectiveType === '4g' && metrics.downlink > 10) return 'excellent'
    if (metrics.effectiveType === '4g' && metrics.downlink > 5) return 'good'
    if (metrics.effectiveType === '3g' || (metrics.effectiveType === '4g' && metrics.downlink > 1)) return 'fair'
    return 'poor'
  }

  const getConnectionColor = (quality: string): string => {
    switch (quality) {
      case 'excellent': return 'text-green-500'
      case 'good': return 'text-blue-500'
      case 'fair': return 'text-yellow-500'
      case 'poor': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 z-50"
      >
        <Activity className="h-4 w-4 mr-2" />
        PWA Debug
      </Button>
    )
  }

  const connectionQuality = getConnectionQuality()

  return (
    <Card className="fixed bottom-4 left-4 w-80 z-50 max-h-96 overflow-y-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">PWA Performance</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
          >
            ×
          </Button>
        </div>
        <CardDescription className="text-xs">
          Real-time PWA performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {metrics.isOnline ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm font-medium">
              {metrics.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <Badge 
            variant="outline" 
            className={getConnectionColor(connectionQuality)}
          >
            {connectionQuality}
          </Badge>
        </div>

        {/* Connection Details */}
        {metrics.isOnline && (
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Type:</span>
              <span>{metrics.effectiveType.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span>Speed:</span>
              <span>{metrics.downlink} Mbps</span>
            </div>
            <div className="flex justify-between">
              <span>Latency:</span>
              <span>{metrics.rtt}ms</span>
            </div>
          </div>
        )}

        {/* Cache Information */}
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-blue-500" />
          <div className="flex-1">
            <div className="text-xs font-medium">Cache</div>
            <div className="text-xs text-gray-500">
              {metrics.cacheSize} items cached
            </div>
          </div>
        </div>

        {/* Sync Information */}
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-purple-500" />
          <div className="flex-1">
            <div className="text-xs font-medium">Last Sync</div>
            <div className="text-xs text-gray-500">
              {formatTime(metrics.lastSync)}
            </div>
          </div>
          {metrics.pendingOperations > 0 && (
            <Badge variant="destructive" className="text-xs">
              {metrics.pendingOperations} pending
            </Badge>
          )}
        </div>

        {/* Memory Usage */}
        {metrics.memoryUsage > 0 && (
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <div className="flex-1">
              <div className="text-xs font-medium">Memory</div>
              <div className="text-xs text-gray-500">
                {formatBytes(metrics.memoryUsage)}
              </div>
            </div>
          </div>
        )}

        {/* Storage Usage */}
        {metrics.storageQuota > 0 && (
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-indigo-500" />
            <div className="flex-1">
              <div className="text-xs font-medium">Storage</div>
              <div className="text-xs text-gray-500">
                {formatBytes(metrics.storageUsage)} / {formatBytes(metrics.storageQuota)}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                <div 
                  className="bg-indigo-500 h-1 rounded-full" 
                  style={{ 
                    width: `${(metrics.storageUsage / metrics.storageQuota) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={collectMetrics}
            className="flex-1 text-xs"
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if ('caches' in window) {
                caches.keys().then(names => {
                  names.forEach(name => caches.delete(name))
                })
              }
            }}
            className="flex-1 text-xs"
          >
            Clear Cache
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
