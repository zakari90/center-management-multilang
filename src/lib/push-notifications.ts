// src/lib/push-notifications.ts
'use client'

interface NotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: Record<string, unknown>
  actions?: Array<{ action: string; title: string }>
  requireInteraction?: boolean
  silent?: boolean
}

class PushNotificationService {
  private permission: NotificationPermission = 'default'
  private registration: ServiceWorkerRegistration | null = null

  constructor() {
    this.checkPermission()
    this.registerServiceWorker()
  }

  private async checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission
    }
  }

  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.ready
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    if (this.permission === 'granted') {
      return true
    }

    if (this.permission === 'denied') {
      console.warn('Notification permission denied')
      return false
    }

    try {
      this.permission = await Notification.requestPermission()
      return this.permission === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  async showNotification(options: NotificationOptions): Promise<void> {
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission()
      if (!granted) {
        console.warn('Cannot show notification: permission not granted')
        return
      }
    }

    const notificationOptions: NotificationOptions = {
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      requireInteraction: false,
      silent: false,
      ...options
    }

    try {
      if (this.registration?.showNotification) {
        await this.registration.showNotification(notificationOptions.title, notificationOptions)
      } else {
        new Notification(notificationOptions.title, notificationOptions)
      }
    } catch (error) {
      console.error('Error showing notification:', error)
    }
  }

  async showSystemNotification(title: string, body: string, data?: Record<string, unknown>): Promise<void> {
    await this.showNotification({
      title,
      body,
      tag: 'system',
      data,
      requireInteraction: false
    })
  }

  async showPaymentNotification(amount: number, studentName: string): Promise<void> {
    await this.showNotification({
      title: 'Payment Received',
      body: `Payment of ${amount} MAD received from ${studentName}`,
      tag: 'payment',
      data: { type: 'payment', amount, studentName },
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'View Details' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    })
  }

  async showSyncNotification(status: 'success' | 'error', message: string): Promise<void> {
    await this.showNotification({
      title: status === 'success' ? 'Sync Complete' : 'Sync Failed',
      body: message,
      tag: 'sync',
      data: { type: 'sync', status },
      requireInteraction: status === 'error'
    })
  }

  async showUpdateNotification(): Promise<void> {
    await this.showNotification({
      title: 'App Update Available',
      body: 'A new version of the app is available. Click to update.',
      tag: 'update',
      data: { type: 'update' },
      requireInteraction: true,
      actions: [
        { action: 'update', title: 'Update Now' },
        { action: 'later', title: 'Later' }
      ]
    })
  }

  async showOfflineNotification(): Promise<void> {
    await this.showNotification({
      title: 'You are offline',
      body: 'Some features may be limited. Data will sync when you\'re back online.',
      tag: 'offline',
      data: { type: 'offline' },
      requireInteraction: false,
      silent: true
    })
  }

  async showOnlineNotification(): Promise<void> {
    await this.showNotification({
      title: 'You are back online',
      body: 'All features are now available. Syncing data...',
      tag: 'online',
      data: { type: 'online' },
      requireInteraction: false
    })
  }

  // Handle notification clicks
  setupNotificationClickHandler(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'notification-click') {
          this.handleNotificationClick(event.data)
        }
      })
    }
  }

  private handleNotificationClick(data: Record<string, unknown>): void {
    const { action, notificationData } = data

    switch (action) {
      case 'view':
        if (notificationData?.type === 'payment') {
          // Navigate to payment details
          window.location.href = '/manager/receipts'
        }
        break
      case 'update':
        // Trigger app update
        window.location.reload()
        break
      case 'dismiss':
        // Just dismiss the notification
        break
      default:
        // Default action - could navigate to dashboard
        window.location.href = '/'
    }
  }

  // Check if notifications are supported
  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    return this.permission
  }

  // Clear all notifications
  async clearAllNotifications(): Promise<void> {
    if (this.registration) {
      const notifications = await this.registration.getNotifications()
      notifications.forEach(notification => notification.close())
    }
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService()

// Export class for testing
export { PushNotificationService }
