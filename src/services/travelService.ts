import OpenAI from 'openai'
import type { TravelParams, TravelRoute, ApiResponse, POI } from '../types'
import { AI_CONFIG, validateConfig, isConfigured } from './aiConfig'
import { TRAVEL_PLANNING_SYSTEM_PROMPT, generateTravelPlanningPrompt } from './prompts'
import { unifiedAmapService } from './unifiedAmapService'
import { mapToSimplePreference, type DestinationPreference } from '../types'
import logger from '../utils/logger'

// JSON Schema for Structured Outputs - 确保AI生成符合预期的JSON格式
const TRAVEL_ROUTES_JSON_SCHEMA = {
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
          },
          pois: {
            type: 'object',
            properties: {
              attractions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    address: { type: 'string' },
                    location: {
                      type: 'object',
                      properties: {
                        lat: { type: 'number' },
                        lng: { type: 'number' }
                      },
                      required: ['lat', 'lng']
                    },
                    category: { type: 'string' },
                    rating: { type: 'number' },
                    tag: { type: 'string' }
                  },
                  required: ['name', 'address', 'location']
                }
              },
              hotels: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    address: { type: 'string' },
                    location: {
                      type: 'object',
                      properties: {
                        lat: { type: 'number' },
                        lng: { type: 'number' }
                      },
                      required: ['lat', 'lng']
                    },
                    rating: { type: 'number' }
                  },
                  required: ['name', 'address', 'location']
                }
              },
              restaurants: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    address: { type: 'string' },
                    location: {
                      type: 'object',
                      properties: {
                        lat: { type: 'number' },
                        lng: { type: 'number' }
                      },
                      required: ['lat', 'lng']
                    },
                    rating: { type: 'number' }
                  },
                  required: ['name', 'address', 'location']
                }
              }
            }
          }
        },
        required: ['id', 'title', 'description', 'theme', 'totalCost', 'duration', 'highlights', 'coverImageQuery', 'itinerary']
      }
    }
  },
  required: ['routes']
}

// Type definitions for tool calls
interface ToolCallArguments {
  city: string
  keywords?: string
  limit?: number
}

interface ToolCall {
  id: string
  function: {
    name: string
    arguments: string
  }
}

// 宽松的JSON解析函数 - 处理AI返回的各种JSON格式问题
function lenientJsonParse<T = any>(jsonString: string): T {
  // 清理常见的JSON格式问题
  let cleaned = jsonString.trim()

  // 移除markdown代码块
  cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/g, '')
  cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/g, '')

  // 移除控制字符但保留中文标点
  cleaned = cleaned.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, '')

  // 修复未加引号的属性名（JavaScript对象字面量语法）
  // 匹配 key: value 中的 key，支持英文、中文、日文、韩文等Unicode字符
  cleaned = cleaned.replace(/([{,]\s*)([\p{L}\p{N}_$][\p{L}\p{N}_$]*)\s*:/gu, '$1"$2":')

  // 尝试标准JSON.parse
  try {
    return JSON.parse(cleaned)
  } catch (e) {
    logger.debug('第一次JSON解析失败，尝试修复...')

    try {
      // 移除尾随逗号
      cleaned = cleaned.replace(/,\s*([}\]])/g, '$1')

      // 处理单引号包裹的字符串
      const singleQuoteFixed = cleaned.replace(/'([^']*)'/g, (match, content) => {
        // 避免替换already quoted的内容
        if (content.includes('"')) return match
        return `"${content}"`
      })

      return JSON.parse(singleQuoteFixed)
    } catch (e2) {
      logger.debug('第二次JSON解析失败，尝试更激进的修复...')

      try {
        // 更激进的修复：处理可能的中文标点问题
        // 将中文冒号替换为英文冒号
        let aggressivelyFixed = cleaned.replace(/：/g, ':')

        // 处理连续的多个冒号
        aggressivelyFixed = aggressivelyFixed.replace(/:+/g, ':')

        // 处理 value 后缺少逗号的情况（常见的AI生成问题）
        aggressivelyFixed = aggressivelyFixed.replace(/(["'\d\]])\s+([{"'\p{L}])/gu, '$1,$2')

        // 移除重复的逗号
        aggressivelyFixed = aggressivelyFixed.replace(/,\s*,/g, ',')

        return JSON.parse(aggressivelyFixed)
      } catch (e3) {
        // 记录详细的错误信息用于调试
        const errorPosition = e3 instanceof Error && e3.message.includes('position')
          ? e3.message.match(/position (\d+)/)?.[1]
          : 'unknown'

        let contextAround = ''
        if (errorPosition && !isNaN(parseInt(errorPosition))) {
          const pos = parseInt(errorPosition)
          const start = Math.max(0, pos - 200)
          const end = Math.min(cleaned.length, pos + 200)
          contextAround = cleaned.substring(start, end)
        }

        logger.error('JSON解析最终失败:')
        logger.error('  错误位置:', errorPosition)
        logger.error('  上下文:', contextAround)
        logger.error('  内容前500字符:', cleaned.substring(0, Math.min(500, cleaned.length)))
        const tailStart = Math.max(0, cleaned.length - 500)
        logger.error('  内容后500字符:', cleaned.substring(tailStart))

        throw new Error(`JSON解析失败: ${e3 instanceof Error ? e3.message : '未知错误'}`)
      }
    }
  }
}
const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  '北京': { lat: 39.9042, lng: 116.4074 },
  '上海': { lat: 31.2304, lng: 121.4737 },
  '广州': { lat: 23.1291, lng: 113.2644 },
  '深圳': { lat: 22.5431, lng: 114.0579 },
  '杭州': { lat: 30.2741, lng: 120.1551 },
  '成都': { lat: 30.5728, lng: 104.0668 },
  '重庆': { lat: 29.5630, lng: 106.5516 },
  '西安': { lat: 34.3416, lng: 108.9398 },
  '南京': { lat: 32.0603, lng: 118.7969 },
  '武汉': { lat: 30.5928, lng: 114.3055 },
  '昆明': { lat: 25.0453, lng: 102.7097 },
  '大理': { lat: 25.6063, lng: 100.2676 },
  '丽江': { lat: 26.8756, lng: 100.2330 },
  '三亚': { lat: 18.2528, lng: 109.5119 },
  '厦门': { lat: 24.4798, lng: 118.0894 },
  '青岛': { lat: 36.0671, lng: 120.3826 },
  '苏州': { lat: 31.2989, lng: 120.5853 },
  '长沙': { lat: 28.2282, lng: 112.9388 },
  '贵阳': { lat: 26.6470, lng: 106.6302 },
  '桂林': { lat: 25.2740, lng: 110.2992 },
  '黄山': { lat: 29.7144, lng: 118.3380 },
  '拉萨': { lat: 29.6525, lng: 91.1721 },
  '哈尔滨': { lat: 45.8038, lng: 126.5350 },
  '天津': { lat: 39.0842, lng: 117.2009 },
  '郑州': { lat: 34.7466, lng: 113.6254 },
  '济南': { lat: 36.6512, lng: 117.1201 },
  '南昌': { lat: 28.6820, lng: 115.8579 },
  '合肥': { lat: 31.8612, lng: 117.2830 },
  '福州': { lat: 26.0745, lng: 119.2965 },
  '南宁': { lat: 22.8170, lng: 108.3665 },
  '乌鲁木齐': { lat: 43.7930, lng: 87.6271 },
  '西宁': { lat: 36.6233, lng: 101.7783 },
  '兰州': { lat: 36.0611, lng: 103.8343 },
  '沈阳': { lat: 41.7968, lng: 123.4315 },
  '长春': { lat: 43.8868, lng: 125.3245 },
  '石家庄': { lat: 38.0428, lng: 114.5149 },
  '太原': { lat: 37.8706, lng: 112.5489 },
  '呼和浩特': { lat: 40.8427, lng: 111.7492 },
  '银川': { lat: 38.4870, lng: 106.2309 }
}

// 从活动列表生成虚拟POI
function generateVirtualPOIsFromActivities(
  itinerary: TravelRoute['itinerary'],
  destinationPreference: DestinationPreference
): POI[] {
  const pois: POI[] = []

  // 将详细偏好转换为简单偏好
  const simplePreference = mapToSimplePreference(destinationPreference)

  // 尝试从目的地偏好中提取城市
  let baseCoords = cityCoordinates['北京'] // 默认北京
  for (const [city, coords] of Object.entries(cityCoordinates)) {
    if (simplePreference.includes(city) || city.includes(simplePreference)) {
      baseCoords = coords
      break
    }
  }

  // 目的地关键词映射
  const keywordMap: Record<string, { lat: number; lng: number }> = {
    '云南': cityCoordinates['昆明']!,
    '西藏': cityCoordinates['拉萨']!,
    '海南': cityCoordinates['三亚']!,
    '江南': cityCoordinates['杭州']!,
    '四川': cityCoordinates['成都']!,
    '江浙沪': cityCoordinates['上海']!,
    '华东': cityCoordinates['上海']!,
    '华南': cityCoordinates['广州']!,
    '西南': cityCoordinates['昆明']!,
    '西北': cityCoordinates['兰州']!,
    '东北': cityCoordinates['哈尔滨']!
  }

  for (const [keyword, coords] of Object.entries(keywordMap)) {
    if (simplePreference.includes(keyword)) {
      baseCoords = coords
      break
    }
  }

  // 从每日的活动中提取景点
  itinerary.forEach((day, dayIndex) => {
    const activities = day.activities || []

    activities.forEach((activity, actIndex) => {
      // 为每个活动生成一个虚拟POI
      // 使用确定性偏移确保同一活动总是生成相同坐标
      const hash = `${day.day}-${activity}`.split('').reduce((acc, char) => {
        return ((acc << 5) - acc) + char.charCodeAt(0)
      }, 0)

      const offsetLat = ((hash % 100) - 50) / 1000 // -0.05 到 +0.05
      const offsetLng = (((hash >> 5) % 100) - 50) / 1000

      // 根据活动名称推断类型
      let category = '景点'
      let tag = '推荐景点'
      if (activity.includes('美食') || activity.includes('餐厅') || activity.includes('吃')) {
        category = '美食'
        tag = '当地美食'
      } else if (activity.includes('住宿') || activity.includes('酒店') || activity.includes('客栈')) {
        category = '住宿'
        tag = '推荐住宿'
      } else if (activity.includes('博物馆') || activity.includes('展览') || activity.includes('文化')) {
        category = '文化'
        tag = '文化体验'
      } else if (activity.includes('自然') || activity.includes('公园') || activity.includes('风景')) {
        category = '自然风光'
        tag = '自然美景'
      } else if (activity.includes('购物') || activity.includes('逛街')) {
        category = '购物'
        tag = '购物休闲'
      } else if (activity.includes('夜景') || activity.includes('灯光')) {
        category = '夜景'
        tag = '夜景圣地'
      }

      // 随机评分 3.5-5.0
      const rating = (3.5 + (hash % 15) / 10).toFixed(1)

      pois.push({
        id: `poi-${day.day}-${actIndex}`,
        name: activity,
        address: `${simplePreference}市`,
        location: {
          lat: baseCoords.lat + offsetLat,
          lng: baseCoords.lng + offsetLng
        },
        category,
        rating: parseFloat(rating),
        tag
      })
    })
  })

  return pois
}

let openaiClient: OpenAI | null = null

const generateImageUrl = (query: string, width: number = 800, height: number = 600): string => {
  // 扩展的图片库 - 50+ 张不同风格的旅行图片
  const imageIds = [
    // 山水自然
    '1506905925346-21bda4d32df4', // 山景
    '1469474968028-56623f02e42e', // 自然风光
    '1472214103451-9374bd1c798e', // 森林
    '1441974231531-c6227db76b6e', // 森林日出
    '1505142468610-359e7d316be0', // 湖景
    '1500375592092-40eb2168fd21', // 海滩
    '1518709268805-4e9042af2176', // 雪景
    '1482192596544-9eb780fc7f66', // 雪景2
    '1454491731202-8d36c75c893f', // 雪山
    '1464822759023-fed622ff2c3b', // 山脉
    '1470770841072-f978cf4d019e', // 山谷
    '1504280390367-8096e13afbc3', // 沙漠
    '1465188162913-8fb5719d6d39', // 峡谷
    '1465050266043-701e0d79a1e6', // 瀑布
    '1500530855692-b90f5e157d8f', // 梯田
    '1476623579620-9f9502355618', // 草原

    // 海洋水景
    '1507525428034-b723cf961d3e', // 海洋
    '1500375592092-40eb2168fd21', // 海滩日落
    '1544551763-46a013bb71e6', // 热带海岛
    '1543825123-c8b2d4d4e0a7', // 水下
    '1519049657709-7a1240491b8e', // 珊瑚礁
    '1537996194471-e8df566d631b', // 港口

    // 城市建筑
    '1441986300917-64674bd600d8', // 城市
    '1514565131-fce0801e5785', // 现代建筑
    '1469474968028-56623f02e42e', // 城市天际线
    '1516838958650-41056f76e26a', // 东京街头
    '1480714378405-67049d7d5a0c', // 纽约
    '1493976040374-85c8e12f0c0e', // 城市夜景
    '1520250491945-8b4c0f5e8c5c', // 古镇
    '1502673539246-7dcc451fc893', // 建筑细节
    '1547619292-240402b5d664', // 街道
    '1565626424178-b9a57cf98948', // 城市风光

    // 文化古迹
    '1564507592333-c6065ab1c030', // 寺庙
    '1528164344705-4754268798e8', // 古建筑
    '1508804185872-d7badad00f7d', // 传统文化
    '1528114039690-7660f2941f80', // 宫殿
    '1565060643200-74d3b596b433', // 古城墙
    '1564664683458-5ad4aac9d1a6', // 塔庙
    '1548566750-96f3d9b0201e', // 博物馆

    // 四季风景
    '1417256541686-aac7dc8db9c0', // 春天樱花
    '1465201438172-7672f72a28c0', // 秋天红叶
    '1542259499-13e8ddd97e55', // 秋天风景
    '1500375592092-40eb2168fd21', // 夏天海滩
    '1483664858045-1afccb3a9b4c', // 冬天雪景

    // 人文活动
    '1507525428034-b723cf961d3e', // 旅行
    '1527631746610-9ea7c4a44496', // 背包客
    '1469530228144-5c6195a23c8e', // 户外活动
    '1477102038288-c3a44c9c6c00', // 探险
    '1501556466850-7c9fa1fccb4c', // 公路旅行
    '1501785218491-35c81c57095b', // 日出
    '1481270546521-1d2b4878b0b8', // 星空
    '1530783362536-79d08c180c91', // 夜景

    // 美食住宿
    '1414235077428-338989a2e8c0', // 美食
    '1504677351687-313b7d7c9c9d', // 餐厅
    '1567620900571-9d4d1dd8b94b', // 酒店
    '1565895405138-6c3a5d019a5a', // 民宿

    // 随机分布
    '1449824913935-59a10b8d2000', // 风景1
    '1464207687429-7505649dae38', // 风景2
    '1507003211169-0a8a29bdf997', // 风景3
  ]

  // 使用确定性哈希算法，基于查询文本生成固定的图片索引
  // 确保相同的查询始终返回相同的图片URL，以支持浏览器缓存
  const hash = query.split('').reduce((acc, char) => {
    const charCode = char.charCodeAt(0)
    return ((acc << 5) - acc) + charCode + (acc << 3) - (acc << 1)
  }, 0)

  // 仅使用查询的哈希值，确保相同查询返回相同图片
  const imageIndex = Math.abs(hash) % imageIds.length
  const imageId = imageIds[imageIndex]

  return `https://images.unsplash.com/photo-${imageId}?w=${width}&h=${height}&fit=crop&q=80`
}

const getOpenAIClient = (): OpenAI => {
  if (!openaiClient) {
    validateConfig()
    openaiClient = new OpenAI({
      apiKey: AI_CONFIG.apiKey,
      baseURL: AI_CONFIG.baseURL,
      dangerouslyAllowBrowser: true
    })
  }
  return openaiClient
}

const generateAIRoutes = async (params: TravelParams): Promise<TravelRoute[]> => {
  logger.info('开始生成AI旅行路线...')

  const client = getOpenAIClient()
  const userPrompt = generateTravelPlanningPrompt(params)

  const tools: OpenAI.Chat.ChatCompletionTool[] = [
    {
      type: 'function' as const,
      function: {
        name: 'searchAttractions',
        description: '搜索指定城市的景点信息',
        parameters: {
          type: 'object',
          properties: {
            city: {
              type: 'string',
              description: '城市名称，例如：东京、北京、上海'
            },
            keywords: {
              type: 'string',
              description: '景点关键词，例如：雪山、温泉、历史古迹等'
            },
            limit: {
              type: 'number',
              description: '返回结果数量，默认为10'
            }
          },
          required: ['city']
        }
      }
    },
    {
      type: 'function' as const,
      function: {
        name: 'searchHotels',
        description: '搜索指定城市的酒店信息',
        parameters: {
          type: 'object',
          properties: {
            city: {
              type: 'string',
              description: '城市名称，例如：东京、北京、上海'
            },
            keywords: {
              type: 'string',
              description: '酒店关键词，例如：豪华、精品、山景等'
            },
            limit: {
              type: 'number',
              description: '返回结果数量，默认为5'
            }
          },
          required: ['city']
        }
      }
    },
    {
      type: 'function' as const,
      function: {
        name: 'searchRestaurants',
        description: '搜索指定城市的餐厅信息',
        parameters: {
          type: 'object',
          properties: {
            city: {
              type: 'string',
              description: '城市名称，例如：东京、北京、上海'
            },
            keywords: {
              type: 'string',
              description: '餐厅关键词，例如：当地美食、烧烤、传统菜等'
            },
            limit: {
              type: 'number',
              description: '返回结果数量，默认为10'
            }
          },
          required: ['city']
        }
      }
    }
  ]

  logger.info('AI调用配置:', {
    model: AI_CONFIG.model,
    baseURL: AI_CONFIG.baseURL,
    temperature: AI_CONFIG.temperature,
    maxTokens: AI_CONFIG.maxTokens
  })

  logger.debug('用户提示:', userPrompt)

  try {
    let messages: any[] = [
      {
        role: 'system' as const,
        content: TRAVEL_PLANNING_SYSTEM_PROMPT + '\n\n【关键要求】\n生成的3条路线必须在景点选择、活动安排、预算分配上完全不同。\n同一条路线的3天行程也要有不同侧重点（抵达探索日、深度体验日、休闲收尾日）。\n不要生成相似的内容！'
      },
      {
        role: 'user' as const,
        content: `${userPrompt}

【强制性差异化要求】
请严格按照以下规则生成3条路线：

路线1（经典深度游）的3天：
- Day 1: 必须是"抵达+标志性景点+城市观光"的模式
- Day 2: 必须是"经典景点深度游+文化体验"的模式
- Day 3: 必须是"休闲收尾+当地生活体验"的模式

路线2（特色体验游）的3天：
- Day 1: 必须是"小众景点+探索发现"的模式
- Day 2: 必须是"特色活动+沉浸体验"的模式
- Day 3: 必须是"自由活动+美食购物"的模式

路线3（极致体验游）的3天：
- Day 1: 必须是"VIP景点+顶级享受"的模式
- Day 2: 必须是"私人定制+高端体验"的模式
- Day 3: 必须是"SPA休闲+完美收官"的模式

每条路线每天的活动必须具体且有针对性，绝对不能雷同！`
      }
    ]

    let maxIterations = 5
    let iteration = 0

    while (iteration < maxIterations) {
      iteration++
      logger.info(`AI调用第${iteration}轮...`)

      const completion = await client.chat.completions.create({
        model: AI_CONFIG.model,
        messages,
        temperature: AI_CONFIG.temperature,
        max_tokens: AI_CONFIG.maxTokens,
        tools,
        tool_choice: iteration === 1 ? 'auto' : 'none',
        // 第二轮使用 JSON 模式确保输出为有效 JSON
        // 注意：SiliconFlow/Qwen 可能不完全支持 json_schema，回退到 json_object
        ...(iteration !== 1 ? {
          response_format: {
            type: 'json_object'
          }
        } : {})
      }, {
        timeout: AI_CONFIG.timeout
      })

      const message = completion.choices[0]?.message
      if (!message) {
        throw new Error('AI服务未返回有效消息')
      }

      messages.push(message)

      if (message.tool_calls && message.tool_calls.length > 0) {
        logger.info(`AI请求调用${message.tool_calls.length}个工具`)

        for (const toolCall of message.tool_calls) {
          const { id } = toolCall
          // Handle both function and custom tool call types
          const func = 'function' in toolCall ? (toolCall as any).function : toolCall
          const { name, arguments: args } = func
          logger.debug(`调用工具: ${name}`)

          let toolResult
          try {
            const params = JSON.parse(args)

            switch (name) {
              case 'searchAttractions':
                toolResult = await unifiedAmapService.searchAttractions(params.city, params.keywords, params.limit || 10)
                break
              case 'searchHotels':
                toolResult = await unifiedAmapService.searchHotels(params.city, params.keywords, params.limit || 5)
                break
              case 'searchRestaurants':
                toolResult = await unifiedAmapService.searchRestaurants(params.city, params.keywords, params.limit || 10)
                break
              default:
                throw new Error(`未知工具: ${name}`)
            }

            logger.info(`工具${name}执行完成，返回${Array.isArray(toolResult) ? toolResult.length : 1}个结果`)
          } catch (error) {
            logger.error(`工具${name}执行失败:`, error)
            toolResult = { error: error instanceof Error ? error.message : '工具执行失败' }
          }

          messages.push({
            role: 'tool',
            content: JSON.stringify(toolResult),
            tool_call_id: id
          })
        }
      } else if (message.content) {
        logger.info('AI返回最终响应')
        break
      } else {
        logger.warn('AI响应不完整，继续对话')
      }
    }

    const finalMessage = messages[messages.length - 1]
    if (!finalMessage.content) {
      throw new Error('AI未生成最终响应')
    }

    const response = finalMessage.content
    logger.debug('AI最终响应内容长度:', response.length)
    logger.debug('AI最终响应内容预览:', response.substring(0, 200) + '...')

    try {
      // 使用宽松JSON解析处理各种格式问题
      const parsedResponse = lenientJsonParse(response)
      if (!parsedResponse.routes || !Array.isArray(parsedResponse.routes)) {
        throw new Error('AI响应格式不正确')
      }

      return parsedResponse.routes.map((route: TravelRoute, index: number) => ({
        id: route.id || `route-${index + 1}`,
        title: route.title || '未命名路线',
        description: route.description || '暂无描述',
        totalCost: typeof route.totalCost === 'number' ? route.totalCost : 0,
        duration: route.duration || params.duration,
        theme: route.theme || '通用路线',
        highlights: Array.isArray(route.highlights) ? route.highlights : [],
        coverImageUrl: route.coverImageUrl || (route.coverImageQuery ? generateImageUrl(route.coverImageQuery) : generateImageUrl('travel destination')),
        itinerary: Array.isArray(route.itinerary) ? route.itinerary.map((day) => ({
          day: day.day || 1,
          activities: Array.isArray(day.activities) ? day.activities : [],
          meals: Array.isArray(day.meals) ? day.meals : [],
          accommodation: day.accommodation,
          imageUrl: day.imageUrl || (day.imageQuery ? generateImageUrl(day.imageQuery, 600, 400) : generateImageUrl('travel activity', 600, 400))
        })) : [],
        // 确保pois.attractions存在，如果AI没有返回则从activities生成虚拟POI
        pois: route.pois || {
          attractions: generateVirtualPOIsFromActivities(route.itinerary || [], params.destinationPreference),
          hotels: [],
          restaurants: []
        }
      }))
    } catch (parseError) {
      logger.error('AI响应解析失败:', parseError)
      logger.error('AI原始响应前1000字符:', response.substring(0, 1000))
      logger.error('AI原始响应后500字符:', response.substring(response.length - 500))
      throw new Error('AI响应格式错误，无法解析')
    }
  } catch (apiError) {
    logger.error('AI API调用失败:', apiError)

    // 检查是否为超时错误
    if (apiError instanceof Error && apiError.message.includes('timeout')) {
      throw new Error('API访问超时')
    }

    throw apiError
  }
}

export const generateTravelRoutes = async (params: TravelParams): Promise<ApiResponse<TravelRoute[]>> => {
  try {
    if (!isConfigured()) {
      return {
        success: false,
        error: 'AI服务未配置，请检查环境变量设置'
      }
    }

    const routes = await generateAIRoutes(params)
    return {
      success: true,
      data: routes
    }
  } catch (error) {
    logger.error('AI路线生成失败:', error)

    let errorMessage = '生成路线失败，请重试'

    if (error instanceof Error) {
      if (error.message.includes('timeout') || error.message.includes('Timeout')) {
        errorMessage = 'API访问超时'
      } else if (error.message.includes('APIConnectionTimeoutError')) {
        errorMessage = 'API访问超时'
      } else if (error.message.includes('API key') || error.message.includes('authentication')) {
        errorMessage = 'API访问失败'
      } else {
        errorMessage = error.message
      }
    }

    return {
      success: false,
      error: errorMessage
    }
  }
}