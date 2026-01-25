import { amapService } from './amapService'
import { mcpAmapService } from './mcpAmapService'
import { getCurrentServiceMode, type ServiceMode } from './serviceConfig'
import type { AMapPOI } from './amapService'
import logger from '../utils/logger'

interface ServiceStatus {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  mode: ServiceMode
}

class UnifiedAmapService {
  private currentMode: ServiceMode
  private initialized: boolean = false

  constructor(mode?: ServiceMode) {
    this.currentMode = mode || getCurrentServiceMode()
    logger.info(`统一高德服务初始化，模式: ${this.currentMode}`)
    this.initialized = true
  }

  /**
   * 设置服务模式
   * 注意：此方法仅在首次初始化时有效，后续调用不会改变已设置的模式
   * 如需动态切换模式，请创建新的服务实例
   */
  setMode(mode: ServiceMode): void {
    if (!this.initialized) {
      this.currentMode = mode
      logger.info(`统一服务模式设置为: ${mode}`)
    } else {
      logger.warn(`无法更改已初始化的服务模式，当前模式: ${this.currentMode}, 请求模式: ${mode}`)
    }
  }

  getCurrentMode(): ServiceMode {
    return this.currentMode
  }

  private getService() {
    if (this.currentMode === 'mcp') {
      return mcpAmapService
    }
    return amapService
  }

  async searchPOIs(query: string, city: string, category?: string, limit: number = 10): Promise<AMapPOI[]> {
    const service = this.getService()
    logger.debug(`[${this.currentMode}] 搜索POIs:`, { query, city, category, limit })

    try {
      const result = await service.searchPOIs(query, city, category, limit)
      logger.debug(`[${this.currentMode}] POIs搜索成功，返回${result.length}个结果`)
      return result
    } catch (error) {
      logger.error(`[${this.currentMode}] POIs搜索失败:`, error)
      throw error
    }
  }

  async searchAttractions(city: string, keywords?: string, limit: number = 10): Promise<AMapPOI[]> {
    const service = this.getService()
    logger.debug(`[${this.currentMode}] 搜索景点:`, { city, keywords, limit })

    try {
      const result = await service.searchAttractions(city, keywords, limit)
      logger.debug(`[${this.currentMode}] 景点搜索成功，返回${result.length}个结果`)
      return result
    } catch (error) {
      logger.error(`[${this.currentMode}] 景点搜索失败:`, error)
      throw error
    }
  }

  async searchHotels(city: string, keywords?: string, limit: number = 5): Promise<AMapPOI[]> {
    const service = this.getService()
    logger.debug(`[${this.currentMode}] 搜索酒店:`, { city, keywords, limit })

    try {
      const result = await service.searchHotels(city, keywords, limit)
      logger.debug(`[${this.currentMode}] 酒店搜索成功，返回${result.length}个结果`)
      return result
    } catch (error) {
      logger.error(`[${this.currentMode}] 酒店搜索失败:`, error)
      throw error
    }
  }

  async searchRestaurants(city: string, keywords?: string, limit: number = 10): Promise<AMapPOI[]> {
    const service = this.getService()
    logger.debug(`[${this.currentMode}] 搜索餐厅:`, { city, keywords, limit })

    try {
      const result = await service.searchRestaurants(city, keywords, limit)
      logger.debug(`[${this.currentMode}] 餐厅搜索成功，返回${result.length}个结果`)
      return result
    } catch (error) {
      logger.error(`[${this.currentMode}] 餐厅搜索失败:`, error)
      throw error
    }
  }

  /**
   * 获取服务状态
   * 返回当前服务的连接状态信息
   */
  getStatus(): ServiceStatus {
    const service = this.getService()
    const hasGetStatus = 'getStatus' in service && typeof (service as any).getStatus === 'function'

    if (hasGetStatus) {
      const status = (service as any).getStatus()
      return {
        ...status,
        mode: this.currentMode
      }
    }

    return {
      isConnected: this.currentMode === 'rest',
      isConnecting: false,
      error: null,
      mode: this.currentMode
    }
  }

  /**
   * 检查服务是否可用
   */
  isAvailable(): boolean {
    try {
      const status = this.getStatus()
      return status.isConnected || status.error === null
    } catch {
      return false
    }
  }
}

// 使用闭包保护单例，确保线程安全的初始化
const getUnifiedServiceInstance = (() => {
  let instance: UnifiedAmapService | null = null

  return (mode?: ServiceMode): UnifiedAmapService => {
    if (!instance) {
      instance = new UnifiedAmapService(mode)
    }
    // 注意：不支持动态切换已存在实例的模式
    // 如需使用不同模式，请重新启动应用或使用不同的服务实例
    return instance
  }
})()

export function createUnifiedAmapService(mode?: ServiceMode): UnifiedAmapService {
  return new UnifiedAmapService(mode)
}

export const unifiedAmapService = getUnifiedServiceInstance()
export type { ServiceStatus }
