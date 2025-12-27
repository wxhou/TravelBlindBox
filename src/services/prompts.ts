import type { TravelParams } from '../types'

export const TRAVEL_PLANNING_SYSTEM_PROMPT = `你是一位专业的旅行规划专家。你可以调用高德地图工具来获取实时POI数据。

你可以使用以下工具来获取旅行相关信息：
- searchAttractions: 搜索景点信息
- searchHotels: 搜索酒店信息
- searchRestaurants: 搜索餐厅信息

请根据用户参数生成3条不同的旅行路线建议。你应该先调用相关工具获取真实数据，然后基于这些数据生成具体的旅行路线。

每条路线包含：
- title: 路线标题
- description: 详细描述
- totalCost: 预算总价（数字）
- duration: 天数
- highlights: 亮点数组
- coverImageQuery: 封面图片搜索关键词（用于从图片库搜索相关图片）
- itinerary: 每日行程数组，每个行程日包含：
  - day: 天数
  - activities: 活动数组
  - meals: 餐食数组
  - accommodation: 住宿
  - imageQuery: 该日行程图片搜索关键词

输出必须是有效的JSON格式：{"routes": [...]}`

export const generateTravelPlanningPrompt = (params: TravelParams): string => {
  const departureInfo = params.departureCity ? `从${params.departureCity}出发` : '出发地点未指定'

  const prompt = `生成3条${params.duration}天${params.destinationPreference}旅行路线，预算范围${params.budgetMin}-${params.budgetMax}元，${departureInfo}，出发日期${params.departureDate}，交通${params.transportation}。

请先调用高德地图工具搜索该城市的景点、酒店和餐厅信息，并在调用时传递${params.destinationPreference}相关的关键词。例如，如果目的地偏好是"雪山"，则在景点搜索时传递"雪山"作为关键词。

每条路线请提供封面图片搜索关键词，用于从图片库搜索相关封面图片。
每个行程日请提供图片搜索关键词，用于搜索该日行程的代表性图片。

请返回JSON格式：
{
  "routes": [
    {
      "id": "route-1",
      "title": "路线标题",
      "description": "路线描述",
      "totalCost": 预算数字,
      "duration": 天数,
      "highlights": ["亮点1", "亮点2"],
      "coverImageQuery": "封面图片搜索关键词",
      "itinerary": [
        {
          "day": 1,
          "activities": ["活动1"],
          "meals": ["早餐", "午餐"],
          "accommodation": "酒店",
          "imageQuery": "该日行程图片搜索关键词"
        }
      ]
    }
  ]
}`

  return prompt
}

export const TRAVEL_PLANNING_SCHEMA = {
  type: 'object',
  properties: {
    routes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          totalCost: { type: 'number' },
          duration: { type: 'number' },
          highlights: {
            type: 'array',
            items: { type: 'string' }
          },
          coverImageQuery: { type: 'string' },
          itinerary: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                day: { type: 'number' },
                activities: {
                  type: 'array',
                  items: { type: 'string' }
                },
                meals: {
                  type: 'array',
                  items: { type: 'string' }
                },
                accommodation: { type: 'string' },
                imageQuery: { type: 'string' }
              },
              required: ['day', 'activities', 'meals']
            }
          }
        },
        required: ['id', 'title', 'description', 'totalCost', 'duration', 'highlights', 'coverImageQuery', 'itinerary']
      }
    }
  },
  required: ['routes']
}