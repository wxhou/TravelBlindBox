import OpenAI from 'openai'
import type { TravelParams, TravelRoute, ApiResponse } from '../types'
import { AI_CONFIG, validateConfig, isConfigured } from './aiConfig'
import { TRAVEL_PLANNING_SYSTEM_PROMPT, generateTravelPlanningPrompt } from './prompts'
import { unifiedAmapService } from './unifiedAmapService'
import logger from '../utils/logger'

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

  // 使用更复杂的哈希算法，基于查询文本生成伪随机索引
  const hash = query.split('').reduce((acc, char) => {
    const charCode = char.charCodeAt(0)
    return ((acc << 5) - acc) + charCode + (acc << 3) - (acc << 1)
  }, 0)

  // 添加随机因子确保不同时间生成的图片不同
  const timeComponent = Date.now() % 100000
  const randomComponent = Math.floor(Math.random() * 100)

  const combinedHash = Math.abs(hash + timeComponent + randomComponent)
  const imageIndex = combinedHash % imageIds.length
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
        content: TRAVEL_PLANNING_SYSTEM_PROMPT
      },
      {
        role: 'user' as const,
        content: userPrompt
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
        tool_choice: iteration === 1 ? 'auto' : 'none'
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
      const parsedResponse = JSON.parse(response)
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
        })) : []
      }))
    } catch (parseError) {
      logger.error('AI响应解析失败:', parseError)
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