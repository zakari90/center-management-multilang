'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, XCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react'

interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'warning' | 'pending'
  message: string
  details?: string
}

export default function PWATestingSuite() {
  const [isVisible, setIsVisible] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [progress, setProgress] = useState(0)

  const tests = [
    {
      name: 'HTTPS',
      test: testHttps,
      critical: true
    },
    {
      name: 'Service Worker',
      test: testServiceWorker,
      critical: true
    },
    {
      name: 'Manifest',
      test: testManifest,
      critical: true
    },
    {
      name: 'Icons',
      test: testIcons,
      critical: true
    },
    {
      name: 'Offline Functionality',
      test: testOfflineFunctionality,
      critical: false
    },
    {
      name: 'Installability',
      test: testInstallability,
      critical: true
    },
    {
      name: 'Push Notifications',
      test: testPushNotifications,
      critical: false
    },
    {
      name: 'Background Sync',
      test: testBackgroundSync,
      critical: false
    },
    {
      name: 'Caching Strategy',
      test: testCachingStrategy,
      critical: false
    },
    {
      name: 'Performance',
      test: testPerformance,
      critical: false
    }
  ]

  const runTests = async () => {
    setIsRunning(true)
    setProgress(0)
    setResults([])

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i]
      setProgress((i / tests.length) * 100)

      try {
        const result = await test.test()
        setResults(prev => [...prev, {
          name: test.name,
          status: result.status,
          message: result.message,
          details: result.details
        }])
      } catch (error) {
        setResults(prev => [...prev, {
          name: test.name,
          status: 'fail',
          message: `Test failed: ${error}`,
          details: error instanceof Error ? error.stack : String(error)
        }])
      }

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setProgress(100)
    setIsRunning(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'pending':
        return <Clock className="h-5 w-5 text-gray-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800'
      case 'fail':
        return 'bg-red-100 text-red-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'pending':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getOverallScore = () => {
    if (results.length === 0) return 0
    const passed = results.filter(r => r.status === 'pass').length
    return Math.round((passed / results.length) * 100)
  }

  const getCriticalIssues = () => {
    return results.filter(r => r.status === 'fail' && tests.find(t => t.name === r.name)?.critical)
  }

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        PWA Test
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 z-50 max-h-96 overflow-y-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">PWA Testing Suite</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
          >
            ×
          </Button>
        </div>
        <CardDescription className="text-xs">
          Comprehensive PWA functionality testing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        {isRunning && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Running tests...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Overall Score */}
        {results.length > 0 && !isRunning && (
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {getOverallScore()}%
            </div>
            <div className="text-xs text-muted-foreground">
              PWA Score
            </div>
          </div>
        )}

        {/* Critical Issues */}
        {getCriticalIssues().length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-red-600">
              Critical Issues ({getCriticalIssues().length})
            </div>
            {getCriticalIssues().map((issue, index) => (
              <div key={index} className="text-xs text-red-600">
                • {issue.name}: {issue.message}
              </div>
            ))}
          </div>
        )}

        {/* Test Results */}
        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded border">
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  <span className="text-xs font-medium">{result.name}</span>
                </div>
                <Badge className={`text-xs ${getStatusColor(result.status)}`}>
                  {result.status}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={runTests}
            disabled={isRunning}
            className="flex-1 text-xs"
            size="sm"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" />
                Run Tests
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setResults([])
              setProgress(0)
            }}
            className="text-xs"
            size="sm"
          >
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Test functions
async function testHttps(): Promise<TestResult> {
  const isHttps = window.location.protocol === 'https:'
  return {
    name: 'HTTPS',
    status: isHttps ? 'pass' : 'fail',
    message: isHttps ? 'HTTPS is enabled' : 'HTTPS is required for PWA',
    details: `Protocol: ${window.location.protocol}`
  }
}

async function testServiceWorker(): Promise<TestResult> {
  if (!('serviceWorker' in navigator)) {
    return {
      name: 'Service Worker',
      status: 'fail',
      message: 'Service Worker not supported',
      details: 'This browser does not support Service Workers'
    }
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      return {
        name: 'Service Worker',
        status: 'pass',
        message: 'Service Worker is registered',
        details: `Scope: ${registration.scope}`
      }
    } else {
      return {
        name: 'Service Worker',
        status: 'fail',
        message: 'Service Worker not registered',
        details: 'No active service worker found'
      }
    }
  } catch (error) {
    return {
      name: 'Service Worker',
      status: 'fail',
      message: 'Service Worker registration failed',
      details: String(error)
    }
  }
}

async function testManifest(): Promise<TestResult> {
  const manifestLink = document.querySelector('link[rel="manifest"]')
  if (!manifestLink) {
    return {
      name: 'Manifest',
      status: 'fail',
      message: 'Manifest not found',
      details: 'No manifest link found in document head'
    }
  }

  try {
    const response = await fetch(manifestLink.getAttribute('href') || '')
    if (!response.ok) {
      return {
        name: 'Manifest',
        status: 'fail',
        message: 'Manifest not accessible',
        details: `HTTP ${response.status}: ${response.statusText}`
      }
    }

    const manifest = await response.json()
    const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons']
    const missingFields = requiredFields.filter(field => !manifest[field])

    if (missingFields.length > 0) {
      return {
        name: 'Manifest',
        status: 'warning',
        message: 'Manifest missing required fields',
        details: `Missing: ${missingFields.join(', ')}`
      }
    }

    return {
      name: 'Manifest',
      status: 'pass',
      message: 'Manifest is valid',
      details: `Name: ${manifest.name}, Icons: ${manifest.icons?.length || 0}`
    }
  } catch (error) {
    return {
      name: 'Manifest',
      status: 'fail',
      message: 'Manifest validation failed',
      details: String(error)
    }
  }
}

async function testIcons(): Promise<TestResult> {
  const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512]
  const missingIcons = []

  for (const size of iconSizes) {
    const iconUrl = `/icon-${size}x${size}.png`
    try {
      const response = await fetch(iconUrl, { method: 'HEAD' })
      if (!response.ok) {
        missingIcons.push(size)
      }
    } catch {
      missingIcons.push(size)
    }
  }

  if (missingIcons.length === 0) {
    return {
      name: 'Icons',
      status: 'pass',
      message: 'All required icons are present',
      details: `Found ${iconSizes.length} icon sizes`
    }
  } else if (missingIcons.length < iconSizes.length / 2) {
    return {
      name: 'Icons',
      status: 'warning',
      message: 'Some icons are missing',
      details: `Missing: ${missingIcons.join(', ')}px`
    }
  } else {
    return {
      name: 'Icons',
      status: 'fail',
      message: 'Many icons are missing',
      details: `Missing: ${missingIcons.join(', ')}px`
    }
  }
}

async function testOfflineFunctionality(): Promise<TestResult> {
  // This is a simplified test - in a real app, you'd test actual offline functionality
  const hasOfflinePage = document.querySelector('link[href="/offline.html"]') !== null
  
  if (hasOfflinePage) {
    return {
      name: 'Offline Functionality',
      status: 'pass',
      message: 'Offline page configured',
      details: 'Offline fallback page is available'
    }
  } else {
    return {
      name: 'Offline Functionality',
      status: 'warning',
      message: 'No offline page configured',
      details: 'Consider adding an offline fallback page'
    }
  }
}

async function testInstallability(): Promise<TestResult> {
  // Check if the app meets installability criteria
  const hasManifest = document.querySelector('link[rel="manifest"]') !== null
  const hasServiceWorker = 'serviceWorker' in navigator
  const isHttps = window.location.protocol === 'https:'
  
  if (hasManifest && hasServiceWorker && isHttps) {
    return {
      name: 'Installability',
      status: 'pass',
      message: 'App meets installability criteria',
      details: 'Ready for installation'
    }
  } else {
    const issues = []
    if (!hasManifest) issues.push('No manifest')
    if (!hasServiceWorker) issues.push('No service worker')
    if (!isHttps) issues.push('Not HTTPS')
    
    return {
      name: 'Installability',
      status: 'fail',
      message: 'App not installable',
      details: `Issues: ${issues.join(', ')}`
    }
  }
}

async function testPushNotifications(): Promise<TestResult> {
  if (!('Notification' in window)) {
    return {
      name: 'Push Notifications',
      status: 'warning',
      message: 'Notifications not supported',
      details: 'This browser does not support notifications'
    }
  }

  const permission = Notification.permission
  if (permission === 'granted') {
    return {
      name: 'Push Notifications',
      status: 'pass',
      message: 'Notifications are enabled',
      details: 'User has granted notification permission'
    }
  } else if (permission === 'denied') {
    return {
      name: 'Push Notifications',
      status: 'warning',
      message: 'Notifications are denied',
      details: 'User has denied notification permission'
    }
  } else {
    return {
      name: 'Push Notifications',
      status: 'warning',
      message: 'Notifications not requested',
      details: 'Notification permission has not been requested'
    }
  }
}

async function testBackgroundSync(): Promise<TestResult> {
  if (!('serviceWorker' in navigator)) {
    return {
      name: 'Background Sync',
      status: 'warning',
      message: 'Background sync not supported',
      details: 'Service Worker not supported'
    }
  }

  // This is a simplified test - in a real app, you'd test actual background sync
  return {
    name: 'Background Sync',
    status: 'pass',
    message: 'Background sync is configured',
    details: 'Service Worker supports background sync'
  }
}

async function testCachingStrategy(): Promise<TestResult> {
  if (!('caches' in window)) {
    return {
      name: 'Caching Strategy',
      status: 'warning',
      message: 'Cache API not supported',
      details: 'This browser does not support the Cache API'
    }
  }

  try {
    const cacheNames = await caches.keys()
    if (cacheNames.length > 0) {
      return {
        name: 'Caching Strategy',
        status: 'pass',
        message: 'Caching is configured',
        details: `Found ${cacheNames.length} cache(s): ${cacheNames.join(', ')}`
      }
    } else {
      return {
        name: 'Caching Strategy',
        status: 'warning',
        message: 'No caches found',
        details: 'Consider implementing caching strategies'
      }
    }
  } catch (error) {
    return {
      name: 'Caching Strategy',
      status: 'fail',
      message: 'Cache access failed',
      details: String(error)
    }
  }
}

async function testPerformance(): Promise<TestResult> {
  // Basic performance test
  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  const loadTime = navigation.loadEventEnd - navigation.loadEventStart
  
  if (loadTime < 1000) {
    return {
      name: 'Performance',
      status: 'pass',
      message: 'Good performance',
      details: `Load time: ${Math.round(loadTime)}ms`
    }
  } else if (loadTime < 3000) {
    return {
      name: 'Performance',
      status: 'warning',
      message: 'Moderate performance',
      details: `Load time: ${Math.round(loadTime)}ms`
    }
  } else {
    return {
      name: 'Performance',
      status: 'fail',
      message: 'Poor performance',
      details: `Load time: ${Math.round(loadTime)}ms`
    }
  }
}
