import { useState } from 'react'
import { MapPin, Clock, DollarSign, Star, Calendar, Utensils, Bed, ImageIcon } from 'lucide-react'
import type { TravelRoute } from '../types'
import { MapVisualization } from './map/MapVisualization'

interface RouteDisplayProps {
  routes: TravelRoute[]
}

export function RouteDisplay({ routes }: RouteDisplayProps) {
  const [activeRoute, setActiveRoute] = useState<number>(0)

  return (
    <div className="mt-8 space-y-8">
      <div className="text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
        <div className="inline-flex items-center gap-3 bg-white rounded-full px-4 py-2 shadow-sm mb-4">
          <Star className="w-5 h-5 text-yellow-500 fill-current" />
          <span className="text-sm font-medium text-gray-700">AI智能推荐</span>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-3">为您推荐的旅行路线</h2>
        <p className="text-gray-600 text-lg">AI根据您的偏好生成了以下三条个性化路线供您选择</p>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto scrollbar-hide">
          {routes.map((route, index) => (
            <button
              key={route.id}
              onClick={() => setActiveRoute(index)}
              className={`flex-1 min-w-0 px-3 py-4 sm:px-4 text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap border-b-2 ${
                activeRoute === index
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-purple-500'
                  : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50 border-transparent'
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-1 sm:gap-2">
                <div className="flex items-center gap-1 sm:gap-2">
                  <MapPin className={`w-3 h-3 sm:w-4 sm:h-4 ${activeRoute === index ? 'text-white' : 'text-purple-500'}`} />
                  <span className="hidden xs:inline">路线 {index + 1}</span>
                  <span className="xs:hidden">{index + 1}</span>
                </div>
                <div className={`text-xs leading-tight text-center max-w-20 sm:max-w-none truncate ${activeRoute === index ? 'text-purple-100' : 'text-gray-500'}`}>
                  {route.title.length > 8 ? route.title.substring(0, 8) + '...' : route.title}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="relative overflow-hidden">
          {routes.map((route, index) => (
            <div
              key={route.id}
              className={`transition-all duration-500 ease-in-out ${
                activeRoute === index
                  ? 'opacity-100 transform translate-x-0'
                  : 'opacity-0 transform translate-x-full absolute inset-0'
              }`}
            >
              <RouteCard route={route} index={index + 1} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface RouteCardProps {
  route: TravelRoute
  index: number
}

function RouteCard({ route, index }: RouteCardProps) {
  const [activeTab, setActiveTab] = useState<number>(1)

  return (
    <div className="bg-white overflow-hidden">
      <div className="relative">
        {route.coverImageUrl && (
          <div className="h-48 sm:h-64 bg-gray-200 rounded-t-2xl overflow-hidden">
            <img
              src={route.coverImageUrl}
              alt={route.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          </div>
        )}

        <div className={`bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 sm:p-6 lg:p-8 text-white relative overflow-hidden ${route.coverImageUrl ? 'rounded-b-2xl' : 'rounded-2xl'}`}>
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 rounded-full p-2">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold">路线 {index}</h3>
                  <p className="text-purple-100 text-sm">AI智能推荐</p>
                </div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-full px-3 py-1 self-start">
                <span className="text-sm font-medium">{route.theme}</span>
              </div>
            </div>

            <h4 className="text-lg sm:text-xl font-semibold mb-2">{route.title}</h4>
            <p className="text-purple-100 mb-4 leading-relaxed text-sm sm:text-base">{route.description}</p>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-base sm:text-lg font-bold">¥{route.totalCost.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-base sm:text-lg">{route.duration}天</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 animate-slide-in-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-500 rounded-full p-2 animate-pulse">
                <Star className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-bold text-gray-800">路线亮点</h4>
            </div>
            <ul className="space-y-3">
              {route.highlights.map((highlight, idx) => (
                <li key={idx} className={`flex items-start text-gray-700 animate-fade-in-up animate-delay-${(idx + 1) * 100}`}>
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="leading-relaxed">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 animate-slide-in-right">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-500 rounded-full p-2 animate-pulse">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-bold text-gray-800">行程概况</h4>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">旅行天数</span>
                </div>
                <span className="font-bold text-gray-800">{route.duration}天</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">预估费用</span>
                </div>
                <span className="font-bold text-gray-800">¥{route.totalCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">路线主题</span>
                </div>
                <span className="font-bold text-gray-800">{route.theme}</span>
              </div>
            </div>
          </div>
        </div>

        {route.pois && (route.pois.attractions?.length || route.pois.hotels?.length || route.pois.restaurants?.length) && (
          <div className="mb-6 md:mb-8">
            <MapVisualization
              pois={[
                ...(route.pois.attractions || []),
                ...(route.pois.hotels || []),
                ...(route.pois.restaurants || [])
              ].slice(0, 10)}
              className="h-80 md:h-96"
            />
          </div>
        )}

        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-purple-500 rounded-full p-2">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-bold text-gray-800 text-xl">详细行程</h4>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-200">
              {route.itinerary.map((day) => (
                <button
                  key={day.day}
                  onClick={() => setActiveTab(day.day)}
                  className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === day.day
                      ? 'bg-purple-500 text-white border-b-2 border-purple-500'
                      : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  第{day.day}天
                </button>
              ))}
            </div>

            <div className="p-6">
              {route.itinerary
                .filter((day) => day.day === activeTab)
                .map((day) => (
                  <div key={day.day} className="animate-fade-in-up">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="lg:col-span-2 space-y-6">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="bg-blue-500 rounded-full p-1">
                              <MapPin className="w-4 h-4 text-white" />
                            </div>
                            <h5 className="font-semibold text-gray-800">活动安排</h5>
                          </div>
                          <ul className="space-y-2">
                            {day.activities.map((activity, idx) => (
                              <li key={idx} className="flex items-start text-gray-700">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span className="text-sm leading-relaxed">{activity}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="bg-green-500 rounded-full p-1">
                              <Utensils className="w-4 h-4 text-white" />
                            </div>
                            <h5 className="font-semibold text-gray-800">餐饮安排</h5>
                          </div>
                          <ul className="space-y-2">
                            {day.meals.map((meal, idx) => (
                              <li key={idx} className="flex items-start text-gray-700">
                                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                <span className="text-sm leading-relaxed">{meal}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {day.accommodation && (
                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="bg-purple-500 rounded-full p-1">
                                <Bed className="w-4 h-4 text-white" />
                              </div>
                              <h5 className="font-semibold text-gray-800">住宿安排</h5>
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed">{day.accommodation}</p>
                          </div>
                        )}
                      </div>

                      <div className="lg:col-span-1">
                        <div className="bg-gray-50 rounded-lg p-4 h-full">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="bg-gray-500 rounded-full p-1">
                              <ImageIcon className="w-4 h-4 text-white" />
                            </div>
                            <h5 className="font-semibold text-gray-800">景点图片</h5>
                          </div>
                          <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                            {day.imageUrl ? (
                              <img
                                src={day.imageUrl}
                                alt={`第${day.day}天景点`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.src = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop'
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                                <ImageIcon className="w-8 h-8 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            {day.activities[0] ? day.activities[0].substring(0, 20) + '...' : '景点图片'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}