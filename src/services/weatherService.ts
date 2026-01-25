import { GeolocationService } from './geolocationService'
import type { GeolocationResult } from './geolocationService'
import logger from '../utils/logger'

export interface WeatherData {
  location: string
  locationName: string
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
  source: 'api' | 'mock'
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

// 天气条件到图标的映射
const CONDITION_TO_ICON: Record<string, string> = {
  'Clear': 'sunny',
  'Clouds': 'cloudy',
  'Rain': 'rainy',
  'Drizzle': 'rainy',
  'Thunderstorm': 'thunderstorm',
  'Snow': 'snowy',
  'Mist': 'foggy',
  'Fog': 'foggy',
  'Haze': 'hazy'
}

// 中文天气条件映射
const CONDITION_TEXT_ZH: Record<string, string> = {
  'Clear': '晴天',
  'Clouds': '多云',
  'Rain': '小雨',
  'Drizzle': '毛毛雨',
  'Thunderstorm': '雷阵雨',
  'Snow': '小雪',
  'Mist': '薄雾',
  'Fog': '雾',
  'Haze': '霾',
  'Heavy Rain': '大雨',
  'Heavy Snow': '大雪'
}

export class WeatherService {
  private static instance: WeatherService
  private cache: Map<string, WeatherCache> = new Map()
  private readonly CACHE_DURATION = 30 * 60 * 1000 // 30分钟
  private readonly UPDATE_INTERVAL = 15 * 60 * 1000 // 15分钟更新一次

  // 使用环境变量配置API密钥
  private readonly weatherApiKey = import.meta.env.VITE_WEATHER_API_KEY || ''
  private readonly weatherApiBase = 'https://api.openweathermap.org/data/2.5'
  private readonly geoApiBase = 'http://api.openweathermap.org/geo/1.0'

  static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService()
    }
    return WeatherService.instance
  }

  /**
   * 检查API是否已配置
   */
  isApiConfigured(): boolean {
    return Boolean(this.weatherApiKey && this.weatherApiKey !== 'demo_key')
  }

  async getCurrentWeather(location?: string): Promise<WeatherData> {
    const cacheKey = location || 'current_location'

    // 检查缓存
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

      // 尝试从API获取
      if (this.isApiConfigured()) {
        try {
          const weatherData = await this.fetchWeatherDataFromApi(coordinates, location)
          this.cache.set(cacheKey, {
            data: weatherData,
            location: cacheKey,
            timestamp: Date.now(),
            expiresAt: Date.now() + this.CACHE_DURATION
          })
          return weatherData
        } catch (apiError) {
          logger.warn('天气API调用失败，使用模拟数据:', apiError)
        }
      }

      // 回退到模拟数据
      const mockData = await this.fetchWeatherData(coordinates, location)
      this.cache.set(cacheKey, {
        data: mockData,
        location: cacheKey,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.CACHE_DURATION
      })
      return mockData
    } catch (error) {
      logger.error('获取天气数据失败:', error)
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

      // 尝试从API获取
      if (this.isApiConfigured()) {
        try {
          const weatherData = await this.fetchWeatherForecastFromApi(coordinates, days, location)
          this.cache.set(cacheKey, {
            data: weatherData,
            location: cacheKey,
            timestamp: Date.now(),
            expiresAt: Date.now() + this.CACHE_DURATION
          })
          return weatherData
        } catch (apiError) {
          logger.warn('天气预报API调用失败，使用模拟数据:', apiError)
        }
      }

      const weatherData = await this.fetchWeatherForecast(coordinates, days, location)
      this.cache.set(cacheKey, {
        data: weatherData,
        location: cacheKey,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.CACHE_DURATION
      })
      return weatherData
    } catch (error) {
      logger.error('获取天气预报失败:', error)
      throw new Error(`获取天气预报失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  async checkWeatherAlerts(location?: string): Promise<WeatherAlert[]> {
    try {
      const weatherData = await this.getCurrentWeather(location)
      return weatherData.alerts || []
    } catch (error) {
      logger.error('检查天气预警失败:', error)
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

        const alerts = await this.checkWeatherAlerts(location)
        const newAlerts = alerts.filter(
          alert => alert.startTime > Date.now() - this.UPDATE_INTERVAL
        )

        if (newAlerts.length > 0 && onAlert) {
          newAlerts.forEach(alert => onAlert(alert))
        }
      } catch (error) {
        logger.error('天气监控更新失败:', error)
      }
    }, this.UPDATE_INTERVAL)

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

  /**
   * 从OpenWeatherMap API获取实时天气
   */
  private async fetchWeatherDataFromApi(
    coordinates: GeolocationResult,
    locationName?: string
  ): Promise<WeatherData> {
    const { latitude, longitude } = coordinates
    const response = await fetch(
      `${this.weatherApiBase}/weather?lat=${latitude}&lon=${longitude}&units=metric&lang=zh&appid=${this.weatherApiKey}`
    )

    if (!response.ok) {
      throw new Error(`天气API响应错误: ${response.status}`)
    }

    const data = await response.json()
    const condition = data.weather[0]?.main || 'Clear'

    return {
      location: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
      locationName: locationName || data.name || '未知地点',
      current: {
        temperature: Math.round(data.main?.temp || 20),
        humidity: data.main?.humidity || 50,
        pressure: data.main?.pressure || 1013,
        visibility: (data.visibility || 10000) / 1000,
        uvIndex: 5, // 当前天气API不提供UV指数
        windSpeed: Math.round((data.wind?.speed || 0) * 3.6), // 转换为km/h
        windDirection: data.wind?.deg || 0,
        condition: CONDITION_TEXT_ZH[condition] || condition,
        icon: CONDITION_TO_ICON[condition] || 'sunny',
        lastUpdated: Date.now()
      },
      forecast: [], // 单个天气API不包含预报，需要调用另一个API
      alerts: [], // 需要单独调用预警API
      updatedAt: Date.now(),
      source: 'api'
    }
  }

  /**
   * 从OpenWeatherMap API获取天气预报 (One Call API 3.0需要付费，使用5天预报API)
   */
  private async fetchWeatherForecastFromApi(
    coordinates: GeolocationResult,
    days: number,
    locationName?: string
  ): Promise<WeatherData> {
    const { latitude, longitude } = coordinates

    // 先获取当前天气
    const currentResponse = await fetch(
      `${this.weatherApiBase}/weather?lat=${latitude}&lon=${longitude}&units=metric&lang=zh&appid=${this.weatherApiKey}`
    )

    if (!currentResponse.ok) {
      throw new Error(`天气API响应错误: ${currentResponse.status}`)
    }

    const currentData = await currentResponse.json()

    // 获取5天预报
    const forecastResponse = await fetch(
      `${this.weatherApiBase}/forecast?lat=${latitude}&lon=${longitude}&units=metric&lang=zh&appid=${this.weatherApiKey}`
    )

    if (!forecastResponse.ok) {
      throw new Error(`天气预报API响应错误: ${forecastResponse.status}`)
    }

    const forecastData = await forecastResponse.json()
    const condition = currentData.weather[0]?.main || 'Clear'

    // 处理预报数据 - 按天分组
    const dailyForecasts = new Map<string, typeof forecastData.list[0][]>()

    forecastData.list?.forEach((item: any) => {
      const date = item.dt_txt.split(' ')[0]
      if (!dailyForecasts.has(date)) {
        dailyForecasts.set(date, [])
      }
      dailyForecasts.get(date)!.push(item)
    })

    // 提取每天的预报
    const forecast: WeatherData['forecast'] = []
    const today = new Date().toISOString().split('T')[0]

    let dayCount = 0
    for (const [date, items] of dailyForecasts) {
      if (date <= today) continue
      if (dayCount >= days) break

      // 使用中午的预报数据
      const noonItem = items.find((item: any) => {
        const hour = new Date(item.dt * 1000).getHours()
        return hour >= 11 && hour <= 13
      }) || items[0]

      const dayCondition = noonItem.weather[0]?.main || 'Clear'

      forecast.push({
        date,
        high: Math.round(Math.max(...items.map((i: any) => i.main?.temp_max || 20))),
        low: Math.round(Math.min(...items.map((i: any) => i.main?.temp_min || 10))),
        condition: CONDITION_TEXT_ZH[dayCondition] || dayCondition,
        icon: CONDITION_TO_ICON[dayCondition] || 'sunny',
        humidity: noonItem.main?.humidity || 50,
        windSpeed: Math.round((noonItem.wind?.speed || 0) * 3.6),
        windDirection: noonItem.wind?.deg || 0
      })

      dayCount++
    }

    return {
      location: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
      locationName: locationName || currentData.name || '未知地点',
      current: {
        temperature: Math.round(currentData.main?.temp || 20),
        humidity: currentData.main?.humidity || 50,
        pressure: currentData.main?.pressure || 1013,
        visibility: (currentData.visibility || 10000) / 1000,
        uvIndex: 5,
        windSpeed: Math.round((currentData.wind?.speed || 0) * 3.6),
        windDirection: currentData.wind?.deg || 0,
        condition: CONDITION_TEXT_ZH[condition] || condition,
        icon: CONDITION_TO_ICON[condition] || 'sunny',
        lastUpdated: Date.now()
      },
      forecast,
      alerts: [],
      updatedAt: Date.now(),
      source: 'api'
    }
  }

  /**
   * 将城市名称转换为坐标
   */
  private async getLocationFromName(location: string): Promise<GeolocationResult> {
    if (!this.isApiConfigured()) {
      // 使用简单的城市坐标映射
      return this.getChineseCityCoordinates(location) || {
        latitude: 39.9042,
        longitude: 116.4074,
        accuracy: 1000,
        timestamp: Date.now()
      }
    }

    try {
      const encodedLocation = encodeURIComponent(location)
      const response = await fetch(
        `${this.geoApiBase}/direct?q=${encodedLocation},CN&limit=1&appid=${this.weatherApiKey}`
      )

      if (!response.ok) {
        throw new Error(`地理编码API响应错误: ${response.status}`)
      }

      const data = await response.json()

      if (data && data.length > 0) {
        return {
          latitude: data[0].lat,
          longitude: data[0].lon,
          accuracy: 1000,
          timestamp: Date.now()
        }
      }
    } catch (error) {
      logger.warn('地理编码失败，使用默认坐标:', error)
    }

    // 回退到中国城市坐标映射
    return this.getChineseCityCoordinates(location) || {
      latitude: 39.9042,
      longitude: 116.4074,
      accuracy: 1000,
      timestamp: Date.now()
    }
  }

  /**
   * 中国主要城市坐标映射
   */
  private getChineseCityCoordinates(location: string): GeolocationResult | null {
    const cityCoordinates: Record<string, { lat: number; lng: number }> = {
      '北京': { lat: 39.9042, lng: 116.4074 },
      '上海': { lat: 31.2304, lng: 121.4737 },
      '广州': { lat: 23.1291, lng: 113.2644 },
      '深圳': { lat: 22.5431, lng: 114.0579 },
      '杭州': { lat: 30.2741, lng: 120.1551 },
      '成都': { lat: 30.5728, lng: 104.0668 },
      '重庆': { lat: 29.5630, lng: 106.5516 },
      '武汉': { lat: 30.5928, lng: 114.3055 },
      '西安': { lat: 34.3416, lng: 108.9398 },
      '南京': { lat: 32.0603, lng: 118.7969 },
      '天津': { lat: 39.1256, lng: 117.1909 },
      '苏州': { lat: 31.2989, lng: 120.5853 },
      '长沙': { lat: 28.2282, lng: 112.9388 },
      '青岛': { lat: 36.0671, lng: 120.3826 },
      '厦门': { lat: 24.4798, lng: 118.0894 },
      '昆明': { lat: 25.0453, lng: 102.7097 },
      '贵阳': { lat: 26.6470, lng: 106.6302 },
      '南宁': { lat: 22.8170, lng: 108.3665 },
      '南昌': { lat: 28.6829, lng: 115.8579 },
      '合肥': { lat: 31.8612, lng: 117.2830 },
      '太原': { lat: 37.8706, lng: 112.5489 },
      '沈阳': { lat: 41.7968, lng: 123.4315 },
      '长春': { lat: 43.8868, lng: 125.3245 },
      '哈尔滨': { lat: 45.8038, lng: 126.5350 },
      '兰州': { lat: 36.0611, lng: 103.8343 },
      '乌鲁木齐': { lat: 43.8256, lng: 87.6168 },
      '拉萨': { lat: 29.6525, lng: 91.1721 },
      '西宁': { lat: 36.6232, lng: 101.7782 },
      '呼和浩特': { lat: 40.8427, lng: 111.7492 },
      '银川': { lat: 38.4870, lng: 106.2309 },
      '海口': { lat: 20.0440, lng: 110.3492 },
      '三亚': { lat: 18.2528, lng: 109.5119 },
      '珠海': { lat: 22.2710, lng: 113.5767 },
      '大理': { lat: 25.6063, lng: 100.2676 },
      '丽江': { lat: 26.8756, lng: 100.2298 },
      '桂林': { lat: 25.2740, lng: 110.2992 },
      '黄山': { lat: 29.7144, lng: 118.3375 },
      '无锡': { lat: 31.4912, lng: 120.3119 },
      '宁波': { lat: 29.8684, lng: 121.5440 },
      '温州': { lat: 28.0006, lng: 120.6721 },
      '绍兴': { lat: 30.0302, lng: 120.5801 },
      '东莞': { lat: 23.0489, lng: 113.7447 },
      '佛山': { lat: 23.0218, lng: 113.1219 }
    }

    // 模糊匹配
    for (const [city, coords] of Object.entries(cityCoordinates)) {
      if (location.includes(city) || city.includes(location)) {
        return { latitude: coords.lat, longitude: coords.lng, accuracy: 100, timestamp: Date.now() }
      }
    }

    return null
  }

  /**
   * 获取模拟天气数据（当API不可用时使用）
   */
  private async fetchWeatherData(
    coordinates: GeolocationResult,
    locationName?: string
  ): Promise<WeatherData> {
    const location = locationName || this.getLocationNameFromCoords(coordinates)

    // 根据坐标生成伪随机的天气数据
    const seed = Math.abs(
      coordinates.latitude * 1000 + coordinates.longitude * 1000
    )
    const baseTemp = 15 + (seed % 15) // 15-30度基础温度
    const humidity = 40 + (seed % 40) // 40-80%湿度

    const conditions = ['晴天', '多云', '阴天', '小雨']
    const condition = conditions[seed % conditions.length]

    return {
      location: `${coordinates.latitude.toFixed(2)}, ${coordinates.longitude.toFixed(2)}`,
      locationName: location,
      current: {
        temperature: baseTemp + Math.round(Math.random() * 5),
        humidity,
        pressure: 1010 + (seed % 10),
        visibility: 8 + (seed % 5),
        uvIndex: 3 + (seed % 5),
        windSpeed: 5 + (seed % 15),
        windDirection: (seed * 37) % 360,
        condition,
        icon: this.getIconFromCondition(condition),
        lastUpdated: Date.now()
      },
      forecast: this.generateMockForecast(7, coordinates),
      alerts: [],
      updatedAt: Date.now(),
      source: 'mock'
    }
  }

  private async fetchWeatherForecast(
    coordinates: GeolocationResult,
    days: number,
    locationName?: string
  ): Promise<WeatherData> {
    const location = locationName || this.getLocationNameFromCoords(coordinates)
    const seed = Math.abs(
      coordinates.latitude * 1000 + coordinates.longitude * 1000
    )

    return {
      location: `${coordinates.latitude.toFixed(2)}, ${coordinates.longitude.toFixed(2)}`,
      locationName: location,
      current: {
        temperature: 20 + (seed % 10),
        humidity: 50 + (seed % 30),
        pressure: 1013,
        visibility: 10,
        uvIndex: 5,
        windSpeed: 10 + (seed % 10),
        windDirection: (seed * 37) % 360,
        condition: '多云',
        icon: 'partly-cloudy',
        lastUpdated: Date.now()
      },
      forecast: this.generateMockForecast(days, coordinates),
      alerts: [],
      updatedAt: Date.now(),
      source: 'mock'
    }
  }

  private getLocationNameFromCoords(coordinates: GeolocationResult): string {
    const city = this.getChineseCityCoordinatesByCoords(coordinates.latitude, coordinates.longitude)
    return city || '未知地点'
  }

  private getChineseCityCoordinatesByCoords(lat: number, lng: number): string | null {
    const cityCoordinates: Array<{ name: string; lat: number; lng: number }> = [
      { name: '北京', lat: 39.9042, lng: 116.4074 },
      { name: '上海', lat: 31.2304, lng: 121.4737 },
      { name: '广州', lat: 23.1291, lng: 113.2644 },
      { name: '深圳', lat: 22.5431, lng: 114.0579 },
      { name: '杭州', lat: 30.2741, lng: 120.1551 },
      { name: '成都', lat: 30.5728, lng: 104.0668 },
      { name: '重庆', lat: 29.5630, lng: 106.5516 },
      { name: '武汉', lat: 30.5928, lng: 114.3055 },
      { name: '西安', lat: 34.3416, lng: 108.9398 },
      { name: '南京', lat: 32.0603, lng: 118.7969 }
    ]

    let nearestCity = null
    let nearestDistance = Infinity

    for (const city of cityCoordinates) {
      const distance = Math.sqrt(
        Math.pow(city.lat - lat, 2) + Math.pow(city.lng - lng, 2)
      )
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestCity = city.name
      }
    }

    return nearestDistance < 5 ? nearestCity : null
  }

  private getIconFromCondition(condition: string): string {
    const iconMap: Record<string, string> = {
      '晴天': 'sunny',
      '多云': 'partly-cloudy',
      '阴天': 'cloudy',
      '小雨': 'rainy',
      '中雨': 'rainy',
      '大雨': 'rainy',
      '雪': 'snowy',
      '雾': 'foggy'
    }
    return iconMap[condition] || 'sunny'
  }

  private generateMockForecast(days: number, coordinates: GeolocationResult): WeatherData['forecast'] {
    const conditions = ['晴天', '多云', '阴天', '小雨']
    const icons = ['sunny', 'partly-cloudy', 'cloudy', 'rainy']
    const seed = Math.abs(
      coordinates.latitude * 1000 + coordinates.longitude * 1000
    )

    const forecast = []
    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)

      const conditionIndex = (seed + i) % conditions.length
      forecast.push({
        date: date.toISOString().split('T')[0],
        high: 20 + ((seed + i * 7) % 10),
        low: 12 + ((seed + i * 3) % 8),
        condition: conditions[conditionIndex],
        icon: icons[conditionIndex],
        humidity: 40 + ((seed + i * 11) % 40),
        windSpeed: 5 + ((seed + i * 5) % 15),
        windDirection: ((seed + i * 37) % 360)
      })
    }

    return forecast
  }
}

export const weatherService = WeatherService.getInstance()
