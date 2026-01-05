export interface TranslationOptions {
  from?: string
  to: string
  provider?: 'mymemory' | 'libre'
  cache?: boolean
}

export interface TranslationResult {
  translatedText: string
  sourceLanguage: string
  targetLanguage: string
  confidence?: number
  provider: string
}

export interface TranslationCache {
  [key: string]: TranslationResult
}

export class TranslationService {
  private cache: TranslationCache = {}
  private cacheExpiry: Map<string, number> = new Map()
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 24小时

  constructor() {
    this.loadCacheFromStorage()
  }

  private loadCacheFromStorage(): void {
    try {
      const cached = localStorage.getItem('voice-assistant-translation-cache')
      if (cached) {
        const parsed = JSON.parse(cached)
        const now = Date.now()
        
        Object.entries(parsed).forEach(([key, result]) => {
          const expiryKey = `${key}-expiry`
          const expiry = localStorage.getItem(expiryKey)
          
          if (expiry && parseInt(expiry) > now) {
            this.cache[key] = result as TranslationResult
            this.cacheExpiry.set(key, parseInt(expiry))
          } else {
            // 清理过期缓存
            localStorage.removeItem(expiryKey)
            delete parsed[key]
          }
        })
        
        // 保存清理后的缓存
        if (Object.keys(parsed).length > 0) {
          localStorage.setItem('voice-assistant-translation-cache', JSON.stringify(parsed))
        }
      }
    } catch (error) {
      console.warn('加载翻译缓存失败:', error)
    }
  }

  private saveCacheToStorage(): void {
    try {
      const cacheData: TranslationCache = {}
      const now = Date.now()
      
      Object.entries(this.cache).forEach(([key, result]) => {
        if (this.cacheExpiry.get(key) && this.cacheExpiry.get(key)! > now) {
          cacheData[key] = result
        }
      })
      
      localStorage.setItem('voice-assistant-translation-cache', JSON.stringify(cacheData))
    } catch (error) {
      console.warn('保存翻译缓存失败:', error)
    }
  }

  private getCacheKey(text: string, from: string, to: string, provider: string): string {
    return `${provider}:${from}->${to}:${text.toLowerCase().trim()}`
  }

  private getCachedResult(text: string, from: string, to: string, provider: string): TranslationResult | null {
    const key = this.getCacheKey(text, from, to, provider)
    const expiry = this.cacheExpiry.get(key)
    
    if (expiry && expiry > Date.now() && this.cache[key]) {
      return this.cache[key]
    }
    
    return null
  }

  private setCachedResult(text: string, from: string, to: string, provider: string, result: TranslationResult): void {
    const key = this.getCacheKey(text, from, to, provider)
    const expiry = Date.now() + this.CACHE_DURATION
    
    this.cache[key] = result
    this.cacheExpiry.set(key, expiry)
    
    // 定期保存到localStorage
    if (Object.keys(this.cache).length % 10 === 0) {
      this.saveCacheToStorage()
    }
  }

  private cleanExpiredCache(): void {
    const now = Date.now()
    Object.keys(this.cache).forEach(key => {
      const expiry = this.cacheExpiry.get(key)
      if (!expiry || expiry <= now) {
        delete this.cache[key]
        this.cacheExpiry.delete(key)
      }
    })
  }

  public async translate(
    text: string, 
    options: TranslationOptions
  ): Promise<TranslationResult> {
    if (!text.trim()) {
      throw new Error('翻译文本不能为空')
    }

    const from = options.from || 'auto'
    const to = options.to
    const provider = options.provider || 'mymemory'
    
    // 检查缓存
    const cached = this.getCachedResult(text, from, to, provider)
    if (cached) {
      return cached
    }

    try {
      let result: TranslationResult
      
      switch (provider) {
        case 'mymemory':
          result = await this.translateWithMyMemory(text, from, to)
          break
        case 'libre':
          result = await this.translateWithLibre(text, from, to)
          break
        default:
          throw new Error(`不支持的翻译服务: ${provider}`)
      }

      if (options.cache !== false) {
        this.setCachedResult(text, from, to, provider, result)
      }

      return result
    } catch (error) {
      throw new Error(`翻译失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private async translateWithMyMemory(text: string, from: string, to: string): Promise<TranslationResult> {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.responseStatus !== 200) {
      throw new Error(data.responseDetails || '翻译服务响应错误')
    }

    const translatedText = data.responseData?.translatedText
    if (!translatedText) {
      throw new Error('翻译结果为空')
    }

    return {
      translatedText,
      sourceLanguage: from,
      targetLanguage: to,
      provider: 'mymemory'
    }
  }

  private async translateWithLibre(text: string, from: string, to: string): Promise<TranslationResult> {
    const url = 'https://libretranslate.de/translate'
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: from === 'auto' ? 'auto' : from,
        target: to,
        format: 'text'
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    
    if (data.error) {
      throw new Error(data.error)
    }

    const translatedText = data.translatedText
    if (!translatedText) {
      throw new Error('翻译结果为空')
    }

    return {
      translatedText,
      sourceLanguage: from,
      targetLanguage: to,
      provider: 'libre'
    }
  }

  public getSupportedLanguages(): string[] {
    return [
      'zh-CN', // 中文(简体)
      'en',    // 英语
      'ja',    // 日语
      'ko',    // 韩语
      'es',    // 西班牙语
      'fr',    // 法语
      'de',    // 德语
      'it',    // 意大利语
      'pt',    // 葡萄牙语
      'ru',    // 俄语
      'ar',    // 阿拉伯语
      'hi',    // 印地语
      'th',    // 泰语
      'vi',    // 越南语
      'auto'   // 自动检测
    ]
  }

  public getLanguageName(langCode: string): string {
    const languageNames: Record<string, string> = {
      'zh-CN': '中文(简体)',
      'en': 'English',
      'ja': '日本語',
      'ko': '한국어',
      'es': 'Español',
      'fr': 'Français',
      'de': 'Deutsch',
      'it': 'Italiano',
      'pt': 'Português',
      'ru': 'Русский',
      'ar': 'العربية',
      'hi': 'हिन्दी',
      'th': 'ไทย',
      'vi': 'Tiếng Việt',
      'auto': '自动检测'
    }
    return languageNames[langCode] || langCode
  }

  public getProviderName(provider: string): string {
    const providerNames: Record<string, string> = {
      'mymemory': 'MyMemory',
      'libre': 'LibreTranslate'
    }
    return providerNames[provider] || provider
  }

  public clearCache(): void {
    this.cache = {}
    this.cacheExpiry.clear()
    try {
      localStorage.removeItem('voice-assistant-translation-cache')
    } catch (error) {
      console.warn('清理缓存失败:', error)
    }
  }

  public getCacheSize(): number {
    this.cleanExpiredCache()
    return Object.keys(this.cache).length
  }

  public debug(): void {
    this.cleanExpiredCache()
    console.log('Translation Service Debug Info:')
    console.log('- Supported languages:', this.getSupportedLanguages())
    console.log('- Cache size:', this.getCacheSize())
    console.log('- Available providers:', ['mymemory', 'libre'])
    
    console.log('- Cached translations:')
    Object.entries(this.cache).forEach(([key, result]) => {
      console.log(`  - ${key}: "${result.translatedText}"`)
    })
  }
}

export const translationService = new TranslationService()