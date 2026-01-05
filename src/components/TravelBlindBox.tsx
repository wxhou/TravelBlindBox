import { useState, useEffect } from 'react'
import type { TravelParams } from '../types'
import { useGeolocation } from '../hooks/useGeolocation'
import { getUnifiedAmapService } from '../services/unifiedAmapService'
import { isMcpEnabled } from '../services/serviceConfig'
import { RouteHistory } from './RouteHistory'
import { VoiceAssistantUI } from './VoiceAssistantUI'
import { Clock, Mic } from 'lucide-react'

interface TravelBlindBoxProps {
  onGenerateRoutes: (params: TravelParams) => Promise<void>
  loading: boolean
  logs: string[]
}

export function TravelBlindBox({ onGenerateRoutes, loading, logs }: TravelBlindBoxProps) {
  const {
    city: detectedCity,
    loading: locationLoading,
    error: locationError,
    requestLocation,
    retryLocation,
    isAutoLocated
  } = useGeolocation()

  const [mcpConnected, setMcpConnected] = useState(false)
  const [mcpConnecting, setMcpConnecting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showVoiceAssistant, setShowVoiceAssistant] = useState(false)

  // const [apiMode, setApiMode] = useState<'rest' | 'mcp'>('rest')

  const [preferences, setPreferences] = useState<TravelParams>({
    destinationPreference: '冒险',
    budgetMin: 1000,
    budgetMax: 5000,
    duration: 3,
    departureCity: detectedCity || '上海',
    departureDate: new Date().toISOString().split('T')[0],
    transportation: '飞机'
  })

  const [currentStep, setCurrentStep] = useState(0)
  const [searchMethod, setSearchMethod] = useState<'rest' | 'mcp'>('rest')
  const unifiedService = getUnifiedAmapService()

  useEffect(() => {
    if (!isAutoLocated && !locationLoading) {
      requestLocation()
    }
  }, [])

  useEffect(() => {
    if (detectedCity) {
      setPreferences(prev => ({ ...prev, departureCity: detectedCity }))
    }
  }, [detectedCity])

  useEffect(() => {
    unifiedService.setMode(searchMethod)
  }, [searchMethod, unifiedService])

  useEffect(() => {
    const mcpAvailable = isMcpEnabled()
    if (mcpAvailable) {
      setMcpConnecting(true)
      setTimeout(() => {
        setMcpConnected(true)
        setMcpConnecting(false)
      }, 800)
    } else {
      setMcpConnected(false)
      setMcpConnecting(false)
    }
  }, [])

  const mysteryDestinations = [
    { emoji: '🗺️', title: '神秘冒险', desc: '意想不到的惊喜之旅' },
    { emoji: '🏖️', title: '热带天堂', desc: '阳光沙滩的慢时光' },
    { emoji: '🏔️', title: '雪山秘境', desc: '纯净天地的宁静体验' },
    { emoji: '🌃', title: '都市奇遇', desc: '繁华城市的隐藏角落' },
    { emoji: '🏛️', title: '文化古迹', desc: '历史传承的深度探索' },
    { emoji: '🌌', title: '星空浪漫', desc: '满天繁星的梦幻夜晚' }
  ]

  const handlePreferenceChange = (field: keyof TravelParams, value: string | number) => {
    setPreferences(prev => ({ ...prev, [field]: value }))
  }

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1)
    } else {
      onGenerateRoutes(preferences)
    }
  }

  const handleViewHistory = () => {
    setShowHistory(true)
  }

  const handleHistoryClose = () => {
    setShowHistory(false)
  }

  const handleHistoryRouteSelect = (route: any) => {
    setShowHistory(false)
  }

  const handleVoiceAssistantToggle = () => {
    setShowVoiceAssistant(!showVoiceAssistant)
  }

  const handleVoiceAssistantClose = () => {
    setShowVoiceAssistant(false)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center space-y-8">
            <div className="relative">
              <div className="w-40 h-40 mx-auto rounded-full bg-gradient-to-br from-amber-400/30 via-orange-400/30 to-red-400/30 backdrop-blur-xl border border-white/20 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:scale-105 transition-all duration-500 shadow-2xl shadow-amber-500/30" onClick={handleNextStep}>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/20 via-orange-400/20 to-red-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-amber-400/40 via-orange-400/40 to-red-400/40 animate-pulse" />
                <div className="relative z-10 text-7xl animate-bounce">🎁</div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center animate-ping">
                  <div className="w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-3xl font-display font-bold bg-gradient-to-r from-amber-300 via-orange-200 to-red-300 bg-clip-text text-transparent">
                  您的专属旅行盲盒
                </h3>
                <p className="text-xl text-orange-200/90 font-light">
                  即将为您精心准备一份意想不到的惊喜
                </p>
              </div>
              
              <div className="space-y-3">
                <p className="text-slate-300/90 font-body leading-relaxed">
                  每一段旅程都承载着美好的期待
                </p>
                <p className="text-slate-400/80 font-body text-sm">
                  让我们一起开启这场充满惊喜的探索之旅
                </p>
              </div>
              
              <div className="flex items-center justify-center gap-4 pt-4">
                <div className="flex items-center gap-2 text-amber-400/80">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">精选体验</span>
                </div>
                <div className="w-px h-4 bg-white/20" />
                <div className="flex items-center gap-2 text-orange-400/80">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">专属定制</span>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-display font-bold text-white">您渴望什么样的旅行体验？</h3>
              <p className="text-slate-300/80 font-body">每一种风格都代表着一种独特的心情和期待</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {mysteryDestinations.map((destination, index) => (
                <button
                  key={index}
                  onClick={() => handlePreferenceChange('destinationPreference', destination.title)}
                  className={`p-4 rounded-xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 group ${
                    preferences.destinationPreference === destination.title
                      ? 'bg-gradient-to-r from-amber-400/20 to-orange-400/20 border-amber-400/50 shadow-lg shadow-amber-400/20'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">{destination.emoji}</div>
                    <div className="text-sm font-medium text-white mb-1">{destination.title}</div>
                    <div className="text-xs text-slate-400/80 font-light">{destination.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )
      
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-display font-bold text-white">您的旅行预算期望</h3>
              <p className="text-slate-300/80 font-body">好的旅行不在于花费多少，而在于收获多少美好</p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2 font-body">最低预算 (元)</label>
                  <input
                    type="number"
                    value={preferences.budgetMin}
                    onChange={(e) => handlePreferenceChange('budgetMin', Number(e.target.value))}
                    className="w-full p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white font-body focus:border-cyan-400/50 focus:outline-none transition-colors"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2 font-body">最高预算 (元)</label>
                  <input
                    type="number"
                    value={preferences.budgetMax}
                    onChange={(e) => handlePreferenceChange('budgetMax', Number(e.target.value))}
                    className="w-full p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white font-body focus:border-cyan-400/50 focus:outline-none transition-colors"
                    placeholder="5000"
                  />
                </div>
              </div>
              <div className="p-6 bg-gradient-to-br from-amber-400/10 via-orange-400/10 to-red-400/10 backdrop-blur-sm border border-amber-400/20 rounded-xl shadow-lg">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-amber-400 mb-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span className="text-lg font-medium">您的旅行预算</span>
                  </div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
                    ¥{preferences.budgetMin.toLocaleString()} - ¥{preferences.budgetMax.toLocaleString()}
                  </div>
                  <p className="text-xs text-slate-400/80 font-light">
                    这个预算范围内，我们可以为您创造难忘的回忆
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-display font-bold text-white">让我们了解更多细节</h3>
              <p className="text-slate-300/80 font-body">这些信息将帮助我们为您定制最完美的旅行体验</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2 font-body">出行天数</label>
                <select
                  value={preferences.duration}
                  onChange={(e) => handlePreferenceChange('duration', Number(e.target.value))}
                  className="w-full p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white font-body focus:border-cyan-400/50 focus:outline-none transition-colors"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map(days => (
                    <option key={days} value={days} className="bg-slate-800">{days} 天</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2 font-body">出发城市</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={preferences.departureCity}
                    onChange={(e) => handlePreferenceChange('departureCity', e.target.value)}
                    className="w-full p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white font-body focus:border-cyan-400/50 focus:outline-none transition-colors"
                    placeholder="正在获取位置..."
                    disabled={locationLoading}
                  />
                  <div className="flex items-center gap-2">
                    {locationLoading ? (
                      <div className="flex items-center gap-2 text-sm text-cyan-400 font-body">
                        <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                        <span>正在获取您的位置...</span>
                      </div>
                    ) : detectedCity && isAutoLocated ? (
                      <div className="flex items-center gap-2 text-sm text-green-400 font-body">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>当前位置: {detectedCity}</span>
                      </div>
                    ) : locationError ? (
                      <div className="flex items-center gap-2 text-sm text-red-400 font-body">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{locationError}</span>
                      </div>
                    ) : null}
                    <button
                      onClick={retryLocation}
                      disabled={locationLoading}
                      className="px-3 py-1 text-xs bg-cyan-400/20 hover:bg-cyan-400/30 disabled:opacity-50 text-cyan-400 rounded-md font-body transition-colors"
                    >
                      {locationLoading ? '获取中...' : '使用我的位置'}
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2 font-body">出发日期</label>
                <input
                  type="date"
                  value={preferences.departureDate}
                  onChange={(e) => handlePreferenceChange('departureDate', e.target.value)}
                  className="w-full p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white font-body focus:border-cyan-400/50 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2 font-body">交通方式</label>
                <select
                  value={preferences.transportation}
                  onChange={(e) => handlePreferenceChange('transportation', e.target.value)}
                  className="w-full p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white font-body focus:border-cyan-400/50 focus:outline-none transition-colors"
                >
                  <option value="飞机" className="bg-slate-800">✈️ 飞机</option>
                  <option value="高铁" className="bg-slate-800">🚄 高铁</option>
                  <option value="自驾" className="bg-slate-800">🚗 自驾</option>
                  <option value="火车" className="bg-slate-800">🚂 火车</option>
                </select>
              </div>
            </div>
          </div>
        )
      
      case 4:
        return (
          <div className="text-center space-y-8">
            <div className="relative">
              <div className="w-40 h-40 mx-auto rounded-full bg-gradient-to-br from-amber-400/30 via-orange-400/30 to-red-400/30 backdrop-blur-xl border border-white/20 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:scale-105 transition-all duration-500 shadow-2xl shadow-amber-500/30" onClick={handleNextStep}>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/20 via-orange-400/20 to-red-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-2 rounded-full bg-gradient-to-br from-amber-400/40 via-orange-400/40 to-red-400/40 animate-pulse" />
                <div className="relative z-10 text-7xl animate-bounce">✨</div>
                <div className="absolute -top-3 -right-3 w-10 h-10 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 rounded-full flex items-center justify-center animate-ping">
                  <div className="w-5 h-5 bg-white rounded-full" />
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-3xl font-display font-bold bg-gradient-to-r from-amber-300 via-orange-200 to-red-300 bg-clip-text text-transparent">
                  一切准备就绪
                </h3>
                <p className="text-xl text-orange-200/90 font-light">
                  您的专属旅行盲盒即将开启
                </p>
              </div>
              
              <div className="space-y-4">
                <p className="text-slate-300/90 font-body leading-relaxed">
                  基于您的偏好，我们将为您精心挑选
                </p>
                <p className="text-slate-400/80 font-body text-sm">
                  一份独一无二的旅行体验
                </p>
              </div>
              
              <div className="pt-4">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-400/20 to-orange-400/20 backdrop-blur-sm border border-amber-400/30 rounded-full">
                  <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
                  <span className="text-amber-400 font-medium">正在准备您的惊喜</span>
                  <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                </div>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  if (showHistory) {
    return (
      <RouteHistory
        onRouteSelect={handleHistoryRouteSelect}
        onClose={handleHistoryClose}
      />
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handleVoiceAssistantToggle}
            className={`flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-medium transition-all duration-300 ${
              showVoiceAssistant
                ? 'bg-gradient-to-r from-cyan-400/20 to-pink-400/20 border-cyan-400/40 text-cyan-300'
                : 'bg-white/5 hover:bg-white/10 border-amber-400/20 hover:border-amber-400/40 text-slate-300 hover:text-white'
            }`}
          >
            <Mic className="w-5 h-5" />
            <span className="text-sm font-medium">语音助手</span>
          </button>
          <button
            onClick={handleViewHistory}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-amber-400/20 hover:border-amber-400/40 rounded-xl text-slate-300 hover:text-white transition-all duration-300"
          >
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">查看历史</span>
          </button>
        </div>
        {!loading && (
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <div className="flex space-x-2">
                {[0, 1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      step <= currentStep ? 'bg-gradient-to-r from-cyan-400 to-pink-400' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>
            {renderStep()}
            {currentStep > 0 && (
              <div className="flex justify-center mt-8 space-x-4">
                <button
                  onClick={() => setCurrentStep(0)}
                  className="px-6 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 font-body hover:bg-white/10 transition-colors"
                >
                  首页
                </button>
                <button
                  onClick={() => setCurrentStep(prev => prev - 1)}
                  className="px-6 py-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 font-body hover:bg-white/10 transition-colors"
                >
                  上一步
                </button>
                {currentStep < 4 && (
                  <button
                    onClick={handleNextStep}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-pink-400 rounded-lg text-white font-body hover:from-cyan-500 hover:to-pink-500 transition-all duration-300 shadow-lg hover:shadow-cyan-400/25"
                  >
                    下一步
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        
        {loading && (
          <div className="text-center py-16 space-y-8">
            <div className="relative w-40 h-40 mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 animate-ping opacity-20" />
              <div className="absolute inset-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl animate-bounce">🎁</div>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center animate-ping">
                <div className="w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-3xl font-display font-bold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
                  正在为您精心准备
                </h3>
                <p className="text-xl text-orange-200/90 font-light">
                  您的专属旅行惊喜
                </p>
              </div>
              
              <div className="space-y-3">
                <p className="text-slate-300/90 font-body leading-relaxed">
                  我们的旅行专家正在根据您的偏好
                </p>
                <p className="text-slate-400/80 font-body">
                  精心策划一段难忘的旅程
                </p>
              </div>
              
              <div className="flex items-center justify-center gap-4 pt-4">
                <div className="flex items-center gap-2 text-amber-400/80">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">个性化定制</span>
                </div>
                <div className="w-px h-4 bg-white/20" />
                <div className="flex items-center gap-2 text-orange-400/80">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                  <span className="text-sm font-medium">惊喜准备中</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {logs.length > 0 && (
          <div className="mt-8 p-6 bg-black/20 backdrop-blur-sm border border-white/5 rounded-2xl">
            <h4 className="text-sm font-display font-semibold text-cyan-400 mb-4">🔮 生成日志</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="text-sm text-slate-300/80 font-body">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-display font-semibold text-white">🔗 API调用方式</h4>
            <div className="flex items-center gap-2">
              {mcpConnected ? (
                <div className="flex items-center gap-1 text-green-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-xs">MCP已连接</span>
                </div>
              ) : mcpConnecting ? (
                <div className="flex items-center gap-1 text-yellow-400">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                  <span className="text-xs">MCP连接中</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-400">
                  <div className="w-2 h-2 bg-red-400 rounded-full" />
                  <span className="text-xs">MCP未连接</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setSearchMethod('rest')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                searchMethod === 'rest'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              🗺️ REST API
            </button>
            <button
              onClick={() => setSearchMethod('mcp')}
              disabled={!mcpConnected}
              className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                searchMethod === 'mcp'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                  : mcpConnected
                  ? 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10'
                  : 'bg-white/5 text-slate-500 border border-white/10 cursor-not-allowed opacity-50'
              }`}
            >
              🔗 MCP Hook
            </button>
          </div>
          
          <div className="mt-3 text-xs text-slate-400/80">
            {searchMethod === 'rest' ? (
              '使用高德地图REST API调用方式'
            ) : mcpConnected ? (
              '使用MCP Hook调用方式'
            ) : (
              'MCP未连接，无法使用此模式'
            )}
          </div>
        </div>
      </div>
      
      {/* 语音助手UI */}
      <VoiceAssistantUI
        isVisible={showVoiceAssistant}
        onClose={handleVoiceAssistantClose}
      />
    </div>
  )
}