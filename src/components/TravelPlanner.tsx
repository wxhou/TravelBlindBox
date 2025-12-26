import { useState, useEffect } from 'react'
import { Range } from 'react-range'
import { Calendar, DollarSign, MapPin, Clock, Plane, Car, Train, Bus, Sparkles, Navigation, RefreshCw } from 'lucide-react'
import type { TravelParams } from '../types'
import { DESTINATION_PREFERENCES, TRANSPORTATION_OPTIONS, DURATION_OPTIONS } from '../constants'
import { useGeolocation } from '../hooks/useGeolocation'

interface TravelPlannerProps {
  onGenerateRoutes: (params: TravelParams) => void
  loading: boolean
  logs: string[]
}

export function TravelPlanner({ onGenerateRoutes, loading, logs }: TravelPlannerProps) {
  const [params, setParams] = useState<TravelParams>({
    departureDate: '',
    departureCity: '',
    budgetMin: 2000,
    budgetMax: 6000,
    destinationPreference: '城市',
    duration: 5,
    transportation: '飞机'
  })

  const {
    city,
    loading: locationLoading,
    error: locationError,
    requestLocation,
    isSupported,
    isAutoLocated
  } = useGeolocation()

  useEffect(() => {
    if (city && !params.departureCity) {
      setParams(prev => ({ ...prev, departureCity: city }))
    }
  }, [city, params.departureCity])

  useEffect(() => {
    if (city && isAutoLocated && !params.departureCity) {
      setParams(prev => ({ ...prev, departureCity: city }))
    }
  }, [city, isAutoLocated, params.departureCity])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!params.departureDate) {
      alert('请选择出发日期')
      return
    }
    onGenerateRoutes(params)
  }



  const handleDurationChange = (durationIndex: number) => {
    setParams(prev => ({
      ...prev,
      duration: DURATION_OPTIONS[durationIndex].value
    }))
  }

  const getTransportationIcon = (transport: string) => {
    switch (transport) {
      case '飞机': return <Plane className="w-4 h-4" />
      case '火车': return <Train className="w-4 h-4" />
      case '自驾': return <Car className="w-4 h-4" />
      case '公交': return <Bus className="w-4 h-4" />
      default: return null
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Sparkles className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">旅行参数设置</h2>
          <p className="text-gray-600 text-sm">告诉我们您的旅行偏好，AI将为您规划完美路线</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Calendar className="w-4 h-4" />
              出发日期
            </label>
            <input
              type="date"
              value={params.departureDate}
              onChange={(e) => setParams(prev => ({ ...prev, departureDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Navigation className="w-4 h-4" />
              出发城市
            </label>
            <div className="relative">
              <input
                type="text"
                value={params.departureCity}
                onChange={(e) => setParams(prev => ({ ...prev, departureCity: e.target.value }))}
                placeholder="请输入出发城市"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                {locationLoading && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
                {isSupported && !locationLoading && (
                  <button
                    type="button"
                    onClick={requestLocation}
                    className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                    title="自动定位当前城市"
                  >
                    <Navigation className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            {locationError && (
              <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                <span>⚠️</span>
                {locationError}
              </p>
            )}
            {isAutoLocated && city && (
              <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                <span>✅</span>
                已自动定位到：{city}
              </p>
            )}
            {city && !locationError && (
              <p className="text-sm text-green-600 mt-1">已自动定位到：{city}</p>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <DollarSign className="w-4 h-4" />
              预算范围
            </label>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <BudgetRangeSlider
                min={500}
                max={10000}
                value={{ min: params.budgetMin, max: params.budgetMax }}
                onChange={(value) => setParams(prev => ({ ...prev, budgetMin: value.min, budgetMax: value.max }))}
              />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <MapPin className="w-4 h-4" />
              目的地偏好
            </label>
            <select
              value={params.destinationPreference}
              onChange={(e) => setParams(prev => ({
                ...prev,
                destinationPreference: e.target.value as TravelParams['destinationPreference']
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              {DESTINATION_PREFERENCES.map(pref => (
                <option key={pref} value={pref}>{pref}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Clock className="w-4 h-4" />
              旅行天数
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DURATION_OPTIONS.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDurationChange(index)}
                  className={`px-3 py-2 text-sm border rounded-lg transition-all duration-200 ${
                    params.duration === option.value
                      ? 'bg-blue-500 text-white border-blue-500 shadow-md scale-105'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-blue-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Plane className="w-4 h-4" />
            交通方式
          </label>
          <div className="flex flex-wrap gap-2">
            {TRANSPORTATION_OPTIONS.map(transport => (
              <button
                key={transport}
                type="button"
                onClick={() => setParams(prev => ({ ...prev, transportation: transport }))}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-all duration-200 ${
                  params.transportation === transport
                    ? 'bg-blue-500 text-white border-blue-500 shadow-md scale-105'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-blue-300'
                }`}
              >
                {getTransportationIcon(transport)}
                {transport}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                <span className="text-lg">AI正在生成路线...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span className="text-lg">生成旅行路线</span>
              </div>
            )}
          </button>

          {logs.length > 0 && (
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto">
              <h4 className="text-sm font-medium text-gray-700 mb-2">生成日志</h4>
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-xs text-gray-600 font-mono">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-3">
            基于您的偏好，AI将生成3条个性化旅行路线
          </p>
        </div>
      </form>
    </div>
  )
}

interface BudgetRangeSliderProps {
  min: number
  max: number
  value: { min: number; max: number }
  onChange: (value: { min: number; max: number }) => void
  step?: number
}

function BudgetRangeSlider({ min, max, value, onChange, step = 500 }: BudgetRangeSliderProps) {
  const formatValue = (val: number) => {
    if (val >= 10000) {
      return `${(val / 10000).toFixed(1)}万`
    }
    return val.toLocaleString()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-gray-600">
        <span>¥{formatValue(value.min)}</span>
        <span>¥{formatValue(value.max)}</span>
      </div>

      <Range
        step={step}
        min={min}
        max={max}
        values={[value.min, value.max]}
        onChange={(values) => onChange({ min: values[0], max: values[1] })}
        renderTrack={({ props, children }) => (
          <div
            {...props}
            className="w-full h-2 bg-gray-200 rounded-full"
            style={{
              ...props.style,
            }}
          >
            {children}
          </div>
        )}
        renderThumb={({ props, isDragged }) => (
          <div
            {...props}
            className={`w-5 h-5 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full border-2 border-white shadow-lg transform transition-transform ${
              isDragged ? 'scale-110' : ''
            }`}
            style={{
              ...props.style,
              outline: 'none',
            }}
          />
        )}
      />

      <div className="text-center text-sm text-gray-500">
        拖动滑块选择预算范围 (¥{min.toLocaleString()} - ¥{max.toLocaleString()})
      </div>
    </div>
  )
}