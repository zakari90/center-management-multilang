'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstall, setShowInstall] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
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

  if (!showInstall) return null

  return (
    <Alert className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-50 border-primary">
      <Download className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between gap-2">
        <span className="text-sm">تثبيت التطبيق للحصول على تجربة أفضل</span>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleInstall}>
            تثبيت
          </Button>
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
