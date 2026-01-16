import React from 'react'
import type { TravelParams } from '../../types'

interface Step3DetailsProps {
  preferences: TravelParams
  onPreferenceChange: (field: keyof TravelParams, value: string | number) => void
  locationLoading: boolean
  detectedCity: string | null
  isAutoLocated: boolean
  locationError: string | null
  onRetryLocation: () => void
}

export function Step3Details({
  preferences,
  onPreferenceChange,
  locationLoading,
  detectedCity,
  isAutoLocated,
  locationError,
  onRetryLocation
}: Step3DetailsProps) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-display font-bold text-white">让我们了解更多细节</h3>
        <p className="text-slate-300/80 font-body text-sm">这些信息将帮助我们为您定制最完美的旅行体验</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-slate-300 mb-2 font-body">出行天数</label>
          <select
            value={preferences.duration}
            onChange={(e) => onPreferenceChange('duration', Number(e.target.value))}
            className="w-full p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white font-body focus:border-cyan-400/50 focus:outline-none transition-colors"
          >
            {[1, 2, 3, 4, 5, 6, 7].map(days => (
              <option key={days} value={days} className="bg-slate-800">{days} 天</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-2 font-body">出发城市</label>
          <div className="space-y-2">
            <input
              type="text"
              value={preferences.departureCity}
              onChange={(e) => onPreferenceChange('departureCity', e.target.value)}
              className="w-full p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white font-body focus:border-cyan-400/50 focus:outline-none transition-colors"
              placeholder="正在获取位置..."
              disabled={locationLoading}
            />
            <div className="flex items-center gap-2">
              {locationLoading ? (
                <div className="flex items-center gap-2 text-sm text-cyan-400 font-body">
                  <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span>正在获取您的位置...</span>
                </div>
              ) : detectedCity && isAutoLocated ? (
                <div className="flex items-center gap-2 text-sm text-green-400 font-body">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>当前位置: {detectedCity}</span>
                </div>
              ) : locationError ? (
                <div className="flex items-center gap-2 text-sm text-red-400 font-body">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{locationError}</span>
                </div>
              ) : null}
              <button
                onClick={onRetryLocation}
                disabled={locationLoading}
                className="px-3 py-1 text-xs bg-cyan-400/20 hover:bg-cyan-400/30 disabled:opacity-50 text-cyan-400 rounded-md font-body transition-colors"
              >
                {locationLoading ? '获取中...' : '使用我的位置'}
              </button>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-2 font-body">出发日期</label>
          <input
            type="date"
            value={preferences.departureDate}
            onChange={(e) => onPreferenceChange('departureDate', e.target.value)}
            className="w-full p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white font-body focus:border-cyan-400/50 focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-2 font-body">交通方式</label>
          <select
            value={preferences.transportation}
            onChange={(e) => onPreferenceChange('transportation', e.target.value)}
            className="w-full p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white font-body focus:border-cyan-400/50 focus:outline-none transition-colors"
          >
            <option value="飞机" className="bg-slate-800">✈️ 飞机</option>
            <option value="高铁" className="bg-slate-800">🚄 高铁</option>
            <option value="自驾" className="bg-slate-800">🚗 自驾</option>
            <option value="火车" className="bg-slate-800">🚂 火车</option>
          </select>
        </div>
      </div>
    </div>
  )
}
