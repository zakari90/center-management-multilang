'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X, Share } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useTranslations } from 'next-intl'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPWA() {
  const t = useTranslations('InstallPWA')
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase()
    const iOS = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(iOS)

    const standalone = window.matchMedia('(display-mode: standalone)').matches
    setIsStandalone(standalone)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    if (iOS && !standalone) {
      const timer = setTimeout(() => {
        setShowInstall(true)
      }, 30000)

      return () => {
        window.removeEventListener('beforeinstallprompt', handler)
        clearTimeout(timer)
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setShowInstall(false)
    }
  }

  if (isStandalone) return null
  if (!showInstall) return null

  return (
    <Alert className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 border-primary bg-background shadow-lg">
      <Download className="h-4 w-4" />
      <AlertDescription className="flex flex-col gap-3">
        <span className="text-sm">
          {isIOS ? t('iosInstructions') : t('installMessage')}
        </span>
        <div className="flex gap-2">
          {isIOS ? (
            <Button size="sm" variant="outline" className="flex items-center gap-2">
              <Share className="h-4 w-4" />
              {t('instructions')}
            </Button>
          ) : (
            <Button size="sm" onClick={handleInstall}>
              {t('install')}
            </Button>
          )}
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setShowInstall(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
