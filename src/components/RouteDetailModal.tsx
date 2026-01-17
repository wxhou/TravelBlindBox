import { useState, useEffect } from 'react'
import type { TravelRoute, POI } from '../types'
import {
  X,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Star,
  ChevronDown,
  ChevronUp,
  Plane,
  Train,
  Bus,
  Car,
  Camera,
  Utensils,
  ShoppingBag,
  Coffee
} from 'lucide-react'
import { generateImageUrlFromQuery, getThemeAwareFallbackImage, isValidImageUrl } from '../utils/imageUtils'

interface RouteDetailModalProps {
  route: TravelRoute
  isOpen: boolean
  onClose: () => void
}

const transportIcons: Record<string, typeof Plane> = {
  '飞机': Plane,
  '火车': Train,
  '大巴': Bus,
  '自驾': Car,
  '公交': Bus
}

function DayItinerary({
  day,
  dayIndex,
  isExpanded,
  onToggle
}: {
  day: TravelRoute['itinerary'][0]
  dayIndex: number
  isExpanded: boolean
  onToggle: () => void
}) {
  const transportType = '自驾' // Default transport
  const TransportIcon = transportIcons[transportType] || Car

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400/30 to-pink-400/30 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">{dayIndex + 1}</span>
          </div>
          <div className="text-left">
            <h4 className="text-white font-medium">第 {day.day} 天</h4>
            <p className="text-slate-400 text-sm">{(day.poiActivities?.[0]?.name || '自由活动')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-slate-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm">{day.poiActivities?.length || 0}个活动</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-white/10 space-y-4">
          {/* Activities Timeline */}
          <div className="relative pl-4">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-400 to-pink-400" />
            {day.poiActivities?.map((activity, idx) => (
              <div key={idx} className="relative pb-4 last:pb-0">
                <div className="absolute -left-[17px] w-3 h-3 rounded-full bg-gradient-to-br from-cyan-400 to-pink-400 border-2 border-slate-900" />
                <div className="bg-white/5 rounded-lg p-3 ml-2">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="text-white font-medium">{activity.name}</h5>
                    <span className="text-xs text-slate-400">{activity.duration}小时</span>
                  </div>
                  {activity.description && (
                    <p className="text-slate-400 text-sm mb-2">{activity.description}</p>
                  )}
                  {activity.poi && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="w-3 h-3" />
                      <span>{activity.poi.address || activity.poi.name}</span>
                      {activity.poi.rating && (
                        <span className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3 h-3 fill-current" />
                          {activity.poi.rating}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Meals */}
          {day.meals && day.meals.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {day.meals.map((meal, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-orange-500/20 text-orange-300 rounded-lg text-xs flex items-center gap-1"
                >
                  <Utensils className="w-3 h-3" />
                  {meal}
                </span>
              ))}
            </div>
          )}

          {/* Notes */}
          {day.accommodation && (
            <p className="text-slate-400 text-sm italic">住宿: {day.accommodation}</p>
          )}
        </div>
      )}
    </div>
  )
}

function POICard({ poi }: { poi: POI }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <h5 className="text-white font-medium flex items-center gap-2">
          {poi.name}
          {poi.category && (
            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-full text-xs">
              {poi.category}
            </span>
          )}
        </h5>
        {poi.rating && (
          <span className="flex items-center gap-1 text-amber-400 text-sm">
            <Star className="w-4 h-4 fill-current" />
            {poi.rating}
          </span>
        )}
      </div>
      {poi.address && (
        <p className="text-slate-400 text-sm mb-2 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {poi.address}
        </p>
      )}
      {poi.tag && (
        <p className="text-slate-300 text-sm">{poi.tag}</p>
      )}
    </div>
  )
}

export function RouteDetailModal({ route, isOpen, onClose }: RouteDetailModalProps) {
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([0]))
  const [activeTab, setActiveTab] = useState<'itinerary' | 'attractions' | 'info'>('itinerary')
  const [coverImage, setCoverImage] = useState<string>('')
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  // 获取封面图片
  const getCoverImage = (): string => {
    // 优先使用AI生成的URL
    if (route.coverImageUrl && isValidImageUrl(route.coverImageUrl)) {
      return route.coverImageUrl
    }
    // 使用coverImageQuery生成动态图片URL
    if (route.coverImageQuery) {
      const dynamicUrl = generateImageUrlFromQuery(route.coverImageQuery)
      if (dynamicUrl) {
        return dynamicUrl
      }
    }
    // 使用主题感知的备用图片
    return getThemeAwareFallbackImage(route.coverImageQuery || route.title)
  }

  // 初始化图片
  useEffect(() => {
    if (isOpen && route) {
      setImageLoading(true)
      setImageError(false)
      setCoverImage(getCoverImage())
    }
  }, [isOpen, route])

  // 图片加载成功
  const handleImageLoad = () => {
    setImageLoading(false)
    setImageError(false)
  }

  // 图片加载失败
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement
    // 尝试使用备用图片
    const fallbackImage = getThemeAwareFallbackImage(route.coverImageQuery || route.title)
    if (fallbackImage !== target.src) {
      target.src = fallbackImage
    } else {
      setImageLoading(false)
      setImageError(true)
      target.style.display = 'none'
    }
  }

  if (!isOpen) return null

  const toggleDay = (dayIndex: number) => {
    const newExpanded = new Set(expandedDays)
    if (newExpanded.has(dayIndex)) {
      newExpanded.delete(dayIndex)
    } else {
      newExpanded.add(dayIndex)
    }
    setExpandedDays(newExpanded)
  }

  const allPois = route.pois?.attractions || []

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xl overflow-y-auto">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm">
              {route.theme}
            </span>
          </div>
        </div>

        {/* Cover Image */}
        <div className="relative h-64 rounded-2xl overflow-hidden mb-6 bg-gradient-to-br from-slate-800 to-slate-900">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {coverImage && !imageError && (
            <img
              src={coverImage}
              alt={route.title}
              className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">🏔️</div>
                <p className="text-slate-400 text-sm">风景加载失败</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <h1 className="text-2xl font-bold text-white mb-2">{route.title}</h1>
            <p className="text-slate-300 text-sm line-clamp-2">{route.description}</p>
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <Calendar className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{route.duration}</div>
            <div className="text-slate-400 text-sm">旅行天数</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <DollarSign className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">¥{(route.totalCost || 0).toLocaleString()}</div>
            <div className="text-slate-400 text-sm">预计花费</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <MapPin className="w-6 h-6 text-amber-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{route.highlights?.length || 0}</div>
            <div className="text-slate-400 text-sm">精选亮点</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <Star className="w-6 h-6 text-pink-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{allPois.length}</div>
            <div className="text-slate-400 text-sm">景点数量</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('itinerary')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'itinerary'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            行程安排
          </button>
          <button
            onClick={() => setActiveTab('attractions')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'attractions'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            景点详情
          </button>
          <button
            onClick={() => setActiveTab('info')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'info'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            费用明细
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'itinerary' && (
          <div className="space-y-4">
            {route.itinerary.map((day, index) => (
              <DayItinerary
                key={index}
                day={day}
                dayIndex={index}
                isExpanded={expandedDays.has(index)}
                onToggle={() => toggleDay(index)}
              />
            ))}
          </div>
        )}

        {activeTab === 'attractions' && (
          <div className="grid gap-4">
            {allPois.map((poi, index) => (
              <POICard key={index} poi={poi} />
            ))}
            {allPois.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无景点详情</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-medium text-white mb-4">费用明细</h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-slate-400">住宿费用</span>
                <span className="text-white">¥{(route.totalCost || 0) * 0.35} - ¥{(route.totalCost || 0) * 0.45}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-slate-400">交通费用</span>
                <span className="text-white">¥{(route.totalCost || 0) * 0.25} - ¥{(route.totalCost || 0) * 0.35}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-slate-400">餐饮费用</span>
                <span className="text-white">¥{(route.totalCost || 0) * 0.15} - ¥{(route.totalCost || 0) * 0.20}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/10">
                <span className="text-slate-400">门票及活动</span>
                <span className="text-white">¥{(route.totalCost || 0) * 0.10} - ¥{(route.totalCost || 0) * 0.15}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">其他费用</span>
                <span className="text-white">¥{(route.totalCost || 0) * 0.05} - ¥{(route.totalCost || 0) * 0.10}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex justify-between items-center">
                <span className="text-white font-medium">总计预算</span>
                <span className="text-2xl font-bold text-cyan-400">¥{(route.totalCost || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-colors"
          >
            返回选择
          </button>
          <button
            className="flex-1 py-3 bg-gradient-to-r from-cyan-400 to-pink-400 hover:from-cyan-500 hover:to-pink-500 text-white rounded-xl font-medium transition-all"
          >
            开始预订
          </button>
        </div>
      </div>
    </div>
  )
}

export default RouteDetailModal
