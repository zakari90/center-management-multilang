'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function PWADebug() {
  const [info, setInfo] = useState({
    isHttps: false,
    isStandalone: false,
    serviceWorkerSupported: false,
    serviceWorkerRegistered: false,
    manifestLinked: false,
    promptEventFired: false,
  })

  useEffect(() => {
    const checkPWA = async () => {
      // Check HTTPS
      const isHttps = window.location.protocol === 'https:'

      // Check standalone mode
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches

      // Check service worker support
      const serviceWorkerSupported = 'serviceWorker' in navigator

      // Check service worker registration
      let serviceWorkerRegistered = false
      if (serviceWorkerSupported) {
        try {
          const registration = await navigator.serviceWorker.getRegistration()
          serviceWorkerRegistered = !!registration
        } catch (e) {
          console.error('Service worker check failed:', e)
        }
      }

      // Check manifest
      const manifestLinked = !!document.querySelector('link[rel="manifest"]')

      setInfo({
        isHttps,
        isStandalone,
        serviceWorkerSupported,
        serviceWorkerRegistered,
        manifestLinked,
        promptEventFired: false, // Will be updated by event
      })

      // Listen for install prompt
      window.addEventListener('beforeinstallprompt', () => {
        console.log('✅ beforeinstallprompt event FIRED!')
        setInfo(prev => ({ ...prev, promptEventFired: true }))
      })

      // Check after 10 seconds
      setTimeout(() => {
        setInfo(prev => {
          if (!prev.promptEventFired) {
            console.log('❌ beforeinstallprompt did NOT fire after 10 seconds')
          }
          return prev
        })
      }, 10000)
    }

    checkPWA()
  }, [])

  // Only show in development or with ?debug=true
  if (process.env.NODE_ENV === 'production' && !window.location.search.includes('debug=true')) {
    return null
  }

  return (
    <Card className="fixed top-4 right-4 z-50 w-80 shadow-lg">
      <CardHeader>
        <CardTitle className="text-sm">PWA Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span>HTTPS:</span>
          <Badge variant={info.isHttps ? 'default' : 'destructive'}>
            {info.isHttps ? '✓' : '✗'}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span>Standalone Mode:</span>
          <Badge variant={info.isStandalone ? 'default' : 'secondary'}>
            {info.isStandalone ? 'Yes' : 'No'}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span>SW Support:</span>
          <Badge variant={info.serviceWorkerSupported ? 'default' : 'destructive'}>
            {info.serviceWorkerSupported ? '✓' : '✗'}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span>SW Registered:</span>
          <Badge variant={info.serviceWorkerRegistered ? 'default' : 'destructive'}>
            {info.serviceWorkerRegistered ? '✓' : '✗'}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span>Manifest Linked:</span>
          <Badge variant={info.manifestLinked ? 'default' : 'destructive'}>
            {info.manifestLinked ? '✓' : '✗'}
          </Badge>
        </div>
        <div className="flex justify-between">
          <span>Install Prompt:</span>
          <Badge variant={info.promptEventFired ? 'default' : 'destructive'}>
            {info.promptEventFired ? 'Fired' : 'Not Fired'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
