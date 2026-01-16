import React from 'react'
import type { TravelParams } from '../../types'

interface Step2BudgetProps {
  preferences: TravelParams
  onPreferenceChange: (field: keyof TravelParams, value: string | number) => void
}

export function Step2Budget({ preferences, onPreferenceChange }: Step2BudgetProps) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-display font-bold text-white">您的旅行预算期望</h3>
        <p className="text-slate-300/80 font-body text-sm">好的旅行不在于花费多少，而在于收获多少美好</p>
      </div>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-300 mb-2 font-body">最低预算 (元)</label>
            <input
              type="number"
              value={preferences.budgetMin}
              onChange={(e) => onPreferenceChange('budgetMin', Number(e.target.value))}
              className="w-full p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white font-body focus:border-cyan-400/50 focus:outline-none transition-colors"
              placeholder="1000"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2 font-body">最高预算 (元)</label>
            <input
              type="number"
              value={preferences.budgetMax}
              onChange={(e) => onPreferenceChange('budgetMax', Number(e.target.value))}
              className="w-full p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white font-body focus:border-cyan-400/50 focus:outline-none transition-colors"
              placeholder="5000"
            />
          </div>
        </div>
        <div className="p-4 bg-gradient-to-br from-amber-400/10 via-orange-400/10 to-red-400/10 backdrop-blur-sm border border-amber-400/20 rounded-lg shadow-lg">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-amber-400 mb-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span className="text-lg font-medium">您的旅行预算</span>
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
              ¥{preferences.budgetMin.toLocaleString()} - ¥{preferences.budgetMax.toLocaleString()}
            </div>
            <p className="text-xs text-slate-400/80 font-light">
              这个预算范围内，我们可以为您创造难忘的回忆
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
