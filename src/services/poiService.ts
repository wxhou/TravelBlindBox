import { unifiedAmapService } from './unifiedAmapService'
import { GeolocationService } from './geolocationService'
import type { AMapPOI } from './unifiedAmapService'
import type { GeolocationResult } from './geolocationService'

export interface POIStatus {
  id: string
  name: string
  location: {
    lat: number
    lng: number
  }
  basicInfo: {
    name: string
    address: string
    category: string
    rating?: number
    telephone?: string
    photos?: string[]
    description?: string
  }
  status: {
    isOpen: boolean
    currentHours: string
    regularHours: {
      monday: string
      tuesday: string
      wednesday: string
      thursday: string
      friday: string
      saturday: string
      sunday: string
    }
    lastUpdated: number
  }
  realTimeInfo: {
    crowdLevel: 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
    estimatedVisitTime: number // 预计游览时间（分钟）
    queueTime: number // 当前排队时间（分钟）
    capacity: {
      current: number
      maximum: number
      percentage: number
    }
    weatherImpact: 'none' | 'minor' | 'moderate' | 'severe'
    specialEvents: POISpecialEvent[]
    maintenanceStatus: {
      isUnderMaintenance: boolean
      estimatedCompletion?: number
      affectedAreas: string[]
    }
  }
  booking: {
    available: boolean
    advanceBookingRequired: boolean
    bookingPlatforms: string[]
    nextAvailableSlot?: number
    pricing: {
      adult: number
      child?: number
      senior?: number
      group?: number
    }
  }
  services: {
    parking: 'available' | 'limited' | 'unavailable'
    restroom: boolean
    food: boolean
    giftShop: boolean
    wheelchairAccessible: boolean
    wifi: boolean
  }
  alerts: POIAlert[]
  updatedAt: number
}

export interface POISpecialEvent {
  id: string
  title: string
  description: string
  startTime: number
  endTime: number
  type: 'festival' | 'maintenance' | 'private_event' | 'construction'
  impact: 'none' | 'limited_access' | 'temporary_closure' | 'enhanced_experience'
}

export interface POIAlert {
  id: string
  type: 'weather' | 'capacity' | 'maintenance' | 'event' | 'safety' | 'transportation'
  severity: 'info' | 'warning' | 'critical'
  title: string
  message: string
  timestamp: number
  expiresAt?: number
  actionable: boolean
  actions?: string[]
}

export interface POISearchOptions {
  category?: string
  radius?: number // 搜索半径（米）
  minRating?: number
  crowdLevel?: POIStatus['realTimeInfo']['crowdLevel']
  openNow?: boolean
  availableBooking?: boolean
  limit?: number
}

export interface POICache {
  data: POIStatus
  timestamp: number
  expiresAt: number
}

export class POIService {
  private static instance: POIService
  private cache: Map<string, POICache> = new Map()
  private readonly CACHE_DURATION = 15 * 60 * 1000 // 15分钟
  private readonly UPDATE_INTERVAL = 10 * 60 * 1000 // 10分钟更新一次
  
  private readonly amapKey = process.env.VITE_AMAP_KEY || 'demo_amap_key'

  static getInstance(): POIService {
    if (!POIService.instance) {
      POIService.instance = new POIService()
    }
    return POIService.instance
  }

  async searchPOIsWithStatus(
    query: string,
    location: string | GeolocationResult,
    options: POISearchOptions = {}
  ): Promise<POIStatus[]> {
    try {
      // 获取基础POI数据
      const pois = await unifiedAmapService.searchPOIs(
        query,
        typeof location === 'string' ? location : '当前位置',
        options.category,
        options.limit || 20
      )

      // 转换为实时状态POI
      const poiStatuses = await Promise.all(
        pois.map(poi => this.enrichPOIWithStatus(poi))
      )

      // 应用过滤条件
      const filteredPOIs = poiStatuses.filter(poi => {
        if (options.openNow && !poi.status.isOpen) return false
        if (options.availableBooking && !poi.booking.available) return false
        if (options.minRating && (!poi.basicInfo.rating || poi.basicInfo.rating < options.minRating)) return false
        if (options.crowdLevel && poi.realTimeInfo.crowdLevel !== options.crowdLevel) return false
        return true
      })

      return filteredPOIs
    } catch (error) {
      console.error('搜索POI状态失败:', error)
      throw new Error(`搜索景点信息失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  async getPOIStatus(poiId: string): Promise<POIStatus> {
    const cacheKey = `poi_${poiId}`
    
    // 检查缓存
    const cached = this.cache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data
    }

    try {
      // 这里需要根据poiId获取详细信息
      // 实际实现中需要调用地图API或数据库
      const poiStatus = await this.fetchPOIStatus(poiId)
      
      // 缓存数据
      this.cache.set(cacheKey, {
        data: poiStatus,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.CACHE_DURATION
      })

      return poiStatus
    } catch (error) {
      console.error('获取POI状态失败:', error)
      throw new Error(`获取景点状态失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  async getPOIsByLocation(
    location: string | GeolocationResult,
    radius: number = 5000,
    category?: string
  ): Promise<POIStatus[]> {
    try {
      // 获取用户位置
      let coordinates: GeolocationResult
      if (typeof location === 'string') {
        // 需要地理编码将地名转换为坐标
        coordinates = {
          latitude: 39.9042,
          longitude: 116.4074,
          accuracy: 1000,
          timestamp: Date.now()
        }
      } else {
        coordinates = location
      }

      // 搜索附近的POI
      const pois = await unifiedAmapService.searchPOIs(
        '景点',
        '北京', // 简化处理
        category,
        50
      )

      // 过滤距离范围内的POI
      const nearbyPOIs = pois.filter(poi => {
        const distance = this.calculateDistance(
          coordinates.latitude,
          coordinates.longitude,
          poi.location.lat,
          poi.location.lng
        )
        return distance <= radius
      })

      // 获取实时状态
      const poiStatuses = await Promise.all(
        nearbyPOIs.map(poi => this.enrichPOIWithStatus(poi))
      )

      return poiStatuses
    } catch (error) {
      console.error('获取附近POI失败:', error)
      throw new Error(`获取附近景点失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  async getCrowdedPOIs(location: string | GeolocationResult, limit: number = 10): Promise<POIStatus[]> {
    try {
      const allPOIs = await this.getPOIsByLocation(location)
      
      // 按拥挤度排序
      const crowdedPOIs = allPOIs
        .filter(poi => poi.realTimeInfo.crowdLevel === 'high' || poi.realTimeInfo.crowdLevel === 'very_high')
        .sort((a, b) => {
          const crowdOrder = { 'very_low': 1, 'low': 2, 'medium': 3, 'high': 4, 'very_high': 5 }
          return crowdOrder[b.realTimeInfo.crowdLevel] - crowdOrder[a.realTimeInfo.crowdLevel]
        })
        .slice(0, limit)

      return crowdedPOIs
    } catch (error) {
      console.error('获取拥挤景点失败:', error)
      return []
    }
  }

  async getPOIsWithBooking(location: string | GeolocationResult, limit: number = 10): Promise<POIStatus[]> {
    try {
      const allPOIs = await this.getPOIsByLocation(location)
      
      const bookablePOIs = allPOIs
        .filter(poi => poi.booking.available)
        .sort((a, b) => {
          // 优先显示需要预约的景点
          if (a.booking.advanceBookingRequired && !b.booking.advanceBookingRequired) return -1
          if (!a.booking.advanceBookingRequired && b.booking.advanceBookingRequired) return 1
          return 0
        })
        .slice(0, limit)

      return bookablePOIs
    } catch (error) {
      console.error('获取可预约景点失败:', error)
      return []
    }
  }

  async startPOIMonitoring(
    poiIds: string[],
    onUpdate?: (poi: POIStatus) => void,
    onAlert?: (poiId: string, alert: POIAlert) => void
  ): Promise<() => void> {
    const intervalId = setInterval(async () => {
      try {
        for (const poiId of poiIds) {
          try {
            const poiStatus = await this.getPOIStatus(poiId)
            
            if (onUpdate) {
              onUpdate(poiStatus)
            }

            // 检查新的预警
            const newAlerts = poiStatus.alerts.filter(alert => 
              alert.timestamp > Date.now() - this.UPDATE_INTERVAL
            )

            if (newAlerts.length > 0 && onAlert) {
              newAlerts.forEach(alert => onAlert(poiId, alert))
            }
          } catch (error) {
            console.error(`更新POI ${poiId} 状态失败:`, error)
          }
        }
      } catch (error) {
        console.error('POI监控更新失败:', error)
      }
    }, this.UPDATE_INTERVAL)

    // 返回停止函数
    return () => clearInterval(intervalId)
  }

  clearCache(poiId?: string): void {
    if (poiId) {
      this.cache.delete(`poi_${poiId}`)
    } else {
      this.cache.clear()
    }
  }

  getCacheStatus(): { totalEntries: number; poiIds: string[] } {
    return {
      totalEntries: this.cache.size,
      poiIds: Array.from(this.cache.keys()).map(key => key.replace('poi_', ''))
    }
  }

  private async enrichPOIWithStatus(poi: AMapPOI): Promise<POIStatus> {
    // 检查缓存
    const cacheKey = `poi_${poi.id}`
    const cached = this.cache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data
    }

    // 生成实时状态信息
    const poiStatus = await this.generatePOIStatus(poi)
    
    // 缓存数据
    this.cache.set(cacheKey, {
      data: poiStatus,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.CACHE_DURATION
    })

    return poiStatus
  }

  private async fetchPOIStatus(poiId: string): Promise<POIStatus> {
    // 实际实现中需要根据poiId调用相应的API
    // 这里使用模拟数据
    const mockPOI: AMapPOI = {
      id: poiId,
      name: '故宫博物院',
      address: '北京市东城区景山前街4号',
      location: { lat: 39.9163, lng: 116.3972 },
      category: '风景名胜;旅游景点',
      rating: 4.8,
      telephone: '010-85007421',
      photos: ['https://example.com/photo1.jpg'],
      tag: '历史文化',
      source: 'amap'
    }

    return this.generatePOIStatus(mockPOI)
  }

  private async generatePOIStatus(poi: AMapPOI): Promise<POIStatus> {
    // 生成模拟的实时数据
    const now = new Date()
    const currentHour = now.getHours()
    const isOpen = currentHour >= 8 && currentHour < 17

    return {
      id: poi.id,
      name: poi.name,
      location: poi.location,
      basicInfo: {
        name: poi.name,
        address: poi.address,
        category: poi.category,
        rating: poi.rating,
        telephone: poi.telephone,
        photos: poi.photos,
        description: `${poi.name}是一个著名的旅游景点，${poi.tag || '提供优质的旅游体验'}。`
      },
      status: {
        isOpen,
        currentHours: isOpen ? '8:00 - 17:00' : '已闭馆',
        regularHours: {
          monday: '8:00 - 17:00',
          tuesday: '8:00 - 17:00',
          wednesday: '8:00 - 17:00',
          thursday: '8:00 - 17:00',
          friday: '8:00 - 17:00',
          saturday: '8:00 - 17:00',
          sunday: '8:00 - 17:00'
        },
        lastUpdated: Date.now()
      },
      realTimeInfo: {
        crowdLevel: this.generateRandomCrowdLevel(),
        estimatedVisitTime: Math.floor(Math.random() * 120) + 60, // 60-180分钟
        queueTime: Math.floor(Math.random() * 30), // 0-30分钟
        capacity: {
          current: Math.floor(Math.random() * 8000) + 2000,
          maximum: 10000,
          percentage: Math.floor(Math.random() * 80) + 20
        },
        weatherImpact: 'none',
        specialEvents: [],
        maintenanceStatus: {
          isUnderMaintenance: false,
          affectedAreas: []
        }
      },
      booking: {
        available: Math.random() > 0.3,
        advanceBookingRequired: Math.random() > 0.5,
        bookingPlatforms: ['官网', '携程', '美团'],
        nextAvailableSlot: Date.now() + 3600000, // 1小时后
        pricing: {
          adult: Math.floor(Math.random() * 100) + 50,
          child: Math.floor(Math.random() * 50) + 25,
          senior: Math.floor(Math.random() * 75) + 40,
          group: Math.floor(Math.random() * 80) + 45
        }
      },
      services: {
        parking: Math.random() > 0.5 ? 'available' : 'limited',
        restroom: true,
        food: Math.random() > 0.3,
        giftShop: Math.random() > 0.2,
        wheelchairAccessible: Math.random() > 0.4,
        wifi: Math.random() > 0.1
      },
      alerts: this.generateMockAlerts(),
      updatedAt: Date.now()
    }
  }

  private generateRandomCrowdLevel(): POIStatus['realTimeInfo']['crowdLevel'] {
    const levels: POIStatus['realTimeInfo']['crowdLevel'][] = ['very_low', 'low', 'medium', 'high', 'very_high']
    return levels[Math.floor(Math.random() * levels.length)]
  }

  private generateMockAlerts(): POIAlert[] {
    const alerts: POIAlert[] = []
    
    // 随机生成一些预警
    if (Math.random() > 0.7) {
      alerts.push({
        id: `alert_${Date.now()}`,
        type: 'weather',
        severity: 'warning',
        title: '天气预警',
        message: '今日有雨，建议携带雨具',
        timestamp: Date.now(),
        actionable: true,
        actions: ['携带雨具', '选择室内活动']
      })
    }

    if (Math.random() > 0.8) {
      alerts.push({
        id: `alert_${Date.now()}_2`,
        type: 'capacity',
        severity: 'info',
        title: '客流提醒',
        message: '当前客流较大，预计排队时间30分钟',
        timestamp: Date.now(),
        actionable: false
      })
    }

    return alerts
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3 // 地球半径（米）
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lng2 - lng1) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }
}