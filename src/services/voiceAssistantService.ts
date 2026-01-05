import type { TravelRoute } from '../types'
import { speechRecognitionService, type SpeechRecognitionOptions, type SpeechRecognitionResult } from './speechRecognitionService'
import { translationService, type TranslationOptions, type TranslationResult } from './translationService'
import { conversationService } from './conversationService'
import { voiceNarrationService, type VoiceNarrationOptions } from './voiceNarrationService'

export interface VoiceAssistantOptions {
  language?: string
  translationEnabled?: boolean
  translationTarget?: string
  conversationEnabled?: boolean
  voiceCommandEnabled?: boolean
}

export interface VoiceAssistantState {
  isListening: boolean
  isProcessing: boolean
  isSpeaking: boolean
  currentLanguage: string
  translationEnabled: boolean
  conversationEnabled: boolean
  translationTarget: string
  lastRecognizedText?: string
  lastTranslationResult?: TranslationResult
}

export type VoiceAssistantEvent = 
  | { type: 'listening-started' }
  | { type: 'listening-stopped' }
  | { type: 'speech-recognized'; text: string; isFinal: boolean }
  | { type: 'translation-completed'; original: string; translated: string }
  | { type: 'response-generated'; text: string }
  | { type: 'speech-started' }
  | { type: 'speech-completed' }
  | { type: 'error'; error: Error }
  | { type: 'command-recognized'; command: string; action: string }

export class VoiceAssistantService {
  private state: VoiceAssistantState = {
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    currentLanguage: 'zh-CN',
    translationEnabled: false,
    conversationEnabled: true,
    translationTarget: 'en'
  }

  private eventHandlers: Map<string, ((event: VoiceAssistantEvent) => void)[]> = new Map()
  private commandHandlers: Map<string, () => void> = new Map()

  constructor() {
    this.setupEventListeners()
    this.setupVoiceCommands()
  }

  private setupEventListeners(): void {
    // 语音识别事件
    speechRecognitionService.on('start', () => {
      this.state.isListening = true
      this.emit({ type: 'listening-started' })
    })

    speechRecognitionService.on('end', () => {
      this.state.isListening = false
      this.emit({ type: 'listening-stopped' })
    })

    speechRecognitionService.on('result', async (result: SpeechRecognitionResult) => {
      this.state.lastRecognizedText = result.transcript
      
      this.emit({ type: 'speech-recognized', text: result.transcript, isFinal: result.isFinal })

      if (result.isFinal && result.transcript.trim()) {
        await this.processRecognizedSpeech(result.transcript)
      }
    })

    speechRecognitionService.on('error', (error) => {
      let errorMessage = '语音识别错误'
      
      if (typeof error === 'object' && error.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error && error.error) {
        switch (error.error) {
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
            errorMessage = `语音识别错误: ${error.error}`
        }
      }
      
      this.emit({ type: 'error', error: new Error(errorMessage) })
    })

    // 语音合成事件监听
    // 这里可以添加对voiceNarrationService事件的监听
  }

  private setupVoiceCommands(): void {
    // 导航控制命令
    this.commandHandlers.set('next-route', () => this.handleNextRouteCommand())
    this.commandHandlers.set('previous-route', () => this.handlePreviousRouteCommand())
    this.commandHandlers.set('go-back', () => this.handleGoBackCommand())
    this.commandHandlers.set('show-details', () => this.handleShowDetailsCommand())
    
    // 语音播放控制命令
    this.commandHandlers.set('play', () => this.handlePlayCommand())
    this.commandHandlers.set('pause', () => this.handlePauseCommand())
    this.commandHandlers.set('stop', () => this.handleStopCommand())
    this.commandHandlers.set('repeat', () => this.handleRepeatCommand())
    
    // 设置控制命令
    this.commandHandlers.set('switch-language', () => this.handleSwitchLanguageCommand())
    this.commandHandlers.set('enable-translation', () => this.handleEnableTranslationCommand())
    this.commandHandlers.set('disable-translation', () => this.handleDisableTranslationCommand())
    
    // 帮助命令
    this.commandHandlers.set('help', () => this.handleHelpCommand())
    this.commandHandlers.set('what-can-you-do', () => this.handleWhatCanYouDoCommand())
  }

  private parseVoiceCommand(text: string): { command?: string; action?: string } {
    const lowerText = text.toLowerCase()
    
    // 导航命令
    if (this.containsKeywords(lowerText, ['下一条', '下一个', '切换到下一条'])) {
      return { command: 'next-route', action: '切换到下一条路线' }
    }
    
    if (this.containsKeywords(lowerText, ['上一条', '上一个', '返回上一条'])) {
      return { command: 'previous-route', action: '返回上一条路线' }
    }
    
    if (this.containsKeywords(lowerText, ['返回', '上一页', '后退'])) {
      return { command: 'go-back', action: '返回上一页' }
    }
    
    if (this.containsKeywords(lowerText, ['详情', '详细信息', '更多'])) {
      return { command: 'show-details', action: '显示详细信息' }
    }
    
    // 播放控制命令
    if (this.containsKeywords(lowerText, ['播放', '继续', '开始'])) {
      return { command: 'play', action: '开始播放' }
    }
    
    if (this.containsKeywords(lowerText, ['暂停', '停止播放'])) {
      return { command: 'pause', action: '暂停播放' }
    }
    
    if (this.containsKeywords(lowerText, ['停止', '结束'])) {
      return { command: 'stop', action: '停止播放' }
    }
    
    if (this.containsKeywords(lowerText, ['重复', '再说一遍', '重新播放'])) {
      return { command: 'repeat', action: '重复播放' }
    }
    
    // 设置命令
    if (this.containsKeywords(lowerText, ['切换语言', '换语言'])) {
      return { command: 'switch-language', action: '切换语言' }
    }
    
    if (this.containsKeywords(lowerText, ['开启翻译', '开始翻译'])) {
      return { command: 'enable-translation', action: '开启翻译' }
    }
    
    if (this.containsKeywords(lowerText, ['关闭翻译', '停止翻译'])) {
      return { command: 'disable-translation', action: '关闭翻译' }
    }
    
    // 帮助命令
    if (this.containsKeywords(lowerText, ['帮助', 'help'])) {
      return { command: 'help', action: '显示帮助' }
    }
    
    if (this.containsKeywords(lowerText, ['你能做什么', '功能'])) {
      return { command: 'what-can-you-do', action: '显示功能列表' }
    }
    
    return {}
  }

  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword))
  }

  private async processRecognizedSpeech(text: string): Promise<void> {
    if (this.state.isProcessing) return
    
    this.state.isProcessing = true
    
    try {
      let processedText = text

      // 语音命令检查
      const commandResult = this.parseVoiceCommand(text)
      if (commandResult.command && commandResult.action) {
        this.emit({ type: 'command-recognized', command: commandResult.command, action: commandResult.action })
        await this.executeCommand(commandResult.command)
        return
      }

      // 翻译处理
      if (this.state.translationEnabled) {
        const translationOptions: TranslationOptions = {
          from: this.state.currentLanguage,
          to: this.state.translationTarget || 'en',
          cache: true
        }

        try {
          const translationResult = await translationService.translate(text, translationOptions)
          this.state.lastTranslationResult = translationResult
          processedText = translationResult.translatedText
          this.emit({ type: 'translation-completed', original: text, translated: processedText })
        } catch (error) {
          console.warn('翻译失败，继续使用原文:', error)
        }
      }

      // 对话处理
      if (this.state.conversationEnabled) {
        const response = await conversationService.processMessage(processedText)
        await this.speak(response)
      } else {
        // 如果对话禁用，只是简单回读用户输入
        await this.speak(`您说的是：${processedText}`)
      }
    } catch (error) {
      this.emit({ type: 'error', error: error instanceof Error ? error : new Error('处理语音时出错') })
    } finally {
      this.state.isProcessing = false
    }
  }

  private async executeCommand(command: string): Promise<void> {
    const handler = this.commandHandlers.get(command)
    if (handler) {
      await handler()
    } else {
      await this.speak('抱歉，我不理解这个命令')
    }
  }

  // 语音命令处理方法
  private async handleNextRouteCommand(): Promise<void> {
    await this.speak('正在为您切换到下一条路线')
    // 这里需要与路由管理组件集成
    // 暂时模拟实现
  }

  private async handlePreviousRouteCommand(): Promise<void> {
    await this.speak('正在为您切换到上一条路线')
    // 这里需要与路由管理组件集成
  }

  private async handleGoBackCommand(): Promise<void> {
    await this.speak('正在为您返回上一页')
    // 这里需要与路由导航集成
  }

  private async handleShowDetailsCommand(): Promise<void> {
    await this.speak('正在为您显示路线详细信息')
    // 这里需要与UI组件集成
  }

  private async handlePlayCommand(): Promise<void> {
    voiceNarrationService.resume()
    await this.speak('已开始播放')
  }

  private async handlePauseCommand(): Promise<void> {
    voiceNarrationService.pause()
    await this.speak('已暂停播放')
  }

  private async handleStopCommand(): Promise<void> {
    voiceNarrationService.stop()
    await this.speak('已停止播放')
  }

  private async handleRepeatCommand(): Promise<void> {
    if (this.state.lastRecognizedText) {
      await this.speak(this.state.lastRecognizedText)
    } else {
      await this.speak('没有可重复的内容')
    }
  }

  private async handleSwitchLanguageCommand(): Promise<void> {
    const languages = speechRecognitionService.getSupportedLanguages()
    const currentIndex = languages.indexOf(this.state.currentLanguage)
    const nextIndex = (currentIndex + 1) % languages.length
    const nextLanguage = languages[nextIndex]
    const languageName = speechRecognitionService.getLanguageName(nextLanguage)
    
    this.setLanguage(nextLanguage)
    await this.speak(`已切换到${languageName}`)
  }

  private async handleEnableTranslationCommand(): Promise<void> {
    this.state.translationEnabled = true
    await this.speak('已开启翻译功能')
  }

  private async handleDisableTranslationCommand(): Promise<void> {
    this.state.translationEnabled = false
    await this.speak('已关闭翻译功能')
  }

  private async handleHelpCommand(): Promise<void> {
    const helpText = `我是您的智能语音助手，可以帮助您：
    1. 语音导航：说"下一条路线"、"返回上一页"等
    2. 语音控制：说"播放"、"暂停"、"停止"等
    3. 语言切换：说"切换语言"
    4. 翻译功能：说"开启翻译"、"关闭翻译"
    5. 旅行咨询：可以问我关于景点、美食、住宿等问题`
    
    await this.speak(helpText)
  }

  private async handleWhatCanYouDoCommand(): Promise<void> {
    const featuresText = `我可以帮您：
    • 规划旅行路线和推荐景点
    • 提供美食和住宿建议
    • 语音导航和控制
    • 多语言翻译
    • 回答旅行相关问题`
    
    await this.speak(featuresText)
  }

  // 公共API方法
  public async startListening(options?: SpeechRecognitionOptions): Promise<void> {
    if (this.state.isListening) {
      throw new Error('语音识别已在运行中')
    }

    const defaultOptions: SpeechRecognitionOptions = {
      language: this.state.currentLanguage,
      continuous: false,
      interimResults: true
    }

    await speechRecognitionService.start({ ...defaultOptions, ...options })
  }

  public stopListening(): void {
    speechRecognitionService.stop()
  }

  public async speak(text: string, options?: VoiceNarrationOptions): Promise<void> {
    try {
      this.state.isSpeaking = true
      this.emit({ type: 'speech-started' })
      
      const ttsOptions: VoiceNarrationOptions = {
        lang: this.state.currentLanguage,
        rate: 0.85,
        pitch: 1.1,
        volume: 0.9,
        ...options
      }
      
      await voiceNarrationService.speak(text, ttsOptions)
    } finally {
      this.state.isSpeaking = false
      this.emit({ type: 'speech-completed' })
    }
  }

  public setLanguage(language: string): void {
    this.state.currentLanguage = language
    speechRecognitionService.setLanguage(language)
  }

  public getSupportedLanguages(): string[] {
    return speechRecognitionService.getSupportedLanguages()
  }

  public getLanguageName(langCode: string): string {
    return speechRecognitionService.getLanguageName(langCode)
  }

  public setTranslationEnabled(enabled: boolean): void {
    this.state.translationEnabled = enabled
  }

  public setTranslationTarget(target: string): void {
    this.state.translationTarget = target
  }

  public setConversationEnabled(enabled: boolean): void {
    this.state.conversationEnabled = enabled
  }

  public getState(): VoiceAssistantState {
    return { ...this.state }
  }

  public on(event: VoiceAssistantEvent['type'], handler: (event: VoiceAssistantEvent) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  public off(event: VoiceAssistantEvent['type'], handler: (event: VoiceAssistantEvent) => void): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private emit(event: VoiceAssistantEvent): void {
    const handlers = this.eventHandlers.get(event.type)
    if (handlers) {
      handlers.forEach(handler => handler(event))
    }
  }

  public isSupported(): boolean {
    return speechRecognitionService.isSupported() && voiceNarrationService.isSupported()
  }

  public debug(): void {
    console.log('Voice Assistant Service Debug Info:')
    console.log('- State:', this.state)
    console.log('- Is supported:', this.isSupported())
    console.log('- Available commands:', Array.from(this.commandHandlers.keys()))
    
    speechRecognitionService.debug()
    conversationService.debug()
  }
}

export const voiceAssistantService = new VoiceAssistantService()