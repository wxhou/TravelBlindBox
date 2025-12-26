export interface IPGeolocationResult {
  city: string
  country: string
  region: string
  latitude: number
  longitude: number
  timezone: string
}

export interface IPGeolocationError {
  message: string
  service: string
}

export class IPGeolocationService {
  private static instance: IPGeolocationService

  static getInstance(): IPGeolocationService {
    if (!IPGeolocationService.instance) {
      IPGeolocationService.instance = new IPGeolocationService()
    }
    return IPGeolocationService.instance
  }

  async getCurrentLocation(): Promise<IPGeolocationResult> {
    try {
      return await this.tryIpApiCom()
    } catch (error) {
      console.warn('IP geolocation failed:', error)
      throw new Error('无法获取当前位置信息，请手动输入出发城市')
    }
  }

  private async tryIpApiCom(): Promise<IPGeolocationResult> {
    try {
      const response = await fetch('http://ip-api.com/json')

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()

      if (data.status === 'fail') {
        throw new Error(data.message || 'API error')
      }

      return {
        city: data.city || '',
        country: data.country || '',
        region: data.regionName || '',
        latitude: parseFloat(data.lat) || 0,
        longitude: parseFloat(data.lon) || 0,
        timezone: data.timezone || ''
      }
    } catch (error) {
      console.warn('ip-api.com failed:', error)
      throw error
    }
  }
}