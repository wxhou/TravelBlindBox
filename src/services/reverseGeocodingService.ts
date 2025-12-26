export interface Address {
  city: string
  region: string
  country: string
  displayName: string
}

export class ReverseGeocodingService {
  private static instance: ReverseGeocodingService
  private cache = new Map<string, Address>()

  static getInstance(): ReverseGeocodingService {
    if (!ReverseGeocodingService.instance) {
      ReverseGeocodingService.instance = new ReverseGeocodingService()
    }
    return ReverseGeocodingService.instance
  }

  async coordinatesToCity(latitude: number, longitude: number): Promise<string> {
    const address = await this.coordinatesToAddress(latitude, longitude)
    return address.city || address.displayName.split(',')[0].trim()
  }

  async coordinatesToAddress(latitude: number, longitude: number): Promise<Address> {
    const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'TravelBlindBox/1.0'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`地理编码服务响应错误: ${response.status}`)
      }

      const data = await response.json()

      if (!data || !data.address) {
        throw new Error('无法解析地址信息')
      }

      const address: Address = {
        city: data.address.city ||
              data.address.town ||
              data.address.village ||
              data.address.municipality ||
              data.address.county ||
              data.display_name.split(',')[0].trim(),
        region: data.address.state || data.address.region || '',
        country: data.address.country || '',
        displayName: data.display_name
      }

      this.cache.set(cacheKey, address)
      return address

    } catch (error) {
      console.error('逆地理编码失败:', error)

      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('网络连接失败，请检查网络连接')
      }

      throw new Error('无法获取地址信息，请稍后重试')
    }
  }

  clearCache(): void {
    this.cache.clear()
  }
}