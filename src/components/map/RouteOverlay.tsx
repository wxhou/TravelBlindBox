import { useEffect, useRef } from 'react'
import type { POI } from '../../types'

interface RouteSegment {
  from: POI
  to: POI
  transportation: '飞机' | '火车' | '自驾' | '公交'
  distance?: number
  duration?: string
}

interface RouteOverlayProps {
  map: any
  segments: RouteSegment[]
}

const getTransportationColor = (transportation: string): string => {
  switch (transportation) {
    case '飞机': return '#ef4444'
    case '火车': return '#3b82f6'
    case '自驾': return '#10b981'
    case '公交': return '#f59e0b'
    default: return '#6b7280'
  }
}

const getTransportationIcon = (transportation: string): string => {
  switch (transportation) {
    case '飞机': return '✈️'
    case '火车': return '🚆'
    case '自驾': return '🚗'
    case '公交': return '🚌'
    default: return '🚶'
  }
}

export function RouteOverlay({ map, segments }: RouteOverlayProps) {
  const polylinesRef = useRef<any[]>([])
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    if (!map || !segments.length) return

    const AMap = (window as any).AMap
    if (!AMap) return

    polylinesRef.current.forEach(polyline => map.remove(polyline))
    markersRef.current.forEach(marker => map.remove(marker))
    polylinesRef.current = []
    markersRef.current = []

    segments.forEach((segment, index) => {
      const path = [
        [segment.from.location.lng, segment.from.location.lat],
        [segment.to.location.lng, segment.to.location.lat]
      ]

      const polyline = new AMap.Polyline({
        path,
        strokeColor: getTransportationColor(segment.transportation),
        strokeWeight: 4,
        strokeStyle: 'solid',
        strokeOpacity: 0.8,
        lineJoin: 'round',
        lineCap: 'round'
      })

      map.add(polyline)
      polylinesRef.current.push(polyline)

      const midPoint = [
        (segment.from.location.lng + segment.to.location.lng) / 2,
        (segment.from.location.lat + segment.to.location.lat) / 2
      ]

      const transportMarker = new AMap.Marker({
        position: midPoint,
        content: `
          <div style="
            background: ${getTransportationColor(segment.transportation)};
            color: white;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            border: 2px solid white;
          ">
            ${getTransportationIcon(segment.transportation)}
          </div>
        `,
        offset: new AMap.Pixel(-14, -14),
        zIndex: 100 + index
      })

      transportMarker.on('click', () => {
        const infoWindow = new AMap.InfoWindow({
          content: `
            <div style="padding: 8px; text-align: center;">
              <div style="font-size: 16px; margin-bottom: 4px;">${getTransportationIcon(segment.transportation)} ${segment.transportation}</div>
              ${segment.distance ? `<div style="color: #6b7280; font-size: 12px;">距离: ${segment.distance}km</div>` : ''}
              ${segment.duration ? `<div style="color: #6b7280; font-size: 12px;">时长: ${segment.duration}</div>` : ''}
            </div>
          `,
          offset: new AMap.Pixel(0, -20)
        })

        infoWindow.open(map, midPoint)
      })

      map.add(transportMarker)
      markersRef.current.push(transportMarker)
    })

    return () => {
      polylinesRef.current.forEach(polyline => map.remove(polyline))
      markersRef.current.forEach(marker => map.remove(marker))
      polylinesRef.current = []
      markersRef.current = []
    }
  }, [map, segments])

  return null
}