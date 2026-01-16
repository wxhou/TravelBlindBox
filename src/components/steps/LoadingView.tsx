import React from 'react'

interface LoadingViewProps {
  logs: string[]
}

export function LoadingView({ logs }: LoadingViewProps) {
  return (
    <div className="text-center py-8 space-y-4">
      <div className="relative w-28 h-28 mx-auto">
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 animate-ping opacity-20" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-5xl animate-bounce">🎁</div>
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center animate-ping">
          <div className="w-3 h-3 bg-white rounded-full" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <h3 className="text-2xl font-display font-bold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
            正在为您精心准备
          </h3>
          <p className="text-lg text-orange-200/90 font-light">
            您的专属旅行惊喜
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-slate-300/90 font-body leading-relaxed text-sm">
            我们的旅行专家正在根据您的偏好
          </p>
          <p className="text-slate-400/80 font-body text-xs">
            精心策划一段难忘的旅程
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 pt-2">
          <div className="flex items-center gap-2 text-amber-400/80">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium">个性化定制</span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <div className="flex items-center gap-2 text-orange-400/80">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
            <span className="text-sm font-medium">惊喜准备中</span>
          </div>
        </div>
      </div>

      {logs.length > 0 && (
        <div className="mt-4 p-4 bg-black/20 backdrop-blur-sm border border-white/5 rounded-xl max-h-32 overflow-y-auto mx-auto max-w-md">
          <h4 className="text-sm font-display font-semibold text-cyan-400 mb-2">🔮 生成日志</h4>
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div key={index} className="text-xs text-slate-300/80 font-body">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
