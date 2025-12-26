export interface GeolocationResult {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

export interface GeolocationError {
  code: number
  message: string
}

export type GeolocationPermissionState = 'granted' | 'denied' | 'prompt'

export class GeolocationService {
  private static instance: GeolocationService
  private watchId: number | null = null

  static getInstance(): GeolocationService {
    if (!GeolocationService.instance) {
      GeolocationService.instance = new GeolocationService()
    }
    return GeolocationService.instance
  }

  async getCurrentPosition(options?: PositionOptions): Promise<GeolocationResult> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('浏览器不支持地理定位功能'))
        return
      }

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5分钟
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          })
        },
        (error) => {
          let message = '获取位置失败'
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = '用户拒绝了定位权限，请在浏览器设置中允许定位访问'
              break
            case error.POSITION_UNAVAILABLE:
              message = '位置信息暂时不可用，请检查GPS信号或网络连接后重试'
              break
            case error.TIMEOUT:
              message = '获取位置超时，请重试或手动输入出发城市'
              break
            default:
              if (error.message && error.message.includes('LocationUnknown')) {
                message = '定位服务暂时无法获取位置，请稍后重试或手动输入出发城市'
              } else {
                message = `定位失败：${error.message || '未知错误'}`
              }
              break
          }
          reject(new Error(message))
        },
        { ...defaultOptions, ...options }
      )
    })
  }

  async getPermissionState(): Promise<GeolocationPermissionState> {
    if (!navigator.permissions) {
      return 'prompt'
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' })
      return result.state as GeolocationPermissionState
    } catch {
      return 'prompt'
    }
  }

  watchPosition(
    callback: (position: GeolocationResult) => void,
    errorCallback?: (error: GeolocationError) => void,
    options?: PositionOptions
  ): number {
    if (!navigator.geolocation) {
      throw new Error('浏览器不支持地理定位功能')
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        })
      },
      (error) => {
        if (errorCallback) {
          errorCallback({
            code: error.code,
            message: error.message
          })
        }
      },
      options
    )

    return this.watchId
  }

  clearWatch(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
  }

  isSupported(): boolean {
    return 'geolocation' in navigator
  }
}