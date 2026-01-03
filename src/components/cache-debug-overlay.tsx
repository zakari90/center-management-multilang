'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type CacheStatus = {
  isOnline: boolean
  hasSW: boolean
  hasController: boolean
  swScope: string | null
  swActive: boolean
  swWaiting: boolean
  swInstalling: boolean
  swScriptURL: string | null
  pagesCached: boolean
  pagesCacheKey: string | null
  pagesCacheError: string | null
  assetsCount: number | null
  assetsError: string | null
  localeCookie: string | null
  localeNavigator: string | null
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const parts = document.cookie.split(';')
  for (const part of parts) {
    const [k, ...rest] = part.trim().split('=')
    if (k === name) return decodeURIComponent(rest.join('='))
  }
  return null
}

function normalizeLocale(raw: string | null): string | null {
  if (!raw) return null
  return raw.split(',')[0]?.trim()?.split(';')[0]?.trim() || null
}

export default function CacheDebugOverlay() {
  const pathname = usePathname()
  const [status, setStatus] = useState<CacheStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    hasSW: typeof navigator !== 'undefined' ? 'serviceWorker' in navigator : false,
    hasController: typeof navigator !== 'undefined' ? !!navigator.serviceWorker?.controller : false,
    swScope: null,
    swActive: false,
    swWaiting: false,
    swInstalling: false,
    swScriptURL: null,
    pagesCached: false,
    pagesCacheKey: null,
    pagesCacheError: null,
    assetsCount: null,
    assetsError: null,
    localeCookie: null,
    localeNavigator: null,
  })

  const localeCookie = useMemo(() => normalizeLocale(getCookie('NEXT_LOCALE')), [pathname])
  const localeNavigator = useMemo(() => {
    if (typeof navigator === 'undefined') return null
    return normalizeLocale(navigator.languages?.[0] || navigator.language || null)
  }, [pathname])

  useEffect(() => {
    const onOnline = () => setStatus((s) => ({ ...s, isOnline: true }))
    const onOffline = () => setStatus((s) => ({ ...s, isOnline: false }))
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      const hasSW = 'serviceWorker' in navigator
      const hasController = !!navigator.serviceWorker?.controller

      let swScope: string | null = null
      let swActive = false
      let swWaiting = false
      let swInstalling = false
      let swScriptURL: string | null = null
      if (hasSW) {
        const reg = await navigator.serviceWorker.getRegistration().catch(() => null)
        swScope = reg?.scope ?? null
        swActive = !!reg?.active
        swWaiting = !!reg?.waiting
        swInstalling = !!reg?.installing
        swScriptURL = reg?.active?.scriptURL ?? reg?.waiting?.scriptURL ?? reg?.installing?.scriptURL ?? null
      }

      const next: CacheStatus = {
        isOnline: navigator.onLine,
        hasSW,
        hasController,
        swScope,
        swActive,
        swWaiting,
        swInstalling,
        swScriptURL,
        pagesCached: false,
        pagesCacheKey: null,
        pagesCacheError: null,
        assetsCount: null,
        assetsError: null,
        localeCookie,
        localeNavigator,
      }

      try {
        const cache = await caches.open('pages-v1')
        const localeForKey = localeCookie || localeNavigator || 'ar'
        const keyUrl = `${location.origin}${pathname}?__sw_locale=${encodeURIComponent(localeForKey)}`
        const match = await cache.match(new Request(keyUrl, { method: 'GET' }))
        next.pagesCached = !!match
        next.pagesCacheKey = `${pathname}?__sw_locale=${localeForKey}`
      } catch (e) {
        next.pagesCacheError = e instanceof Error ? e.message : String(e)
      }

      try {
        const assets = await caches.open('assets-v1')
        const keys = await assets.keys()
        next.assetsCount = keys.length
      } catch (e) {
        next.assetsError = e instanceof Error ? e.message : String(e)
      }

      if (!cancelled) setStatus(next)
    }

    run()
    const id = window.setInterval(run, 2000)
    return () => {
      cancelled = true
      window.clearInterval(id)
    }
  }, [pathname, localeCookie, localeNavigator])

  return (
    <div
      style={{
        position: 'fixed',
        left: 8,
        bottom: 8,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.75)',
        color: 'white',
        padding: '8px 10px',
        borderRadius: 8,
        fontSize: 12,
        lineHeight: 1.25,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        maxWidth: 360,
        pointerEvents: 'none',
      }}
    >
      <div>path: {pathname}</div>
      <div>online: {String(status.isOnline)}</div>
      <div>sw: {status.hasSW ? 'yes' : 'no'} | controller: {status.hasController ? 'yes' : 'no'}</div>
      <div>scope: {status.swScope ?? 'null'}</div>
      <div>reg: active={String(status.swActive)} waiting={String(status.swWaiting)} installing={String(status.swInstalling)}</div>
      <div>script: {status.swScriptURL ?? 'null'}</div>
      <div>locale(cookie): {status.localeCookie ?? 'null'}</div>
      <div>locale(nav): {status.localeNavigator ?? 'null'}</div>
      <div>pages-v1: {status.pagesCached ? 'HIT' : 'MISS'} | key: {status.pagesCacheKey ?? 'null'}</div>
      {status.pagesCacheError ? <div>pages error: {status.pagesCacheError}</div> : null}
      <div>assets-v1 count: {status.assetsCount ?? 'null'}</div>
      {status.assetsError ? <div>assets error: {status.assetsError}</div> : null}
    </div>
  )
}
