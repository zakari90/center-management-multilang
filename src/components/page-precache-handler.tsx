'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CheckCircle, Download, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

// Pages to precache for offline-first experience
const BASE_PAGES_TO_PRECACHE = [
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

function readVisitedPages(): string[] {
  try {
    const raw = localStorage.getItem('visited-pages')
    const parsed = raw ? (JSON.parse(raw) as unknown) : []
    if (!Array.isArray(parsed)) return []
    return parsed.filter((p) => typeof p === 'string') as string[]
  } catch {
    return []
  }
}

export default function PagePrecacheHandler() {
  const [isPrecaching, setIsPrecaching] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const hasAutoStarted = useRef(false)

  const basePagesCount = BASE_PAGES_TO_PRECACHE.length
  const totalPageCount = basePagesCount * LOCALES.length

  useEffect(() => {
    // Check if we've already precached
    const hasPrecached = localStorage.getItem('pages-precached')
    const lastPrecacheDate = localStorage.getItem('precache-date')
    const dismissed = localStorage.getItem('precache-dismissed')
    console.log('[Precache] boot', {
      hasPrecached,
      lastPrecacheDate,
      dismissed,
      onLine: navigator.onLine,
      hasServiceWorker: 'serviceWorker' in navigator,
      hasCaches: 'caches' in window,
      pathname: typeof window !== 'undefined' ? window.location.pathname : null,
    })
    
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
    console.log('[Precache] prompt decision', {
      shouldShowPrompt,
      hasPrecached,
      daysSincePrecache,
      hoursSinceDismiss,
    })
    
    if (shouldShowPrompt && 'serviceWorker' in navigator && 'caches' in window) {
      const timer = setTimeout(() => {
        console.log('[Precache] show prompt')
        setShowPrompt(true)
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!showPrompt) return
    if (isPrecaching || isComplete) return
    if (hasAutoStarted.current) return
    if (!navigator.onLine) return
    if (!('serviceWorker' in navigator) || !('caches' in window)) return

    hasAutoStarted.current = true
    console.log('[Precache] auto-starting precachePages()')
    precachePages()
  }, [showPrompt, isPrecaching, isComplete])

  const precachePages = async () => {
    setIsPrecaching(true)
    setShowPrompt(false)
    
    try {
      // Ensure service worker is ready
      if ('serviceWorker' in navigator) {
        console.log('[Precache] service worker state', {
          hasController: !!navigator.serviceWorker.controller,
        })
        console.log('[Precache] waiting for service worker ready...')
        const readyResult = await Promise.race([
          navigator.serviceWorker.ready.then(() => 'ready' as const),
          new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), 4000)),
        ])
        console.log('[Precache] service worker ready result', { readyResult })
        if (readyResult === 'timeout') {
          const reg = await navigator.serviceWorker.getRegistration().catch(() => null)
          console.log('[Precache] service worker registration (timeout fallback)', {
            hasRegistration: !!reg,
            scope: (reg as any)?.scope ?? null,
            active: !!(reg as any)?.active,
            installing: !!(reg as any)?.installing,
            waiting: !!(reg as any)?.waiting,
          })
        }
      }
      
      // Use the same cache as the service worker
      const cache = await caches.open('pages-cache-v1')
      const assetsCache = await caches.open('assets-v1')
      const beforeKeys = await cache.keys().catch(() => [])
      console.log('[Precache] opened cache pages-v1', { beforeCount: beforeKeys.length })
      const beforeAssetKeys = await assetsCache.keys().catch(() => [])
      console.log('[Precache] opened cache assets-v1', { beforeCount: beforeAssetKeys.length })
      const visitedPages = readVisitedPages()
      const visitedBasePages = visitedPages
        .map((p) => {
          // Store base (locale-agnostic) paths for caching across locales
          const match = p.match(/^\/(en|ar|fr)(\/.*)?$/)
          return match ? (match[2] || '/') : p
        })
        .filter((p) => typeof p === 'string' && p.startsWith('/'))

      const uniqueBasePages = Array.from(new Set([...BASE_PAGES_TO_PRECACHE, ...visitedBasePages]))

      const totalPages = uniqueBasePages.length * LOCALES.length
      let cachedCount = 0
      let successCount = 0
      const failedPages: string[] = []

      // Get current locale from URL
      const currentPath = window.location.pathname
      const currentLocale = LOCALES.find(locale => currentPath.startsWith(`/${locale}`)) || 'en'

      // Precache current locale first, then others
      const sortedLocales = [currentLocale, ...LOCALES.filter(l => l !== currentLocale)]

      console.log(`[Precache] Starting to cache ${totalPages} pages...`)
      console.log('[Precache] locales order', { currentLocale, sortedLocales })
      console.log('[Precache] visited pages', { count: visitedPages.length })
      console.log('[Precache] base pages to cache', { count: uniqueBasePages.length })

      // Precache all pages for all locales
      for (const locale of sortedLocales) {
        for (const basePath of uniqueBasePages) {
          try {
            const url = `/${locale}${basePath}`

            // Safety: never request non-locale routes when localePrefix is "always"
            const hasLocalePrefix = LOCALES.some((loc) => url === `/${loc}` || url.startsWith(`/${loc}/`))
            if (!hasLocalePrefix) {
              console.warn('[Precache] Skipping non-locale page:', url)
              cachedCount++
              setProgress(Math.round((cachedCount / totalPages) * 100))
              continue
            }
            
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

            const contentType = response.headers.get('content-type')
            console.log('[Precache] fetch result', {
              url,
              status: response.status,
              ok: response.ok,
              redirected: response.redirected,
              finalUrl: response.url,
              contentType,
            })
            
            if (response.ok && response.status === 200) {
              // Extract Next.js static assets from HTML and cache them too.
              // Without these JS/CSS chunks, offline navigation will render HTML but the app won't hydrate.
              if (contentType?.includes('text/html')) {
                try {
                  const html = await response.clone().text()
                  const matches = Array.from(
                    html.matchAll(/(?:src|href)=(?:"|')([^"']+)(?:"|')/g),
                  )
                    .map((m) => m[1])
                    .filter((u) => u && typeof u === 'string')

                  const assetUrls = Array.from(
                    new Set(
                      matches
                        .filter((u) => u.startsWith('/_next/static/'))
                        .map((u) => u.split('?')[0]),
                    ),
                  )

                  if (assetUrls.length > 0) {
                    console.log('[Precache] discovered assets', {
                      page: url,
                      count: assetUrls.length,
                    })
                  }

                  for (const assetPath of assetUrls) {
                    try {
                      const already = await assetsCache.match(assetPath)
                      if (already) continue

                      const assetRes = await fetch(assetPath, {
                        method: 'GET',
                        credentials: 'same-origin',
                        cache: 'no-cache',
                      })
                      if (assetRes.ok) {
                        await assetsCache.put(assetPath, assetRes.clone())
                      } else {
                        console.warn('[Precache] asset fetch bad status', {
                          assetPath,
                          status: assetRes.status,
                        })
                      }
                    } catch (assetErr) {
                      console.warn('[Precache] asset fetch failed', { assetPath, assetErr })
                    }
                  }
                } catch (parseErr) {
                  console.warn('[Precache] failed to parse html for assets', { url, parseErr })
                }
              }

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
            const url = `/${locale}${basePath}`
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
      console.log('[Precache] cache keys after', { afterCount: allCached.length })

      const allAssets = await assetsCache.keys().catch(() => [])
      console.log('[Precache] assets cache keys after', { afterCount: allAssets.length })

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
  // const canTriggerManually = () => {
  //   const dismissed = localStorage.getItem('precache-dismissed')
  //   if (dismissed) {
  //     const dismissedTime = new Date(dismissed).getTime()
  //     const hoursSinceDismiss = (new Date().getTime() - dismissedTime) / (1000 * 60 * 60)
  //     return hoursSinceDismiss > 24 // Allow after 24 hours
  //   }
  //   return true
  // }

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
                  {Math.round((totalPageCount * progress) / 100)} / {totalPageCount}
                </span>
              )}
            </div>
            {isComplete && (
              <p className="text-xs text-green-600 dark:text-green-400 text-center mt-1">
                {/* ✓ Pages stored in cache and ready for offline use */}
                <CheckCircle className="h-5 w-5 text-green-500" />
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
              {/* Download Now */}
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

