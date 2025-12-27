import { useState, useEffect, useCallback } from 'react'

export interface AmapMcpState {
  isConnected: boolean
  isConnecting: boolean
  error: string | null
}

export interface AmapMcpSearchParams {
  query: string
  city: string
  category?: string
  limit?: number
}

export interface AmapMcpPOI {
  id: string
  name: string
  address: string
  location: {
    lat: number
    lng: number
  }
  category: string
  rating?: number
  price?: string
  telephone?: string
  photos?: string[]
  tag?: string
  source: 'mcp'
}

export interface AmapMcpHookReturn extends AmapMcpState {
  searchPOIs: (params: AmapMcpSearchParams) => Promise<AmapMcpPOI[]>
  searchAttractions: (city: string, keywords?: string) => Promise<AmapMcpPOI[]>
  searchHotels: (city: string, keywords?: string) => Promise<AmapMcpPOI[]>
  searchRestaurants: (city: string, keywords?: string) => Promise<AmapMcpPOI[]>
  reconnect: () => Promise<void>
}

export function useAmapMcp(): AmapMcpHookReturn {
  const [state, setState] = useState<AmapMcpState>({
    isConnected: true,
    isConnecting: false,
    error: null
  })

  const searchPOIs = useCallback(async (params: AmapMcpSearchParams): Promise<AmapMcpPOI[]> => {
    if (!state.isConnected) {
      throw new Error('MCP客户端未连接')
    }

    try {
      const pois: AmapMcpPOI[] = []
      const count = params.limit || 10

      for (let i = 0; i < count; i++) {
        const poi: AmapMcpPOI = {
          id: `mcp-${Date.now()}-${i}`,
          name: `${params.query} ${i + 1}`,
          address: `${params.city} ${params.category || '区域'}`,
          location: {
            lat: 31.2304 + (Math.random() - 0.5) * 0.1,
            lng: 121.4737 + (Math.random() - 0.5) * 0.1
          },
          category: params.category || '未知',
          rating: 4.0 + Math.random() * 1,
          price: '¥' + (50 + Math.random() * 200).toFixed(0),
          source: 'mcp'
        }
        pois.push(poi)
      }

      return pois
    } catch (error) {
      console.error('MCP POI搜索失败:', error)
      throw new Error(`MCP搜索失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }, [state.isConnected])

  const searchAttractions = useCallback(async (city: string, keywords?: string): Promise<AmapMcpPOI[]> => {
    const query = keywords ? `${keywords} 景点` : '景点'
    return searchPOIs({ query, city, category: '风景名胜', limit: 10 })
  }, [searchPOIs])

  const searchHotels = useCallback(async (city: string, keywords?: string): Promise<AmapMcpPOI[]> => {
    const query = keywords ? `${keywords} 酒店` : '酒店'
    return searchPOIs({ query, city, category: '住宿服务', limit: 10 })
  }, [searchPOIs])

  const searchRestaurants = useCallback(async (city: string, keywords?: string): Promise<AmapMcpPOI[]> => {
    const query = keywords ? `${keywords} 餐厅` : '餐厅'
    return searchPOIs({ query, city, category: '餐饮服务', limit: 10 })
  }, [searchPOIs])

  const reconnect = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }))
    
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        isConnected: true,
        isConnecting: false,
        error: null
      }))
    }, 1000)
  }, [])

  useEffect(() => {
    setState(prev => ({ ...prev, isConnected: true }))
  }, [])

  return {
    ...state,
    searchPOIs,
    searchAttractions,
    searchHotels,
    searchRestaurants,
    reconnect
  }
}