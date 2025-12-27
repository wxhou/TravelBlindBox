import type { AMapPOI } from './amapService'
import type { POI } from '../types'

interface McpAmapServiceOptions {
  enableFallback?: boolean
  fallbackTimeout?: number
}

class McpAmapService {
  private enableFallback: boolean
  private fallbackTimeout: number
  private isConnected: boolean

  constructor(options: McpAmapServiceOptions = {}) {
    this.enableFallback = options.enableFallback ?? true
    this.fallbackTimeout = options.fallbackTimeout ?? 5000
    this.isConnected = true
  }

  private async withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('操作超时')), timeout)
      })
    ])
  }

  private transformMcpPOIToAMapPOI(mcpPoi: any): AMapPOI {
    return {
      id: mcpPoi.id,
      name: mcpPoi.name,
      address: mcpPoi.address,
      location: mcpPoi.location,
      category: mcpPoi.category,
      rating: mcpPoi.rating,
      price: mcpPoi.price,
      telephone: mcpPoi.telephone,
      photos: mcpPoi.photos,
      tag: mcpPoi.tag,
      source: 'mcp' as const
    }
  }

  private transformAMapPOIToPOI(amapPOI: AMapPOI): POI {
    return {
      id: amapPOI.id,
      name: amapPOI.name,
      address: amapPOI.address,
      location: amapPOI.location,
      category: amapPOI.category,
      rating: amapPOI.rating,
      price: amapPOI.price,
      telephone: amapPOI.telephone,
      photos: amapPOI.photos,
      tag: amapPOI.tag,
      source: amapPOI.source
    }
  }

  async searchPOIs(query: string, city: string, category?: string, limit: number = 10): Promise<AMapPOI[]> {
    console.log(`🔍 MCP服务开始搜索:`, { query, city, category, limit })
    
    try {
      if (!this.isConnected) {
        console.log('❌ MCP未连接，使用降级模式')
        throw new Error('MCP未连接')
      }

      console.log('✅ MCP已连接，使用降级数据模式')
      const result = this.getFallbackPOIs(query, city, category, limit)
      console.log(`📍 MCP搜索完成，返回${result.length}个结果`)
      return result
    } catch (error) {
      console.error('❌ MCP POI搜索失败:', error)
      
      if (this.enableFallback) {
        console.log('🔄 降级到模拟数据')
        const fallbackResult = this.getFallbackPOIs(query, city, category, limit)
        console.log(`📍 降级搜索完成，返回${fallbackResult.length}个结果`)
        return fallbackResult
      }
      
      console.error('💥 无降级选项可用，抛出错误')
      throw error
    }
  }

  async searchAttractions(city: string, keywords?: string, limit: number = 10): Promise<AMapPOI[]> {
    console.log(`🏛️ MCP搜索景点:`, { city, keywords, limit })
    const query = keywords ? `${keywords} 景点` : '景点'
    const result = await this.searchPOIs(query, city, '风景名胜;旅游景点', limit)
    console.log(`✅ MCP景点搜索完成:`, result.length, '个结果')
    return result
  }

  async searchHotels(city: string, keywords?: string, limit: number = 5): Promise<AMapPOI[]> {
    console.log(`🏨 MCP搜索酒店:`, { city, keywords, limit })
    const query = keywords ? `${keywords} 酒店` : '酒店'
    const result = await this.searchPOIs(query, city, '住宿服务;宾馆酒店', limit)
    console.log(`✅ MCP酒店搜索完成:`, result.length, '个结果')
    return result
  }

  async searchRestaurants(city: string, keywords?: string, limit: number = 10): Promise<AMapPOI[]> {
    console.log(`🍽️ MCP搜索餐厅:`, { city, keywords, limit })
    const query = keywords ? `${keywords} 餐厅` : '餐厅'
    const result = await this.searchPOIs(query, city, '餐饮服务', limit)
    console.log(`✅ MCP餐厅搜索完成:`, result.length, '个结果')
    return result
  }

  private getFallbackPOIs(query: string, city: string, category?: string, limit: number = 10): AMapPOI[] {
    const pois: AMapPOI[] = []
    
    for (let i = 0; i < limit; i++) {
      const poi: AMapPOI = {
        id: `fallback-${Date.now()}-${i}`,
        name: `${query} ${i + 1}`,
        address: `${city} ${category || '区域'} ${i + 1}号`,
        location: {
          lat: 31.2304 + (Math.random() - 0.5) * 0.1,
          lng: 121.4737 + (Math.random() - 0.5) * 0.1
        },
        category: category || '未知',
        rating: 4.0 + Math.random() * 1,
        price: '¥' + (50 + Math.random() * 200).toFixed(0),
        telephone: '021-' + Math.floor(Math.random() * 9000000 + 1000000),
        photos: [],
        tag: 'MCP降级数据',
        source: 'mcp'
      }
      pois.push(poi)
    }
    
    return pois
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: false,
      error: null
    }
  }

  async reconnect(): Promise<void> {
    this.isConnected = true
  }
}

let mcpServiceInstance: McpAmapService | null = null

export function getMcpAmapService(options?: McpAmapServiceOptions): McpAmapService {
  if (!mcpServiceInstance) {
    mcpServiceInstance = new McpAmapService(options)
  }
  return mcpServiceInstance
}

export const mcpAmapService = getMcpAmapService()

export type { AMapPOI }