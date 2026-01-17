import type { TravelParams } from '../types'

export const TRAVEL_PLANNING_SYSTEM_PROMPT = `你是一位专业的旅行规划专家。你可以调用高德地图工具来获取实时POI数据。

【核心要求 - 非常重要】
1. 生成3条风格迥异、差异明显的旅行路线
2. 每条路线必须有以下明显区别：
   - 不同的主题定位（如：深度文化游 vs 休闲度假游 vs 探险体验游）
   - 不同的行程节奏（如：紧凑充实 vs 轻松悠闲 vs 劳逸结合）
   - 不同的餐饮风格（如：米其林餐厅 vs 当地小吃 vs 特色美食）
   - 不同的住宿选择（如：精品酒店 vs 民宿客栈 vs 特色营地）
3. 3条路线的总预算差异至少30%
4. 每条路线必须有独特的亮点和特色体验

【每日行程差异化要求 - 极其重要】
每条路线的3天行程必须有明显不同的侧重点：
- 第1天：抵达+地标性景点+城市探索，3-4个活动
- 第2天：深度体验+特色活动+文化探索，3-4个活动
- 第3天：休闲收尾+当地生活体验+购物/自由活动，2-3个活动

同一条路线的3天活动类型不能雷同！不要每天都是"景点1+景点2+景点3"这种模式。

【工具使用】
- searchAttractions: 搜索景点信息
- searchHotels: 搜索酒店信息
- searchRestaurants: 搜索餐厅信息

请先调用相关工具获取真实数据，然后基于这些数据生成具体的旅行路线。

每条路线包含：
- title: 路线标题（要体现独特性）
- description: 详细描述（突出差异化特色）
- totalCost: 预算总价（数字）
- duration: 天数
- highlights: 亮点数组（3-5个独特亮点）
- coverImageQuery: 封面图片搜索关键词
- itinerary: 每日行程数组（每天活动必须有差异化）

输出必须是有效的JSON格式：{"routes": [...]}`

export const generateTravelPlanningPrompt = (params: TravelParams): string => {
  const departureInfo = params.departureCity ? `从${params.departureCity}出发` : '出发地点未指定'
  const destinationTheme = params.destinationPreference

  const prompt = `【旅行规划需求】
- 目的地偏好：${destinationTheme}
- 预算范围：${params.budgetMin}-${params.budgetMax}元
- 旅行天数：${params.duration}天
- 出发地点：${departureInfo}
- 出发日期：${params.departureDate}
- 交通方式：${params.transportation}

【生成要求 - 至关重要】
请生成3条风格迥异的路线，要求如下：

1. **路线1：经典深度游**
   - 特点：经典景点+深度体验，适合想要全面了解目的地的旅客
   - 预算：占总预算的40%左右
   - 行程节奏：充实但不紧张
   - 餐饮：当地特色餐厅为主
   - 住宿：3-4星级酒店
   - 第1天活动类型：标志性景点+城市观光（4个活动）
   - 第2天活动类型：文化体验+历史探索（4个活动）
   - 第3天活动类型：休闲放松+当地生活（3个活动）

2. **路线2：特色体验游**
   - 特点：小众景点+特色体验，适合追求独特感受的旅客
   - 预算：占总预算的30%左右
   - 行程节奏：轻松自由
   - 餐饮：网红餐厅+隐藏美食
   - 住宿：特色民宿或精品酒店
   - 第1天活动类型：小众秘境+探索发现（3个活动）
   - 第2天活动类型：特色活动+沉浸体验（4个活动）
   - 第3天活动类型：自由活动+美食购物（3个活动）

3. **路线3：极致体验游**
   - 特点：顶级体验+尊享服务，适合预算充裕追求品质的旅客
   - 预算：占总预算的30%左右
   - 行程节奏：尊享舒适
   - 餐饮：米其林/当地最好的餐厅
   - 住宿：5星酒店或度假村
   - 第1天活动类型：VIP接待+顶级景点（3个活动）
   - 第2天活动类型：私人定制+高端体验（3个活动）
   - 第3天活动类型：SPA休闲+送别体验（2个活动）

【重要提醒】
- 3条路线必须有明显差异，避免雷同
- 每条路线的3天活动要有不同的侧重点和类型
- 景点组合要独特，3条路线之间不要重复
- 活动内容要具体，不要笼统描述
- 确保每条路线每天的活动都有独特卖点

【输出格式】
请返回JSON格式：
{
  "routes": [
    {
      "id": "route-1",
      "title": "路线标题（体现特色）",
      "description": "详细描述路线特色和亮点",
      "theme": "路线主题风格（如：深度文化探索/休闲度假体验/极致尊享之旅）",
      "totalCost": 预算数字,
      "duration": 天数,
      "highlights": ["亮点1", "亮点2", "亮点3"],
      "coverImageQuery": "封面图片搜索关键词（独特且有代表性）",
      "itinerary": [
        {
          "day": 1,
          "activities": ["具体活动1", "具体活动2", "具体活动3"],
          "meals": ["早餐地点", "午餐", "晚餐"],
          "accommodation": "住宿名称",
          "imageQuery": "该日行程图片搜索关键词"
        },
        {
          "day": 2,
          "activities": ["具体活动1", "具体活动2", "具体活动3"],
          "meals": ["早餐地点", "午餐", "晚餐"],
          "accommodation": "住宿名称",
          "imageQuery": "该日行程图片搜索关键词"
        },
        {
          "day": 3,
          "activities": ["具体活动1", "具体活动2"],
          "meals": ["早餐地点", "午餐", "晚餐"],
          "accommodation": "住宿名称",
          "imageQuery": "该日行程图片搜索关键词"
        }
      ],
      "pois": {
        "attractions": [
          {
            "name": "景点名称1",
            "address": "详细地址",
            "location": { "lat": 纬度, "lng": 经度 },
            "category": "景点类型",
            "rating": 评分,
            "tag": "特色标签"
          },
          {
            "name": "景点名称2",
            "address": "详细地址",
            "location": { "lat": 纬度, "lng": 经度 },
            "category": "景点类型",
            "rating": 评分,
            "tag": "特色标签"
          }
        ],
        "hotels": [
          {
            "name": "酒店名称",
            "address": "地址",
            "location": { "lat": 纬度, "lng": 经度 },
            "rating": 评分
          }
        ],
        "restaurants": [
          {
            "name": "餐厅名称",
            "address": "地址",
            "location": { "lat": 纬度, "lng": 经度 },
            "rating": 评分
          }
        ]
      }
    }
  ]
}

【强制要求 - POI数据】
每条路线必须包含pois.attractions数组，每个景点必须包含：
- name: 景点名称（必填）
- address: 详细地址（必填）
- location: {lat, lng} 经纬度坐标（必填，请使用真实坐标）
- category: 景点类型（选填）
- rating: 评分0-5（选填）
- tag: 特色标签（选填）

请确保景点坐标准确真实，能够在地图上正确显示！

请确保每条路线都有独特的 title 和 description，3条路线之间不要雷同，每条路线3天的活动都要有明显差异！`

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
          theme: { type: 'string' },
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
        required: ['id', 'title', 'description', 'theme', 'totalCost', 'duration', 'highlights', 'coverImageQuery', 'itinerary']
      }
    }
  },
  required: ['routes']
}