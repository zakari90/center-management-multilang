'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, Download, X } from 'lucide-react'
import { useEffect, useState } from 'react'

// Pages to precache for offline-first experience
const PAGES_TO_PRECACHE = [
  // Auth pages
  '/login',
  '/loginmanager',
  '/register',
  
  // Admin pages
  '/admin',
  '/admin/center',
  '/admin/receipts',
  '/admin/schedule',
  '/admin/users',
  
  // Manager pages
  '/manager',
  '/manager/receipts',
  '/manager/receipts/create',
  '/manager/receipts/create-teacher-payment',
  '/manager/schedule',
  '/manager/students',
  '/manager/students/create',
  '/manager/teachers',
  '/manager/teachers/create',
]

const LOCALES = ['en', 'ar', 'fr']

export default function PagePrecacheHandler() {
  const [isPrecaching, setIsPrecaching] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if we've already precached
    const hasPrecached = localStorage.getItem('pages-precached')
    const lastPrecacheDate = localStorage.getItem('precache-date')
    const dismissed = localStorage.getItem('precache-dismissed')
    
    // Show prompt if:
    // 1. Never precached, OR
    // 2. Precached more than 7 days ago, OR  
    // 3. User hasn't dismissed recently (within 24 hours)
    const daysSincePrecache = lastPrecacheDate 
      ? (new Date().getTime() - new Date(lastPrecacheDate).getTime()) / (1000 * 60 * 60 * 24)
      : Infinity
    
    const hoursSinceDismiss = dismissed
      ? (new Date().getTime() - new Date(dismissed).getTime()) / (1000 * 60 * 60)
      : Infinity
    
    const shouldShowPrompt = (
      (!hasPrecached || daysSincePrecache > 7) && 
      (hoursSinceDismiss > 24 || !dismissed)
    )
    
    if (shouldShowPrompt && 'serviceWorker' in navigator && 'caches' in window) {
      // Wait a bit before showing the prompt (to not overwhelm on first load)
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 5000) // 5 seconds to give user time to settle
      
      return () => clearTimeout(timer)
    }
  }, [])

  const precachePages = async () => {
    setIsPrecaching(true)
    setShowPrompt(false)
    
    try {
      // Ensure service worker is ready
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.ready
      }
      
      // Use the same cache as the service worker
      const cache = await caches.open('pages-v1')
      const totalPages = PAGES_TO_PRECACHE.length * LOCALES.length
      let cachedCount = 0
      let successCount = 0
      let failedPages: string[] = []

      // Get current locale from URL
      const currentPath = window.location.pathname
      const currentLocale = LOCALES.find(locale => currentPath.startsWith(`/${locale}`)) || 'en'

      // Precache current locale first, then others
      const sortedLocales = [currentLocale, ...LOCALES.filter(l => l !== currentLocale)]

      console.log(`[Precache] Starting to cache ${totalPages} pages...`)

      // Precache all pages for all locales
      for (const locale of sortedLocales) {
        for (const page of PAGES_TO_PRECACHE) {
          try {
            const url = `/${locale}${page}`
            
            // Check if already cached
            const existing = await cache.match(url)
            if (existing) {
              console.log(`[Precache] Already cached: ${url}`)
              cachedCount++
              successCount++
              setProgress(Math.round((cachedCount / totalPages) * 100))
              continue
            }
            
            // Try to fetch the page with a timeout
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s timeout for slower connections
            
            console.log(`[Precache] Fetching: ${url}`)
            
            const response = await fetch(url, {
              method: 'GET',
              credentials: 'same-origin',
              signal: controller.signal,
              cache: 'no-cache', // Force fresh fetch for caching
            })
            
            clearTimeout(timeoutId)
            
            if (response.ok && response.status === 200) {
              // Clone the response before caching (responses can only be read once)
              const responseClone = response.clone()
              
              // Store in cache
              await cache.put(url, responseClone)
              
              // Verify it was cached
              const verified = await cache.match(url)
              if (verified) {
                console.log(`[Precache] ✓ Cached: ${url}`)
                successCount++
              } else {
                console.warn(`[Precache] ✗ Failed to verify cache: ${url}`)
                failedPages.push(url)
              }
            } else {
              console.warn(`[Precache] ✗ Bad response (${response.status}): ${url}`)
              failedPages.push(url)
            }
            
            cachedCount++
            setProgress(Math.round((cachedCount / totalPages) * 100))
            
            // Small delay to prevent overwhelming the browser/network
            await new Promise(resolve => setTimeout(resolve, 200))
          } catch (error) {
            const url = `/${locale}${page}`
            console.warn(`[Precache] ✗ Failed to cache ${url}:`, error)
            failedPages.push(url)
            cachedCount++
            setProgress(Math.round((cachedCount / totalPages) * 100))
          }
        }
      }

      // Verify cached pages count
      const allCached = await cache.keys()
      const cachedPages = allCached.filter(req => {
        const url = new URL(req.url)
        return sortedLocales.some(locale => url.pathname.startsWith(`/${locale}/`))
      }).length

      // Mark as complete
      localStorage.setItem('pages-precached', 'true')
      localStorage.setItem('precache-date', new Date().toISOString())
      localStorage.setItem('precache-count', successCount.toString())
      localStorage.setItem('precache-total', totalPages.toString())
      
      if (failedPages.length > 0) {
        localStorage.setItem('precache-failed', JSON.stringify(failedPages))
      }
      
      setIsComplete(true)
      
      console.log(`[Precache] Complete! Successfully cached ${successCount} of ${totalPages} pages`)
      console.log(`[Precache] Verified cache has ${cachedPages} pages`)
      if (failedPages.length > 0) {
        console.warn(`[Precache] Failed pages:`, failedPages)
      }
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        setShowPrompt(false)
        setIsPrecaching(false)
      }, 5000)
      
    } catch (error) {
      console.error('[Precache] Error precaching pages:', error)
      setIsPrecaching(false)
      setShowPrompt(true) // Show prompt again on error
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Store dismiss time so we don't show again too soon
    localStorage.setItem('precache-dismissed', new Date().toISOString())
  }

  const handleStartPrecache = () => {
    precachePages()
  }

  // Check if user wants to manually trigger precaching
  const canTriggerManually = () => {
    const dismissed = localStorage.getItem('precache-dismissed')
    if (dismissed) {
      const dismissedTime = new Date(dismissed).getTime()
      const hoursSinceDismiss = (new Date().getTime() - dismissedTime) / (1000 * 60 * 60)
      return hoursSinceDismiss > 24 // Allow after 24 hours
    }
    return true
  }

  if (!showPrompt && !isPrecaching) return null

  return (
    <Card className="fixed bottom-4 right-4 w-96 z-50 shadow-lg border-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {isComplete ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              Ready for Offline Use!
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              {isPrecaching ? 'Downloading Pages...' : 'Enable Offline Access'}
            </>
          )}
        </CardTitle>
        <CardDescription>
          {isComplete
            ? `All pages cached successfully! Ready for offline use.`
            : isPrecaching
            ? `Caching pages for offline use (${progress}%)`
            : 'Download all pages to use the app without internet'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {isPrecaching || isComplete ? (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>{progress}% complete</span>
              {isPrecaching && (
                <span>
                  {Math.round((PAGES_TO_PRECACHE.length * LOCALES.length * progress) / 100)} / {PAGES_TO_PRECACHE.length * LOCALES.length}
                </span>
              )}
            </div>
            {isComplete && (
              <p className="text-xs text-green-600 dark:text-green-400 text-center mt-1">
                ✓ Pages stored in cache and ready for offline use
              </p>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <Button 
              onClick={handleStartPrecache}
              className="flex-1"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Now
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

