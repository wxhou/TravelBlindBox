import { useState, useEffect, lazy, Suspense } from 'react'
import type { TravelRoute } from '../types'
import { Gift, Sparkles, MapPin, Calendar, DollarSign, ChevronRight, X, Map } from 'lucide-react'
import { getThemeAwareFallbackImage, getBestRouteImageUrl } from '../utils/imageUtils'
import { REVEAL_PHASE_CONFIG } from '../config/appConfig'
import { ModalSkeleton } from './LoadingSkeleton'

// 懒加载大型组件以实现代码分割
const RouteMap = lazy(() => import('./RouteMap').then(module => ({ default: module.RouteMap })))
const RouteDetailModal = lazy(() => import('./RouteDetailModal').then(module => ({ default: module.RouteDetailModal })))

interface ProgressiveRevealProps {
  routes: TravelRoute[]
  onSelect: (route: TravelRoute) => void
  onClose: () => void
}

type RevealPhase = 'ready' | 'theme' | 'hints' | 'complete'

// 使用配置常量
const phaseConfig = REVEAL_PHASE_CONFIG

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

function RevealCard({ route, phase, isRevealed, onSelect }: { route: TravelRoute; phase: RevealPhase; isRevealed: boolean; onSelect?: (route: TravelRoute) => void }) {
  const handleRouteSelect = () => {
    if (onSelect) {
      onSelect(route)
    }
  }
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // 获取封面图片 - 使用POI数据生成更精准的图片
  const getCoverImage = (): string => {
    return getBestRouteImageUrl(route)
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
      <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 min-h-[420px] flex items-center justify-center overflow-hidden">
        {/* 神秘闪光动画 */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-pink-500/10" />
        <div className="relative text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400/30 to-pink-500/30 flex items-center justify-center">
            <Gift className="w-10 h-10 text-white/80" />
          </div>
          <p className="text-slate-400">神秘路线</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-white/30 hover:bg-white/10 transition-all duration-300 flex flex-col group">
      {/* 封面图片 */}
      <div className="relative h-40 bg-gradient-to-br from-slate-800 to-slate-900 flex-shrink-0 overflow-hidden">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <img
          src={coverImage}
          alt={route.title}
          loading="lazy"
          decoding="async"
          className={`w-full h-full object-cover transition-all duration-500 ${imageLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100 group-hover:scale-110'}`}
          onLoad={() => setImageLoading(false)}
          onError={handleImageError}
        />
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-500/10 to-pink-500/10">
            <div className="text-center">
              <div className="text-4xl mb-2">🏔️</div>
              <p className="text-slate-400 text-sm">风景加载失败</p>
            </div>
          </div>
        )}
        {/* 图片遮罩渐变 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* 主题标签 */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-cyan-500/80 backdrop-blur-sm rounded-full text-xs text-white">
              {route.theme || '探索之旅'}
            </span>
          </div>
          <h3 className="text-lg font-bold text-white leading-tight">{route.title}</h3>
        </div>

        {/* 悬浮时显示的遮罩层 */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* 路线信息 */}
      <div className="p-4 space-y-3 flex-1 flex flex-col custom-scrollbar-dark">
        {/* 描述 - 限制行数 */}
        <p className="text-slate-300 text-sm leading-relaxed line-clamp-2 flex-shrink-0">
          {route.description}
        </p>

        {/* 统计信息 */}
        <div className="grid grid-cols-3 gap-2 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="text-xs">{route.duration}天</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-xs">¥{route.totalCost?.toLocaleString() || '待定'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span className="text-xs">{route.highlights?.length || 0}亮点</span>
          </div>
        </div>

        {/* 亮点标签 - 限制最多2个 */}
        {route.highlights && route.highlights.length > 0 && (
          <div className="flex flex-wrap gap-1.5 flex-shrink-0">
            {route.highlights.slice(0, 2).map((highlight, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-white/10 rounded-lg text-xs text-slate-300 truncate max-w-[100px]"
                title={highlight}
              >
                {highlight}
              </span>
            ))}
            {route.highlights.length > 2 && (
              <span className="px-2 py-0.5 bg-gradient-to-r from-cyan-500/20 to-pink-500/20 rounded-lg text-xs text-cyan-300">
                +{route.highlights.length - 2}
              </span>
            )}
          </div>
        )}

        {/* 按钮 */}
        <button
          onClick={handleRouteSelect}
          className="mt-auto py-2.5 bg-gradient-to-r from-cyan-400/20 to-pink-400/20 hover:from-cyan-400/30 hover:to-pink-400/30 text-white rounded-xl transition-all font-medium flex items-center justify-center gap-2 cursor-pointer border border-white/10 hover:border-cyan-400/30"
        >
          <span className="text-sm">查看详情</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
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
        setCurrentPhase('complete')
        setShowRoutes(true)
      }, phaseConfig.hints.duration)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 relative aurora-glow">
      {/* 背景渐变 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-pink-500/10 via-transparent to-transparent" />

      {/* 遮罩层 */}
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative container mx-auto px-4 py-8 min-h-screen flex flex-col">
        {/* 页面头部 */}
        <div className="max-w-4xl mx-auto w-full mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2"
            >
              <X className="w-5 h-5 text-slate-400" />
              <span className="text-slate-400 text-sm">返回</span>
            </button>
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
              <span className="text-xl">{phaseConfig[currentPhase].icon}</span>
              <span className="text-lg font-medium text-white">{phaseConfig[currentPhase].title}</span>
            </div>
            <div className="w-24" />
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
            <div className="text-center py-16">
              <div className="mb-6">
                <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-amber-400/30 to-pink-500/30 mb-4 ${currentPhase !== 'ready' ? 'animate-pulse' : 'animate-bounce'}`}>
                  <span className="text-5xl">{phaseConfig[currentPhase].icon}</span>
                </div>
              </div>

              {currentPhase === 'theme' && (
                <div className="space-y-3 animate-fade-in">
                  <h2 className="text-xl title-elegant text-white">您的旅行风格</h2>
                  <div className="flex items-center justify-center gap-3 text-2xl">
                    <span>{themeEmojis[routes[0]?.theme] || '✨'}</span>
                    <span className="text-cyan-300 italic">{routes[0]?.theme || '探索之旅'}</span>
                  </div>
                </div>
              )}

              {currentPhase === 'hints' && (
                <div className="space-y-3 animate-fade-in max-w-md mx-auto">
                  <h2 className="text-xl title-elegant text-white mb-3">路线线索</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {routes[0]?.highlights?.slice(0, 4).map((highlight, index) => (
                      <div
                        key={index}
                        className="p-2.5 bg-white/5 border border-white/10 rounded-lg text-slate-300 text-sm"
                      >
                        💡 {highlight}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 路线卡片展示 */}
          {showRoutes && (
            <div className="animate-fade-in">
              <div className="text-center mb-6">
                <h2 className="text-2xl title-elegant text-white mb-1">🎉 您的旅行盲盒</h2>
                <p className="text-slate-400 text-sm">3条精心为您准备的路线</p>
              </div>

              {/* 路线卡片网格 - 使用aspect保持一致高度 */}
              <div className="grid md:grid-cols-3 gap-5">
                {routes.map((route, index) => (
                  <div key={route.id} className="relative group h-full card-hover-lift">
                    <RevealCard
                      route={route}
                      phase={currentPhase}
                      isRevealed={showRoutes}
                      onSelect={handleRouteSelect}
                    />
                    {selectedRoute?.id === route.id && (
                      <div className="absolute -top-1.5 -right-1.5 w-7 h-7 bg-gradient-to-r from-cyan-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg shadow-cyan-400/30">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 操作按钮 */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                {selectedRoute && (
                  <>
                    <button
                      onClick={() => setShowMap(true)}
                      className="px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white flex items-center gap-2 transition-colors text-sm"
                    >
                      <Map className="w-4 h-4" />
                      查看地图
                    </button>
                    <button
                      className="px-5 py-2.5 bg-gradient-to-r from-cyan-400/20 to-pink-400/20 hover:from-cyan-400/30 hover:to-pink-400/30 text-white rounded-xl font-medium transition-all border border-white/10 text-sm"
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
          <Suspense fallback={<ModalSkeleton />}>
            <RouteMap
              route={selectedRoute}
              isOpen={showMap}
              onClose={() => setShowMap(false)}
            />
          </Suspense>
        )}

        {/* 路线详情弹窗 */}
        {selectedRoute && (
          <Suspense fallback={<ModalSkeleton />}>
            <RouteDetailModal
              route={selectedRoute}
              isOpen={showDetail}
              onClose={() => setShowDetail(false)}
            />
          </Suspense>
        )}
      </div>
    </div>
  )
}

export default ProgressiveReveal
