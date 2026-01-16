import React from 'react'
import type { TravelParams } from '../../types'

interface Step1DestinationProps {
  preferences: TravelParams
  onPreferenceChange: (field: keyof TravelParams, value: string | number) => void
}

const DESTINATIONS = [
  { emoji: '🗺️', title: '神秘冒险', desc: '意想不到的惊喜之旅' },
  { emoji: '🏖️', title: '热带天堂', desc: '阳光沙滩的慢时光' },
  { emoji: '🏔️', title: '雪山秘境', desc: '纯净天地的宁静体验' },
  { emoji: '🌃', title: '都市奇遇', desc: '繁华城市的隐藏角落' },
  { emoji: '🏛️', title: '文化古迹', desc: '历史传承的深度探索' },
  { emoji: '🌌', title: '星空浪漫', desc: '满天繁星的梦幻夜晚' }
]

export function Step1Destination({ preferences, onPreferenceChange }: Step1DestinationProps) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-display font-bold text-white">您渴望什么样的旅行体验？</h3>
        <p className="text-slate-300/80 font-body text-sm">每一种风格都代表着一种独特的心情和期待</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {DESTINATIONS.map((destination, index) => (
          <button
            key={index}
            onClick={() => onPreferenceChange('destinationPreference', destination.title)}
            className={`p-3 rounded-lg backdrop-blur-sm border transition-all duration-300 hover:scale-105 group ${
              preferences.destinationPreference === destination.title
                ? 'bg-gradient-to-r from-amber-400/20 to-orange-400/20 border-amber-400/50 shadow-lg shadow-amber-400/20'
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">{destination.emoji}</div>
              <div className="text-sm font-medium text-white">{destination.title}</div>
              <div className="text-xs text-slate-400/80 font-light">{destination.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
