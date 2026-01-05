import { GeolocationService } from './geolocationService'
import type { GeolocationResult } from './geolocationService'

export interface TrafficData {
  route: {
    origin: string
    destination: string
    distance: number
    duration: number
    durationInTraffic: number
    trafficLevel: 'low' | 'medium' | 'high' | 'severe'
    trafficColor: string
    updatedAt: number
  }
  segments: TrafficSegment[]
  alternativeRoutes: AlternativeRoute[]
  incidents: TrafficIncident[]
  publicTransport: PublicTransportInfo[]
  updatedAt: number
}

export interface TrafficSegment {
  id: string
  name: string
  coordinates: Array<{ lat: number; lng: number }>
  distance: number
  duration: number
  durationInTraffic: number
  trafficLevel: 'low' | 'medium' | 'high' | 'severe'
  congestionLevel: number // 0-100
  averageSpeed: number
  updatedAt: number
}

export interface AlternativeRoute {
  id: string
  name: string
  distance: number
  duration: number
  durationInTraffic: number
  trafficLevel: 'low' | 'medium' | 'high' | 'severe'
  tollCost?: number
  advantages: string[]
  disadvantages: string[]
}

export interface TrafficIncident {
  id: string
  type: 'accident' | 'construction' | 'closure' | 'event' | 'weather'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  location: {
    lat: number
    lng: number
    address: string
  }
  affectedRoads: string[]
  startTime: number
  estimatedEndTime?: number
  delayTime: number
  active: boolean
  reportedBy: string
}

export interface PublicTransportInfo {
  type: 'subway' | 'bus' | 'train' | 'flight'
  route: string
  name: string
  status: 'on_time' | 'delayed' | 'cancelled' | 'suspended'
  delay: number // 分钟
  nextArrival?: number // 下一班车到达时间
  frequency: string // 发车频率
  alerts: string[]
  updatedAt: number
}

export interface TrafficCache {
  data: TrafficData
  route: string
  timestamp: number
  expiresAt: number
}

export class TrafficService {
  private static instance: TrafficService
  private cache: Map<string, TrafficCache> = new Map()
  private readonly CACHE_DURATION = 10 * 60 * 1000 // 10分钟
  private readonly UPDATE_INTERVAL = 5 * 60 * 1000 // 5分钟更新一次
  
  private readonly trafficApiKey = process.env.VITE_TRAFFIC_API_KEY || 'demo_key'
  private readonly amapKey = process.env.VITE_AMAP_KEY || 'demo_amap_key'

  static getInstance(): TrafficService {
    if (!TrafficService.instance) {
      TrafficService.instance = new TrafficService()
    }
    return TrafficService.instance
  }

  async getTrafficInfo(
    origin: string | GeolocationResult,
    destination: string | GeolocationResult,
    travelMode: 'driving' | 'transit' | 'walking' | 'cycling' = 'driving'
  ): Promise<TrafficData> {
    const cacheKey = this.generateCacheKey(origin, destination, travelMode)
    
    // 检查缓存
    const cached = this.cache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data
    }

    try {
      // 获取交通数据
      const trafficData = await this.fetchTrafficData(origin, destination, travelMode)
      
      // 缓存数据
      this.cache.set(cacheKey, {
        data: trafficData,
        route: cacheKey,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.CACHE_DURATION
      })

      return trafficData
    } catch (error) {
      console.error('获取交通信息失败:', error)
      throw new Error(`获取交通信息失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  async getTrafficIncidents(location: string | GeolocationResult, radius: number = 5000): Promise<TrafficIncident[]> {
    try {
      const coordinates = await this.normalizeLocation(location)
      const incidents = await this.fetchTrafficIncidents(coordinates, radius)
      return incidents
    } catch (error) {
      console.error('获取交通事件失败:', error)
      return []
    }
  }

  async getPublicTransportInfo(location: string | GeolocationResult): Promise<PublicTransportInfo[]> {
    try {
      const coordinates = await this.normalizeLocation(location)
      const transportInfo = await this.fetchPublicTransportInfo(coordinates)
      return transportInfo
    } catch (error) {
      console.error('获取公共交通信息失败:', error)
      return []
    }
  }

  async getAlternativeRoutes(
    origin: string | GeolocationResult,
    destination: string | GeolocationResult
  ): Promise<AlternativeRoute[]> {
    try {
      const trafficData = await this.getTrafficInfo(origin, destination)
      return trafficData.alternativeRoutes || []
    } catch (error) {
      console.error('获取替代路线失败:', error)
      return []
    }
  }

  async startTrafficMonitoring(
    origin: string | GeolocationResult,
    destination: string | GeolocationResult,
    travelMode: 'driving' | 'transit' | 'walking' | 'cycling' = 'driving',
    onUpdate?: (data: TrafficData) => void,
    onIncident?: (incident: TrafficIncident) => void
  ): Promise<() => void> {
    const intervalId = setInterval(async () => {
      try {
        const data = await this.getTrafficInfo(origin, destination, travelMode)
        
        if (onUpdate) {
          onUpdate(data)
        }

        // 检查新的交通事件
        const incidents = await this.getTrafficIncidents(
          typeof origin === 'string' ? origin : origin
        )
        const newIncidents = incidents.filter(incident => 
          incident.active && incident.startTime > Date.now() - this.UPDATE_INTERVAL
        )

        if (newIncidents.length > 0 && onIncident) {
          newIncidents.forEach(incident => onIncident(incident))
        }
      } catch (error) {
        console.error('交通监控更新失败:', error)
      }
    }, this.UPDATE_INTERVAL)

    // 返回停止函数
    return () => clearInterval(intervalId)
  }

  async getOptimalRoute(
    origin: string | GeolocationResult,
    destination: string | GeolocationResult,
    preferences?: {
      avoidTolls?: boolean
      avoidHighways?: boolean
      avoidFerries?: boolean
      preferHighways?: boolean
    }
  ): Promise<AlternativeRoute> {
    try {
      const routes = await this.getAlternativeRoutes(origin, destination)
      
      // 根据偏好选择最佳路线
      let bestRoute = routes[0]
      if (preferences) {
        bestRoute = routes.find(route => {
          if (preferences.avoidTolls && route.tollCost && route.tollCost > 0) return false
          if (preferences.avoidHighways && route.advantages.some(adv => adv.includes('高速'))) return false
          return true
        }) || routes[0]
      }

      return bestRoute
    } catch (error) {
      console.error('获取最优路线失败:', error)
      throw new Error(`获取最优路线失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  clearCache(route?: string): void {
    if (route) {
      this.cache.delete(route)
    } else {
      this.cache.clear()
    }
  }

  getCacheStatus(): { totalEntries: number; routes: string[] } {
    return {
      totalEntries: this.cache.size,
      routes: Array.from(this.cache.keys())
    }
  }

  private generateCacheKey(
    origin: string | GeolocationResult,
    destination: string | GeolocationResult,
    travelMode: string
  ): string {
    const originStr = typeof origin === 'string' ? origin : `${origin.latitude},${origin.longitude}`
    const destStr = typeof destination === 'string' ? destination : `${destination.latitude},${destination.longitude}`
    return `${originStr}_${destStr}_${travelMode}`
  }

  private async normalizeLocation(location: string | GeolocationResult): Promise<GeolocationResult> {
    if (typeof location === 'string') {
      // 需要地理编码服务将地名转换为坐标
      return {
        latitude: 39.9042,
        longitude: 116.4074,
        accuracy: 1000,
        timestamp: Date.now()
      }
    }
    return location
  }

  private async fetchTrafficData(
    origin: string | GeolocationResult,
    destination: string | GeolocationResult,
    travelMode: string
  ): Promise<TrafficData> {
    // 使用模拟数据作为示例，实际应用中需要接入真实的交通API
    const mockData: TrafficData = {
      route: {
        origin: typeof origin === 'string' ? origin : '当前位置',
        destination: typeof destination === 'string' ? destination : '目的地',
        distance: 15.6,
        duration: 1800, // 30分钟
        durationInTraffic: 2400, // 40分钟
        trafficLevel: 'medium',
        trafficColor: '#ffa500',
        updatedAt: Date.now()
      },
      segments: this.generateMockSegments(),
      alternativeRoutes: this.generateMockAlternativeRoutes(),
      incidents: this.generateMockIncidents(),
      publicTransport: this.generateMockPublicTransport(),
      updatedAt: Date.now()
    }

    return mockData
  }

  private async fetchTrafficIncidents(coordinates: GeolocationResult, radius: number): Promise<TrafficIncident[]> {
    return this.generateMockIncidents()
  }

  private async fetchPublicTransportInfo(coordinates: GeolocationResult): Promise<PublicTransportInfo[]> {
    return this.generateMockPublicTransport()
  }

  private generateMockSegments(): TrafficSegment[] {
    return [
      {
        id: 'segment_1',
        name: '建国门大街',
        coordinates: [
          { lat: 39.9042, lng: 116.4074 },
          { lat: 39.9050, lng: 116.4080 }
        ],
        distance: 2.3,
        duration: 480,
        durationInTraffic: 600,
        trafficLevel: 'medium',
        congestionLevel: 45,
        averageSpeed: 35,
        updatedAt: Date.now()
      },
      {
        id: 'segment_2',
        name: '二环路',
        coordinates: [
          { lat: 39.9050, lng: 116.4080 },
          { lat: 39.9060, lng: 116.4090 }
        ],
        distance: 3.1,
        duration: 540,
        durationInTraffic: 720,
        trafficLevel: 'high',
        congestionLevel: 75,
        averageSpeed: 25,
        updatedAt: Date.now()
      }
    ]
  }

  private generateMockAlternativeRoutes(): AlternativeRoute[] {
    return [
      {
        id: 'route_1',
        name: '二环路路线',
        distance: 16.2,
        duration: 1800,
        durationInTraffic: 2400,
        trafficLevel: 'medium',
        advantages: ['路况相对稳定', '红绿灯较少'],
        disadvantages: ['距离稍远']
      },
      {
        id: 'route_2',
        name: '三环路路线',
        distance: 18.5,
        duration: 2000,
        durationInTraffic: 2200,
        trafficLevel: 'low',
        tollCost: 5,
        advantages: ['交通顺畅', '高速路段较多'],
        disadvantages: ['需要过路费', '距离最远']
      }
    ]
  }

  private generateMockIncidents(): TrafficIncident[] {
    return [
      {
        id: 'incident_1',
        type: 'accident',
        severity: 'medium',
        title: '交通事故',
        description: '建国门大街发生交通事故，占用右侧车道',
        location: {
          lat: 39.9042,
          lng: 116.4074,
          address: '建国门大街与长安街交叉口'
        },
        affectedRoads: ['建国门大街', '长安街'],
        startTime: Date.now() - 1800000, // 30分钟前
        delayTime: 10,
        active: true,
        reportedBy: '交通管理部门'
      },
      {
        id: 'incident_2',
        type: 'construction',
        severity: 'low',
        title: '道路施工',
        description: '二环路南段进行道路维修，单车道通行',
        location: {
          lat: 39.9050,
          lng: 116.4080,
          address: '二环路南段'
        },
        affectedRoads: ['二环路'],
        startTime: Date.now() - 3600000, // 1小时前
        estimatedEndTime: Date.now() + 7200000, // 2小时后结束
        delayTime: 5,
        active: true,
        reportedBy: '市政部门'
      }
    ]
  }

  private generateMockPublicTransport(): PublicTransportInfo[] {
    return [
      {
        type: 'subway',
        route: 'Line1',
        name: '地铁1号线',
        status: 'on_time',
        delay: 0,
        nextArrival: Date.now() + 180000, // 3分钟后
        frequency: '2-3分钟',
        alerts: [],
        updatedAt: Date.now()
      },
      {
        type: 'bus',
        route: '52路',
        name: '52路公交车',
        status: 'delayed',
        delay: 8,
        frequency: '5-8分钟',
        alerts: ['由于交通拥堵，班车可能晚点8-10分钟'],
        updatedAt: Date.now()
      }
    ]
  }
}