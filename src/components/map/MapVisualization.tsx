import { useState, useMemo, lazy, Suspense } from 'react'
import type { POI } from '../../types'

const MapContainer = lazy(() => import('./MapContainer').then(module => ({ default: module.MapContainer })))
const POIMarkers = lazy(() => import('./POIMarkers').then(module => ({ default: module.POIMarkers })))
const RouteOverlay = lazy(() => import('./RouteOverlay').then(module => ({ default: module.RouteOverlay })))

interface MapVisualizationProps {
  pois: POI[]
  className?: string
}

export function MapVisualization({ pois, className = 'h-64 sm:h-80 md:h-96 lg:h-[400px]' }: MapVisualizationProps) {
  const [mapInstance, setMapInstance] = useState<any>(null)
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null)

  const routeSegments = useMemo(() => {
    if (pois.length < 2) return []

    const segments = []
    for (let i = 0; i < pois.length - 1; i++) {
      segments.push({
        from: pois[i],
        to: pois[i + 1],
        transportation: '自驾' as const,
        distance: Math.round(
          Math.sqrt(
            Math.pow(pois[i + 1].location.lng - pois[i].location.lng, 2) +
            Math.pow(pois[i + 1].location.lat - pois[i].location.lat, 2)
          ) * 111
        ),
        duration: `${Math.round(
          Math.sqrt(
            Math.pow(pois[i + 1].location.lng - pois[i].location.lng, 2) +
            Math.pow(pois[i + 1].location.lat - pois[i].location.lat, 2)
          ) * 111 / 80 * 60
        )}分钟`
      })
    }
    return segments
  }, [pois])

  const center = useMemo(() => {
    if (pois.length === 0) return [116.3974, 39.9093]

    const avgLng = pois.reduce((sum, poi) => sum + poi.location.lng, 0) / pois.length
    const avgLat = pois.reduce((sum, poi) => sum + poi.location.lat, 0) / pois.length
    return [avgLng, avgLat]
  }, [pois])

  const handleMapReady = (map: any) => {
    setMapInstance(map)
  }

  const handleMarkerClick = (poi: POI) => {
    setSelectedPOI(poi)
  }

  return (
    <div className={`bg-white rounded-lg sm:rounded-xl shadow-lg overflow-hidden ${className}`}>
      <div className="p-3 sm:p-4 border-b border-gray-200">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-xl sm:text-2xl">🗺️</span>
          旅行路线地图
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          查看景点、酒店、餐厅位置及路线轨迹
        </p>
      </div>

      <div className="relative h-full">
        <Suspense
          fallback={
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">加载地图组件...</span>
              </div>
            </div>
          }
        >
          <MapContainer
            pois={pois}
            center={center as [number, number]}
            zoom={pois.length > 1 ? 8 : 10}
            className="h-full"
            onMapReady={handleMapReady}
          />

          {mapInstance && (
            <>
              <POIMarkers
                map={mapInstance}
                pois={pois}
                onMarkerClick={handleMarkerClick}
              />
              <RouteOverlay
                map={mapInstance}
                segments={routeSegments}
              />
            </>
          )}
        </Suspense>
      </div>

      {selectedPOI && (
        <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 bg-white rounded-lg shadow-lg p-3 sm:p-4 max-w-sm sm:max-w-md mx-auto sm:mx-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-800 text-sm sm:text-base truncate">{selectedPOI.name}</h4>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">{selectedPOI.category}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-2">{selectedPOI.address}</p>
            </div>
            <button
              onClick={() => setSelectedPOI(null)}
              className="touch-target-min text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0 rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <span className="text-sm sm:text-base">✕</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}