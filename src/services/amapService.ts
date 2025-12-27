interface AMapPOI {
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
  source?: 'amap' | 'cache' | 'mcp'
}

interface AMapSearchResult {
  pois: AMapPOI[]
  total: number
}

class AMapService {
  private apiKey: string = '9f8e5af62cebb2c124583e5023c19fe4'
  private maxRetries: number = 3
  private retryDelay: number = 1000
  private cache = new Map<string, { data: AMapPOI[], timestamp: number }>()
  private cacheTimeout = 1000 * 60 * 30

  constructor() {
    console.log('高德地图服务初始化完成')
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private async retryRequest<T>(fn: () => Promise<T>, retries: number = this.maxRetries): Promise<T> {
    try {
      return await fn()
    } catch (error) {
      if (retries > 0) {
        await this.delay(this.retryDelay)
        return this.retryRequest(fn, retries - 1)
      }
      throw error
    }
  }

  private getCacheKey(query: string, city: string, category?: string): string {
    return `${query}-${city}-${category || 'all'}`
  }

  private getCachedData(key: string): AMapPOI[] | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }
    if (cached) {
      this.cache.delete(key)
    }
    return null
  }

  private setCachedData(key: string, data: AMapPOI[]): void {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  async searchPOIs(query: string, city: string, category?: string, limit: number = 10): Promise<AMapPOI[]> {
    const cacheKey = this.getCacheKey(query, city, category)
    const cachedData = this.getCachedData(cacheKey)
    if (cachedData) {
      return cachedData.slice(0, limit).map(poi => ({ ...poi, source: 'cache' as const }))
    }

    return this.retryRequest(async () => {
      const searchParams = new URLSearchParams({
        keywords: query,
        city: city,
        ...(category && { category }),
        output: 'json',
        key: this.apiKey,
        offset: '0',
        page: '1',
        extensions: 'all'
      })

      const response = await fetch(`https://restapi.amap.com/v3/place/text?${searchParams}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`高德API请求失败: ${response.status}`)
      }

      const data = await response.json()

      if (data.status !== '1') {
        throw new Error(`高德API错误: ${data.info}`)
      }

      const pois = data.pois?.map((poi: any) => ({
        id: poi.id,
        name: poi.name,
        address: poi.address,
        location: {
          lat: parseFloat(poi.location.split(',')[1]),
          lng: parseFloat(poi.location.split(',')[0])
        },
        category: poi.type,
        rating: poi.rating ? parseFloat(poi.rating) : undefined,
        price: poi.biz_ext?.cost || undefined,
        telephone: poi.tel,
        photos: poi.photos?.map((photo: any) => photo.url) || [],
        tag: poi.tag,
        source: 'amap' as const
      })) || []

      this.setCachedData(cacheKey, pois)
      return pois.slice(0, limit)
    })
  }

  async searchAttractions(city: string, keywords?: string, limit: number = 10): Promise<AMapPOI[]> {
    const query = keywords ? `${keywords} 景点` : '景点'
    return this.searchPOIs(query, city, '风景名胜;旅游景点', limit)
  }

  async searchHotels(city: string, keywords?: string, limit: number = 5): Promise<AMapPOI[]> {
    const query = keywords ? `${keywords} 酒店` : '酒店'
    return this.searchPOIs(query, city, '住宿服务;宾馆酒店', limit)
  }

  async searchRestaurants(city: string, keywords?: string, limit: number = 10): Promise<AMapPOI[]> {
    const query = keywords ? `${keywords} 餐厅` : '餐厅'
    return this.searchPOIs(query, city, '餐饮服务', limit)
  }
}

export const amapService = new AMapService()
export type { AMapPOI, AMapSearchResult }

import type { POI, POIActivity, POIMeal, POIAccommodation } from '../types'

export class DataTransform {
  static transformPOI(amapPOI: AMapPOI): POI {
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

  static transformPOIs(amapPOIs: AMapPOI[]): POI[] {
    return amapPOIs.map(poi => this.transformPOI(poi))
  }

  static createPOIActivity(poi: POI, description?: string): POIActivity {
    return {
      id: `activity-${poi.id}`,
      name: poi.name,
      description: description || `${poi.name} - ${poi.category}`,
      poi: poi,
      duration: '2-3小时',
      cost: poi.price ? parseFloat(poi.price.replace(/[^\d.]/g, '')) || 0 : undefined,
      imageUrl: poi.photos?.[0]
    }
  }

  static createPOIMeal(poi: POI, mealType: '早餐' | '午餐' | '晚餐' | '小吃', description?: string): POIMeal {
    return {
      id: `meal-${poi.id}-${mealType}`,
      name: poi.name,
      description: description || `${mealType} - ${poi.name}`,
      poi: poi,
      type: mealType,
      cost: poi.price ? parseFloat(poi.price.replace(/[^\d.]/g, '')) || 50 : 50,
      imageUrl: poi.photos?.[0]
    }
  }

  static createPOIAccommodation(poi: POI, description?: string): POIAccommodation {
    return {
      id: `accommodation-${poi.id}`,
      name: poi.name,
      description: description || `${poi.name} - ${poi.category}`,
      poi: poi,
      cost: poi.price ? parseFloat(poi.price.replace(/[^\d.]/g, '')) || 200 : 200,
      rating: poi.rating,
      imageUrl: poi.photos?.[0]
    }
  }

  static findBestPOIForActivity(pois: POI[], activityDescription: string): POI | undefined {
    const keywords = activityDescription.toLowerCase()

    const scoredPOIs = pois.map(poi => {
      let score = 0
      const poiText = `${poi.name} ${poi.category} ${poi.tag || ''}`.toLowerCase()

      if (poiText.includes('景点') || poiText.includes('旅游') || poiText.includes('风景')) score += 3
      if (poiText.includes('博物馆') || poiText.includes('历史')) score += 2
      if (poiText.includes('公园') || poiText.includes('广场')) score += 2
      if (keywords.includes(poi.name.toLowerCase())) score += 5
      if (poi.rating && poi.rating > 4.0) score += 1

      return { poi, score }
    })

    scoredPOIs.sort((a, b) => b.score - a.score)
    return scoredPOIs[0]?.score > 0 ? scoredPOIs[0].poi : undefined
  }

  static findBestPOIForMeal(pois: POI[], mealType: '早餐' | '午餐' | '晚餐' | '小吃'): POI | undefined {
    const scoredPOIs = pois.map(poi => {
      let score = 0
      const poiText = `${poi.name} ${poi.category}`.toLowerCase()

      if (poiText.includes('餐厅') || poiText.includes('饭店') || poiText.includes('酒店')) score += 3
      if (poiText.includes('咖啡') && mealType === '早餐') score += 2
      if (poiText.includes('中餐') || poiText.includes('西餐')) score += 2
      if (poi.rating && poi.rating > 4.0) score += 1

      return { poi, score }
    })

    scoredPOIs.sort((a, b) => b.score - a.score)
    return scoredPOIs[0]?.score > 0 ? scoredPOIs[0].poi : undefined
  }

  static findBestPOIForAccommodation(pois: POI[]): POI | undefined {
    const scoredPOIs = pois.map(poi => {
      let score = 0
      const poiText = `${poi.name} ${poi.category}`.toLowerCase()

      if (poiText.includes('酒店') || poiText.includes('宾馆') || poiText.includes('住宿')) score += 5
      if (poi.rating && poi.rating > 4.0) score += 2
      if (poi.price) {
        const price = parseFloat(poi.price.replace(/[^\d.]/g, ''))
        if (price > 0 && price < 500) score += 1
      }

      return { poi, score }
    })

    scoredPOIs.sort((a, b) => b.score - a.score)
    return scoredPOIs[0]?.score > 0 ? scoredPOIs[0].poi : undefined
  }
}

export const dataTransform = new DataTransform()