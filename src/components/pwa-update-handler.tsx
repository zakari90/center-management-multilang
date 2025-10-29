/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, RefreshCw, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAUpdateHandler() {
  const t = useTranslations('PWAUpdate')
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showUpdate, setShowUpdate] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isInApp = (window.navigator as any).standalone || isStandalone
    setIsInstalled(isInApp)

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      toast.success(t('appInstalled'))
    }

    // Listen for service worker updates
    const handleServiceWorkerUpdate = () => {
      setShowUpdate(true)
      toast.info(t('updateAvailable'))
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', handleServiceWorkerUpdate)
      
      // Check for updates on load
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          registration.addEventListener('updatefound', handleServiceWorkerUpdate)
        }
      })
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleServiceWorkerUpdate)
      }
    }
  }, [t])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    setIsUpdating(true)
    try {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null)
        toast.success(t('installStarted'))
      }
    } catch {
      toast.error(t('installError'))
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdate = async () => {
    setIsUpdating(true)
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          window.location.reload()
        }
      }
    } catch {
      toast.error(t('updateError'))
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDismiss = () => {
    setShowUpdate(false)
  }

  // Don't show if already installed and no update available
  if (isInstalled && !showUpdate && !deferredPrompt) return null

  return (
    <>
      {/* Install Prompt */}
      {deferredPrompt && !isInstalled && (
        <Card className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 border-primary bg-background shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="h-5 w-5" />
              {t('installTitle')}
            </CardTitle>
            <CardDescription>
              {t('installDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-2">
              <Button 
                onClick={handleInstall} 
                disabled={isUpdating}
                className="flex-1"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {t('installing')}
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    {t('install')}
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => setDeferredPrompt(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Update Available */}
      {showUpdate && (
        <Card className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 border-orange-500 bg-orange-50 dark:bg-orange-900/20 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-orange-700 dark:text-orange-300">
              <RefreshCw className="h-5 w-5" />
              {t('updateTitle')}
            </CardTitle>
            <CardDescription className="text-orange-600 dark:text-orange-400">
              {t('updateDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-2">
              <Button 
                onClick={handleUpdate} 
                disabled={isUpdating}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    {t('updating')}
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {t('update')}
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleDismiss}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}
