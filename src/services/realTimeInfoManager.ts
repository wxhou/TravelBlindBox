import { WeatherService } from './weatherService'
import type { WeatherData, WeatherAlert } from './weatherService'
import { TrafficService } from './trafficService'
import type { TrafficData, TrafficIncident } from './trafficService'
import { POIService } from './poiService'
import type { POIStatus } from './poiService'
import { EmergencyService } from './emergencyService'
import type { EmergencyAlert, EmergencyResource } from './emergencyService'
import { GeolocationService } from './geolocationService'
import type { GeolocationResult } from './geolocationService'

export interface RealTimeInfoData {
  location: {
    latitude: number
    longitude: number
    address: string
    timestamp: number
  }
  weather: {
    data: WeatherData | null
    lastUpdated: number
    isLoading: boolean
    error: string | null
  }
  traffic: {
    data: TrafficData | null
    lastUpdated: number
    isLoading: boolean
    error: string | null
  }
  pois: {
    data: POIStatus[]
    lastUpdated: number
    isLoading: boolean
    error: string | null
  }
  emergency: {
    alerts: EmergencyAlert[]
    resources: EmergencyResource[]
    lastUpdated: number
    isLoading: boolean
    error: string | null
  }
  summary: {
    overallStatus: 'good' | 'fair' | 'poor' | 'critical'
    activeAlerts: number
    trafficLevel: 'low' | 'medium' | 'high' | 'severe'
    weatherSeverity: 'clear' | 'mild' | 'moderate' | 'severe'
    lastUpdate: number
  }
}

export interface InfoUpdateCallback {
  (data: Partial<RealTimeInfoData>): void
}

export interface AlertCallback {
  (type: 'weather' | 'traffic' | 'emergency' | 'poi', data: any): void
}

export interface UserPreferences {
  location: string | GeolocationResult
  updateFrequency: 'realtime' | 'frequent' | 'normal' | 'low'
  alertSettings: {
    weather: boolean
    traffic: boolean
    emergency: boolean
    poi: boolean
  }
  units: {
    temperature: 'celsius' | 'fahrenheit'
    distance: 'metric' | 'imperial'
  }
  notifications: {
    push: boolean
    sound: boolean
    vibration: boolean
  }
  dataSharing: {
    anonymous: boolean
    analytics: boolean
  }
}

export interface CacheStrategy {
  weather: number // 分钟
  traffic: number // 分钟
  poi: number // 分钟
  emergency: number // 分钟
}

export class RealTimeInfoManager {
  private static instance: RealTimeInfoManager
  private weatherService: WeatherService
  private trafficService: TrafficService
  private poiService: POIService
  private emergencyService: EmergencyService
  private geolocationService: GeolocationService
  
  private currentData: RealTimeInfoData
  private updateCallbacks: Set<InfoUpdateCallback> = new Set()
  private alertCallbacks: Set<AlertCallback> = new Set()
  private userPreferences: UserPreferences
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map()
  private isMonitoring = false
  
  private readonly defaultCacheStrategy: CacheStrategy = {
    weather: 30,    // 30分钟
    traffic: 10,    // 10分钟
    poi: 15,        // 15分钟
    emergency: 5    // 5分钟（紧急信息需要更频繁更新）
  }

  private constructor() {
    this.weatherService = WeatherService.getInstance()
    this.trafficService = TrafficService.getInstance()
    this.poiService = POIService.getInstance()
    this.emergencyService = EmergencyService.getInstance()
    this.geolocationService = GeolocationService.getInstance()
    
    this.userPreferences = this.getDefaultPreferences()
    this.currentData = this.initializeData()
  }

  static getInstance(): RealTimeInfoManager {
    if (!RealTimeInfoManager.instance) {
      RealTimeInfoManager.instance = new RealTimeInfoManager()
    }
    return RealTimeInfoManager.instance
  }

  async initialize(location?: string | GeolocationResult): Promise<void> {
    try {
      console.log('初始化实时信息管理器...')
      
      // 设置用户位置
      if (location) {
        await this.setUserLocation(location)
      } else {
        // 尝试获取当前位置
        try {
          const position = await this.geolocationService.getCurrentPosition()
          await this.setUserLocation(position)
        } catch (error) {
          console.warn('无法获取当前位置，使用默认位置:', error)
          await this.setUserLocation('北京市')
        }
      }

      // 初始加载所有数据
      await this.refreshAllData()
      
      console.log('实时信息管理器初始化完成')
    } catch (error) {
      console.error('初始化实时信息管理器失败:', error)
      throw error
    }
  }

  async setUserLocation(location: string | GeolocationResult): Promise<void> {
    try {
      let coordinates: GeolocationResult
      
      if (typeof location === 'string') {
        // 地名需要地理编码
        coordinates = {
          latitude: 39.9042, // 默认北京
          longitude: 116.4074,
          accuracy: 1000,
          timestamp: Date.now()
        }
        this.userPreferences.location = location
      } else {
        coordinates = location
        this.userPreferences.location = location
      }

      // 更新当前位置
      const address = await this.reverseGeocode(coordinates)
      
      this.currentData.location = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        address: address || '未知位置',
        timestamp: coordinates.timestamp
      }

      console.log('用户位置已更新:', this.currentData.location)
    } catch (error) {
      console.error('设置用户位置失败:', error)
      throw error
    }
  }

  async getCurrentData(): Promise<RealTimeInfoData> {
    return { ...this.currentData }
  }

  async refreshWeatherData(): Promise<void> {
    try {
      this.currentData.weather.isLoading = true
      this.notifyUpdateCallbacks()

      const location = this.userPreferences.location
      const data = await this.weatherService.getCurrentWeather(
        typeof location === 'string' ? location : undefined
      )

      this.currentData.weather.data = data
      this.currentData.weather.lastUpdated = Date.now()
      this.currentData.weather.error = null

      console.log('天气数据更新完成')
    } catch (error) {
      console.error('更新天气数据失败:', error)
      this.currentData.weather.error = error instanceof Error ? error.message : '未知错误'
    } finally {
      this.currentData.weather.isLoading = false
      this.notifyUpdateCallbacks()
    }
  }

  async refreshTrafficData(origin?: string | GeolocationResult, destination?: string | GeolocationResult): Promise<void> {
    try {
      this.currentData.traffic.isLoading = true
      this.notifyUpdateCallbacks()

      const location = this.userPreferences.location
      const defaultOrigin = origin || location
      const defaultDestination = destination || '北京市中心'

      const data = await this.trafficService.getTrafficInfo(
        defaultOrigin,
        defaultDestination,
        'driving'
      )

      this.currentData.traffic.data = data
      this.currentData.traffic.lastUpdated = Date.now()
      this.currentData.traffic.error = null

      console.log('交通数据更新完成')
    } catch (error) {
      console.error('更新交通数据失败:', error)
      this.currentData.traffic.error = error instanceof Error ? error.message : '未知错误'
    } finally {
      this.currentData.traffic.isLoading = false
      this.notifyUpdateCallbacks()
    }
  }

  async refreshPOIData(query?: string): Promise<void> {
    try {
      this.currentData.pois.isLoading = true
      this.notifyUpdateCallbacks()

      const location = this.userPreferences.location
      const pois = await this.poiService.searchPOIsWithStatus(
        query || '景点',
        location,
        { limit: 20 }
      )

      this.currentData.pois.data = pois
      this.currentData.pois.lastUpdated = Date.now()
      this.currentData.pois.error = null

      console.log(`POI数据更新完成，找到${pois.length}个景点`)
    } catch (error) {
      console.error('更新POI数据失败:', error)
      this.currentData.pois.error = error instanceof Error ? error.message : '未知错误'
    } finally {
      this.currentData.pois.isLoading = false
      this.notifyUpdateCallbacks()
    }
  }

  async refreshEmergencyData(): Promise<void> {
    try {
      this.currentData.emergency.isLoading = true
      this.notifyUpdateCallbacks()

      const location = this.userPreferences.location
      const [alerts, resources] = await Promise.all([
        this.emergencyService.getEmergencyAlerts(location),
        this.emergencyService.getNearbyEmergencyResources(location)
      ])

      this.currentData.emergency.alerts = alerts
      this.currentData.emergency.resources = resources
      this.currentData.emergency.lastUpdated = Date.now()
      this.currentData.emergency.error = null

      console.log(`紧急数据更新完成，${alerts.length}个预警，${resources.length}个资源`)
    } catch (error) {
      console.error('更新紧急数据失败:', error)
      this.currentData.emergency.error = error instanceof Error ? error.message : '未知错误'
    } finally {
      this.currentData.emergency.isLoading = false
      this.notifyUpdateCallbacks()
    }
  }

  async refreshAllData(): Promise<void> {
    console.log('开始刷新所有实时数据...')
    
    const promises = [
      this.refreshWeatherData(),
      this.refreshTrafficData(),
      this.refreshPOIData(),
      this.refreshEmergencyData()
    ]

    await Promise.allSettled(promises)
    
    // 更新综合摘要
    this.updateSummary()
    
    console.log('所有数据刷新完成')
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) {
      console.log('监控已在运行中')
      return
    }

    console.log('启动实时信息监控...')
    this.isMonitoring = true

    // 天气监控
    const weatherInterval = setInterval(() => {
      this.refreshWeatherData().catch(console.error)
    }, this.getUpdateInterval('weather'))
    this.monitoringIntervals.set('weather', weatherInterval)

    // 交通监控
    const trafficInterval = setInterval(() => {
      this.refreshTrafficData().catch(console.error)
    }, this.getUpdateInterval('traffic'))
    this.monitoringIntervals.set('traffic', trafficInterval)

    // POI监控
    const poiInterval = setInterval(() => {
      this.refreshPOIData().catch(console.error)
    }, this.getUpdateInterval('poi'))
    this.monitoringIntervals.set('poi', poiInterval)

    // 紧急信息监控（更频繁）
    const emergencyInterval = setInterval(() => {
      this.refreshEmergencyData().catch(console.error)
    }, this.getUpdateInterval('emergency'))
    this.monitoringIntervals.set('emergency', emergencyInterval)

    // 启动天气预警监控
    this.startWeatherAlertMonitoring()
    
    // 启动交通事件监控
    this.startTrafficIncidentMonitoring()
    
    // 启动紧急预警监控
    this.startEmergencyAlertMonitoring()

    console.log('实时信息监控已启动')
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) {
      return
    }

    console.log('停止实时信息监控...')
    this.isMonitoring = false

    // 清除所有监控定时器
    this.monitoringIntervals.forEach((interval) => {
      clearInterval(interval)
    })
    this.monitoringIntervals.clear()

    console.log('实时信息监控已停止')
  }

  subscribeToUpdates(callback: InfoUpdateCallback): () => void {
    this.updateCallbacks.add(callback)
    
    // 立即调用一次以提供当前数据
    callback(this.currentData)
    
    // 返回取消订阅函数
    return () => {
      this.updateCallbacks.delete(callback)
    }
  }

  subscribeToAlerts(callback: AlertCallback): () => void {
    this.alertCallbacks.add(callback)
    
    return () => {
      this.alertCallbacks.delete(callback)
    }
  }

  updateUserPreferences(preferences: Partial<UserPreferences>): void {
    this.userPreferences = { ...this.userPreferences, ...preferences }
    console.log('用户偏好已更新:', this.userPreferences)
  }

  getUserPreferences(): UserPreferences {
    return { ...this.userPreferences }
  }

  getCacheStatus() {
    return {
      weather: this.weatherService.getCacheStatus(),
      traffic: this.trafficService.getCacheStatus(),
      poi: this.poiService.getCacheStatus(),
      emergency: this.emergencyService.getCacheStatus()
    }
  }

  clearCache(): void {
    console.log('清除所有缓存...')
    
    this.weatherService.clearCache()
    this.trafficService.clearCache()
    this.poiService.clearCache()
    this.emergencyService.clearCache()
    
    console.log('所有缓存已清除')
  }

  private initializeData(): RealTimeInfoData {
    return {
      location: {
        latitude: 39.9042,
        longitude: 116.4074,
        address: '北京市',
        timestamp: Date.now()
      },
      weather: {
        data: null,
        lastUpdated: 0,
        isLoading: false,
        error: null
      },
      traffic: {
        data: null,
        lastUpdated: 0,
        isLoading: false,
        error: null
      },
      pois: {
        data: [],
        lastUpdated: 0,
        isLoading: false,
        error: null
      },
      emergency: {
        alerts: [],
        resources: [],
        lastUpdated: 0,
        isLoading: false,
        error: null
      },
      summary: {
        overallStatus: 'good',
        activeAlerts: 0,
        trafficLevel: 'low',
        weatherSeverity: 'clear',
        lastUpdate: Date.now()
      }
    }
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      location: '北京市',
      updateFrequency: 'normal',
      alertSettings: {
        weather: true,
        traffic: true,
        emergency: true,
        poi: false
      },
      units: {
        temperature: 'celsius',
        distance: 'metric'
      },
      notifications: {
        push: true,
        sound: true,
        vibration: true
      },
      dataSharing: {
        anonymous: true,
        analytics: false
      }
    }
  }

  private getUpdateInterval(type: keyof CacheStrategy): number {
    const baseInterval = this.defaultCacheStrategy[type]
    const frequencyMultiplier = {
      'realtime': 0.1,
      'frequent': 0.5,
      'normal': 1,
      'low': 2
    }
    
    return Math.floor(baseInterval * 60 * 1000 * frequencyMultiplier[this.userPreferences.updateFrequency])
  }

  private async reverseGeocode(coordinates: GeolocationResult): Promise<string> {
    // 简化实现，实际需要调用地理编码API
    return `${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`
  }

  private updateSummary(): void {
    const weather = this.currentData.weather.data
    const traffic = this.currentData.traffic.data
    const emergency = this.currentData.emergency.alerts

    // 计算综合状态
    let overallStatus: RealTimeInfoData['summary']['overallStatus'] = 'good'
    let weatherSeverity: RealTimeInfoData['summary']['weatherSeverity'] = 'clear'
    let trafficLevel: RealTimeInfoData['summary']['trafficLevel'] = 'low'
    let activeAlerts = emergency.filter(alert => alert.active).length

    // 天气严重程度
    if (weather?.alerts && weather.alerts.length > 0) {
      const maxSeverity = Math.max(...weather.alerts.map(alert => 
        alert.severity === 'extreme' ? 4 :
        alert.severity === 'high' ? 3 :
        alert.severity === 'medium' ? 2 : 1
      ))
      
      weatherSeverity = maxSeverity >= 4 ? 'severe' :
                      maxSeverity >= 3 ? 'moderate' :
                      maxSeverity >= 2 ? 'mild' : 'clear'
    }

    // 交通拥堵程度
    if (traffic?.route) {
      trafficLevel = traffic.route.trafficLevel
    }

    // 紧急预警数量
    activeAlerts = emergency.filter(alert => alert.active && alert.severity === 'critical').length

    // 综合状态评估
    if (activeAlerts > 0 || weatherSeverity === 'severe' || trafficLevel === 'severe') {
      overallStatus = 'critical'
    } else if (emergency.filter(alert => alert.active).length > 2 || weatherSeverity === 'moderate' || trafficLevel === 'high') {
      overallStatus = 'poor'
    } else if (weatherSeverity === 'mild' || trafficLevel === 'medium') {
      overallStatus = 'fair'
    }

    this.currentData.summary = {
      overallStatus,
      activeAlerts,
      trafficLevel,
      weatherSeverity,
      lastUpdate: Date.now()
    }

    this.notifyUpdateCallbacks()
  }

  private notifyUpdateCallbacks(): void {
    this.updateCallbacks.forEach(callback => {
      try {
        callback(this.currentData)
      } catch (error) {
        console.error('更新回调执行失败:', error)
      }
    })
  }

  private startWeatherAlertMonitoring(): void {
    // 这里可以启动天气预警的专门监控
    console.log('启动天气预警监控')
  }

  private startTrafficIncidentMonitoring(): void {
    // 这里可以启动交通事件的专门监控
    console.log('启动交通事件监控')
  }

  private startEmergencyAlertMonitoring(): void {
    // 这里可以启动紧急预警的专门监控
    console.log('启动紧急预警监控')
  }
}