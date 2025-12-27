import { useState, useEffect } from 'react'
import type { StoredRoute, RouteHistoryFilters } from '../types'
import { routeStorageService } from '../services/routeStorageService'

interface RouteHistoryProps {
  onRouteSelect: (route: StoredRoute) => void
  onClose: () => void
  showScheduledOnly?: boolean
}

type FilterStatus = 'all' | 'revealed' | 'scheduled'

export function RouteHistory({ onRouteSelect, onClose, showScheduledOnly = false }: RouteHistoryProps) {
  const [routes, setRoutes] = useState<StoredRoute[]>([])
  const [filteredRoutes, setFilteredRoutes] = useState<StoredRoute[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>(showScheduledOnly ? 'scheduled' : 'all')
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    loadRoutes()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [routes, filterStatus, searchQuery])

  const loadRoutes = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = filterStatus === 'scheduled' 
        ? await routeStorageService.getScheduled()
        : await routeStorageService.getHistory()
      
      setRoutes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载历史记录失败')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = routes

    if (filterStatus !== 'all') {
      filtered = filtered.filter(route => route.status === filterStatus)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(route =>
        route.title.toLowerCase().includes(query) ||
        route.description.toLowerCase().includes(query) ||
        route.theme.toLowerCase().includes(query)
      )
    }

    setFilteredRoutes(filtered)
  }

  const handleDeleteRoute = async (routeId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    if (!confirm('确定要删除这条路线吗？此操作无法撤销。')) {
      return
    }

    try {
      setDeletingId(routeId)
      await routeStorageService.deleteRoute(routeId)
      await loadRoutes()
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: 'revealed' | 'scheduled') => {
    return status === 'scheduled' ? 'from-blue-400 to-cyan-400' : 'from-amber-400 to-orange-400'
  }

  const getStatusText = (status: 'revealed' | 'scheduled') => {
    return status === 'scheduled' ? '稍后安排' : '已揭晓'
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 mx-auto border-4 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
          <p className="text-slate-300 text-lg">加载历史记录中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-6xl w-full max-h-[90vh] overflow-hidden bg-white/5 backdrop-blur-xl border border-amber-400/20 rounded-3xl">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-amber-400/20">
            <div className="space-y-2">
              <h2 className="text-3xl font-display font-bold bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
                {showScheduledOnly ? '稍后安排' : '历史记录'}
              </h2>
              <p className="text-slate-400">
                {showScheduledOnly ? '管理您的稍后安排路线' : '查看您所有的旅行惊喜'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-amber-400/20 hover:border-amber-400/40 transition-all duration-300 flex items-center justify-center"
            >
              <span className="text-2xl text-slate-300">✕</span>
            </button>
          </div>

          <div className="p-6 border-b border-amber-400/20">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="搜索路线标题、描述或主题..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-amber-400/20 rounded-xl text-white placeholder-slate-400 focus:border-amber-400/40 focus:outline-none transition-colors"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                    🔍
                  </div>
                </div>
              </div>
              
              {!showScheduledOnly && (
                <div className="flex gap-2">
                  {(['all', 'revealed', 'scheduled'] as FilterStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                        filterStatus === status
                          ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-white'
                          : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-amber-400/20 hover:border-amber-400/40'
                      }`}
                    >
                      {status === 'all' ? '全部' : status === 'revealed' ? '已揭晓' : '稍后安排'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400">{error}</p>
              </div>
            )}

            {filteredRoutes.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-semibold text-slate-300 mb-2">
                  {showScheduledOnly ? '暂无稍后安排的路线' : '暂无历史记录'}
                </h3>
                <p className="text-slate-400">
                  {showScheduledOnly 
                    ? '您还没有保存任何稍后安排的路线'
                    : '开始您的旅行盲盒之旅，创造美好的回忆'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredRoutes.map((route) => (
                  <div
                    key={route.id}
                    onClick={() => onRouteSelect(route)}
                    className="group cursor-pointer bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl border border-amber-400/20 hover:border-amber-400/40 rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/10"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-display font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-2">
                            {route.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getStatusColor(route.status)} text-white`}>
                              {getStatusText(route.status)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteRoute(route.id, e)}
                          disabled={deletingId === route.id}
                          className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-300 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100"
                        >
                          {deletingId === route.id ? (
                            <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                          ) : (
                            <span className="text-sm">🗑️</span>
                          )}
                        </button>
                      </div>

                      <p className="text-slate-300 text-sm line-clamp-3 leading-relaxed">
                        {route.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                          <span>⏱️</span>
                          <span>{route.duration}天</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>💰</span>
                          <span>¥{route.totalCost.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>🎨</span>
                          <span>{route.theme}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-amber-400">精彩亮点</h4>
                        <div className="space-y-1">
                          {route.highlights.slice(0, 2).map((highlight, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-1 h-1 bg-amber-400 rounded-full mt-2 flex-shrink-0" />
                              <span className="text-xs text-slate-400 line-clamp-1">{highlight}</span>
                            </div>
                          ))}
                          {route.highlights.length > 2 && (
                            <div className="text-xs text-slate-500">
                              还有 {route.highlights.length - 2} 个亮点...
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-700/50">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>保存于 {formatDate(route.savedAt)}</span>
                          <span className="text-amber-400 group-hover:text-amber-300">点击查看详情 →</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}