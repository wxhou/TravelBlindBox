import { useState, useEffect } from 'react'
import type { TravelParams } from '../types'
import { useGeolocation } from '../hooks/useGeolocation'
import { getUnifiedAmapService } from '../services/unifiedAmapService'
import { isMcpEnabled } from '../services/serviceConfig'
import { RouteHistory } from './RouteHistory'
import { VoiceAssistantUI } from './VoiceAssistantUI'
import { Clock, Mic } from 'lucide-react'
import {
  Step0Welcome,
  Step1Destination,
  Step2Budget,
  Step3Details,
  Step4Ready,
  StepIndicator,
  StepNavigation,
  LoadingView
} from './steps'

interface TravelBlindBoxProps {
  onGenerateRoutes: (params: TravelParams) => Promise<void>
  loading: boolean
  logs: string[]
}

const TOTAL_STEPS = 5

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

  const handlePreferenceChange = (field: keyof TravelParams, value: string | number) => {
    setPreferences(prev => ({ ...prev, [field]: value }))
  }

  const handleNextStep = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      onGenerateRoutes(preferences)
    }
  }

  const handleViewHistory = () => setShowHistory(true)
  const handleHistoryClose = () => setShowHistory(false)
  const handleHistoryRouteSelect = () => setShowHistory(false)
  const handleVoiceAssistantToggle = () => setShowVoiceAssistant(!showVoiceAssistant)
  const handleVoiceAssistantClose = () => setShowVoiceAssistant(false)

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Step0Welcome onNext={handleNextStep} />
      case 1:
        return <Step1Destination preferences={preferences} onPreferenceChange={handlePreferenceChange} />
      case 2:
        return <Step2Budget preferences={preferences} onPreferenceChange={handlePreferenceChange} />
      case 3:
        return (
          <Step3Details
            preferences={preferences}
            onPreferenceChange={handlePreferenceChange}
            locationLoading={locationLoading}
            detectedCity={detectedCity}
            isAutoLocated={isAutoLocated}
            locationError={locationError}
            onRetryLocation={retryLocation}
          />
        )
      case 4:
        return <Step4Ready onNext={handleNextStep} />
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
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl">
        {/* Header Buttons */}
        <div className="flex justify-between items-center mb-4">
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

        {/* Main Content */}
        {!loading && (
          <div className="mb-4">
            <StepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />
            {renderStep()}
            <StepNavigation
              currentStep={currentStep}
              totalSteps={TOTAL_STEPS}
              onStepChange={setCurrentStep}
              onNext={handleNextStep}
            />
          </div>
        )}

        {loading && <LoadingView logs={logs} />}

        {/* API Mode Selection */}
        <div className="mt-4 p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg">
          <div className="flex items-center justify-between mb-2">
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

          <div className="mt-2 text-xs text-slate-400/80">
            {searchMethod === 'rest'
              ? '使用高德地图REST API调用方式'
              : mcpConnected
              ? '使用MCP Hook调用方式'
              : 'MCP未连接，无法使用此模式'}
          </div>
        </div>
      </div>

      {/* Voice Assistant Modal */}
      <VoiceAssistantUI
        isVisible={showVoiceAssistant}
        onClose={handleVoiceAssistantClose}
      />
    </div>
  )
}
