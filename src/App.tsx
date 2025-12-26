import { useState } from 'react'
import type { TravelParams, TravelRoute } from './types'
import { TravelPlanner } from './components/TravelPlanner'
import { RouteDisplay } from './components/RouteDisplay'
import { generateTravelRoutes } from './services/travelService'

function App() {
  const [routes, setRoutes] = useState<TravelRoute[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
  }

  const handleGenerateRoutes = async (params: TravelParams) => {
    setLoading(true)
    setError('')
    setRoutes([])
    setLogs([])

    addLog('开始生成旅行路线...')
    addLog(`目的地偏好: ${params.destinationPreference}`)
    addLog(`预算范围: ${params.budgetMin}-${params.budgetMax}元`)
    addLog(`出行天数: ${params.duration}天`)
    addLog(`出发城市: ${params.departureCity}`)
    addLog(`出发日期: ${params.departureDate}`)
    addLog(`交通方式: ${params.transportation}`)
    addLog('正在连接AI服务...')

    try {
      const response = await generateTravelRoutes(params)
      if (response.success && response.data) {
        addLog(`✅ 成功生成${response.data.length}条旅行路线`)
        setRoutes(response.data)
      } else {
        addLog(`❌ 生成失败: ${response.error || '未知错误'}`)
        setError(response.error || '生成路线失败')
      }
    } catch (err) {
      addLog('❌ 网络错误，请重试')
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            智能旅行路线规划
          </h1>
          <p className="text-gray-600 text-lg">
            输入您的旅行偏好，AI为您生成个性化路线
          </p>
        </header>

        <main className="max-w-4xl mx-auto">
          <TravelPlanner
            onGenerateRoutes={handleGenerateRoutes}
            loading={loading}
            logs={logs}
          />

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {routes.length > 0 && (
            <RouteDisplay routes={routes} />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
