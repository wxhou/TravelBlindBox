import { RealTimeInfoManager } from './realTimeInfoManager'
import type { RealTimeInfoData } from './realTimeInfoManager'
import type { WeatherData, WeatherAlert } from './weatherService'
import type { TrafficData } from './trafficService'
import type { POIStatus } from './poiService'
import type { EmergencyAlert } from './emergencyService'
import type { TravelRoute } from '../types'

export interface VoiceNarrationOptions {
  rate?: number
  pitch?: number
  volume?: number
  lang?: string
}

export class VoiceNarrationService {
  private synthesis: SpeechSynthesis
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private isInitialized: boolean = false
  private availableVoices: SpeechSynthesisVoice[] = []
  private selectedVoice: SpeechSynthesisVoice | null = null

  constructor() {
    this.synthesis = window.speechSynthesis
    this.initializeService()
  }

  private initializeService(): void {
    if (this.synthesis) {
      this.isInitialized = true
      this.loadVoices()
    }
  }

  private loadVoices(): void {
    const loadVoicesOnce = () => {
      this.availableVoices = this.synthesis.getVoices()
      this.selectBestVoice()
    }

    loadVoicesOnce()
    
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = loadVoicesOnce
    }
  }

  private selectBestVoice(): void {
    const chineseVoices = this.availableVoices.filter(voice => 
      voice.lang.includes('zh') || voice.lang.includes('cmn')
    )
    
    if (chineseVoices.length > 0) {
      this.selectedVoice = chineseVoices.find(voice => 
        voice.name.includes('Female') || 
        voice.name.includes('Xiaoxiao') ||
        voice.name.includes('Yaoyao') ||
        voice.name.includes('xiaoyi') ||
        voice.name.includes('xiaoxiao') ||
        voice.name.includes('xiaoyi')
      ) || chineseVoices[0]
    } else {
      this.selectedVoice = this.availableVoices[0] || null
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.availableVoices
  }

  public getSelectedVoice(): SpeechSynthesisVoice | null {
    return this.selectedVoice
  }

  public setVoice(voiceName: string): void {
    const voice = this.availableVoices.find(v => v.name === voiceName)
    if (voice) {
      this.selectedVoice = voice
    }
  }

  public debugVoices(): void {
    console.log('Available voices:', this.availableVoices)
    console.log('Selected voice:', this.selectedVoice)
    console.log('Chinese voices:', this.availableVoices.filter(voice => 
      voice.lang.includes('zh') || voice.lang.includes('cmn')
    ))
  }

  public isSupported(): boolean {
    return this.isInitialized && 'speechSynthesis' in window
  }

  public generateNarrationText(route: TravelRoute): string {
    const { title, description, theme, duration, highlights, itinerary } = route
    
    let text = `亲爱的旅行者，欢迎来到您的专属旅行惊喜！`
    text += `这是一次精心为您定制的${duration}天${theme}主题之旅，目的地是${title}。`
    
    if (description) {
      text += ` ${description}`
    }
    
    text += ` 这个旅程的精彩亮点让人期待不已：`
    highlights.forEach((highlight, index) => {
      text += ` 首先是${highlight}，`
    })
    
    text = text.replace(/，$/, '。')
    
    text += ` 接下来的行程安排更是精彩纷呈，我们将为您提供每一天的详细活动指南。`
    text += ` 从美食探索到文化体验，从自然风光到人文历史，每一个环节都经过精心安排。`
    text += ` 相信这次旅程一定会为您留下难忘的美好回忆。`
    
    return text
  }

  public async speak(
    text: string, 
    options: VoiceNarrationOptions = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('语音合成服务不支持'))
        return
      }

      this.stop()

      const utterance = new SpeechSynthesisUtterance(text)
      
      utterance.rate = options.rate ?? 0.85
      utterance.pitch = options.pitch ?? 1.1
      utterance.volume = options.volume ?? 0.9
      utterance.lang = options.lang ?? 'zh-CN'
      
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice
      }

      utterance.onend = () => {
        this.currentUtterance = null
        resolve()
      }

      utterance.onerror = (event) => {
        this.currentUtterance = null
        reject(new Error(`语音合成错误: ${event.error}`))
      }

      this.currentUtterance = utterance
      this.synthesis.speak(utterance)
    })
  }

  public stop(): void {
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.cancel()
    }
    this.currentUtterance = null
  }

  public pause(): void {
    if (this.synthesis && this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause()
    }
  }

  public resume(): void {
    if (this.synthesis && this.synthesis.paused) {
      this.synthesis.resume()
    }
  }

  public getIsSpeaking(): boolean {
    return this.synthesis.speaking
  }

  public getIsPaused(): boolean {
    return this.synthesis.paused
  }

  public generateRealTimeWeatherNarration(weather: WeatherData): string {
    const { current, alerts } = weather
    let text = `当前天气情况：`
    
    text += `${current.temperature}度，${current.condition}，`
    text += `湿度${current.humidity}%，`
    
    if (current.windSpeed > 0) {
      text += `风力${current.windSpeed}级。`
    } else {
      text += `微风。`
    }
    
    if (alerts.length > 0) {
      text += ` 注意：`
      alerts.forEach(alert => {
        text += `${alert.title}，${alert.description}。`
      })
    }
    
    return text
  }

  public generateRealTimeTrafficNarration(traffic: TrafficData): string {
    const { route, incidents } = traffic
    let text = `当前交通状况：`
    
    const trafficLevel = route.trafficLevel === 'low' ? '畅通' : 
                        route.trafficLevel === 'medium' ? '缓慢' : 
                        route.trafficLevel === 'high' ? '拥堵' : '严重拥堵'
    
    text += `${trafficLevel}，`
    text += `距离目的地${route.distance}公里，`
    text += `预计${Math.round(route.durationInTraffic / 60)}分钟。`
    
    if (incidents.length > 0) {
      text += ` 交通提示：`
      incidents.forEach(incident => {
        if (incident.active) {
          text += `${incident.location.address}附近有${incident.title}，`
        }
      })
    }
    
    return text
  }

  public generatePOIStatusNarration(pois: POIStatus[]): string {
    if (pois.length === 0) {
      return '附近暂无可用景点信息。'
    }
    
    const openPOIs = pois.filter(poi => poi.status.isOpen)
    const crowdedPOIs = pois.filter(poi => 
      poi.realTimeInfo.crowdLevel === 'high' || poi.realTimeInfo.crowdLevel === 'very_high'
    )
    
    let text = `景点状态更新：`
    text += `附近${openPOIs.length}个景点正在开放，`
    
    if (crowdedPOIs.length > 0) {
      text += `${crowdedPOIs.length}个景点较为拥挤。`
    } else {
      text += `整体客流适中。`
    }
    
    const recommendations = openPOIs
      .filter(poi => poi.realTimeInfo.crowdLevel === 'low' || poi.realTimeInfo.crowdLevel === 'very_low')
      .slice(0, 2)
    
    if (recommendations.length > 0) {
      text += ` 推荐：`
      recommendations.forEach(poi => {
        text += `${poi.basicInfo.name}，`
      })
    }
    
    return text
  }

  public generateEmergencyNarration(alerts: EmergencyAlert[], resources: any[]): string {
    const activeAlerts = alerts.filter(alert => alert.active)
    const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical')
    
    if (criticalAlerts.length > 0) {
      const alert = criticalAlerts[0]
      return `紧急提醒：${alert.title}。${alert.description}。请立即采取安全措施。记住紧急电话：报警110、火警119、急救120。`
    } else if (activeAlerts.length > 0) {
      const alert = activeAlerts[0]
      return `安全提醒：${alert.title}。${alert.description}。请关注相关信息。`
    } else {
      return `当前区域安全状况良好，附近有${resources.length}个应急设施。记住紧急电话：报警110、火警119、急救120。`
    }
  }

  public generateComprehensiveNarration(data: RealTimeInfoData): string {
    let text = '实时信息播报开始。'
    
    // 天气信息
    if (data.weather.data) {
      text += this.generateRealTimeWeatherNarration(data.weather.data)
    }
    
    // 交通信息
    if (data.traffic.data) {
      text += ' ' + this.generateRealTimeTrafficNarration(data.traffic.data)
    }
    
    // 景点信息
    if (data.pois.data.length > 0) {
      text += ' ' + this.generatePOIStatusNarration(data.pois.data)
    }
    
    // 紧急信息
    if (data.emergency.alerts.length > 0 || data.emergency.resources.length > 0) {
      text += ' ' + this.generateEmergencyNarration(data.emergency.alerts, data.emergency.resources)
    }
    
    text += ' 实时信息播报结束。'
    
    return text
  }

  public async speakRealTimeInfo(data: RealTimeInfoData): Promise<void> {
    const text = this.generateComprehensiveNarration(data)
    return this.speak(text, {
      rate: 0.9,
      pitch: 1.0,
      volume: 1.0
    })
  }

  public async speakWeatherAlert(alert: WeatherAlert): Promise<void> {
    let text = `天气预警：`
    text += `${alert.title}。`
    text += `${alert.description}。`
    
    if (alert.recommendations.length > 0) {
      text += `建议：`
      alert.recommendations.forEach((rec: string) => {
        text += `${rec}，`
      })
    }
    
    return this.speak(text, {
      rate: 0.8,
      pitch: 1.1,
      volume: 1.0
    })
  }

  public async speakEmergencyAlert(alert: EmergencyAlert): Promise<void> {
    let text = `紧急预警：`
    text += `${alert.title}。`
    text += `${alert.description}。`
    
    if (alert.instructions.length > 0) {
      text += `请立即：`
      alert.instructions.forEach((instruction: string) => {
        text += `${instruction}，`
      })
    }
    
    text += '如有需要请拨打紧急电话：报警110、火警119、急救120。'
    
    return this.speak(text, {
      rate: 0.7,
      pitch: 1.2,
      volume: 1.0
    })
  }
}

export const voiceNarrationService = new VoiceNarrationService()