import { useState, useEffect, useRef } from 'react'
import { voiceAssistantService, type VoiceAssistantEvent } from '../services/voiceAssistantService'
import { Mic, MicOff, Volume2, Languages, Settings, HelpCircle, X, Play, Square } from 'lucide-react'

interface VoiceAssistantUIProps {
  isVisible: boolean
  onClose: () => void
}

export function VoiceAssistantUI({ isVisible, onClose }: VoiceAssistantUIProps) {
  const [state, setState] = useState(voiceAssistantService.getState())
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [recognizedText, setRecognizedText] = useState('')
  const [translationResult, setTranslationResult] = useState<{original: string, translated: string} | null>(null)
  const [conversationHistory, setConversationHistory] = useState<string[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [currentLanguage, setCurrentLanguage] = useState(state.currentLanguage)
  const [translationEnabled, setTranslationEnabled] = useState(state.translationEnabled)
  const [translationTarget, setTranslationTarget] = useState(state.translationTarget)

  useEffect(() => {
    if (!isVisible) return

    // 语音识别事件
    const handleListeningStarted = () => {
      setIsListening(true)
      setRecognizedText('')
    }

    const handleListeningStopped = () => {
      setIsListening(false)
    }

    const handleSpeechRecognized = (event: any) => {
      setRecognizedText(event.text)
      if (event.isFinal) {
        // 添加到对话历史
        setConversationHistory(prev => [...prev.slice(-9), `您: ${event.text}`])
      }
    }

    const handleTranslationCompleted = (event: any) => {
      setTranslationResult({ original: event.original, translated: event.translated })
      setConversationHistory(prev => [...prev.slice(-9), `翻译: ${event.translated}`])
    }

    const handleResponseGenerated = (event: any) => {
      setConversationHistory(prev => [...prev.slice(-9), `助手: ${event.text}`])
    }

    const handleSpeechStarted = () => {
      setIsSpeaking(true)
    }

    const handleSpeechCompleted = () => {
      setIsSpeaking(false)
    }

    const handleError = (event: any) => {
      console.error('语音助手错误:', event.error)
      setConversationHistory(prev => [...prev.slice(-9), `错误: ${event.error.message}`])
    }

    const handleCommandRecognized = (event: any) => {
      setConversationHistory(prev => [...prev.slice(-9), `命令: ${event.action}`])
    }

    // 注册事件监听器
    voiceAssistantService.on('listening-started', handleListeningStarted)
    voiceAssistantService.on('listening-stopped', handleListeningStopped)
    voiceAssistantService.on('speech-recognized', handleSpeechRecognized)
    voiceAssistantService.on('translation-completed', handleTranslationCompleted)
    voiceAssistantService.on('response-generated', handleResponseGenerated)
    voiceAssistantService.on('speech-started', handleSpeechStarted)
    voiceAssistantService.on('speech-completed', handleSpeechCompleted)
    voiceAssistantService.on('error', handleError)
    voiceAssistantService.on('command-recognized', handleCommandRecognized)

    // 定期更新状态
    const stateInterval = setInterval(() => {
      setState(voiceAssistantService.getState())
    }, 1000)

    return () => {
      voiceAssistantService.off('listening-started', handleListeningStarted)
      voiceAssistantService.off('listening-stopped', handleListeningStopped)
      voiceAssistantService.off('speech-recognized', handleSpeechRecognized)
      voiceAssistantService.off('translation-completed', handleTranslationCompleted)
      voiceAssistantService.off('response-generated', handleResponseGenerated)
      voiceAssistantService.off('speech-started', handleSpeechStarted)
      voiceAssistantService.off('speech-completed', handleSpeechCompleted)
      voiceAssistantService.off('error', handleError)
      voiceAssistantService.off('command-recognized', handleCommandRecognized)
      clearInterval(stateInterval)
    }
  }, [isVisible])

  const handleStartListening = async () => {
    try {
      await voiceAssistantService.startListening()
    } catch (error: any) {
      console.error('启动语音识别失败:', error)
      
      // 检查是否是权限问题
      if (error.message.includes('权限') || error.message.includes('麦克风')) {
        setConversationHistory(prev => [...prev.slice(-9), `权限问题: ${error.message}`])
        setConversationHistory(prev => [...prev.slice(-8), '请在浏览器设置中允许访问麦克风'])
      } else {
        setConversationHistory(prev => [...prev.slice(-9), `错误: ${error.message}`])
      }
    }
  }

  const handleStopListening = () => {
    voiceAssistantService.stopListening()
  }

  const handleLanguageChange = (lang: string) => {
    setCurrentLanguage(lang)
    voiceAssistantService.setLanguage(lang)
  }

  const handleTranslationToggle = () => {
    const newState = !translationEnabled
    setTranslationEnabled(newState)
    voiceAssistantService.setTranslationEnabled(newState)
  }

  const handleTranslationTargetChange = (target: string) => {
    setTranslationTarget(target)
    voiceAssistantService.setTranslationTarget(target)
  }

  const handlePlay = async () => {
    if (recognizedText) {
      await voiceAssistantService.speak(recognizedText)
    }
  }

  const handleStopSpeaking = () => {
    voiceAssistantService.stopListening()
  }

  const handleClearHistory = () => {
    setConversationHistory([])
    setRecognizedText('')
    setTranslationResult(null)
  }

  if (!isVisible) return null

  const supportedLanguages = voiceAssistantService.getSupportedLanguages()
  const languageNames: Record<string, string> = {
    'zh-CN': '中文',
    'en-US': 'English',
    'ja-JP': '日本語',
    'ko-KR': '한국어'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-pink-400 rounded-full flex items-center justify-center">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">智能语音助手</h3>
              <p className="text-sm text-slate-400">
                {isListening ? '正在听取...' : 
                 isSpeaking ? '正在播放...' :
                 '点击麦克风开始对话'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="帮助"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="设置"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="p-6 space-y-6">
          {/* 语音状态指示器 */}
          <div className="flex items-center justify-center">
            <div className="relative">
              {/* 语音波形动画 */}
              {isListening && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-cyan-400 rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 20 + 10}px`,
                          animationDelay: `${i * 0.1}s`,
                          animationDuration: '0.8s'
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* 主按钮 */}
              <button
                onClick={isListening ? handleStopListening : handleStartListening}
                disabled={isSpeaking}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isListening 
                    ? 'bg-gradient-to-r from-red-400 to-pink-400 hover:from-red-500 hover:to-pink-500 shadow-lg shadow-red-400/30'
                    : isSpeaking
                    ? 'bg-slate-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-cyan-400 to-pink-400 hover:from-cyan-500 hover:to-pink-500 shadow-lg shadow-cyan-400/30 hover:scale-105'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-8 h-8 text-white" />
                ) : (
                  <Mic className="w-8 h-8 text-white" />
                )}
              </button>
            </div>
          </div>

          {/* 识别文本显示 */}
          {recognizedText && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm text-slate-400">识别到的内容:</span>
                <div className="flex gap-2">
                  <button
                    onClick={handlePlay}
                    className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                    title="播放"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleStopSpeaking}
                    className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                    title="停止"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-white">{recognizedText}</p>
              
              {/* 翻译结果 */}
              {translationResult && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Languages className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-400">翻译结果:</span>
                  </div>
                  <p className="text-cyan-300">{translationResult.translated}</p>
                </div>
              )}
            </div>
          )}

          {/* 对话历史 */}
          {conversationHistory.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">对话历史:</span>
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  清空
                </button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {conversationHistory.map((message, index) => (
                  <div key={index} className="text-sm text-slate-300">
                    {message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 设置面板 */}
          {showSettings && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 space-y-4">
              <h4 className="text-sm font-medium text-white">语音设置</h4>
              
              {/* 语言选择 */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">识别语言:</label>
                <select
                  value={currentLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-cyan-400/50 focus:outline-none"
                >
                  {supportedLanguages.map(lang => (
                    <option key={lang} value={lang} className="bg-slate-800">
                      {languageNames[lang] || lang}
                    </option>
                  ))}
                </select>
              </div>

              {/* 翻译开关 */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">启用翻译:</span>
                <button
                  onClick={handleTranslationToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    translationEnabled ? 'bg-cyan-400' : 'bg-slate-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      translationEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* 翻译目标语言 */}
              {translationEnabled && (
                <div>
                  <label className="block text-sm text-slate-400 mb-2">翻译为:</label>
                  <select
                    value={translationTarget}
                    onChange={(e) => handleTranslationTargetChange(e.target.value)}
                    className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:border-cyan-400/50 focus:outline-none"
                  >
                    <option value="en" className="bg-slate-800">English</option>
                    <option value="ja" className="bg-slate-800">日本語</option>
                    <option value="ko" className="bg-slate-800">한국어</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* 帮助面板 */}
          {showHelp && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
              <h4 className="text-sm font-medium text-white mb-3">语音命令帮助</h4>
              <div className="space-y-2 text-xs text-slate-400">
                <div><strong className="text-slate-300">导航命令:</strong> "下一条路线"、"返回上一页"</div>
                <div><strong className="text-slate-300">播放控制:</strong> "播放"、"暂停"、"停止"</div>
                <div><strong className="text-slate-300">设置控制:</strong> "切换语言"、"开启翻译"</div>
                <div><strong className="text-slate-300">旅行咨询:</strong> 可以询问景点、美食、住宿等问题</div>
              </div>
            </div>
          )}
        </div>

        {/* 底部状态栏 */}
        <div className="px-6 py-3 border-t border-white/10 bg-white/5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span>语言: {languageNames[currentLanguage] || currentLanguage}</span>
              {translationEnabled && (
                <span className="flex items-center gap-1">
                  <Languages className="w-3 h-3" />
                  翻译: {languageNames[translationTarget] || translationTarget}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isSpeaking && (
                <div className="flex items-center gap-1">
                  <Volume2 className="w-3 h-3" />
                  <span>正在播放</span>
                </div>
              )}
              {isListening && (
                <div className="flex items-center gap-1">
                  <Mic className="w-3 h-3" />
                  <span>正在听取</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}