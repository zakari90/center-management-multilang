import { getDB, SyncQueue } from './db-client'
import axios from 'axios'

class SyncService {
  private isSyncing = false
  private syncInterval: NodeJS.Timeout | null = null
  private listeners: Set<() => void> = new Set()

  // Subscribe to sync events
  onSyncComplete(callback: () => void) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback())
  }

  // Start automatic sync every 30 seconds
  startAutoSync() {
    if (this.syncInterval) return

    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.syncData()
      }
    }, 30000) // 30 seconds

    // Also sync when coming back online
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.syncData())
    }
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  // Queue operation for sync
  async queueOperation(
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    collection: string,
    data: any,
    serverId?: string
  ) {
    const db = getDB()
    if (!db) {
      console.warn('Database not available, cannot queue operation')
      return
    }

    try {
      await db.syncQueue.add({
        operation,
        collection,
        data,
        timestamp: Date.now(),
        synced: false,
        serverId
      })

      // Try immediate sync if online
      if (typeof window !== 'undefined' && navigator.onLine) {
        setTimeout(() => this.syncData(), 100)
      }
    } catch (error) {
      console.error('Failed to queue operation:', error)
    }
  }

  // Main sync function
  async syncData(): Promise<void> {
    const db = getDB()
    if (!db || this.isSyncing || (typeof window !== 'undefined' && !navigator.onLine)) {
      return
    }
    
    this.isSyncing = true
    console.log('🔄 Starting sync...')

    try {
      // 1. Pull latest data from server
      await this.pullFromServer()

      // 2. Push pending changes to server
      await this.pushToServer()

      // 3. Clean up old synced items
      await this.cleanupSyncQueue()

      console.log('✅ Sync completed successfully')
      this.notifyListeners()
    } catch (error) {
      console.error('❌ Sync failed:', error)
    } finally {
      this.isSyncing = false
    }
  }

  // Pull latest data from server
  private async pullFromServer() {
    const db = getDB()
    if (!db) return

    try {
      // Fetch students
      const { data: students } = await axios.get('/api/students')
      await this.updateLocalCollection('students', students)

      // Fetch teachers
      const { data: teachers } = await axios.get('/api/teachers')
      await this.updateLocalCollection('teachers', teachers)

      // Fetch receipts
      const { data: receipts } = await axios.get('/api/receipts')
      await this.updateLocalCollection('receipts', receipts)

      // Fetch subjects
      const { data: subjects } = await axios.get('/api/subjects')
      await this.updateLocalCollection('subjects', subjects)

      console.log('📥 Pulled data from server')
    } catch (error) {
      console.error('Failed to pull from server:', error)
      throw error
    }
  }

  private async updateLocalCollection(collection: string, serverData: any[]) {
    const db = getDB()
    if (!db) return

    const table = db[collection as keyof typeof db] as any

    if (!table) return

    for (const item of serverData) {
      try {
        const existing = await table.get(item.id)
        const serverTimestamp = new Date(item.updatedAt || item.createdAt).getTime()

        // Only update if server version is newer or doesn't exist locally
        if (!existing || serverTimestamp > existing.lastModified) {
          await table.put({
            ...item,
            lastModified: serverTimestamp,
            synced: true
          })
        }
      } catch (error) {
        console.error(`Failed to update ${collection} item:`, error)
      }
    }
  }

  // Push pending changes to server
  private async pushToServer() {
    const db = getDB()
    if (!db) return

    try {
      const pendingItems = await db.syncQueue
        .where('synced')
        .equals(0)
        .sortBy('timestamp')

      console.log(`📤 Pushing ${pendingItems.length} pending changes...`)

      for (const item of pendingItems) {
        try {
          await this.executeSyncItem(item)
          
          // Mark as synced
          if (item.id) {
            await db.syncQueue.update(item.id, { synced: true })
          }
          
          // Update local record as synced
          const table = db[item.collection as keyof typeof db] as any
          if (table && item.serverId) {
            await table.update(item.serverId, { synced: true })
          }
        } catch (error: any) {
          console.error(`Failed to sync item ${item.id}:`, error)
          
          // Store error for debugging
          if (item.id) {
            await db.syncQueue.update(item.id, { 
              error: error.message || 'Unknown error'
            })
          }
        }
      }
    } catch (error) {
      console.error('Failed to push to server:', error)
    }
  }

  // Execute individual sync operation
  private async executeSyncItem(item: SyncQueue) {
    const endpoint = this.getEndpoint(item.collection, item.serverId)

    switch (item.operation) {
      case 'CREATE':
        const { data: created } = await axios.post(endpoint, item.data)
        
        // Update local record with server ID
        const db = getDB()
        if (!db) return

        const createTable = db[item.collection as keyof typeof db] as any
        const tempId = item.data.id
        
        if (createTable && tempId && tempId.startsWith('temp_')) {
          await createTable.delete(tempId)
          await createTable.put({
            ...item.data,
            id: created.id,
            synced: true,
            lastModified: Date.now()
          })
        }
        break

      case 'UPDATE':
        await axios.put(endpoint, item.data)
        break

      case 'DELETE':
        await axios.delete(endpoint)
        break
    }
  }

  private getEndpoint(collection: string, id?: string): string {
    const base = `/api/${collection}`
    return id ? `${base}/${id}` : base
  }

  // Clean up old synced items (keep last 100)
  private async cleanupSyncQueue() {
    const db = getDB()
    if (!db) return

    try {
      const syncedItems = await db.syncQueue
        .where('synced')
        .equals(1)
        .toArray()

      if (syncedItems.length > 100) {
        const toDelete = syncedItems
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(0, syncedItems.length - 100)
          .map(item => item.id!)
          .filter(id => id !== undefined)

        await db.syncQueue.bulkDelete(toDelete)
      }
    } catch (error) {
      console.error('Failed to cleanup sync queue:', error)
    }
  }

  // Get pending sync count
  async getPendingCount(): Promise<number> {
    const db = getDB()
    if (!db) return 0

    try {
      return await db.syncQueue.where('synced').equals(0).count()
    } catch (error) {
      console.error('Failed to get pending count:', error)
      return 0
    }
  }

  // Clear all local data (useful for logout)
  async clearAllData() {
    const db = getDB()
    if (!db) return

    try {
      await db.students.clear()
      await db.teachers.clear()
      await db.receipts.clear()
      await db.subjects.clear()
      await db.syncQueue.clear()
    } catch (error) {
      console.error('Failed to clear data:', error)
    }
  }
}

export const syncService = new SyncService()
