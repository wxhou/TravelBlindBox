import React from 'react'

interface LoadingViewProps {
  logs: string[]
}

export function LoadingView({ logs }: LoadingViewProps) {
  return (
    <div className="text-center py-6 space-y-4 min-h-[320px] flex flex-col justify-center relative">
      {/* 渐变网格背景 */}
      <div className="gradient-mesh absolute inset-0 opacity-50" />

      <div className="relative w-24 h-24 mx-auto flex-shrink-0">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 animate-ping opacity-20" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-4xl animate-bounce">🎁</div>
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center animate-ping">
          <div className="w-2 h-2 bg-white rounded-full" />
        </div>
      </div>

      <div className="space-y-2 flex-shrink-0">
        <div className="space-y-1">
          <h3 className="text-xl title-elegant bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
            正在为您精心准备
          </h3>
          <p className="text-base text-orange-200/90 font-light italic">
            您的专属旅行惊喜
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-slate-300/90 text-premium text-sm">
            我们的旅行专家正在根据您的偏好
          </p>
          <p className="text-slate-400/80 text-premium text-xs">
            精心策划一段难忘的旅程
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 pt-1">
          <div className="flex items-center gap-2 text-amber-400/80">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-xs font-medium tracking-wide">个性化定制</span>
          </div>
          <div className="w-px h-3 bg-white/20" />
          <div className="flex items-center gap-2 text-orange-400/80">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            <span className="text-xs font-medium tracking-wide">惊喜准备中</span>
          </div>
        </div>
      </div>

      {logs.length > 0 && (
        <div className="mt-2 p-3 bg-black/20 backdrop-blur-sm border border-white/5 rounded-xl max-h-24 overflow-y-auto mx-auto max-w-xs flex-shrink-0">
          <h4 className="text-xs title-subtle text-cyan-400 mb-1">🔮 生成日志</h4>
          <div className="space-y-0.5">
            {logs.slice(-5).map((log, index) => (
              <div key={index} className="text-xs text-slate-300/80 text-premium truncate">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
