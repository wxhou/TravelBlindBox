import { RealTimeInfoManager } from './realTimeInfoManager'
import { conversationService } from './conversationService'
import { voiceNarrationService } from './voiceNarrationService'

export interface SpeechRecognitionOptions {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
  noiseReduction?: boolean
  confidenceThreshold?: number
  enableGrammar?: boolean
  timeoutMs?: number
}

export interface SpeechRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
}

export interface SpeechRecognitionServiceEventMap {
  start: Event
  end: Event
  result: SpeechRecognitionResult
  error: SpeechRecognitionErrorEvent
  nomatch: SpeechRecognitionEvent
}

export class SpeechRecognitionService {
  private recognition: SpeechRecognition | null = null
  private isListening: boolean = false
  private eventHandlers: Map<keyof SpeechRecognitionServiceEventMap, ((event: any) => void)[]> = new Map()
  private realTimeInfoManager: RealTimeInfoManager | null = null
  private voiceControlEnabled: boolean = true
  private lastProcessedCommand: string | null = null
  private confidenceThreshold: number = 0.7
  private noiseReductionEnabled: boolean = true
  private recognitionTimeout: number = 10000
  private retryAttempts: number = 3
  private audioContext: AudioContext | null = null
  private analyserNode: AnalyserNode | null = null
  private microphoneStream: MediaStream | null = null
  private lastRecognitionTime: number = 0
  private recognitionHistory: Array<{ transcript: string; confidence: number; timestamp: number }> = []

  constructor() {
    this.initializeRecognition()
  }

  private initializeRealTimeIntegration(): void {
    try {
      this.realTimeInfoManager = RealTimeInfoManager.getInstance()
    } catch (error) {
      console.warn('实时信息管理器初始化失败:', error)
    }
  }

  private async checkMicrophonePermission(): Promise<boolean> {
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        return permission.state === 'granted'
      }
      return false
    } catch (error) {
      console.warn('无法检查麦克风权限:', error)
      return false
    }
  }

  private async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      console.error('麦克风权限请求失败:', error)
      return false
    }
  }

  private initializeRecognition(): void {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    
    if (!SpeechRecognition) {
      console.error('当前浏览器不支持语音识别功能')
      return
    }

    this.recognition = new SpeechRecognition()
    this.setupRecognitionEvents()
  }

  private setupRecognitionEvents(): void {
    if (!this.recognition) return

    this.recognition.continuous = false
    this.recognition.interimResults = true
    this.recognition.maxAlternatives = 3
    this.recognition.lang = 'zh-CN'

    this.recognition.onstart = (event: Event) => {
      this.isListening = true
      this.emit('start', event)
    }

    this.recognition.onend = (event: Event) => {
      this.isListening = false
      this.emit('end', event)
    }

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = Array.from(event.results)
      const lastResult = results[results.length - 1]
      
      if (lastResult && lastResult.length > 0) {
        const firstAlternative = lastResult[0]
        const transcript = firstAlternative.transcript
        const confidence = firstAlternative.confidence || 0
        const isFinal = lastResult.isFinal

        const result: SpeechRecognitionResult = {
          transcript: transcript.trim(),
          confidence,
          isFinal
        }

        this.emit('result', result)

        // 如果是最终结果，检查是否是实时信息相关命令
        if (isFinal && this.voiceControlEnabled) {
          this.handleRealTimeVoiceCommand(result.transcript, confidence)
        }
      }
    }

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.isListening = false
      
      // 根据错误类型提供具体的错误信息
      let errorMessage = '语音识别错误'
      
      switch (event.error) {
        case 'not-allowed':
          errorMessage = '麦克风权限被拒绝，请允许访问麦克风后重试'
          break
        case 'no-speech':
          errorMessage = '没有检测到语音，请重试'
          break
        case 'audio-capture':
          errorMessage = '音频捕获失败，请检查麦克风设备'
          break
        case 'network':
          errorMessage = '网络错误，请检查网络连接'
          break
        case 'aborted':
          // 正常结束，不显示错误
          return
        default:
          errorMessage = `语音识别错误: ${event.error}`
      }
      
      // 创建一个错误对象作为错误事件
      const errorObj = { ...event, message: errorMessage }
      this.emit('error', errorObj)
    }

    this.recognition.onnomatch = (event: SpeechRecognitionEvent) => {
      this.emit('nomatch', event)
    }
  }

  public setLanguage(language: string): void {
    if (this.recognition) {
      this.recognition.lang = language
    }
  }

  public getSupportedLanguages(): string[] {
    return [
      'zh-CN', // 中文(简体)
      'en-US', // 英语(美国)
      'ja-JP', // 日语(日本)
      'ko-KR'  // 韩语(韩国)
    ]
  }

  public getLanguageName(langCode: string): string {
    const languageNames: Record<string, string> = {
      'zh-CN': '中文',
      'en-US': 'English',
      'ja-JP': '日本語',
      'ko-KR': '한국어'
    }
    return languageNames[langCode] || langCode
  }

  public setContinuous(continuous: boolean): void {
    if (this.recognition) {
      this.recognition.continuous = continuous
    }
  }

  public setInterimResults(interimResults: boolean): void {
    if (this.recognition) {
      this.recognition.interimResults = interimResults
    }
  }

  public async start(options?: SpeechRecognitionOptions): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('语音识别服务不可用'))
        return
      }

      if (this.isListening) {
        reject(new Error('语音识别已在运行中'))
        return
      }

      // 检查频率限制
      if (Date.now() - this.lastRecognitionTime < 1000) {
        reject(new Error('语音识别过于频繁，请稍后再试'))
        return
      }

      // 检查麦克风权限
      const hasPermission = await this.checkMicrophonePermission()
      if (!hasPermission) {
        const permissionGranted = await this.requestMicrophonePermission()
        if (!permissionGranted) {
          reject(new Error('麦克风权限被拒绝，请允许访问麦克风后重试'))
          return
        }
      }

      // 应用配置选项
      if (options?.language) {
        this.setLanguage(options.language)
      }
      if (options?.continuous !== undefined) {
        this.setContinuous(options.continuous)
      }
      if (options?.interimResults !== undefined) {
        this.setInterimResults(options.interimResults)
      }
      if (options?.maxAlternatives !== undefined) {
        this.recognition.maxAlternatives = options.maxAlternatives
      }
      
      // 应用优化选项
      if (options?.confidenceThreshold !== undefined) {
        this.setConfidenceThreshold(options.confidenceThreshold)
      }
      
      if (options?.noiseReduction !== undefined) {
        this.setNoiseReductionEnabled(options.noiseReduction)
      }
      
      if (options?.timeoutMs !== undefined) {
        this.setRecognitionTimeout(options.timeoutMs)
      }

      try {
        // 检查音频质量（如果启用了噪声降低）
        if (this.noiseReductionEnabled) {
          const audioOk = await this.waitForGoodAudio()
          if (!audioOk) {
            console.warn('音频质量不佳，但继续识别')
          }
        }
        
        this.lastRecognitionTime = Date.now()
        this.recognition.start()
        resolve()
      } catch (error: any) {
        if (error.name === 'NotAllowedError') {
          reject(new Error('麦克风权限被拒绝，请在浏览器设置中允许访问麦克风'))
        } else {
          reject(new Error(`语音识别启动失败: ${error.message || error}`))
        }
      }
    })
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
    }
  }

  public isSupported(): boolean {
    return this.recognition !== null
  }

  public getIsListening(): boolean {
    return this.isListening
  }

  public on<K extends keyof SpeechRecognitionServiceEventMap>(
    event: K, 
    handler: (event: SpeechRecognitionServiceEventMap[K]) => void
  ): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler as (event: any) => void)
  }

  public off<K extends keyof SpeechRecognitionServiceEventMap>(
    event: K, 
    handler: (event: SpeechRecognitionServiceEventMap[K]) => void
  ): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler as (event: any) => void)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private emit<K extends keyof SpeechRecognitionServiceEventMap>(event: K, data: SpeechRecognitionServiceEventMap[K]): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if ('speechSynthesis' in window) {
      return window.speechSynthesis.getVoices()
    }
    return []
  }

  public debug(): void {
    console.log('Speech Recognition Service Debug Info:')
    console.log('- Is supported:', this.isSupported())
    console.log('- Is listening:', this.isListening)
    console.log('- Recognition object:', this.recognition)
    console.log('- Available languages:', this.getSupportedLanguages())
    console.log('- Voice control enabled:', this.voiceControlEnabled)
    console.log('- Real-time info manager:', this.realTimeInfoManager ? 'Available' : 'Not available')
    
    const voices = this.getAvailableVoices()
    console.log('- Available TTS voices:', voices.length)
    voices.forEach(voice => {
      console.log(`  - ${voice.name} (${voice.lang})`)
    })
  }

  public setVoiceControlEnabled(enabled: boolean): void {
    this.voiceControlEnabled = enabled
    console.log('语音控制实时信息功能:', enabled ? '已启用' : '已禁用')
  }

  public getVoiceControlEnabled(): boolean {
    return this.voiceControlEnabled
  }

  private async handleRealTimeVoiceCommand(transcript: string, confidence: number): Promise<void> {
    const lowerTranscript = transcript.toLowerCase()
    
    // 防重复处理
    if (this.lastProcessedCommand === transcript && Date.now() - (this as any).lastCommandTime < 3000) {
      return
    }
    
    this.lastProcessedCommand = transcript
    ;(this as any).lastCommandTime = Date.now()
    
    try {
      // 实时信息开关命令
      if (this.containsKeywords(lowerTranscript, ['开启实时信息', '打开实时信息', '启用实时播报'])) {
        this.setVoiceControlEnabled(true)
        await voiceNarrationService.speak('实时信息语音控制已开启')
        return
      }
      
      if (this.containsKeywords(lowerTranscript, ['关闭实时信息', '停止实时信息', '禁用实时播报'])) {
        this.setVoiceControlEnabled(false)
        await voiceNarrationService.speak('实时信息语音控制已关闭')
        return
      }
      
      // 实时信息播报命令
      if (this.containsKeywords(lowerTranscript, ['播报天气', '天气播报', '说说天气'])) {
        await this.speakWeatherInfo()
        return
      }
      
      if (this.containsKeywords(lowerTranscript, ['播报交通', '交通播报', '路况播报'])) {
        await this.speakTrafficInfo()
        return
      }
      
      if (this.containsKeywords(lowerTranscript, ['播报所有', '全部播报', '综合播报'])) {
        await this.speakAllRealTimeInfo()
        return
      }
      
      // 如果不是实时信息命令，传递给对话服务
      if (confidence > 0.7) {
        await conversationService.processMessage(transcript)
      }
    } catch (error) {
      console.error('处理实时语音命令失败:', error)
    }
  }

  private async speakWeatherInfo(): Promise<void> {
    try {
      if (!this.realTimeInfoManager) {
        await voiceNarrationService.speak('实时信息服务暂不可用')
        return
      }
      
      const data = await this.realTimeInfoManager.getCurrentData()
      if (data.weather.data) {
        const weatherText = voiceNarrationService.generateRealTimeWeatherNarration(data.weather.data)
        await voiceNarrationService.speak(weatherText)
      } else {
        await voiceNarrationService.speak('正在获取天气信息，请稍候')
      }
    } catch (error) {
      console.error('播报天气信息失败:', error)
      await voiceNarrationService.speak('天气信息获取失败，请稍后重试')
    }
  }

  private async speakTrafficInfo(): Promise<void> {
    try {
      if (!this.realTimeInfoManager) {
        await voiceNarrationService.speak('实时信息服务暂不可用')
        return
      }
      
      const data = await this.realTimeInfoManager.getCurrentData()
      if (data.traffic.data) {
        const trafficText = voiceNarrationService.generateRealTimeTrafficNarration(data.traffic.data)
        await voiceNarrationService.speak(trafficText)
      } else {
        await voiceNarrationService.speak('正在获取交通信息，请稍候')
      }
    } catch (error) {
      console.error('播报交通信息失败:', error)
      await voiceNarrationService.speak('交通信息获取失败，请稍后重试')
    }
  }

  private async speakAllRealTimeInfo(): Promise<void> {
    try {
      if (!this.realTimeInfoManager) {
        await voiceNarrationService.speak('实时信息服务暂不可用')
        return
      }
      
      const data = await this.realTimeInfoManager.getCurrentData()
      await voiceNarrationService.speakRealTimeInfo(data)
    } catch (error) {
      console.error('播报所有实时信息失败:', error)
      await voiceNarrationService.speak('实时信息获取失败，请稍后重试')
    }
  }

  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword))
  }

  public setConfidenceThreshold(threshold: number): void {
    this.confidenceThreshold = Math.max(0.1, Math.min(1.0, threshold))
    console.log(`置信度阈值设置为: ${this.confidenceThreshold}`)
  }

  public getConfidenceThreshold(): number {
    return this.confidenceThreshold
  }

  public setNoiseReductionEnabled(enabled: boolean): void {
    this.noiseReductionEnabled = enabled
    console.log('噪声降低:', enabled ? '已启用' : '已禁用')
  }

  public getNoiseReductionEnabled(): boolean {
    return this.noiseReductionEnabled
  }

  public setRecognitionTimeout(timeoutMs: number): void {
    this.recognitionTimeout = Math.max(1000, timeoutMs)
    console.log(`识别超时设置为: ${timeoutMs}ms`)
  }

  public getRecognitionTimeout(): number {
    return this.recognitionTimeout
  }

  public async initializeAudioProcessing(): Promise<boolean> {
    try {
      if (!this.noiseReductionEnabled) return true
      
      // 获取麦克风权限
      this.microphoneStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // 创建音频上下文
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const source = this.audioContext.createMediaStreamSource(this.microphoneStream)
      
      // 创建分析器
      this.analyserNode = this.audioContext.createAnalyser()
      this.analyserNode.fftSize = 256
      source.connect(this.analyserNode)
      
      console.log('音频处理初始化成功')
      return true
    } catch (error) {
      console.warn('音频处理初始化失败:', error)
      return false
    }
  }

  public cleanupAudioProcessing(): void {
    if (this.microphoneStream) {
      this.microphoneStream.getTracks().forEach(track => track.stop())
      this.microphoneStream = null
    }
    
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    
    this.analyserNode = null
    console.log('音频处理资源已清理')
  }

  private getAudioLevel(): number {
    if (!this.analyserNode) return 0
    
    const dataArray = new Uint8Array(this.analyserNode.frequencyBinCount)
    this.analyserNode.getByteFrequencyData(dataArray)
    
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
    return average / 255 // 归一化到0-1
  }

  private isNoiseLevelAcceptable(): boolean {
    if (!this.noiseReductionEnabled) return true
    
    const audioLevel = this.getAudioLevel()
    const threshold = 0.1 // 噪声阈值
    
    return audioLevel >= threshold
  }

  private async waitForGoodAudio(): Promise<boolean> {
    if (!this.noiseReductionEnabled) return true
    
    const maxWaitTime = 3000 // 最多等待3秒
    const checkInterval = 100 // 每100ms检查一次
    const startTime = Date.now()
    
    while (Date.now() - startTime < maxWaitTime) {
      if (this.isNoiseLevelAcceptable()) {
        return true
      }
      await new Promise(resolve => setTimeout(resolve, checkInterval))
    }
    
    console.warn('音频质量检查超时')
    return false
  }

  private enhanceRecognitionAccuracy(result: SpeechRecognitionResult): SpeechRecognitionResult {
    // 清理文本
    let enhancedTranscript = this.cleanupTranscript(result.transcript)
    
    // 检查置信度
    if (result.confidence < this.confidenceThreshold) {
      console.log(`识别置信度过低 (${result.confidence}), 尝试增强`)
      enhancedTranscript = this.attemptTranscriptEnhancement(enhancedTranscript)
    }
    
    // 记录识别历史
    this.addToRecognitionHistory(enhancedTranscript, result.confidence)
    
    return {
      ...result,
      transcript: enhancedTranscript,
      confidence: Math.min(1.0, result.confidence + 0.1) // 轻微提升置信度
    }
  }

  private cleanupTranscript(transcript: string): string {
    return transcript
      .replace(/\s+/g, ' ') // 合并多个空格
      .replace(/[。？！，；：]/g, '.') // 统一标点符号
      .trim()
      .toLowerCase()
  }

  private attemptTranscriptEnhancement(transcript: string): string {
    // 基于历史记录增强
    const similarHistory = this.findSimilarTranscripts(transcript)
    if (similarHistory.length > 0) {
      const bestMatch = similarHistory[0]
      console.log(`基于历史记录增强: ${transcript} -> ${bestMatch.transcript}`)
      return bestMatch.transcript
    }
    
    // 常见词汇纠错
    return this.applyCommonCorrections(transcript)
  }

  private findSimilarTranscripts(transcript: string): Array<{ transcript: string; confidence: number }> {
    return this.recognitionHistory
      .filter(item => {
        const similarity = this.calculateStringSimilarity(transcript, item.transcript)
        return similarity > 0.7
      })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  private applyCommonCorrections(transcript: string): string {
    const corrections: Record<string, string> = {
      '实时信息': '实时信息',
      '实时天启': '实时天气',
      '天启播报': '天气播报',
      '交通播报': '交通播报',
      '播报所有': '播报所有',
      '开启实时': '开启实时信息',
      '关闭实时': '关闭实时信息'
    }
    
    for (const [wrong, correct] of Object.entries(corrections)) {
      if (transcript.includes(wrong)) {
        transcript = transcript.replace(wrong, correct)
      }
    }
    
    return transcript
  }

  private addToRecognitionHistory(transcript: string, confidence: number): void {
    this.recognitionHistory.push({
      transcript,
      confidence,
      timestamp: Date.now()
    })
    
    // 保持历史记录在合理范围内
    if (this.recognitionHistory.length > 50) {
      this.recognitionHistory = this.recognitionHistory.slice(-50)
    }
  }

  public getRecognitionHistory(): Array<{ transcript: string; confidence: number; timestamp: number }> {
    return [...this.recognitionHistory]
  }

  public clearRecognitionHistory(): void {
    this.recognitionHistory = []
    console.log('识别历史已清空')
  }

  public getRecognitionStatistics(): {
    totalRecognitions: number
    averageConfidence: number
    successRate: number
    recentAccuracy: number
  } {
    if (this.recognitionHistory.length === 0) {
      return {
        totalRecognitions: 0,
        averageConfidence: 0,
        successRate: 0,
        recentAccuracy: 0
      }
    }
    
    const total = this.recognitionHistory.length
    const averageConfidence = this.recognitionHistory.reduce((sum, item) => sum + item.confidence, 0) / total
    const successRate = this.recognitionHistory.filter(item => item.confidence >= this.confidenceThreshold).length / total
    
    // 最近10次识别的准确率
    const recent = this.recognitionHistory.slice(-10)
    const recentAccuracy = recent.filter(item => item.confidence >= this.confidenceThreshold).length / recent.length
    
    return {
      totalRecognitions: total,
      averageConfidence,
      successRate,
      recentAccuracy
    }
  }
}

export const speechRecognitionService = new SpeechRecognitionService()