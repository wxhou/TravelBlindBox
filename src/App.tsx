import { useState, lazy, Suspense } from 'react'
import type { TravelParams, TravelRoute } from './types'
import { TravelBlindBox } from './components/TravelBlindBox'
import { ErrorBoundary } from './components/ErrorBoundary'
import BackgroundSelector from './components/BackgroundSelector'
import { generateTravelRoutes } from './services/travelService'
import { useBackground } from './hooks/useBackground'
import { Palette } from 'lucide-react'
import { PageSkeleton } from './components/LoadingSkeleton'
import { Agentation } from 'agentation'

// 代码分割 - 懒加载大型组件
const ProgressiveReveal = lazy(() => import('./components/ProgressiveReveal').then(module => ({ default: module.ProgressiveReveal })))

// 文字增强组件 - 优化可读性
const TextEnhancer = ({ children, className = '', style = {} }: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div 
    className={`text-enhancer ${className}`}
    style={{
      // 强制白色文字 + 轻微阴影
      color: '#ffffff',
      textShadow: `
        0 1px 2px rgba(0, 0, 0, 0.4),
        0 2px 4px rgba(0, 0, 0, 0.3)
      `,
      WebkitTextStroke: '0.5px rgba(0, 0, 0, 0.6)',
      filter: 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.4))',
      ...style
    }}
  >
    {children}
  </div>
)

function App() {
  const [routes, setRoutes] = useState<TravelRoute[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [showReveal, setShowReveal] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false)
  const { currentBackground, setBackground } = useBackground()

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const handleBackgroundSelect = (backgroundUrl: string) => {
    setBackground(`url(${backgroundUrl})`)
  }

  const handleGenerateRoutes = async (params: TravelParams) => {
    setLoading(true)
    setError('')
    setRoutes([])
    setLogs([])
    setShowReveal(false)

    addLog('🎲 正在准备您的旅行盲盒...')
    addLog(`🎯 偏好设置: ${params.destinationPreference}`)
    addLog(`💰 预算范围: ${params.budgetMin}-${params.budgetMax}元`)
    addLog(`📅 出行天数: ${params.duration}天`)
    addLog(`🚀 出发城市: ${params.departureCity}`)
    addLog(`🎫 出发日期: ${params.departureDate}`)
    addLog(`🚗 交通方式: ${params.transportation}`)
    addLog('🤖 AI 正在精心挑选您的专属旅程...')

    try {
      const response = await generateTravelRoutes(params)
      if (response.success && response.data) {
        addLog(`✨ 惊喜！为您的旅行盲盒准备了 ${response.data.length} 个精彩选项`)
        setRoutes(response.data)
        
        setTimeout(() => {
          setShowReveal(true)
        }, 2000)
      } else {
        addLog(`❌ 盲盒生成失败: ${response.error || '未知错误'}`)
        setError(response.error || '生成路线失败')
      }
    } catch (err) {
      addLog('❌ 网络连接失败，请重试')
      setError('网络连接失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen relative overflow-y-auto bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
      style={{
        backgroundImage: currentBackground.startsWith('url(') ? currentBackground : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-pink-500/10 via-transparent to-transparent" />
      
      {/* 文字增强叠加层 */}
      <div className="absolute inset-0 bg-black/20" />
      
      <div className="relative container mx-auto px-4 py-4 flex flex-col">
        <div className="flex-1 flex flex-col">
        <header className="text-center mb-4 z-10">
          <div className="relative mb-6">
            {/* 礼物盒子图标 - 渐变光晕效果 */}
            <div className="relative w-20 h-20 mx-auto mb-2">
              {/* 脉冲光晕 */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500/30 via-orange-500/20 to-red-500/30 animate-pulse blur-xl" />
              {/* 主容器 */}
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-amber-400/20 via-orange-400/20 to-red-400/20 backdrop-blur-xl border border-white/20 flex items-center justify-center">
                {/* 内发光 */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/10 to-transparent" />
                {/* 礼物盒SVG图标 */}
                <svg className="w-10 h-10 relative z-10 drop-shadow-lg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fbbf24"/>
                      <stop offset="50%" stopColor="#f97316"/>
                      <stop offset="100%" stopColor="#ea580c"/>
                    </linearGradient>
                    <linearGradient id="ribbonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#fcd34d"/>
                      <stop offset="100%" stopColor="#d97706"/>
                    </linearGradient>
                  </defs>
                  {/* 盒子主体 */}
                  <rect x="10" y="20" width="44" height="38" rx="4" fill="url(#boxGrad)"/>
                  {/* 盒子高光 */}
                  <rect x="10" y="20" width="44" height="38" rx="4" fill="none" stroke="rgba(254,243,199,0.4)" stroke-width="1"/>
                  {/* 横向丝带 */}
                  <rect x="10" y="36" width="44" height="6" fill="url(#ribbonGrad)"/>
                  {/* 纵向丝带 */}
                  <rect x="30" y="20" width="4" height="38" fill="url(#ribbonGrad)"/>
                  {/* 蝴蝶结 */}
                  <ellipse cx="32" cy="18" rx="6" ry="4" fill="#fcd34d"/>
                  <circle cx="32" cy="16" r="2" fill="#fbbf24"/>
                </svg>
              </div>
              {/* 装饰点 */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full shadow-lg shadow-cyan-400/50">
                <div className="absolute inset-1 bg-white rounded-full" />
              </div>
            </div>

            <div className="space-y-3">
              {/* 装饰线 */}
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent w-16" />
                <span className="text-amber-400/60 text-xs tracking-[0.3em] font-light">WANDERLUST</span>
                <div className="h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent w-16" />
              </div>

              {/* 主标题 - 渐变文字 */}
              <h1 className="text-5xl font-display font-bold tracking-widest text-center">
                <span className="bg-gradient-to-r from-amber-200 via-orange-100 to-amber-200 bg-clip-text text-transparent drop-shadow-sm">
                  WANDERLUST
                </span>
              </h1>

              {/* 副标题 - 简约设计 */}
              <p className="text-center">
                <span className="text-orange-200/70 text-sm tracking-[0.4em] font-light">MYSTERY TRAVEL COLLECTION</span>
              </p>

              {/* 宣传语 - 简洁优雅 */}
              <p className="text-orange-100/80 text-sm font-light tracking-wide text-center max-w-md mx-auto mt-2">
                探索未知，遇见惊喜
              </p>

              {/* 三个标签 - 简约点状 */}
              <div className="flex items-center justify-center gap-6 mt-4">
                {[
                  { label: '限量体验', color: 'bg-amber-400' },
                  { label: '专属定制', color: 'bg-orange-400' },
                  { label: '惊喜开启', color: 'bg-red-400' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.color} animate-pulse`} style={{ animationDelay: `${i * 0.2}s` }} />
                    <span className="text-slate-300/70 text-xs tracking-wide">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <button
              onClick={() => setShowBackgroundSelector(true)}
              className="fixed top-6 right-6 z-20 w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 shadow-lg hover:shadow-xl group"
              title="选择旅行背景"
            >
              <Palette className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-6xl mx-auto w-full z-10 relative">
          <ErrorBoundary>
            {/* 当显示揭晓页面时，隐藏主界面 */}
            {!(routes.length > 0 && showReveal) && (
              <TravelBlindBox
                onGenerateRoutes={handleGenerateRoutes}
                loading={loading}
                logs={logs}
              />
            )}

            {error && (
              <div className="mt-6 p-6 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-2xl">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <TextEnhancer className="text-red-300 font-body">{error}</TextEnhancer>
                </div>
              </div>
            )}

            {/* 路线揭晓页面 - 使用 Suspense 包装懒加载组件 */}
            {routes.length > 0 && showReveal && (
              <Suspense fallback={<PageSkeleton />}>
                <ProgressiveReveal
                  routes={routes}
                  onClose={() => {
                    setShowReveal(false)
                    setRoutes([])
                  }}
                  onSelect={(route) => console.log('Selected route:', route.id)}
                />
              </Suspense>
            )}
          </ErrorBoundary>
        </main>
        </div>

        <BackgroundSelector
          isOpen={showBackgroundSelector}
          onClose={() => setShowBackgroundSelector(false)}
          onSelectBackground={handleBackgroundSelect}
        />
        
        <footer className="text-center mt-4 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
            <TextEnhancer className="text-amber-400/60 text-xs font-light tracking-[0.2em]">
              CRAFTED WITH CARE
            </TextEnhancer>
            <div className="w-6 h-px bg-gradient-to-r from-transparent via-amber-400/30 to-transparent" />
          </div>
          <TextEnhancer className="text-slate-400/70 text-xs font-light italic">
            "旅行的意义不在于目的地，而在于沿途的惊喜与发现"
          </TextEnhancer>
          <div className="flex items-center justify-center gap-1 text-xs text-slate-500/60 font-light">
            <TextEnhancer>© 2024 Wanderlust Collection</TextEnhancer>
            <span>·</span>
            <TextEnhancer>Curated Experiences</TextEnhancer>
            <span>·</span>
            <TextEnhancer>Limited Edition</TextEnhancer>
          </div>
        </footer>

        {/* Agentation - 开发环境可视化反馈工具 */}
        {process.env.NODE_ENV === 'development' && <Agentation />}
      </div>
    </div>
  )
}

export default App
