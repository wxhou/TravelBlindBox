import React from 'react'

interface Step4ReadyProps {
  onNext: () => void
}

export function Step4Ready({ onNext }: Step4ReadyProps) {
  return (
    <div className="text-center space-y-4">
      <div className="relative">
        <div
          className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-amber-400/30 via-orange-400/30 to-red-400/30 backdrop-blur-xl border border-white/20 flex items-center justify-center relative overflow-hidden group cursor-pointer hover:scale-105 transition-all duration-500 shadow-xl shadow-amber-500/30"
          onClick={onNext}
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400/20 via-orange-400/20 to-red-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-amber-400/40 via-orange-400/40 to-red-400/40 animate-pulse" />
          <div className="relative z-10 text-5xl animate-bounce">✨</div>
          <div className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 rounded-full flex items-center justify-center animate-ping">
            <div className="w-3 h-3 bg-white rounded-full" />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <h3 className="text-2xl font-display font-bold bg-gradient-to-r from-amber-300 via-orange-200 to-red-300 bg-clip-text text-transparent">
            一切准备就绪
          </h3>
          <p className="text-lg text-orange-200/90 font-light">
            您的专属旅行盲盒即将开启
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-slate-300/90 font-body leading-relaxed text-sm">
            基于您的偏好，我们将为您精心挑选
          </p>
          <p className="text-slate-400/80 font-body text-xs">
            一份独一无二的旅行体验
          </p>
        </div>

        <div className="pt-2">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-amber-400/20 to-orange-400/20 backdrop-blur-sm border border-amber-400/30 rounded-full">
            <div className="w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-amber-400 font-medium text-sm">正在准备您的惊喜</span>
            <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
