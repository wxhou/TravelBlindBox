import { useEffect, useRef, useState } from 'react'
import { load } from '@amap/amap-jsapi-loader'
import type { POI } from '../../types'

interface MapContainerProps {
  pois?: POI[]
  center?: [number, number]
  zoom?: number
  className?: string
  onMapReady?: (map: any) => void
}

export function MapContainer({
  pois = [],
  center = [116.3974, 39.9093],
  zoom = 10,
  className = '',
  onMapReady
}: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const initMap = async () => {
      try {
        setLoading(true)
        setError(null)

        const AMap = await load({
          key: '9f8e5af62cebb2c124583e5023c19fe4',
          version: '2.0',
          plugins: ['AMap.Marker', 'AMap.Polyline', 'AMap.InfoWindow']
        })

        if (!isMounted || !mapRef.current) return

        const mapInstance = new AMap.Map(mapRef.current, {
          center,
          zoom,
          viewMode: '2D',
          lang: 'zh_cn'
        })

        setMap(mapInstance)
        onMapReady?.(mapInstance)

      } catch (err) {
        if (isMounted) {
          console.error('地图初始化失败:', err)
          setError(err instanceof Error ? err.message : '地图加载失败')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    initMap()

    return () => {
      isMounted = false
      if (map) {
        map.destroy()
      }
    }
  }, [center, zoom, onMapReady])

  useEffect(() => {
    if (map && pois.length > 0) {
      const bounds = pois.reduce((acc, poi) => {
        acc.extend([poi.location.lng, poi.location.lat])
        return acc
      }, new (window as any).AMap.Bounds())

      map.setBounds(bounds, true, [50, 50, 50, 50])
    }
  }, [map, pois])

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">⚠️</div>
          <div className="text-sm text-gray-600">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-gray-600">加载地图中...</span>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full rounded-lg" />
    </div>
  )
}