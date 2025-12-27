import { amapService } from './amapService'
import { mcpAmapService } from './mcpAmapService'
import { getCurrentServiceMode, type ServiceMode } from './serviceConfig'
import type { AMapPOI } from './amapService'

class UnifiedAmapService {
  private currentMode: ServiceMode

  constructor(mode?: ServiceMode) {
    this.currentMode = mode || getCurrentServiceMode()
    console.log(`统一服务初始化，使用模式: ${this.currentMode}`)
  }

  setMode(mode: ServiceMode) {
    this.currentMode = mode
    console.log(`切换到服务模式: ${this.currentMode}`)
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
    console.log(`使用${this.currentMode}模式搜索POIs:`, { query, city, category, limit })
    
    try {
      const result = await service.searchPOIs(query, city, category, limit)
      console.log(`${this.currentMode}模式搜索成功，返回${result.length}个结果`)
      return result
    } catch (error) {
      console.error(`${this.currentMode}模式搜索失败:`, error)
      throw error
    }
  }

  async searchAttractions(city: string, keywords?: string, limit: number = 10): Promise<AMapPOI[]> {
    const service = this.getService()
    console.log(`使用${this.currentMode}模式搜索景点:`, { city, keywords, limit })
    
    try {
      const result = await service.searchAttractions(city, keywords, limit)
      console.log(`${this.currentMode}模式景点搜索成功，返回${result.length}个结果`)
      return result
    } catch (error) {
      console.error(`${this.currentMode}模式景点搜索失败:`, error)
      throw error
    }
  }

  async searchHotels(city: string, keywords?: string, limit: number = 5): Promise<AMapPOI[]> {
    const service = this.getService()
    console.log(`使用${this.currentMode}模式搜索酒店:`, { city, keywords, limit })
    
    try {
      const result = await service.searchHotels(city, keywords, limit)
      console.log(`${this.currentMode}模式酒店搜索成功，返回${result.length}个结果`)
      return result
    } catch (error) {
      console.error(`${this.currentMode}模式酒店搜索失败:`, error)
      throw error
    }
  }

  async searchRestaurants(city: string, keywords?: string, limit: number = 10): Promise<AMapPOI[]> {
    const service = this.getService()
    console.log(`使用${this.currentMode}模式搜索餐厅:`, { city, keywords, limit })
    
    try {
      const result = await service.searchRestaurants(city, keywords, limit)
      console.log(`${this.currentMode}模式餐厅搜索成功，返回${result.length}个结果`)
      return result
    } catch (error) {
      console.error(`${this.currentMode}模式餐厅搜索失败:`, error)
      throw error
    }
  }

  getStatus() {
    const service = this.getService()
    if ('getConnectionStatus' in service) {
      return service.getConnectionStatus()
    }
    return {
      isConnected: this.currentMode === 'rest',
      isConnecting: false,
      error: null
    }
  }
}

let unifiedServiceInstance: UnifiedAmapService | null = null

export function getUnifiedAmapService(mode?: ServiceMode): UnifiedAmapService {
  if (!unifiedServiceInstance) {
    unifiedServiceInstance = new UnifiedAmapService(mode)
  } else if (mode && mode !== unifiedServiceInstance.getCurrentMode()) {
    unifiedServiceInstance.setMode(mode)
  }
  return unifiedServiceInstance
}

export const unifiedAmapService = getUnifiedAmapService()
export type { AMapPOI }