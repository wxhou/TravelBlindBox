import { useEffect, useRef } from 'react'
import type { POI } from '../../types'

interface POIMarkersProps {
  map: any
  pois: POI[]
  onMarkerClick?: (poi: POI) => void
}

const getMarkerColor = (category: string): string => {
  if (category.includes('景点') || category.includes('旅游')) return '#ef4444'
  if (category.includes('酒店') || category.includes('住宿')) return '#3b82f6'
  if (category.includes('餐厅') || category.includes('餐饮')) return '#10b981'
  return '#6b7280'
}

const getCategoryIcon = (category: string): string => {
  if (category.includes('景点') || category.includes('旅游')) return '🏛️'
  if (category.includes('酒店') || category.includes('住宿')) return '🏨'
  if (category.includes('餐厅') || category.includes('餐饮')) return '🍽️'
  return '📍'
}

export function POIMarkers({ map, pois, onMarkerClick }: POIMarkersProps) {
  const markersRef = useRef<any[]>([])
  const infoWindowRef = useRef<any>(null)

  useEffect(() => {
    if (!map || !pois.length) return

    const AMap = (window as any).AMap
    if (!AMap) return

    markersRef.current.forEach(marker => map.remove(marker))
    markersRef.current = []

    if (infoWindowRef.current) {
      infoWindowRef.current.close()
    }

    pois.forEach(poi => {
      const marker = new AMap.Marker({
        position: [poi.location.lng, poi.location.lat],
        title: poi.name,
        content: `
          <div style="
            background: white;
            border: 2px solid ${getMarkerColor(poi.category)};
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          ">
            ${getCategoryIcon(poi.category)}
          </div>
        `,
        offset: new AMap.Pixel(-16, -16)
      })

      marker.on('click', () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.close()
        }

        const content = `
          <div style="padding: 12px; max-width: 280px;">
            <h4 style="margin: 0 0 8px 0; font-weight: bold; color: #1f2937;">${poi.name}</h4>
            <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">${poi.category}</p>
            <p style="margin: 0 0 8px 0; color: #374151; font-size: 14px;">${poi.address}</p>
            ${poi.rating ? `<p style="margin: 0 0 4px 0; color: #f59e0b;">⭐ ${poi.rating}分</p>` : ''}
            ${poi.price ? `<p style="margin: 0 0 4px 0; color: #059669;">💰 ${poi.price}</p>` : ''}
            ${poi.telephone ? `<p style="margin: 0 0 4px 0; color: #3b82f6;">📞 ${poi.telephone}</p>` : ''}
          </div>
        `

        infoWindowRef.current = new AMap.InfoWindow({
          content,
          offset: new AMap.Pixel(0, -32)
        })

        infoWindowRef.current.open(map, [poi.location.lng, poi.location.lat])
        onMarkerClick?.(poi)
      })

      map.add(marker)
      markersRef.current.push(marker)
    })

    return () => {
      markersRef.current.forEach(marker => map.remove(marker))
      markersRef.current = []
      if (infoWindowRef.current) {
        infoWindowRef.current.close()
      }
    }
  }, [map, pois, onMarkerClick])

  return null
}