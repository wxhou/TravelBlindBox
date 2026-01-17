import React from 'react'
import { Sparkles } from 'lucide-react'

interface Step0WelcomeProps {
  onNext: () => void
  onStartQuiz?: () => void
  hasStyleResult?: boolean
}

export function Step0Welcome({ onNext, onStartQuiz, hasStyleResult }: Step0WelcomeProps) {
  return (
    <div className="text-center space-y-4">
      <div className="relative">
        <div
          className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-amber-400/30 via-orange-400/30 to-red-400/30 backdrop-blur-xl border border-white/20 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:scale-105 transition-all duration-500 shadow-xl shadow-amber-500/30"
          onClick={onNext}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/20 via-orange-400/20 to-red-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-amber-400/40 via-orange-400/40 to-red-400/40 animate-pulse" />
          <div className="relative z-10 text-5xl animate-bounce">🎁</div>
          <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center animate-ping">
            <div className="w-3 h-3 bg-white rounded-full" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <h3 className="text-2xl font-display font-bold bg-gradient-to-r from-amber-300 via-orange-200 to-red-300 bg-clip-text text-transparent">
            您的专属旅行盲盒
          </h3>
          <p className="text-lg text-orange-200/90 font-light">
            即将为您精心准备一份意想不到的惊喜
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-slate-300/90 font-body leading-relaxed text-sm">
            每一段旅程都承载着美好的期待
          </p>
          <p className="text-slate-400/80 font-body text-xs">
            让我们一起开启这场充满惊喜的探索之旅
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 pt-2">
          <div className="flex items-center gap-2 text-amber-400/80">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium">精选体验</span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-2 text-orange-400/80">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium">专属定制</span>
          </div>
        </div>
      </div>

      {/* 风格测试按钮 */}
      {onStartQuiz && (
        <button
          onClick={onStartQuiz}
          className={`mt-4 px-6 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 mx-auto transition-all ${
            hasStyleResult
              ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/30'
              : 'bg-gradient-to-r from-cyan-400/20 to-pink-400/20 hover:from-cyan-400/30 hover:to-pink-400/30 text-white border border-white/20'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          {hasStyleResult ? '已发现您的风格，继续' : '发现您的旅行风格'}
        </button>
      )}
    </div>
  )
}
