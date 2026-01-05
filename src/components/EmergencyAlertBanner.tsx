import { useState, useEffect } from 'react'
import { RealTimeInfoManager } from '../services/realTimeInfoManager'
import type { EmergencyAlert } from '../services/emergencyService'
import { AlertTriangle, X, Volume2, Shield, MapPin, Clock } from 'lucide-react'

interface EmergencyAlertBannerProps {
  position?: 'top' | 'bottom'
  autoHide?: boolean
  hideDelay?: number
  onAlertClick?: (alert: EmergencyAlert) => void
}

export function EmergencyAlertBanner({ 
  position = 'top',
  autoHide = false,
  hideDelay = 10000,
  onAlertClick
}: EmergencyAlertBannerProps) {
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0)
  const [realTimeManager, setRealTimeManager] = useState<RealTimeInfoManager | null>(null)

  useEffect(() => {
    const manager = RealTimeInfoManager.getInstance()
    setRealTimeManager(manager)

    // 订阅紧急警报更新
    const unsubscribe = manager.subscribeToUpdates((data) => {
      if (data?.emergency?.alerts) {
        const activeAlerts = data.emergency.alerts.filter((alert: any) => alert.active !== false)
        setAlerts(activeAlerts)
        setIsVisible(activeAlerts.length > 0)
        
        if (activeAlerts.length > 0) {
          setCurrentAlertIndex(0)
        }
      }
    })

    return unsubscribe
  }, [])

  // 自动隐藏功能
  useEffect(() => {
    if (isVisible && autoHide && alerts.length > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, hideDelay)

      return () => clearTimeout(timer)
    }
  }, [isVisible, autoHide, hideDelay, alerts])

  // 自动轮播多个警报
  useEffect(() => {
    if (alerts.length > 1) {
      const interval = setInterval(() => {
        setCurrentAlertIndex((prev) => (prev + 1) % alerts.length)
      }, 8000)

      return () => clearInterval(interval)
    }
  }, [alerts.length])

  const handleDismiss = () => {
    setIsVisible(false)
  }

  const handleNextAlert = () => {
    setCurrentAlertIndex((prev) => (prev + 1) % alerts.length)
  }

  const handlePreviousAlert = () => {
    setCurrentAlertIndex((prev) => (prev - 1 + alerts.length) % alerts.length)
  }

  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          bgGradient: 'from-red-600 to-red-700',
          borderColor: 'border-red-400',
          iconColor: 'text-red-200',
          textColor: 'text-white',
          pulseColor: 'animate-pulse-red'
        }
      case 'high':
        return {
          bgGradient: 'from-orange-600 to-red-600',
          borderColor: 'border-orange-400',
          iconColor: 'text-orange-200',
          textColor: 'text-white',
          pulseColor: 'animate-pulse-orange'
        }
      case 'medium':
        return {
          bgGradient: 'from-yellow-600 to-orange-600',
          borderColor: 'border-yellow-400',
          iconColor: 'text-yellow-200',
          textColor: 'text-white',
          pulseColor: 'animate-pulse-yellow'
        }
      default:
        return {
          bgGradient: 'from-blue-600 to-cyan-600',
          borderColor: 'border-blue-400',
          iconColor: 'text-blue-200',
          textColor: 'text-white',
          pulseColor: 'animate-pulse-blue'
        }
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="w-6 h-6" />
      case 'medium':
        return <Shield className="w-6 h-6" />
      default:
        return <MapPin className="w-6 h-6" />
    }
  }

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'critical': return '严重紧急'
      case 'high': return '高危预警'
      case 'medium': return '中等提醒'
      default: return '一般信息'
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'natural_disaster': return '自然灾害'
      case 'weather': return '天气预警'
      case 'security': return '安全警报'
      case 'health': return '健康提醒'
      case 'transportation': return '交通警告'
      case 'infrastructure': return '基础设施'
      case 'public_safety': return '公共安全'
      default: return '紧急信息'
    }
  }

  if (!isVisible || alerts.length === 0) {
    return null
  }

  const currentAlert = alerts[currentAlertIndex]
  const severityConfig = getSeverityConfig(currentAlert.severity)

  return (
    <div className={`fixed ${position === 'top' ? 'top-0' : 'bottom-0'} left-0 right-0 z-50 transition-all duration-500 ease-in-out transform ${
      isVisible ? 'translate-y-0 opacity-100' : position === 'top' ? '-translate-y-full' : 'translate-y-full opacity-0'
    }`}>
      {/* 移动端安全区域适配 */}
      <div className="pt-safe-top pb-safe-bottom">
      <div className={`bg-gradient-to-r ${severityConfig.bgGradient} ${severityConfig.borderColor} border-b shadow-lg backdrop-blur-sm`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between">
            {/* 左侧：图标和主要内容 */}
            <div 
              className="flex items-center gap-2 sm:gap-3 flex-1 cursor-pointer group min-w-0"
              onClick={() => onAlertClick?.(currentAlert)}
            >
              <div className={`flex-shrink-0 ${severityConfig.pulseColor} ${severityConfig.iconColor}`}>
                <div className="w-5 h-5 sm:w-6 sm:h-6">
                  {getSeverityIcon(currentAlert.severity)}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                  <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs font-medium bg-white/20 ${severityConfig.textColor}`}>
                    {getSeverityText(currentAlert.severity)}
                  </span>
                  <span className="text-xs opacity-80 truncate">
                    {getTypeText(currentAlert.type)}
                  </span>
                </div>
                
                <h4 className={`font-semibold ${severityConfig.textColor} text-sm leading-tight mb-1 group-hover:underline truncate`}>
                  {currentAlert.title}
                </h4>
                
                <p className={`text-xs ${severityConfig.textColor} opacity-90 leading-tight line-clamp-2`}>
                  {currentAlert.description}
                </p>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-2 text-xs opacity-75">
                  <div className="flex items-center gap-1 min-w-0">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{currentAlert.location.address}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 flex-shrink-0" />
                    <span>{new Date(currentAlert.startTime).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧：控制按钮 */}
            <div className="flex items-center gap-1 sm:gap-2 ml-2 sm:ml-4">
              {/* 多警报导航 - 移动端隐藏 */}
              {alerts.length > 1 && (
                <div className="hidden sm:flex items-center gap-1 mr-2">
                  <button
                    onClick={handlePreviousAlert}
                    className={`p-1 rounded ${severityConfig.textColor} opacity-60 hover:opacity-100 transition-opacity`}
                    title="上一个提醒"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  <span className={`text-xs ${severityConfig.textColor} opacity-60 px-1`}>
                    {currentAlertIndex + 1}/{alerts.length}
                  </span>
                  
                  <button
                    onClick={handleNextAlert}
                    className={`p-1 rounded ${severityConfig.textColor} opacity-60 hover:opacity-100 transition-opacity`}
                    title="下一个提醒"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
              
              {/* 语音播报按钮 */}
              <button
                onClick={() => {
                  const utterance = new SpeechSynthesisUtterance(`${currentAlert.title}。${currentAlert.description}`)
                  speechSynthesis.speak(utterance)
                }}
                className={`p-2 rounded ${severityConfig.textColor} opacity-60 hover:opacity-100 transition-opacity min-w-[36px] min-h-[36px] flex items-center justify-center`}
                title="语音播报"
              >
                <Volume2 className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
              
              {/* 关闭按钮 */}
              <button
                onClick={handleDismiss}
                className={`p-2 rounded ${severityConfig.textColor} opacity-60 hover:opacity-100 transition-opacity min-w-[36px] min-h-[36px] flex items-center justify-center`}
                title="关闭提醒"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 底部进度条（自动隐藏时显示） */}
      {autoHide && (
        <div className="h-1 bg-black/20">
          <div className={`h-full bg-gradient-to-r ${severityConfig.bgGradient} animate-progress`} style={{ animationDuration: `${hideDelay}ms` }} />
        </div>
      )}
      </div> {/* 结束安全区域适配 */}
    </div>
  )
}