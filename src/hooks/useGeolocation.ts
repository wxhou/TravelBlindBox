import { useState, useEffect } from 'react'
import { GeolocationService } from '../services/geolocationService'
import { ReverseGeocodingService } from '../services/reverseGeocodingService'
import { IPGeolocationService } from '../services/ipGeolocationService'
import type { GeolocationResult, GeolocationPermissionState } from '../services/geolocationService'

export interface GeolocationState {
  city: string | null
  coordinates: GeolocationResult | null
  loading: boolean
  error: string | null
  permission: GeolocationPermissionState
  isAutoLocated: boolean
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    city: null,
    coordinates: null,
    loading: false,
    error: null,
    permission: 'prompt',
    isAutoLocated: false
  })

  const geolocationService = GeolocationService.getInstance()
  const geocodingService = ReverseGeocodingService.getInstance()
  const ipGeolocationService = IPGeolocationService.getInstance()

  const checkPermission = async () => {
    try {
      const permission = await geolocationService.getPermissionState()
      setState(prev => ({ ...prev, permission }))
      return permission
    } catch {
      setState(prev => ({ ...prev, permission: 'prompt' }))
      return 'prompt' as GeolocationPermissionState
    }
  }

  const requestLocation = async (options?: PositionOptions) => {
    if (!geolocationService.isSupported()) {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const ipLocation = await ipGeolocationService.getCurrentLocation()
        setState(prev => ({
          ...prev,
          city: ipLocation.city,
          loading: false,
          isAutoLocated: true
        }))
      } catch (ipError) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: '无法获取位置信息，请手动输入出发城市',
          isAutoLocated: false
        }))
      }
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const permission = await checkPermission()
      if (permission === 'denied') {
        throw new Error('定位权限已被拒绝，尝试IP定位')
      }

      const coordinates = await geolocationService.getCurrentPosition(options)
      const city = await geocodingService.coordinatesToCity(
        coordinates.latitude,
        coordinates.longitude
      )

      setState(prev => ({
        ...prev,
        coordinates,
        city,
        loading: false,
        isAutoLocated: true
      }))

    } catch (gpsError) {
      console.warn('GPS定位失败，尝试IP定位:', gpsError)

      try {
        const ipLocation = await ipGeolocationService.getCurrentLocation()
        setState(prev => ({
          ...prev,
          city: ipLocation.city,
          loading: false,
          isAutoLocated: true
        }))
      } catch (ipError) {
        console.warn('IP定位也失败:', ipError)
        const errorMessage = gpsError instanceof Error ? gpsError.message : '获取位置失败，请手动输入出发城市'
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
          isAutoLocated: false
        }))
      }
    }
  }

  const retryLocation = async () => {
    await requestLocation({ enableHighAccuracy: false, timeout: 15000 })
  }

  const handleLocationRequest = () => {
    requestLocation()
  }

  useEffect(() => {
    checkPermission()
  }, [geolocationService])

  return {
    ...state,
    requestLocation: handleLocationRequest,
    retryLocation,
    isSupported: geolocationService.isSupported()
  }
}