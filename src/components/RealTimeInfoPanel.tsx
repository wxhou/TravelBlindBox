import { useState, useEffect, useRef } from 'react'
import { RealTimeInfoManager } from '../services/realTimeInfoManager'
import { voiceNarrationService } from '../services/voiceNarrationService'
import { speechRecognitionService } from '../services/speechRecognitionService'
import { 
  Cloud, 
  Car, 
  MapPin, 
  AlertTriangle, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  Settings, 
  X,
  Sun,
  CloudRain,
  Wind,
  Thermometer,
  Eye,
  Users,
  Clock,
  Phone,
  Navigation,
  Star,
  Shield,
  Zap
} from 'lucide-react'

interface RealTimeInfoPanelProps {
  isVisible: boolean
  onClose: () => void
}

interface InfoCard {
  id: string
  type: 'weather' | 'traffic' | 'poi' | 'emergency'
  title: string
  data: any
  timestamp: number
}

export function RealTimeInfoPanel({ isVisible, onClose }: RealTimeInfoPanelProps) {
  const [realTimeManager, setRealTimeManager] = useState<RealTimeInfoManager | null>(null)
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'weather' | 'traffic' | 'poi' | 'emergency'>('overview')
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!isVisible) return

    const manager = RealTimeInfoManager.getInstance()
    setRealTimeManager(manager)

    // 初始化实时信息管理器
    manager.initialize().catch(err => {
      console.error('初始化实时信息管理器失败:', err)
      setError('初始化失败，请检查网络连接')
    })

    // 订阅数据更新
    const unsubscribe = manager.subscribeToUpdates((newData) => {
      setData(newData)
      setLastUpdate(new Date())
      setIsLoading(false)
      setError(null)
    })

    unsubscribeRef.current = unsubscribe

    // 开始监控
    manager.startMonitoring().catch(err => {
      console.error('启动监控失败:', err)
      setError('监控启动失败')
    })

    // 初始数据加载
    loadData()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
      manager.stopMonitoring()
    }
  }, [isVisible])

  const loadData = async () => {
    if (!realTimeManager) return
    
    setIsLoading(true)
    try {
      await realTimeManager.refreshAllData()
    } catch (err: any) {
      setError(err.message || '数据加载失败')
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    loadData()
  }

  const handleVoiceToggle = () => {
    setVoiceEnabled(!voiceEnabled)
    speechRecognitionService.setVoiceControlEnabled(!voiceEnabled)
  }

  const handleSpeakAll = async () => {
    if (data && voiceEnabled) {
      try {
        await voiceNarrationService.speakRealTimeInfo(data)
      } catch (error) {
        console.error('语音播报失败:', error)
      }
    }
  }

  const getWeatherIcon = (condition: string) => {
    if (condition.includes('晴')) return <Sun className="w-6 h-6 text-yellow-400" />
    if (condition.includes('雨')) return <CloudRain className="w-6 h-6 text-blue-400" />
    if (condition.includes('云')) return <Cloud className="w-6 h-6 text-gray-400" />
    return <Sun className="w-6 h-6 text-yellow-400" />
  }

  const getTrafficLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'high': return 'text-orange-400'
      case 'severe': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getCrowdLevelColor = (level: string) => {
    switch (level) {
      case 'very_low': case 'low': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'high': case 'very_high': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'high': return 'text-orange-400'
      case 'critical': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  if (!isVisible) return null

  const renderOverviewTab = () => (
    <div className="space-y-4">
      {/* 总体状态卡片 */}
      {data?.summary && (
        <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-white">总体状态</h3>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              data.summary.overallStatus === 'good' ? 'bg-green-400/20 text-green-400' :
              data.summary.overallStatus === 'fair' ? 'bg-yellow-400/20 text-yellow-400' :
              data.summary.overallStatus === 'poor' ? 'bg-orange-400/20 text-orange-400' :
              'bg-red-400/20 text-red-400'
            }`}>
              {data.summary.overallStatus === 'good' ? '良好' :
               data.summary.overallStatus === 'fair' ? '一般' :
               data.summary.overallStatus === 'poor' ? '较差' : '危险'}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${getSeverityColor(data.summary.weatherSeverity)}`} />
              <span className="text-slate-300">天气: {data.summary.weatherSeverity === 'clear' ? '晴朗' : data.summary.weatherSeverity === 'mild' ? '温和' : data.summary.weatherSeverity === 'moderate' ? '一般' : '恶劣'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Car className={`w-4 h-4 ${getTrafficLevelColor(data.summary.trafficLevel)}`} />
              <span className="text-slate-300">交通: {data.summary.trafficLevel === 'low' ? '畅通' : data.summary.trafficLevel === 'medium' ? '缓慢' : data.summary.trafficLevel === 'high' ? '拥堵' : '严重拥堵'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-slate-300">预警: {data.summary.activeAlerts}个</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300">更新: {lastUpdate.toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      )}

      {/* 快速信息卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* 天气卡片 */}
        {data?.weather?.data && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getWeatherIcon(data.weather.data.current.condition)}
                <h4 className="font-medium text-white">天气</h4>
              </div>
              <span className="text-2xl font-bold text-white">{data.weather.data.current.temperature}°C</span>
            </div>
            <p className="text-slate-300 text-sm mb-2">{data.weather.data.current.condition}</p>
            <div className="flex justify-between text-xs text-slate-400">
              <span>湿度 {data.weather.data.current.humidity}%</span>
              <span>风速 {data.weather.data.current.windSpeed}km/h</span>
            </div>
          </div>
        )}

        {/* 交通卡片 */}
        {data?.traffic?.data && (
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Car className={`w-5 h-5 ${getTrafficLevelColor(data.traffic.data.route.trafficLevel)}`} />
                <h4 className="font-medium text-white">交通</h4>
              </div>
              <span className={`font-bold ${getTrafficLevelColor(data.traffic.data.route.trafficLevel)}`}>
                {data.traffic.data.route.trafficLevel === 'low' ? '畅通' :
                 data.traffic.data.route.trafficLevel === 'medium' ? '缓慢' :
                 data.traffic.data.route.trafficLevel === 'high' ? '拥堵' : '严重拥堵'}
              </span>
            </div>
            <p className="text-slate-300 text-sm mb-2">距离 {data.traffic.data.route.distance}km</p>
            <div className="flex justify-between text-xs text-slate-400">
              <span>预计 {Math.round(data.traffic.data.route.durationInTraffic / 60)}分钟</span>
              <span>路况良好</span>
            </div>
          </div>
        )}
      </div>

      {/* 景点推荐 */}
      {data?.pois?.data && data.pois.data.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <h4 className="font-medium text-white mb-3">附近景点</h4>
          <div className="space-y-2">
            {data.pois.data.slice(0, 3).map((poi: any) => (
              <div key={poi.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white">{poi.basicInfo.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className={`w-3 h-3 ${getCrowdLevelColor(poi.realTimeInfo.crowdLevel)}`} />
                  <span className={`text-xs ${getCrowdLevelColor(poi.realTimeInfo.crowdLevel)}`}>
                    {poi.realTimeInfo.crowdLevel === 'very_low' ? '很少' :
                     poi.realTimeInfo.crowdLevel === 'low' ? '较少' :
                     poi.realTimeInfo.crowdLevel === 'medium' ? '适中' :
                     poi.realTimeInfo.crowdLevel === 'high' ? '较多' : '拥挤'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 紧急信息 */}
      {data?.emergency?.alerts && data.emergency.alerts.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h4 className="font-medium text-red-400">安全提醒</h4>
          </div>
          {data.emergency.alerts.slice(0, 2).map((alert: any) => (
            <div key={alert.id} className="mb-2 last:mb-0">
              <p className="text-sm text-white font-medium">{alert.title}</p>
              <p className="text-xs text-slate-300">{alert.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderWeatherTab = () => (
    <div className="space-y-4">
      {data?.weather?.data ? (
        <>
          {/* 当前天气 */}
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {getWeatherIcon(data.weather.data.current.condition)}
                <div>
                  <h3 className="text-xl font-bold text-white">当前天气</h3>
                  <p className="text-slate-300">{data.location.address}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{data.weather.data.current.temperature}°C</div>
                <div className="text-slate-300">{data.weather.data.current.condition}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="md:hidden col-span-2">
                <div className="h-1 bg-white/10 rounded-full">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              <div className="text-center">
                <Thermometer className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                <div className="text-sm text-slate-400">体感温度</div>
                <div className="text-white font-medium">{data.weather.data.current.temperature}°C</div>
              </div>
              <div className="text-center">
                <Cloud className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                <div className="text-sm text-slate-400">湿度</div>
                <div className="text-white font-medium">{data.weather.data.current.humidity}%</div>
              </div>
              <div className="text-center">
                <Wind className="w-6 h-6 text-green-400 mx-auto mb-1" />
                <div className="text-sm text-slate-400">风速</div>
                <div className="text-white font-medium">{data.weather.data.current.windSpeed}km/h</div>
              </div>
              <div className="text-center">
                <Eye className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                <div className="text-sm text-slate-400">能见度</div>
                <div className="text-white font-medium">{data.weather.data.current.visibility}km</div>
              </div>
            </div>
          </div>

          {/* 天气预报 */}
          {data.weather.data.forecast && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <h4 className="font-medium text-white mb-3">7天预报</h4>
              <div className="space-y-2">
                {data.weather.data.forecast.map((day: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getWeatherIcon(day.condition)}
                      <div>
                        <div className="text-white font-medium">
                          {index === 0 ? '今天' : index === 1 ? '明天' : new Date(day.date).toLocaleDateString('zh-CN', { weekday: 'short' })}
                        </div>
                        <div className="text-sm text-slate-400">{day.condition}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-medium">{day.high}° / {day.low}°</div>
                      <div className="text-sm text-slate-400">{day.humidity}%湿度</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 天气预警 */}
          {data.weather.data.alerts && data.weather.data.alerts.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <h4 className="font-medium text-yellow-400">天气预警</h4>
              </div>
              {data.weather.data.alerts.map((alert: any) => (
                <div key={alert.id} className="mb-3 last:mb-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      alert.severity === 'extreme' ? 'bg-red-500/20 text-red-400' :
                      alert.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                      alert.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {alert.severity === 'extreme' ? '极危险' :
                       alert.severity === 'high' ? '高危险' :
                       alert.severity === 'medium' ? '中等' : '低危险'}
                    </span>
                    <span className="text-white font-medium">{alert.title}</span>
                  </div>
                  <p className="text-sm text-slate-300 mb-2">{alert.description}</p>
                  {alert.recommendations && alert.recommendations.length > 0 && (
                    <div className="text-xs text-slate-400">
                      建议: {alert.recommendations.join('、')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <Cloud className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-400">正在获取天气信息...</p>
        </div>
      )}
    </div>
  )

  const renderTrafficTab = () => (
    <div className="space-y-4">
      {data?.traffic?.data ? (
        <>
          {/* 当前路况 */}
          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Car className={`w-8 h-8 ${getTrafficLevelColor(data.traffic.data.route.trafficLevel)}`} />
                <div>
                  <h3 className="text-xl font-bold text-white">当前路况</h3>
                  <p className="text-slate-300">{data.traffic.data.route.origin} → {data.traffic.data.route.destination}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getTrafficLevelColor(data.traffic.data.route.trafficLevel)}`}>
                  {data.traffic.data.route.trafficLevel === 'low' ? '畅通' :
                   data.traffic.data.route.trafficLevel === 'medium' ? '缓慢' :
                   data.traffic.data.route.trafficLevel === 'high' ? '拥堵' : '严重拥堵'}
                </div>
                <div className="text-slate-300">{data.traffic.data.route.distance}km</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <Clock className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                <div className="text-sm text-slate-400">预计时间</div>
                <div className="text-white font-medium">{Math.round(data.traffic.data.route.durationInTraffic / 60)}分钟</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <Navigation className="w-6 h-6 text-green-400 mx-auto mb-1" />
                <div className="text-sm text-slate-400">正常时间</div>
                <div className="text-white font-medium">{Math.round(data.traffic.data.route.duration / 60)}分钟</div>
              </div>
            </div>
          </div>

          {/* 交通事件 */}
          {data.traffic.data.incidents && data.traffic.data.incidents.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <h4 className="font-medium text-white mb-3">交通事件</h4>
              <div className="space-y-2">
                {data.traffic.data.incidents.map((incident: any) => (
                  <div key={incident.id} className={`p-3 rounded-lg border-l-4 ${
                    incident.severity === 'critical' ? 'bg-red-500/10 border-red-400' :
                    incident.severity === 'high' ? 'bg-orange-500/10 border-orange-400' :
                    incident.severity === 'medium' ? 'bg-yellow-500/10 border-yellow-400' :
                    'bg-blue-500/10 border-blue-400'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium">{incident.title}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        incident.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                        incident.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        incident.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {incident.severity === 'critical' ? '严重' :
                         incident.severity === 'high' ? '高' :
                         incident.severity === 'medium' ? '中' : '低'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mb-2">{incident.description}</p>
                    <div className="text-xs text-slate-400">
                      位置: {incident.location.address} | 延误: {incident.delayTime}分钟
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 替代路线 */}
          {data.traffic.data.alternativeRoutes && data.traffic.data.alternativeRoutes.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <h4 className="font-medium text-white mb-3">替代路线</h4>
              <div className="space-y-2">
                {data.traffic.data.alternativeRoutes.map((route: any) => (
                  <div key={route.id} className="p-3 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{route.name}</span>
                      <span className={`text-sm ${getTrafficLevelColor(route.trafficLevel)}`}>
                        {route.trafficLevel === 'low' ? '畅通' :
                         route.trafficLevel === 'medium' ? '缓慢' :
                         route.trafficLevel === 'high' ? '拥堵' : '严重拥堵'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-slate-400">
                      <div>距离: {route.distance}km</div>
                      <div>时间: {Math.round(route.durationInTraffic / 60)}分钟</div>
                      {route.tollCost && <div>过路费: ¥{route.tollCost}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8">
          <Car className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-400">正在获取交通信息...</p>
        </div>
      )}
    </div>
  )

  const renderPOITab = () => (
    <div className="space-y-4">
      {data?.pois?.data ? (
        <>
          {/* 景点状态概览 */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-8 h-8 text-purple-400" />
              <div>
                <h3 className="text-xl font-bold text-white">附近景点</h3>
                <p className="text-slate-300">实时拥挤度与开放状态</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <Users className="w-6 h-6 text-green-400 mx-auto mb-1" />
                <div className="text-sm text-slate-400">低拥挤度</div>
                <div className="text-white font-medium">
                  {data.pois.data.filter((poi: any) => poi.realTimeInfo.crowdLevel === 'low' || poi.realTimeInfo.crowdLevel === 'very_low').length}个
                </div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <Star className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
                <div className="text-sm text-slate-400">适中拥挤</div>
                <div className="text-white font-medium">
                  {data.pois.data.filter((poi: any) => poi.realTimeInfo.crowdLevel === 'medium').length}个
                </div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-1" />
                <div className="text-sm text-slate-400">高拥挤度</div>
                <div className="text-white font-medium">
                  {data.pois.data.filter((poi: any) => poi.realTimeInfo.crowdLevel === 'high' || poi.realTimeInfo.crowdLevel === 'very_high').length}个
                </div>
              </div>
            </div>
          </div>

          {/* 景点列表 */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <h4 className="font-medium text-white mb-3">景点详情</h4>
            <div className="space-y-3">
              {data.pois.data.map((poi: any) => (
                <div key={poi.id} className="p-3 sm:p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-blue-400" />
                      <div>
                        <h5 className="text-white font-medium">{poi.basicInfo.name}</h5>
                        <p className="text-xs text-slate-400">{poi.basicInfo.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        poi.realTimeInfo.status === 'open' ? 'bg-green-500/20 text-green-400' :
                        poi.realTimeInfo.status === 'closed' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {poi.realTimeInfo.status === 'open' ? '开放' :
                         poi.realTimeInfo.status === 'closed' ? '关闭' : '未知'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className={`w-4 h-4 ${getCrowdLevelColor(poi.realTimeInfo.crowdLevel)}`} />
                      <span className="text-slate-300">拥挤度:</span>
                      <span className={`${getCrowdLevelColor(poi.realTimeInfo.crowdLevel)}`}>
                        {poi.realTimeInfo.crowdLevel === 'very_low' ? '很少' :
                         poi.realTimeInfo.crowdLevel === 'low' ? '较少' :
                         poi.realTimeInfo.crowdLevel === 'medium' ? '适中' :
                         poi.realTimeInfo.crowdLevel === 'high' ? '较多' : '拥挤'}
                      </span>
                    </div>
                    {poi.rating && (
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="text-slate-300">评分:</span>
                        <span className="text-yellow-400">{poi.rating.toFixed(1)}</span>
                      </div>
                    )}
                    {poi.distance && (
                      <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300">距离:</span>
                        <span className="text-slate-400">{poi.distance.toFixed(1)}km</span>
                      </div>
                    )}
                    {poi.realTimeInfo.estimatedWaitTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="text-slate-300">预计等待:</span>
                        <span className="text-blue-400">{poi.realTimeInfo.estimatedWaitTime}分钟</span>
                      </div>
                    )}
                  </div>
                  
                  {poi.realTimeInfo.specialNotices && poi.realTimeInfo.specialNotices.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                      <p className="text-xs text-yellow-400 font-medium mb-1">特别提醒:</p>
                      {poi.realTimeInfo.specialNotices.map((notice: string, index: number) => (
                        <p key={index} className="text-xs text-slate-300">{notice}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <MapPin className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-400">正在获取景点信息...</p>
        </div>
      )}
    </div>
  )

  const renderEmergencyTab = () => (
    <div className="space-y-4">
      {data?.emergency?.alerts && data.emergency.alerts.length > 0 ? (
        <>
          {/* 紧急状态概览 */}
          <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
              <div>
                <h3 className="text-xl font-bold text-white">安全提醒</h3>
                <p className="text-slate-300">实时紧急情况与安全信息</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <Shield className="w-6 h-6 text-red-400 mx-auto mb-1" />
                <div className="text-sm text-slate-400">高危预警</div>
                <div className="text-white font-medium">
                  {data.emergency.alerts.filter((alert: any) => alert.severity === 'critical' || alert.severity === 'high').length}个
                </div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <Phone className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                <div className="text-sm text-slate-400">应急电话</div>
                <div className="text-white font-medium">可用</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-lg">
                <Zap className="w-6 h-6 text-green-400 mx-auto mb-1" />
                <div className="text-sm text-slate-400">响应状态</div>
                <div className="text-green-400 font-medium">正常</div>
              </div>
            </div>
          </div>

          {/* 紧急警报列表 */}
          <div className="space-y-3">
            {data.emergency.alerts.map((alert: any) => (
              <div key={alert.id} className={`p-3 sm:p-4 rounded-xl border-l-4 ${
                alert.severity === 'critical' ? 'bg-red-500/10 border-red-400' :
                alert.severity === 'high' ? 'bg-orange-500/10 border-orange-400' :
                alert.severity === 'medium' ? 'bg-yellow-500/10 border-yellow-400' :
                'bg-blue-500/10 border-blue-400'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`w-6 h-6 ${
                      alert.severity === 'critical' ? 'text-red-400' :
                      alert.severity === 'high' ? 'text-orange-400' :
                      alert.severity === 'medium' ? 'text-yellow-400' :
                      'text-blue-400'
                    }`} />
                    <div>
                      <h5 className="text-white font-medium">{alert.title}</h5>
                      <p className="text-sm text-slate-400">{alert.category}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    alert.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                    alert.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                    alert.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {alert.severity === 'critical' ? '严重' :
                     alert.severity === 'high' ? '高危' :
                     alert.severity === 'medium' ? '中等' : '低危'}
                  </span>
                </div>
                
                <p className="text-sm text-slate-300 mb-3">{alert.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400">位置:</span>
                    <span className="text-slate-300">{alert.location.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-400">时间:</span>
                    <span className="text-slate-300">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
                
                {alert.actions && alert.actions.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-yellow-400 font-medium mb-2">建议行动:</p>
                    <ul className="text-xs text-slate-300 space-y-1">
                      {alert.actions.map((action: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-yellow-400 mt-1">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {alert.contacts && alert.contacts.length > 0 && (
                  <div className="pt-3 border-t border-white/10">
                    <p className="text-xs text-blue-400 font-medium mb-2">应急联系方式:</p>
                    <div className="flex flex-wrap gap-2">
                      {alert.contacts.map((contact: any, index: number) => (
                        <a
                          key={index}
                          href={`tel:${contact.phone}`}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          {contact.name}: {contact.phone}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 应急功能 */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <h4 className="font-medium text-white mb-3">应急功能</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button className="flex items-center gap-3 p-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-colors group">
                <Phone className="w-5 h-5 text-red-400 group-hover:text-red-300" />
                <div className="text-left">
                  <div className="text-white font-medium">拨打急救电话</div>
                  <div className="text-xs text-slate-400">120 / 110 / 119</div>
                </div>
              </button>
              
              <button className="flex items-center gap-3 p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg transition-colors group">
                <Shield className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
                <div className="text-left">
                  <div className="text-white font-medium">安全避难</div>
                  <div className="text-xs text-slate-400">查找附近避难所</div>
                </div>
              </button>
              
              <button className="flex items-center gap-3 p-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 rounded-lg transition-colors group">
                <MapPin className="w-5 h-5 text-green-400 group-hover:text-green-300" />
                <div className="text-left">
                  <div className="text-white font-medium">位置共享</div>
                  <div className="text-xs text-slate-400">分享当前位置</div>
                </div>
              </button>
              
              <button className="flex items-center gap-3 p-3 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-lg transition-colors group">
                <AlertTriangle className="w-5 h-5 text-yellow-400 group-hover:text-yellow-300" />
                <div className="text-left">
                  <div className="text-white font-medium">报告险情</div>
                  <div className="text-xs text-slate-400">上报紧急情况</div>
                </div>
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <Shield className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <h4 className="text-white font-medium mb-2">当前安全</h4>
          <p className="text-slate-400">暂无紧急情况，保持警惕</p>
        </div>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-6xl mx-4 sm:mx-4 md:mx-6 lg:mx-8 max-h-[90vh] bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">实时信息面板</h3>
              <p className="text-sm text-slate-400">
                {isLoading ? '正在更新...' : `最后更新: ${lastUpdate.toLocaleTimeString()}`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleVoiceToggle}
              className={`p-2 sm:p-2 rounded-lg transition-colors min-w-[40px] min-h-[40px] sm:min-w-[40px] sm:min-h-[40px] ${
                voiceEnabled 
                  ? 'text-cyan-400 bg-cyan-400/20 hover:bg-cyan-400/30' 
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              title={voiceEnabled ? '关闭语音播报' : '开启语音播报'}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <button
              onClick={handleSpeakAll}
              disabled={!voiceEnabled || !data}
              className="p-2 sm:p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[40px] min-h-[40px]"
              title="语音播报所有信息"
            >
              <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 sm:p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors min-w-[40px] min-h-[40px]"
              title="设置"
            >
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-2 sm:p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 min-w-[40px] min-h-[40px]"
              title="刷新数据"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 sm:p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors min-w-[40px] min-h-[40px]"
              title="关闭"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* 标签页导航 */}
        <div className="flex border-b border-white/10 overflow-x-auto scrollbar-hide">
          {[
            { id: 'overview', label: '总览', icon: Zap },
            { id: 'weather', label: '天气', icon: Cloud },
            { id: 'traffic', label: '交通', icon: Car },
            { id: 'poi', label: '景点', icon: MapPin },
            { id: 'emergency', label: '紧急', icon: AlertTriangle }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? 'text-cyan-400 border-b-2 border-cyan-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">{tab.label}</span>
              <span className="xs:hidden">{tab.label.slice(0, 2)}</span>
            </button>
          ))}
        </div>

        {/* 主要内容区域 */}
        <div className="p-4 sm:p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'weather' && renderWeatherTab()}
          {activeTab === 'traffic' && renderTrafficTab()}
          {activeTab === 'poi' && renderPOITab()}
          {activeTab === 'emergency' && renderEmergencyTab()}
        </div>

        {/* 设置面板 */}
        {showSettings && (
          <div className="absolute top-16 right-4 sm:right-6 w-80 sm:w-64 bg-slate-800/95 backdrop-blur-xl border border-white/20 rounded-xl p-4 space-y-3 z-10">
            <h4 className="text-sm font-medium text-white">设置</h4>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">自动刷新</span>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  autoRefresh ? 'bg-cyan-400' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    autoRefresh ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">语音播报</span>
              <button
                onClick={handleVoiceToggle}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  voiceEnabled ? 'bg-cyan-400' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                    voiceEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="pt-2 border-t border-white/10">
              <button
                onClick={() => realTimeManager?.clearCache()}
                className="w-full text-left text-sm text-slate-400 hover:text-white transition-colors"
              >
                清除缓存
              </button>
              <button
                onClick={() => speechRecognitionService.clearRecognitionHistory()}
                className="w-full text-left text-sm text-slate-400 hover:text-white transition-colors mt-1"
              >
                清除识别历史
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}