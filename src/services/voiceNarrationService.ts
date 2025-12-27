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
}

export const voiceNarrationService = new VoiceNarrationService()