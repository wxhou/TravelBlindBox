import { GeolocationService } from './geolocationService'
import type { GeolocationResult } from './geolocationService'

export interface WeatherData {
  location: string
  current: {
    temperature: number
    humidity: number
    pressure: number
    visibility: number
    uvIndex: number
    windSpeed: number
    windDirection: number
    condition: string
    icon: string
    lastUpdated: number
  }
  forecast: Array<{
    date: string
    high: number
    low: number
    condition: string
    icon: string
    humidity: number
    windSpeed: number
    windDirection: number
  }>
  alerts: WeatherAlert[]
  updatedAt: number
}

export interface WeatherAlert {
  id: string
  type: 'severe_weather' | 'rain' | 'wind' | 'temperature' | 'uv' | 'air_quality'
  severity: 'low' | 'medium' | 'high' | 'extreme'
  title: string
  description: string
  startTime: number
  endTime?: number
  recommendations: string[]
}

export interface WeatherCache {
  data: WeatherData
  location: string
  timestamp: number
  expiresAt: number
}

export class WeatherService {
  private static instance: WeatherService
  private cache: Map<string, WeatherCache> = new Map()
  private readonly CACHE_DURATION = 30 * 60 * 1000 // 30分钟
  private readonly UPDATE_INTERVAL = 15 * 60 * 1000 // 15分钟更新一次
  
  private readonly weatherApiKey = process.env.VITE_WEATHER_API_KEY || 'demo_key'
  private readonly weatherApiBase = 'https://api.openweathermap.org/data/2.5'

  static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService()
    }
    return WeatherService.instance
  }

  async getCurrentWeather(location?: string): Promise<WeatherData> {
    const cacheKey = location || 'current_location'
    
    // 检查缓存
    const cached = this.cache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data
    }

    try {
      // 获取位置
      let coordinates: GeolocationResult
      if (location) {
        coordinates = await this.getLocationFromName(location)
      } else {
        coordinates = await GeolocationService.getInstance().getCurrentPosition()
      }

      // 获取天气数据
      const weatherData = await this.fetchWeatherData(coordinates)
      
      // 缓存数据
      this.cache.set(cacheKey, {
        data: weatherData,
        location: cacheKey,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.CACHE_DURATION
      })

      return weatherData
    } catch (error) {
      console.error('获取天气数据失败:', error)
      throw new Error(`获取天气信息失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  async getWeatherForecast(location?: string, days: number = 7): Promise<WeatherData> {
    const cacheKey = `${location || 'current_location'}_forecast_${days}`
    
    const cached = this.cache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data
    }

    try {
      let coordinates: GeolocationResult
      if (location) {
        coordinates = await this.getLocationFromName(location)
      } else {
        coordinates = await GeolocationService.getInstance().getCurrentPosition()
      }

      const weatherData = await this.fetchWeatherForecast(coordinates, days)
      
      this.cache.set(cacheKey, {
        data: weatherData,
        location: cacheKey,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.CACHE_DURATION
      })

      return weatherData
    } catch (error) {
      console.error('获取天气预报失败:', error)
      throw new Error(`获取天气预报失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  async checkWeatherAlerts(location?: string): Promise<WeatherAlert[]> {
    try {
      const weatherData = await this.getCurrentWeather(location)
      return weatherData.alerts || []
    } catch (error) {
      console.error('检查天气预警失败:', error)
      return []
    }
  }

  async startWeatherMonitoring(
    location?: string,
    onUpdate?: (data: WeatherData) => void,
    onAlert?: (alert: WeatherAlert) => void
  ): Promise<() => void> {
    const intervalId = setInterval(async () => {
      try {
        const data = await this.getCurrentWeather(location)
        
        if (onUpdate) {
          onUpdate(data)
        }

        // 检查新的预警
        const alerts = await this.checkWeatherAlerts(location)
        const newAlerts = alerts.filter(alert => 
          alert.startTime > Date.now() - this.UPDATE_INTERVAL
        )

        if (newAlerts.length > 0 && onAlert) {
          newAlerts.forEach(alert => onAlert(alert))
        }
      } catch (error) {
        console.error('天气监控更新失败:', error)
      }
    }, this.UPDATE_INTERVAL)

    // 返回停止函数
    return () => clearInterval(intervalId)
  }

  clearCache(location?: string): void {
    if (location) {
      this.cache.delete(location)
    } else {
      this.cache.clear()
    }
  }

  getCacheStatus(): { totalEntries: number; locations: string[] } {
    return {
      totalEntries: this.cache.size,
      locations: Array.from(this.cache.keys())
    }
  }

  private async fetchWeatherData(coordinates: GeolocationResult): Promise<WeatherData> {
    // 使用模拟数据作为示例，实际应用中需要接入真实的天气API
    const mockData: WeatherData = {
      location: `${coordinates.latitude.toFixed(2)}, ${coordinates.longitude.toFixed(2)}`,
      current: {
        temperature: 22,
        humidity: 65,
        pressure: 1013,
        visibility: 10,
        uvIndex: 5,
        windSpeed: 12,
        windDirection: 180,
        condition: '多云',
        icon: 'partly-cloudy',
        lastUpdated: Date.now()
      },
      forecast: this.generateMockForecast(),
      alerts: this.generateMockAlerts(),
      updatedAt: Date.now()
    }

    return mockData
  }

  private async fetchWeatherForecast(coordinates: GeolocationResult, days: number): Promise<WeatherData> {
    const mockData: WeatherData = {
      location: `${coordinates.latitude.toFixed(2)}, ${coordinates.longitude.toFixed(2)}`,
      current: {
        temperature: 22,
        humidity: 65,
        pressure: 1013,
        visibility: 10,
        uvIndex: 5,
        windSpeed: 12,
        windDirection: 180,
        condition: '多云',
        icon: 'partly-cloudy',
        lastUpdated: Date.now()
      },
      forecast: this.generateMockForecast(days),
      alerts: this.generateMockAlerts(),
      updatedAt: Date.now()
    }

    return mockData
  }

  private async getLocationFromName(location: string): Promise<GeolocationResult> {
    // 简化实现，实际需要地理编码服务
    // 返回默认坐标（北京）
    return {
      latitude: 39.9042,
      longitude: 116.4074,
      accuracy: 1000,
      timestamp: Date.now()
    }
  }

  private generateMockForecast(days: number = 7): WeatherData['forecast'] {
    const conditions = ['晴天', '多云', '小雨', '阴天']
    const icons = ['sunny', 'partly-cloudy', 'rainy', 'cloudy']
    
    const forecast = []
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        high: Math.floor(Math.random() * 15) + 20,
        low: Math.floor(Math.random() * 10) + 10,
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        icon: icons[Math.floor(Math.random() * icons.length)],
        humidity: Math.floor(Math.random() * 40) + 40,
        windSpeed: Math.floor(Math.random() * 20) + 5,
        windDirection: Math.floor(Math.random() * 360)
      })
    }
    
    return forecast
  }

  private generateMockAlerts(): WeatherAlert[] {
    const alertTypes = [
      {
        type: 'rain' as const,
        severity: 'medium' as const,
        title: '降雨预警',
        description: '预计在未来2小时内有中到大雨',
        recommendations: ['携带雨具', '避免户外活动', '注意交通安全']
      },
      {
        type: 'temperature' as const,
        severity: 'high' as const,
        title: '高温预警',
        description: '今日最高温度将超过35°C',
        recommendations: ['减少户外活动', '及时补充水分', '避免长时间暴晒']
      }
    ]

    return alertTypes.map((alert, index) => ({
      id: `alert_${index}`,
      ...alert,
      startTime: Date.now() - Math.random() * 3600000,
      endTime: Date.now() + Math.random() * 86400000
    }))
  }
}