import { useState, useEffect, useCallback } from 'react'
import type { TravelRoute } from '../types'
import { routeStorageService } from '../services/routeStorageService'
import { RouteHistory } from './RouteHistory'
import { voiceNarrationService } from '../services/voiceNarrationService'
import { Clock, Volume2, VolumeX } from 'lucide-react'

interface BlindBoxRevealProps {
  routes: TravelRoute[]
  onClose: () => void
}

type ViewMode = 'reveal' | 'details' | 'history'

export function BlindBoxReveal({ routes, onClose }: BlindBoxRevealProps) {
  const [isRevealing, setIsRevealing] = useState(true)
  const [currentRouteIndex, setCurrentRouteIndex] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('reveal')
  const [savingRoute, setSavingRoute] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false)
  const [isVoicePlaying, setIsVoicePlaying] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setIsRevealing(false)
    }, 3000)

    const timer2 = setTimeout(() => {
      setShowDetails(true)
    }, 4000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      if (isVoicePlaying) {
        voiceNarrationService.stop()
      }
    }
  }, [])

  const currentRoute = routes[currentRouteIndex]

  useEffect(() => {
    if (isVoiceEnabled && showDetails && currentRoute) {
      handleStartNarration()
    }
  }, [currentRouteIndex, showDetails, isVoiceEnabled])

  const handleStartNarration = useCallback(async () => {
    if (!currentRoute || !voiceNarrationService.isSupported()) {
      setVoiceError('语音服务不支持')
      return
    }

    try {
      setVoiceError(null)
      setIsVoicePlaying(true)
      const narrationText = voiceNarrationService.generateNarrationText(currentRoute)
      await voiceNarrationService.speak(narrationText)
      setIsVoicePlaying(false)
    } catch (error) {
      setIsVoicePlaying(false)
      if (error instanceof Error && error.message !== 'interrupted') {
        setVoiceError(error.message)
      }
    }
  }, [currentRoute])

  const handleToggleVoice = useCallback(() => {
    if (isVoicePlaying) {
      voiceNarrationService.stop()
      setIsVoicePlaying(false)
    }
    setVoiceError(null)
    setIsVoiceEnabled(!isVoiceEnabled)
  }, [isVoiceEnabled, isVoicePlaying])

  const handleStopVoice = useCallback(() => {
    voiceNarrationService.stop()
    setIsVoicePlaying(false)
  }, [])

  const handleNext = () => {
    voiceNarrationService.stop()
    setIsVoicePlaying(false)
    setIsVoiceEnabled(false)
    setVoiceError(null)
    
    if (currentRouteIndex < routes.length - 1) {
      setCurrentRouteIndex(prev => prev + 1)
      setShowDetails(false)
      setTimeout(() => setShowDetails(true), 500)
    } else {
      onClose()
    }
  }

  const handleSaveRoute = async () => {
    if (savingRoute) return
    
    try {
      setSavingRoute(true)
      await routeStorageService.saveRevealedRoute(currentRoute)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      alert(error instanceof Error ? error.message : '保存失败')
    } finally {
      setSavingRoute(false)
    }
  }

  const handleScheduleRoute = async () => {
    if (savingRoute) return
    
    try {
      setSavingRoute(true)
      await routeStorageService.saveRevealedRoute(currentRoute)
      const routeId = await routeStorageService.getHistory().then(routes => routes[0]?.id)
      if (routeId) {
        await routeStorageService.scheduleRoute(routeId)
      }
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      alert(error instanceof Error ? error.message : '稍后安排失败')
    } finally {
      setSavingRoute(false)
    }
  }

  const handleViewHistory = () => {
    setViewMode('history')
  }

  const handleHistoryRouteSelect = (route: TravelRoute) => {
    if (isVoicePlaying) {
      voiceNarrationService.stop()
      setIsVoicePlaying(false)
    }
    const routeIndex = routes.findIndex(r => r.title === route.title && r.description === route.description)
    if (routeIndex !== -1) {
      setCurrentRouteIndex(routeIndex)
      setShowDetails(true)
    }
    setViewMode('details')
  }

  const handleBackToDetails = () => {
    setViewMode('details')
  }

  if (viewMode === 'history') {
    return (
      <RouteHistory
        onRouteSelect={handleHistoryRouteSelect}
        onClose={handleBackToDetails}
      />
    )
  }

  if (isRevealing) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center space-y-6 sm:space-y-8 lg:space-y-12 px-4">
          <div className="relative">
            <div className="w-48 h-48 sm:w-56 sm:h-56 lg:w-64 lg:h-64 mx-auto">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 animate-ping opacity-20" />
              <div className="absolute inset-2 rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 animate-spin" />
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-amber-300/40 via-orange-400/40 to-red-400/40 backdrop-blur-sm" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl animate-bounce">🎁</div>
              </div>
              <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 lg:-top-4 lg:-right-4 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 rounded-full flex items-center justify-center animate-ping">
                <div className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 bg-white rounded-full" />
              </div>
              <div className="absolute -bottom-2 -left-2 sm:-bottom-3 sm:-left-3 lg:-bottom-4 lg:-left-4 w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 rounded-full flex items-center justify-center animate-ping" style={{ animationDelay: '1s' }}>
                <div className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 bg-white rounded-full" />
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="text-5xl font-display font-bold bg-gradient-to-r from-amber-300 via-orange-200 to-red-300 bg-clip-text text-transparent">
                惊喜即将揭晓
              </h2>
              <div className="flex items-center justify-center gap-2">
                <div className="h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent w-24" />
                <span className="text-amber-400/80 text-sm font-light tracking-wider">MYSTERY REVEAL</span>
                <div className="h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent w-24" />
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-slate-300 text-xl font-light leading-relaxed">
                您的专属旅行惊喜正在精心准备中
              </p>
              <p className="text-slate-400/80 font-body">
                每一个细节都承载着对美好旅程的期待
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-amber-400/80">
                <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium">个性化定制</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div className="flex items-center gap-2 text-orange-400/80">
                <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                <span className="text-sm font-medium">惊喜包装</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div className="flex items-center gap-2 text-red-400/80">
                <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                <span className="text-sm font-medium">即将开启</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="max-w-5xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="bg-white/5 backdrop-blur-xl border border-amber-400/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-2xl shadow-amber-500/10">
          <div className="text-center mb-6 sm:mb-8 lg:mb-10">
            <div className="flex justify-between items-start mb-4 sm:mb-6 lg:mb-8 gap-4">
              <button
                onClick={handleViewHistory}
                className="touch-target-min flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 border border-amber-400/20 hover:border-amber-400/40 rounded-xl text-slate-300 hover:text-white transition-all duration-300"
              >
                <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium">查看历史</span>
              </button>
              
              <div className="relative">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mb-4 sm:mb-5 lg:mb-6 rounded-full bg-gradient-to-r from-amber-400/30 via-orange-400/30 to-red-400/30 backdrop-blur-xl border border-white/20 shadow-2xl shadow-amber-500/20">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400/20 to-orange-400/20 animate-pulse" />
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-amber-300 via-orange-400 to-red-500 flex items-center justify-center shadow-lg">
                  <span className="text-xl sm:text-2xl lg:text-3xl">🎁</span>
                </div>
                <div className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 lg:-top-2 lg:-right-2 w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center animate-bounce">
                  <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4 bg-white rounded-full" />
                </div>
                </div>
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-center gap-2 sm:gap-4">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold bg-gradient-to-r from-amber-300 via-orange-200 to-red-300 bg-clip-text text-transparent">
                      惊喜揭晓
                    </h2>
                    {voiceNarrationService.isSupported() && (
                      <button
                        onClick={handleToggleVoice}
                        className={`touch-target-comfortable rounded-full flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
                          isVoiceEnabled
                            ? 'bg-gradient-to-r from-blue-400 to-cyan-400 shadow-lg shadow-blue-400/30'
                            : 'bg-gradient-to-r from-slate-400 to-slate-500 shadow-lg shadow-slate-400/30'
                        } ${isVoicePlaying ? 'animate-pulse' : ''}`}
                        disabled={!voiceNarrationService.isSupported()}
                      >
                        {isVoiceEnabled ? (
                          <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                        ) : (
                          <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                        )}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent w-20" />
                    <span className="text-amber-400/80 text-sm font-light tracking-wider">MYSTERY REVEALED</span>
                    <div className="h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent w-20" />
                  </div>
                </div>
                
                <p className="text-xl text-orange-200/90 font-light mb-2">
                  您的专属旅行体验即将呈现
                </p>
                
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2 text-amber-400/80">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                    <span className="text-sm font-medium">惊喜 {currentRouteIndex + 1}</span>
                  </div>
                  <div className="w-px h-4 bg-white/20" />
                  <div className="flex items-center gap-2 text-orange-400/80">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                    <span className="text-sm font-medium">共 {routes.length} 个选择</span>
                  </div>
                </div>
                
                {voiceError && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-400/20 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-red-400 flex items-center justify-center">
                        <span className="text-white text-xs">!</span>
                      </div>
                      <span className="text-red-400 text-sm">{voiceError}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={`transition-all duration-700 ${showDetails ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-8'}`}>
            <div className="bg-gradient-to-br from-amber-400/10 via-orange-400/10 to-red-400/10 backdrop-blur-xl border border-amber-400/20 rounded-3xl p-8 mb-8 shadow-2xl shadow-amber-500/10">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-1 h-8 bg-gradient-to-b from-amber-400 to-orange-400 rounded-full" />
                      <h3 className="text-3xl font-display font-bold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">{currentRoute.title}</h3>
                    </div>
                    
                    <div className="space-y-3 text-slate-300 font-body">
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-amber-400/10">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 flex items-center justify-center">
                          <span className="text-sm">🎨</span>
                        </div>
                        <div>
                          <span className="text-amber-400 font-medium">主题风格</span>
                          <p className="text-white">{currentRoute.theme}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-amber-400/10">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-400 to-red-400 flex items-center justify-center">
                          <span className="text-sm">⏱️</span>
                        </div>
                        <div>
                          <span className="text-orange-400 font-medium">旅行天数</span>
                          <p className="text-white">{currentRoute.duration} 天的精彩旅程</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-amber-400/10">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-400 to-pink-400 flex items-center justify-center">
                          <span className="text-sm">💰</span>
                        </div>
                        <div>
                          <span className="text-red-400 font-medium">预算范围</span>
                          <p className="text-white">¥{currentRoute.totalCost.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-amber-400/5 to-orange-400/5 rounded-xl border border-amber-400/10">
                      <h5 className="text-amber-400 font-medium mb-2">✨ 体验描述</h5>
                      <p className="text-slate-300 leading-relaxed">{currentRoute.description}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-6 bg-gradient-to-b from-orange-400 to-red-400 rounded-full" />
                      <h4 className="text-xl font-display font-bold text-white">🎆 精彩亮点</h4>
                    </div>
                    
                    <div className="space-y-3">
                      {currentRoute.highlights.map((highlight, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-orange-400/10 hover:border-orange-400/20 transition-colors group">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-orange-400 to-red-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs text-white font-bold">{index + 1}</span>
                          </div>
                          <span className="text-slate-300 font-body group-hover:text-white transition-colors">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-orange-400/20 rounded-3xl p-8 mb-8 shadow-xl">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-6 bg-gradient-to-b from-orange-400 to-red-400 rounded-full" />
                  <h4 className="text-2xl font-display font-bold bg-gradient-to-r from-orange-300 to-red-300 bg-clip-text text-transparent">📅 精心安排的每日行程</h4>
                </div>
                
                <div className="space-y-6">
                  {currentRoute.itinerary.map((day, index) => (
                    <div key={index} className="relative">
                      <div className="flex items-start gap-6">
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 via-orange-400 to-red-400 flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold">{day.day}</span>
                          </div>
                          {index < currentRoute.itinerary.length - 1 && (
                            <div className="w-px h-16 bg-gradient-to-b from-orange-400/50 to-red-400/50 mt-2" />
                          )}
                        </div>
                        
                        <div className="flex-1 space-y-4">
                          <div className="bg-gradient-to-r from-amber-400/5 to-orange-400/5 rounded-xl p-4 border border-amber-400/10">
                            <h5 className="font-display font-bold text-amber-300 mb-3">第 {day.day} 天的精彩安排</h5>
                            
                            <div className="space-y-3">
                              <div>
                                <h6 className="text-sm font-semibold text-orange-400 mb-2 flex items-center gap-2">
                                  <span>🌟</span>
                                  <span>主要活动</span>
                                </h6>
                                <div className="space-y-2">
                                  {day.activities.map((activity, actIndex) => (
                                    <div key={actIndex} className="flex items-start gap-2">
                                      <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                                      <p className="text-slate-300 font-body">{activity}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {day.meals && day.meals.length > 0 && (
                                <div>
                                  <h6 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
                                    <span>🍽️</span>
                                    <span>美食体验</span>
                                  </h6>
                                  <div className="space-y-1">
                                    {day.meals.map((meal, mealIndex) => (
                                      <p key={mealIndex} className="text-slate-400 font-body text-sm pl-3 border-l-2 border-red-400/20">{meal}</p>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {day.accommodation && (
                                <div>
                                  <h6 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-2">
                                    <span>🏨</span>
                                    <span>精致住宿</span>
                                  </h6>
                                  <p className="text-slate-400 font-body text-sm pl-3 border-l-2 border-amber-400/20">{day.accommodation}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>



            {saveSuccess && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-400 flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                  <span className="text-emerald-400 font-medium">路线已保存到历史记录</span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-6 sm:pt-8">
              {currentRouteIndex < routes.length - 1 ? (
                <button
                  onClick={handleNext}
                  className="touch-target-comfortable group px-6 sm:px-8 lg:px-10 py-3 sm:py-4 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 rounded-xl sm:rounded-2xl text-white font-body hover:from-amber-500 hover:via-orange-500 hover:to-red-500 transition-all duration-300 shadow-2xl hover:shadow-amber-400/25 transform hover:scale-105"
                >
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <span className="text-base sm:text-lg font-medium">继续探索惊喜</span>
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <span className="text-sm sm:text-lg">🎁</span>
                    </div>
                  </div>
                </button>
              ) : (
                <button
                  onClick={onClose}
                  className="touch-target-comfortable group px-6 sm:px-8 lg:px-10 py-3 sm:py-4 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 rounded-xl sm:rounded-2xl text-white font-body hover:from-amber-500 hover:via-orange-500 hover:to-red-500 transition-all duration-300 shadow-2xl hover:shadow-amber-400/25 transform hover:scale-105"
                >
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <span className="text-base sm:text-lg font-medium">完成惊喜之旅</span>
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <span className="text-sm sm:text-lg">✨</span>
                    </div>
                  </div>
                </button>
              )}
              
              <button
                onClick={handleSaveRoute}
                disabled={savingRoute}
                className="touch-target-comfortable px-6 sm:px-8 lg:px-10 py-3 sm:py-4 bg-blue-500/20 backdrop-blur-xl border border-blue-400/20 hover:border-blue-400/40 rounded-xl sm:rounded-2xl text-blue-300 font-body hover:bg-blue-500/30 transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center gap-2">
                  {savingRoute ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                      <span className="text-base sm:text-lg font-medium">保存中...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-base sm:text-lg font-medium">保存路线</span>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-blue-400/20 flex items-center justify-center">
                        <span className="text-xs sm:text-sm">💾</span>
                      </div>
                    </>
                  )}
                </div>
              </button>
              
              <button
                onClick={handleScheduleRoute}
                disabled={savingRoute}
                className="touch-target-comfortable px-6 sm:px-8 lg:px-10 py-3 sm:py-4 bg-white/5 backdrop-blur-xl border border-amber-400/20 hover:border-amber-400/30 rounded-xl sm:rounded-2xl text-slate-300 font-body hover:bg-white/10 transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center gap-2">
                  {savingRoute ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin" />
                      <span className="text-base sm:text-lg font-medium">安排中...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-base sm:text-lg font-medium">稍后安排</span>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-400/20 flex items-center justify-center">
                        <span className="text-xs sm:text-sm">⏰</span>
                      </div>
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}