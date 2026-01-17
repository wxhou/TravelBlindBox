import { useState } from 'react'
import type { TravelParams, TravelRoute } from './types'
import { TravelBlindBox } from './components/TravelBlindBox'
import { ProgressiveReveal } from './components/ProgressiveReveal'
import { ErrorBoundary } from './components/ErrorBoundary'
import BackgroundSelector from './components/BackgroundSelector'
import { generateTravelRoutes } from './services/travelService'
import { useBackground } from './hooks/useBackground'
import { Palette } from 'lucide-react'

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
          <div className="relative mb-4">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gradient-to-r from-amber-400/30 via-orange-400/30 to-red-400/30 backdrop-blur-xl border border-white/20 shadow-lg shadow-amber-500/20">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400/20 to-orange-400/20 animate-pulse" />
              <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-amber-300 via-orange-400 to-red-500 flex items-center justify-center shadow-lg">
                <div className="text-lg">🎁</div>
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent w-12" />
                <TextEnhancer className="text-amber-400/80 text-xs font-light tracking-wider">
                  CURATED EXPERIENCES
                </TextEnhancer>
                <div className="h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent w-12" />
              </div>

              <TextEnhancer className="text-4xl font-display font-bold bg-gradient-to-r from-amber-300 via-orange-200 to-red-300 bg-clip-text text-transparent tracking-tight">
                WANDERLUST
              </TextEnhancer>

              <TextEnhancer className="text-lg font-light text-orange-200/90 tracking-wide">
                Mystery Travel Collection
              </TextEnhancer>

              <TextEnhancer className="text-slate-300/90 text-sm font-light leading-relaxed max-w-md mx-auto">
                每一个未知的目的地，都是一份精心准备的惊喜礼物
              </TextEnhancer>

              <div className="flex items-center justify-center gap-4 mt-3">
                <div className="flex items-center gap-2 text-amber-400/80">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                  <TextEnhancer className="text-sm font-medium">限量体验</TextEnhancer>
                </div>
                <div className="w-px h-4 bg-white/20" />
                <div className="flex items-center gap-2 text-orange-400/80">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                  <TextEnhancer className="text-sm font-medium">专属定制</TextEnhancer>
                </div>
                <div className="w-px h-4 bg-white/20" />
                <div className="flex items-center gap-2 text-red-400/80">
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                  <TextEnhancer className="text-sm font-medium">惊喜开启</TextEnhancer>
                </div>
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

        <main className="flex-1 max-w-6xl mx-auto w-full z-10">
          <ErrorBoundary>
            <TravelBlindBox
              onGenerateRoutes={handleGenerateRoutes}
              loading={loading}
              logs={logs}
            />

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

            {routes.length > 0 && showReveal && (
              <ProgressiveReveal
                routes={routes}
                onClose={() => setShowReveal(false)}
                onSelect={(route) => console.log('Selected route:', route.id)}
              />
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
      </div>
    </div>
  )
}

export default App
