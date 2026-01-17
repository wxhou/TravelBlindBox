import { useEffect, useRef, useState } from 'react'
import type { TravelRoute, POI } from '../types'
import { MapPin, Navigation, Layers, ZoomIn, ZoomOut, Maximize2, X } from 'lucide-react'

// 动态导入 Leaflet 组件
import type { Icon } from 'leaflet'

interface RouteMapProps {
  route: TravelRoute
  isOpen: boolean
  onClose: () => void
}

// 中国主要城市的大致坐标
const chinaCities: Record<string, [number, number]> = {
  '北京': [39.9042, 116.4074],
  '上海': [31.2304, 121.4737],
  '广州': [23.1291, 113.2644],
  '深圳': [22.5431, 114.0579],
  '杭州': [30.2741, 120.1551],
  '成都': [30.5728, 104.0668],
  '重庆': [29.5630, 106.5516],
  '西安': [34.3416, 108.9398],
  '南京': [32.0603, 118.7969],
  '武汉': [30.5928, 114.3055],
  '苏州': [31.2989, 120.5853],
  '天津': [39.0842, 117.2009],
  '长沙': [28.2282, 112.9388],
  '青岛': [36.0671, 120.3826],
  '厦门': [24.4798, 118.0894],
  '昆明': [25.0453, 102.7097],
  '贵阳': [26.6470, 106.6302],
  '南宁': [22.8170, 108.3665],
  '哈尔滨': [45.8038, 126.5350],
  '长春': [43.8868, 125.3245],
  '沈阳': [41.7968, 123.4315],
  '石家庄': [38.0428, 114.5149],
  '郑州': [34.7466, 113.6254],
  '济南': [36.6512, 117.1201],
  '太原': [37.8706, 112.5489],
  '南昌': [28.6820, 115.8579],
  '合肥': [31.8612, 117.2830],
  '福州': [26.0745, 119.2965],
  '兰州': [36.0611, 103.8343],
  '乌鲁木齐': [43.7930, 87.6271],
  '拉萨': [29.6525, 91.1721],
  '西宁': [36.6233, 101.7783],
  '呼和浩特': [40.8427, 111.7492],
  '银川': [38.4870, 106.2309],
  '三亚': [18.2528, 109.5119],
  '海口': [20.0440, 110.3497],
  '大理': [25.6063, 100.2676],
  '丽江': [26.8756, 100.2330],
  '张家界': [29.1173, 110.4792],
  '桂林': [25.2740, 110.2992],
  '黄山': [29.7144, 118.3380],
  '苏州园林': [31.3271, 120.6247],
  '西安兵马俑': [34.3842, 109.2786],
  '九寨沟': [33.1025, 103.9110],
  '张家界武陵源': [29.3608, 110.4772],
  '西湖': [30.2741, 120.1551],
  '黄山风景区': [29.7144, 118.3380]
}

// 热门目的地关键词到城市的映射
const destinationKeywords: Record<string, string> = {
  '云南': '昆明',
  '大理': '大理',
  '丽江': '丽江',
  '西藏': '拉萨',
  '青海': '西宁',
  '四川': '成都',
  '江苏': '苏州',
  '浙江': '杭州',
  '山东': '青岛',
  '福建': '厦门',
  '海南': '三亚',
  '东北': '哈尔滨',
  '湖南': '长沙',
  '安徽': '黄山',
  '广西': '桂林',
  '贵州': '贵阳'
}

function getCityCoordinates(cityName: string): [number, number] | null {
  // 直接匹配
  if (chinaCities[cityName]) {
    return chinaCities[cityName]
  }

  // 检查是否是目的地关键词
  if (destinationKeywords[cityName]) {
    const targetCity = destinationKeywords[cityName]
    if (chinaCities[targetCity]) {
      return chinaCities[targetCity]
    }
  }

  // 模糊匹配
  for (const [city, coords] of Object.entries(chinaCities)) {
    if (cityName.includes(city) || city.includes(cityName)) {
      return coords
    }
  }

  // 尝试提取城市名
  const match = cityName.match(/(.+?)(市|省|地区|县|区)/)
  if (match && chinaCities[match[1]]) {
    return chinaCities[match[1]]
  }

  return null
}

// 从文本中提取城市/目的地
function extractDestination(text: string): string | null {
  // 检查目的地关键词
  for (const keyword of Object.keys(destinationKeywords)) {
    if (text.includes(keyword)) {
      return keyword
    }
  }

  // 检查城市名
  for (const city of Object.keys(chinaCities)) {
    if (text.includes(city)) {
      return city
    }
  }

  return null
}

function createCustomIcon(color: string, size: number = 30): Icon {
  return {
    iconUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3" fill="white"/>
      </svg>
    `)}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size]
  } as unknown as Icon
}

export function RouteMap({ route, isOpen, onClose }: RouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!isOpen || !mapRef.current) return

    const initMap = async () => {
      const L = (await import('leaflet')).default
      await import('leaflet/dist/leaflet.css')

      // 清除旧地图
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch (e) {
          // 忽略销毁错误
        }
        mapInstanceRef.current = null
      }

      // 从路线标题和描述提取目的地
      let centerCoords: [number, number] = [39.9042, 116.4074] // 默认北京
      let destinationName = '未知目的地'

      // 尝试从标题提取
      const titleMatch = route.title.match(/【(.*?)】/)
      if (titleMatch) {
        destinationName = titleMatch[1]
      } else {
        // 从标题和描述中提取
        const textToSearch = route.title + ' ' + route.description
        const extracted = extractDestination(textToSearch)
        if (extracted) {
          destinationName = extracted
        }
      }

      const coords = getCityCoordinates(destinationName)
      if (coords) {
        centerCoords = coords
      }

      // 创建地图
      const map = L.map(mapRef.current!, {
        center: centerCoords,
        zoom: 11,
        zoomControl: false
      })

      // 添加底图
      const tileLayer = L.tileLayer(
        mapType === 'street'
          ? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: mapType === 'street'
            ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            : '&copy; Esri'
        }
      ).addTo(map)

      if (!isMountedRef.current) {
        map.remove()
        return
      }

      mapInstanceRef.current = map
      setMapLoaded(true)

      let hasRealMarkers = false

      // 添路线标记点
      const pois = route.pois
      if (pois?.attractions) {
        pois.attractions.forEach((poi, index) => {
          if (poi.location) {
            hasRealMarkers = true
            L.marker([poi.location.lat, poi.location.lng], {
              icon: createCustomIcon('#f59e0b', 36)
            })
              .addTo(map)
              .bindPopup(`
                <div class="p-2">
                  <h3 class="font-bold">${poi.name}</h3>
                  <p class="text-sm text-gray-500">${poi.address || ''}</p>
                  ${poi.rating ? `<p class="text-sm text-yellow-500">评分: ${poi.rating}</p>` : ''}
                </div>
              `)
          }
        })
      }

      // 添加路线上的日期标记
      route.itinerary.forEach((day, index) => {
        if (day.poiActivities && day.poiActivities.length > 0) {
          const firstPoi = day.poiActivities[0]
          if (firstPoi.poi?.location) {
            hasRealMarkers = true
            L.circleMarker([firstPoi.poi.location.lat, firstPoi.poi.location.lng], {
              radius: 8,
              fillColor: '#06b6d4',
              color: '#fff',
              weight: 2,
              fillOpacity: 0.8
            })
              .addTo(map)
              .bindPopup(`第${day.day}天: ${firstPoi.name}`)
          }
        }
      })

      // 如果没有真实标记，添加虚拟标记点
      if (!hasRealMarkers) {
        // 添加目的地主标记
        const mainMarker = L.marker(centerCoords, {
          icon: createCustomIcon('#06b6d4', 40)
        }).addTo(map)

        mainMarker.bindPopup(`
          <div class="p-2">
            <h3 class="font-bold text-lg">${route.title}</h3>
            <p class="text-sm text-gray-600 mt-1">${route.description?.substring(0, 100)}...</p>
            <div class="mt-2 text-sm">
              <p><span class="font-medium">📅</span> ${route.duration}天行程</p>
              <p><span class="font-medium">💰</span> 预算: ¥${(route.totalCost || 0).toLocaleString()}</p>
              <p><span class="font-medium">✨</span> ${route.theme}</p>
            </div>
            <div class="mt-2">
              <p class="font-medium text-sm">亮点:</p>
              <ul class="text-sm text-gray-600 list-disc list-inside">
                ${route.highlights?.slice(0, 3).map(h => `<li>${h}</li>`).join('') || '<li>探索未知风景</li>'}
              </ul>
            </div>
          </div>
        `)

        // 添加每日虚拟标记（基于城市坐标添加偏移）
        route.itinerary.forEach((day, index) => {
          const offset = 0.02 * (index - 1) // 每天稍微偏移一点
          const dayCoords: [number, number] = [centerCoords[0] + offset, centerCoords[1] + offset]

          const dayMarker = L.circleMarker(dayCoords, {
            radius: 12,
            fillColor: index === 0 ? '#10b981' : index === route.itinerary.length - 1 ? '#ef4444' : '#f59e0b',
            color: '#fff',
            weight: 3,
            fillOpacity: 0.9
          }).addTo(map)

          const dayActivities = day.poiActivities?.map(a => a.name).join(', ') || day.activities?.join(', ') || '自由活动'
          dayMarker.bindPopup(`
            <div class="p-2">
              <h3 class="font-bold text-cyan-600">第 ${day.day} 天</h3>
              <p class="text-sm text-gray-600 mt-1">${dayActivities}</p>
              ${day.accommodation ? `<p class="text-sm mt-1">🏨 ${day.accommodation}</p>` : ''}
              ${day.meals && day.meals.length > 0 ? `<p class="text-sm mt-1">🍽️ ${day.meals.join(' / ')}</p>` : ''}
            </div>
          `)
        })
      }
    }

    initMap()

    return () => {
      isMountedRef.current = false
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch (e) {
          // 忽略销毁错误
        }
        mapInstanceRef.current = null
      }
    }
  }, [isOpen, route, mapType])

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn()
    }
  }

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut()
    }
  }

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  if (!isOpen) return null

  return (
    <div
      className={`
        ${isFullscreen ? 'fixed inset-4 z-50' : 'absolute inset-0 z-10'}
        bg-slate-900/95 rounded-2xl overflow-hidden flex flex-col
      `}
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-white font-medium">{route.title}</h3>
            <p className="text-xs text-slate-400">路线地图预览</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMapType(mapType === 'street' ? 'satellite' : 'street')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="切换地图类型"
          >
            <Layers className="w-5 h-5 text-slate-400" />
          </button>
          <button
            onClick={handleToggleFullscreen}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title={isFullscreen ? '退出全屏' : '全屏显示'}
          >
            <Maximize2 className="w-5 h-5 text-slate-400" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* 地图容器 */}
      <div className="flex-1 relative">
        <div ref={mapRef} className="absolute inset-0" />

        {/* 地图控制按钮 */}
        <div className="absolute right-4 bottom-4 flex flex-col gap-2">
          <button
            onClick={handleZoomIn}
            className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors"
          >
            <ZoomIn className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors"
          >
            <ZoomOut className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => {
              if (mapInstanceRef.current) {
                mapInstanceRef.current.flyTo([39.9042, 116.4074], 5)
              }
            }}
            className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-colors"
            title="回到中国视图"
          >
            <Navigation className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* 加载状态 */}
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-400 text-sm">加载地图中...</p>
            </div>
          </div>
        )}

        {/* 图例 */}
        <div className="absolute left-4 bottom-4 bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-2">图例</div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-amber-500" />
              <span className="text-xs text-slate-300">景点</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-cyan-500" />
              <span className="text-xs text-slate-300">每日起点</span>
            </div>
          </div>
        </div>
      </div>

      {/* 路线信息 */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-slate-400">行程天数: <span className="text-white">{route.duration}天</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-400" />
            <span className="text-slate-400">预计花费: <span className="text-white">¥{route.totalCost?.toLocaleString() || '待定'}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-slate-400">主题: <span className="text-white">{route.theme}</span></span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RouteMap
