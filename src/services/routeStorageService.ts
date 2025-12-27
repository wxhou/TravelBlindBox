import type {
  TravelRoute,
  TravelParams,
  StoredRoute,
  RouteHistoryFilters,
  RouteStorageConfig,
  StorageStats,
  StorageError,
  StorageErrorCode
} from '../types'

const STORAGE_KEYS = {
  REVEALED_ROUTES: 'travelblindbox_revealed_routes',
  SCHEDULED_ROUTES: 'travelblindbox_scheduled_routes',
  USER_PREFERENCES: 'travelblindbox_user_preferences',
  STORAGE_METADATA: 'travelblindbox_storage_metadata'
} as const

const DEFAULT_CONFIG: RouteStorageConfig = {
  maxAgeDays: 30,
  maxRecords: 100,
  enableCompression: false
}

class RouteStorageService {
  private config: RouteStorageConfig

  constructor(config: Partial<RouteStorageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  private generateRouteId(): string {
    return `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private createStoredRoute(route: TravelRoute, status: 'revealed' | 'scheduled', params?: TravelParams): StoredRoute {
    return {
      ...route,
      id: this.generateRouteId(),
      savedAt: new Date().toISOString(),
      status,
      generationParams: params
    }
  }

  private validateStoredRoute(data: any): data is StoredRoute {
    return (
      typeof data === 'object' &&
      typeof data.id === 'string' &&
      typeof data.title === 'string' &&
      typeof data.description === 'string' &&
      Array.isArray(data.highlights) &&
      Array.isArray(data.itinerary) &&
      ['revealed', 'scheduled'].includes(data.status) &&
      typeof data.savedAt === 'string'
    )
  }

  private createStorageError(code: StorageErrorCode, message: string, originalError?: Error): StorageError {
    const error = new Error(message) as StorageError
    error.code = code
    error.originalError = originalError
    return error
  }

  private async saveToStorage<T>(key: string, data: T): Promise<void> {
    try {
      const serialized = JSON.stringify(data)
      localStorage.setItem(key, serialized)
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw this.createStorageError('QUOTA_EXCEEDED', '存储容量已满', error)
      }
      throw this.createStorageError('SERIALIZATION_FAILED', '数据序列化失败', error as Error)
    }
  }

  private async loadFromStorage<T>(key: string): Promise<T | null> {
    try {
      const data = localStorage.getItem(key)
      if (!data) return null
      
      const parsed = JSON.parse(data)
      return parsed as T
    } catch (error) {
      throw this.createStorageError('INVALID_DATA', '数据格式无效', error as Error)
    }
  }

  private async getAllRoutes(): Promise<StoredRoute[]> {
    const [revealedRoutes, scheduledRoutes] = await Promise.all([
      this.loadFromStorage<StoredRoute[]>(STORAGE_KEYS.REVEALED_ROUTES),
      this.loadFromStorage<StoredRoute[]>(STORAGE_KEYS.SCHEDULED_ROUTES)
    ])

    const routes = [
      ...(revealedRoutes || []),
      ...(scheduledRoutes || [])
    ]

    return routes.sort((a, b) => 
      new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
    )
  }

  private async saveAllRoutes(revealedRoutes: StoredRoute[], scheduledRoutes: StoredRoute[]): Promise<void> {
    await Promise.all([
      this.saveToStorage(STORAGE_KEYS.REVEALED_ROUTES, revealedRoutes),
      this.saveToStorage(STORAGE_KEYS.SCHEDULED_ROUTES, scheduledRoutes)
    ])
  }

  private filterRoutes(routes: StoredRoute[], filters?: RouteHistoryFilters): StoredRoute[] {
    if (!filters) return routes

    let filtered = routes

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(route => route.status === filters.status)
    }

    if (filters.dateRange) {
      const { start, end } = filters.dateRange
      filtered = filtered.filter(route => {
        const routeDate = new Date(route.savedAt)
        return routeDate >= new Date(start) && routeDate <= new Date(end)
      })
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(route =>
        route.title.toLowerCase().includes(query) ||
        route.description.toLowerCase().includes(query) ||
        route.theme.toLowerCase().includes(query)
      )
    }

    return filtered
  }

  async saveRevealedRoute(route: TravelRoute, params?: TravelParams): Promise<string> {
    try {
      const storedRoute = this.createStoredRoute(route, 'revealed', params)
      const revealedRoutes = await this.loadFromStorage<StoredRoute[]>(STORAGE_KEYS.REVEALED_ROUTES) || []
      
      revealedRoutes.unshift(storedRoute)
      
      if (revealedRoutes.length > this.config.maxRecords) {
        revealedRoutes.splice(this.config.maxRecords)
      }

      await this.saveToStorage(STORAGE_KEYS.REVEALED_ROUTES, revealedRoutes)
      
      return storedRoute.id
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error
      }
      throw this.createStorageError('SERIALIZATION_FAILED', '保存路线失败', error as Error)
    }
  }

  async scheduleRoute(routeId: string): Promise<boolean> {
    try {
      const revealedRoutes = await this.loadFromStorage<StoredRoute[]>(STORAGE_KEYS.REVEALED_ROUTES) || []
      const scheduledRoutes = await this.loadFromStorage<StoredRoute[]>(STORAGE_KEYS.SCHEDULED_ROUTES) || []
      
      const routeIndex = revealedRoutes.findIndex(route => route.id === routeId)
      if (routeIndex === -1) {
        throw this.createStorageError('NOT_FOUND', '路线不存在', undefined)
      }

      const route = revealedRoutes[routeIndex]
      route.status = 'scheduled'
      
      revealedRoutes.splice(routeIndex, 1)
      scheduledRoutes.unshift(route)

      await this.saveAllRoutes(revealedRoutes, scheduledRoutes)
      return true
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error
      }
      throw this.createStorageError('INVALID_DATA', '标记路线失败', error as Error)
    }
  }

  async getHistory(filters?: RouteHistoryFilters): Promise<StoredRoute[]> {
    try {
      const allRoutes = await this.getAllRoutes()
      const revealedRoutes = allRoutes.filter(route => route.status === 'revealed')
      return this.filterRoutes(revealedRoutes, filters)
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error
      }
      throw this.createStorageError('INVALID_DATA', '获取历史记录失败', error as Error)
    }
  }

  async getScheduled(): Promise<StoredRoute[]> {
    try {
      const scheduledRoutes = await this.loadFromStorage<StoredRoute[]>(STORAGE_KEYS.SCHEDULED_ROUTES) || []
      return scheduledRoutes.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error
      }
      throw this.createStorageError('INVALID_DATA', '获取稍后安排失败', error as Error)
    }
  }

  async deleteRoute(routeId: string): Promise<boolean> {
    try {
      const revealedRoutes = await this.loadFromStorage<StoredRoute[]>(STORAGE_KEYS.REVEALED_ROUTES) || []
      const scheduledRoutes = await this.loadFromStorage<StoredRoute[]>(STORAGE_KEYS.SCHEDULED_ROUTES) || []
      
      const revealedIndex = revealedRoutes.findIndex(route => route.id === routeId)
      const scheduledIndex = scheduledRoutes.findIndex(route => route.id === routeId)
      
      if (revealedIndex === -1 && scheduledIndex === -1) {
        throw this.createStorageError('NOT_FOUND', '路线不存在', undefined)
      }

      if (revealedIndex !== -1) {
        revealedRoutes.splice(revealedIndex, 1)
      }
      
      if (scheduledIndex !== -1) {
        scheduledRoutes.splice(scheduledIndex, 1)
      }

      await this.saveAllRoutes(revealedRoutes, scheduledRoutes)
      return true
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error
      }
      throw this.createStorageError('INVALID_DATA', '删除路线失败', error as Error)
    }
  }

  async cleanup(config?: Partial<RouteStorageConfig>): Promise<number> {
    try {
      const cleanupConfig = { ...this.config, ...config }
      const allRoutes = await this.getAllRoutes()
      
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - cleanupConfig.maxAgeDays)
      
      let cleanedCount = 0
      
      const [revealedRoutes, scheduledRoutes] = await Promise.all([
        this.loadFromStorage<StoredRoute[]>(STORAGE_KEYS.REVEALED_ROUTES) || [],
        this.loadFromStorage<StoredRoute[]>(STORAGE_KEYS.SCHEDULED_ROUTES) || []
      ])

      const revealed = revealedRoutes || []
      const scheduled = scheduledRoutes || []

      const filteredRevealed = revealed.filter(route => {
        if (new Date(route.savedAt) < cutoffDate) {
          cleanedCount++
          return false
        }
        return true
      })

      const filteredScheduled = scheduled.filter(route => {
        if (new Date(route.savedAt) < cutoffDate) {
          cleanedCount++
          return false
        }
        return true
      })

      if (filteredRevealed.length !== revealed.length || filteredScheduled.length !== scheduled.length) {
        await this.saveAllRoutes(filteredRevealed, filteredScheduled)
      }

      return cleanedCount
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error
      }
      throw this.createStorageError('INVALID_DATA', '清理数据失败', error as Error)
    }
  }

  async exportData(): Promise<string> {
    try {
      const allRoutes = await this.getAllRoutes()
      const exportData = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        routes: allRoutes
      }
      return JSON.stringify(exportData, null, 2)
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error
      }
      throw this.createStorageError('SERIALIZATION_FAILED', '导出数据失败', error as Error)
    }
  }

  async importData(data: string): Promise<{ success: number; failed: number }> {
    try {
      const importData = JSON.parse(data)
      
      if (!importData.routes || !Array.isArray(importData.routes)) {
        throw this.createStorageError('INVALID_DATA', '导入数据格式无效', undefined)
      }

      let success = 0
      let failed = 0

      for (const routeData of importData.routes) {
        if (this.validateStoredRoute(routeData)) {
          const existingRevealed = await this.loadFromStorage<StoredRoute[]>(STORAGE_KEYS.REVEALED_ROUTES) || []
          const existingScheduled = await this.loadFromStorage<StoredRoute[]>(STORAGE_KEYS.SCHEDULED_ROUTES) || []
          
          const exists = [...existingRevealed, ...existingScheduled].some(route => route.id === routeData.id)
          if (!exists) {
            if (routeData.status === 'revealed') {
              existingRevealed.push(routeData)
              await this.saveToStorage(STORAGE_KEYS.REVEALED_ROUTES, existingRevealed)
            } else {
              existingScheduled.push(routeData)
              await this.saveToStorage(STORAGE_KEYS.SCHEDULED_ROUTES, existingScheduled)
            }
            success++
          }
        } else {
          failed++
        }
      }

      return { success, failed }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error
      }
      throw this.createStorageError('INVALID_DATA', '导入数据失败', error as Error)
    }
  }

  async getStorageStats(): Promise<StorageStats> {
    try {
      const allRoutes = await this.getAllRoutes()
      const dataString = JSON.stringify(allRoutes)
      const storageUsed = new Blob([dataString]).size

      return {
        totalRecords: allRoutes.length,
        storageUsed,
        oldestRecord: allRoutes.length > 0 ? allRoutes[allRoutes.length - 1].savedAt : undefined,
        newestRecord: allRoutes.length > 0 ? allRoutes[0].savedAt : undefined
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error
      }
      throw this.createStorageError('INVALID_DATA', '获取存储统计失败', error as Error)
    }
  }

  updateConfig(newConfig: Partial<RouteStorageConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}

export const routeStorageService = new RouteStorageService()
export default RouteStorageService