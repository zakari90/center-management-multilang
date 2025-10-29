'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
  const t = useTranslations('PWAUpdate')
  const [isPrecaching, setIsPrecaching] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    // Check if we've already precached
    const hasPrecached = localStorage.getItem('pages-precached')
    const lastPrecacheDate = localStorage.getItem('precache-date')
    
    // Show prompt if never precached or if precached more than 7 days ago
    const shouldShowPrompt = !hasPrecached || (lastPrecacheDate && 
      (new Date().getTime() - new Date(lastPrecacheDate).getTime()) > 7 * 24 * 60 * 60 * 1000)
    
    if (shouldShowPrompt && 'serviceWorker' in navigator && 'caches' in window) {
      // Wait a bit before showing the prompt (to not overwhelm on first load)
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 5000) // Increased to 5 seconds to give user time to settle
      
      return () => clearTimeout(timer)
    }
  }, [])

  const precachePages = async () => {
    setIsPrecaching(true)
    setShowPrompt(false)
    
    try {
      const cache = await caches.open('offline-pages-v2')
      const totalPages = PAGES_TO_PRECACHE.length * LOCALES.length
      let cachedCount = 0
      let successCount = 0

      // Get current locale from URL
      const currentPath = window.location.pathname
      const currentLocale = LOCALES.find(locale => currentPath.startsWith(`/${locale}`)) || 'en'

      // Precache current locale first, then others
      const sortedLocales = [currentLocale, ...LOCALES.filter(l => l !== currentLocale)]

      // Precache all pages for all locales
      for (const locale of sortedLocales) {
        for (const page of PAGES_TO_PRECACHE) {
          try {
            const url = `/${locale}${page}`
            
            // Try to fetch the page with a timeout
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
            
            const response = await fetch(url, {
              method: 'GET',
              credentials: 'same-origin',
              signal: controller.signal,
            })
            
            clearTimeout(timeoutId)
            
            if (response.ok && response.status === 200) {
              await cache.put(url, response.clone())
              successCount++
            }
            
            cachedCount++
            setProgress(Math.round((cachedCount / totalPages) * 100))
            
            // Small delay to prevent overwhelming the browser
            await new Promise(resolve => setTimeout(resolve, 100))
          } catch (error) {
            console.warn(`Failed to cache ${locale}${page}:`, error)
            cachedCount++ // Still count it to move progress forward
            setProgress(Math.round((cachedCount / totalPages) * 100))
          }
        }
      }

      // Mark as complete
      localStorage.setItem('pages-precached', 'true')
      localStorage.setItem('precache-date', new Date().toISOString())
      localStorage.setItem('precache-count', successCount.toString())
      setIsComplete(true)
      
      console.log(`Successfully precached ${successCount} of ${totalPages} pages`)
      
      // Auto-hide after 3 seconds
      setTimeout(() => {
        setShowPrompt(false)
        setIsPrecaching(false)
      }, 3000)
      
    } catch (error) {
      console.error('Error precaching pages:', error)
      setIsPrecaching(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Don't mark as precached so it prompts again later
  }

  const handleStartPrecache = () => {
    precachePages()
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
            ? 'All pages are now available offline'
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
            <p className="text-xs text-muted-foreground text-center">
              {progress}% complete
            </p>
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

