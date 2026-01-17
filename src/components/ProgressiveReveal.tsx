import { useState, useEffect } from 'react'
import type { TravelRoute } from '../types'
import { Gift, Sparkles, MapPin, Calendar, DollarSign, ChevronRight, X, Map } from 'lucide-react'
import { RouteMap } from './RouteMap'
import { RouteDetailModal } from './RouteDetailModal'
import { generateImageUrlFromQuery, getThemeAwareFallbackImage, isValidImageUrl } from '../utils/imageUtils'

interface ProgressiveRevealProps {
  routes: TravelRoute[]
  onSelect: (route: TravelRoute) => void
  onClose: () => void
}

type RevealPhase = 'ready' | 'theme' | 'hints' | 'destination' | 'complete'

const phaseConfig = {
  ready: { title: '准备揭晓', icon: '🎁', duration: 2000 },
  theme: { title: '主题风格', icon: '✨', duration: 1500 },
  hints: { title: '线索提示', icon: '🔍', duration: 2000 },
  destination: { title: '目的地', icon: '📍', duration: 2000 },
  complete: { title: '路线揭晓', icon: '🎉', duration: 0 }
}

const themeEmojis: Record<string, string> = {
  '深度文化探索': '🏛️',
  '休闲度假体验': '🏖️',
  '极致尊享之旅': '👑',
  '自然风光摄影': '📸',
  '美食寻味之旅': '🍜',
  '冒险探索之旅': '🧗',
  '穷游体验': '🎒',
  '奢华之旅': '💎',
  '城市漫步': '🌃',
  '古镇风情': '🏘️',
  '海岛度假': '🏝️',
  '雪山之旅': '🏔️'
}

// 备用图片列表 - 高质量旅行图片
const fallbackImages = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',  // 山景
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80',  // 自然风光
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&q=80',  // 森林
  'https://images.unsplash.com/photo-1505142468610-179e0ef2b16d?w=800&q=80',  // 海岛
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',  // 海滩
  'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=800&q=80',  // 海岸
  'https://images.unsplash.com/photo-1528164344705-4754268798e8?w=800&q=80',  // 古镇
  'https://images.unsplash.com/photo-1537996194471-e57df0318bd2?w=800&q=80',  // 梯田
  'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=800&q=80',  // 旅行
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',  // 公路旅行
]

// 基于路线ID生成固定的图片索引
function getRouteImageIndex(routeId: string): number {
  const hash = routeId.split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0)
  }, 0)
  return Math.abs(hash) % fallbackImages.length
}

function RevealCard({ route, phase, isRevealed, onSelect }: { route: TravelRoute; phase: RevealPhase; isRevealed: boolean; onSelect?: (route: TravelRoute) => void }) {
  const handleRouteSelect = () => {
    if (onSelect) {
      onSelect(route)
    }
  }
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(() => getRouteImageIndex(route.id))

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
    // 使用主题感知的备用图片（基于目的地）
    return getThemeAwareFallbackImage(route.coverImageQuery || route.title)
  }

  const coverImage = getCoverImage()

  // 图片加载失败时尝试切换到备用图片
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement
    // 使用主题感知的备用图片
    const fallbackImage = getThemeAwareFallbackImage(route.coverImageQuery || route.title)
    if (fallbackImage !== target.src) {
      target.src = fallbackImage
    } else {
      setImageError(true)
      setImageLoading(false)
      target.style.display = 'none'
    }
  }

  if (!isRevealed) {
    return (
      <div className="relative bg-white/5 border border-white/10 rounded-3xl p-8 min-h-[400px] flex items-center justify-center overflow-hidden">
        {/* 神秘闪光动画 */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-transparent to-pink-500/20 animate-pulse" />
        <div className="relative text-center">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-pink-500 flex items-center justify-center animate-bounce">
            <Gift className="w-12 h-12 text-white" />
          </div>
          <p className="text-slate-400">神秘路线</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden hover:border-white/30 transition-all duration-300 cursor-pointer" onClick={handleRouteSelect}>
      {/* 封面图片 */}
      <div className="relative h-48 bg-gradient-to-br from-slate-800 to-slate-900">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <img
          src={coverImage}
          alt={route.title}
          className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setImageLoading(false)}
          onError={handleImageError}
        />
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-pink-500/20">
            <div className="text-center">
              <div className="text-4xl mb-2">🏔️</div>
              <p className="text-slate-400 text-sm">风景加载失败</p>
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-cyan-500/80 backdrop-blur-sm rounded-full text-xs text-white">
              {route.theme || '探索之旅'}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white">{route.title}</h3>
        </div>
      </div>

      {/* 路线信息 */}
      <div className="p-6 space-y-4">
        <p className="text-slate-300 text-sm line-clamp-2">{route.description}</p>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{route.duration}天</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">¥{route.totalCost?.toLocaleString() || '待定'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{route.highlights?.length || 0}个亮点</span>
          </div>
        </div>

        {/* 亮点标签 */}
        {route.highlights && route.highlights.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {route.highlights.slice(0, 3).map((highlight, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-white/10 rounded-lg text-xs text-slate-300"
              >
                {highlight}
              </span>
            ))}
          </div>
        )}

        <button
          onClick={handleRouteSelect}
          className="w-full py-3 bg-gradient-to-r from-cyan-400 to-pink-400 hover:from-cyan-500 hover:to-pink-500 text-white rounded-xl transition-all font-medium flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>查看详情</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export function ProgressiveReveal({ routes, onSelect, onClose }: ProgressiveRevealProps) {
  const [currentPhase, setCurrentPhase] = useState<RevealPhase>('ready')
  const [showRoutes, setShowRoutes] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<TravelRoute | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    if (currentPhase === 'ready') {
      const timer = setTimeout(() => {
        setCurrentPhase('theme')
      }, phaseConfig.ready.duration)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (currentPhase === 'theme') {
      const timer = setTimeout(() => {
        setCurrentPhase('hints')
      }, phaseConfig.theme.duration)
      return () => clearTimeout(timer)
    }
  }, [currentPhase])

  useEffect(() => {
    if (currentPhase === 'hints') {
      const timer = setTimeout(() => {
        setCurrentPhase('destination')
      }, phaseConfig.hints.duration)
      return () => clearTimeout(timer)
    }
  }, [currentPhase])

  useEffect(() => {
    if (currentPhase === 'destination') {
      const timer = setTimeout(() => {
        setCurrentPhase('complete')
        setShowRoutes(true)
      }, phaseConfig.destination.duration)
      return () => clearTimeout(timer)
    }
  }, [currentPhase])

  const handleRouteSelect = (route: TravelRoute) => {
    setSelectedRoute(route)
    setShowDetail(true)
    onSelect(route)
  }

  const progress = Object.keys(phaseConfig).indexOf(currentPhase) / (Object.keys(phaseConfig).length - 1) * 100

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xl overflow-y-auto">
      <div className="container mx-auto px-4 py-8">
        {/* 顶部进度 */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{phaseConfig[currentPhase].icon}</span>
              <span className="text-xl font-medium text-white">{phaseConfig[currentPhase].title}</span>
            </div>
            <div className="w-10" />
          </div>

          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-pink-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 揭晓内容 */}
        <div className="max-w-6xl mx-auto">
          {/* 渐进式揭晓动画 */}
          {!showRoutes && (
            <div className="text-center py-20">
              <div className="mb-8">
                <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-amber-400 to-pink-500 mb-4 ${currentPhase !== 'ready' ? 'animate-pulse' : 'animate-bounce'}`}>
                  <span className="text-6xl">{phaseConfig[currentPhase].icon}</span>
                </div>
              </div>

              {currentPhase === 'theme' && (
                <div className="space-y-4 animate-fade-in">
                  <h2 className="text-2xl font-bold text-white">您的旅行风格</h2>
                  <div className="flex items-center justify-center gap-3 text-3xl">
                    <span>{themeEmojis[routes[0]?.theme] || '✨'}</span>
                    <span className="text-cyan-300">{routes[0]?.theme || '探索之旅'}</span>
                  </div>
                </div>
              )}

              {currentPhase === 'hints' && (
                <div className="space-y-4 animate-fade-in max-w-md mx-auto">
                  <h2 className="text-2xl font-bold text-white mb-4">路线线索</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {routes[0]?.highlights?.slice(0, 4).map((highlight, index) => (
                      <div
                        key={index}
                        className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-300"
                      >
                        💡 {highlight}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentPhase === 'destination' && (
                <div className="space-y-4 animate-fade-in">
                  <h2 className="text-2xl font-bold text-white">目的地即将揭晓</h2>
                  <div className="flex items-center justify-center gap-2 text-slate-400">
                    <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                    <span>正在打包您的惊喜盲盒...</span>
                    <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 路线卡片展示 */}
          {showRoutes && (
            <div className="animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">🎉 您的旅行盲盒</h2>
                <p className="text-slate-400">3条精心为您准备的路线</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {routes.map((route, index) => (
                  <div key={route.id} className="relative group">
                    <RevealCard
                      route={route}
                      phase={currentPhase}
                      isRevealed={showRoutes}
                      onSelect={handleRouteSelect}
                    />
                    {selectedRoute?.id === route.id && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">✓</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 操作按钮 */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                {selectedRoute && (
                  <>
                    <button
                      onClick={() => setShowMap(true)}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white flex items-center gap-2 transition-colors"
                    >
                      <Map className="w-5 h-5" />
                      查看地图
                    </button>
                    <button
                      className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-pink-400 hover:from-cyan-500 hover:to-pink-500 text-white rounded-xl font-medium transition-all"
                    >
                      开始规划
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 地图弹窗 */}
        {selectedRoute && (
          <RouteMap
            route={selectedRoute}
            isOpen={showMap}
            onClose={() => setShowMap(false)}
          />
        )}

        {/* 路线详情弹窗 */}
        {selectedRoute && (
          <RouteDetailModal
            route={selectedRoute}
            isOpen={showDetail}
            onClose={() => setShowDetail(false)}
          />
        )}
      </div>
    </div>
  )
}

export default ProgressiveReveal
