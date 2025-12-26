import OpenAI from 'openai'
import type { TravelParams, TravelRoute, ApiResponse } from '../types'
import { AI_CONFIG, validateConfig, isConfigured } from './aiConfig'
import { TRAVEL_PLANNING_SYSTEM_PROMPT, generateTravelPlanningPrompt } from './prompts'
import { amapService } from './amapService'

let openaiClient: OpenAI | null = null

const generateImageUrl = (query: string, width: number = 800, height: number = 600): string => {
  const imageIds = [
    '1449824913935-59a10b8d2000', '1506905925346-21bda4d32df4', '1414235077428-338989a2e8c0',
    '1469474968028-56623f02e42e', '1464207687429-7505649dae38', '1508804185872-d7badad00f7d',
    '1507525428034-b723cf961d3e', '1441986300917-64674bd600d8', '1507003211169-0a8a29bdf997',
    '1469474968028-56623f02e42e', '1506905925346-21bda4d32df4', '1414235077428-338989a2e8c0'
  ]

  const queryHash = query.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)

  const imageIndex = Math.abs(queryHash) % imageIds.length
  const imageId = imageIds[imageIndex]

  return `https://images.unsplash.com/photo-${imageId}?w=${width}&h=${height}&fit=crop`
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
  console.log('🚀 开始生成AI旅行路线...')

  const client = getOpenAIClient()
  const userPrompt = generateTravelPlanningPrompt(params)

  const tools: any[] = [
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

  console.log('🤖 AI调用配置:', {
    model: AI_CONFIG.model,
    baseURL: AI_CONFIG.baseURL,
    temperature: AI_CONFIG.temperature,
    maxTokens: AI_CONFIG.maxTokens
  })

  console.log('📝 用户提示:', userPrompt)

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
      console.log(`🔄 AI调用第${iteration}轮...`)

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
        console.log(`🛠️ AI请求调用${message.tool_calls.length}个工具`)

        for (const toolCall of message.tool_calls) {
          const { id, function: func } = toolCall
          const { name, arguments: args } = func
          console.log(`🔧 调用工具: ${name}`)

          let toolResult
          try {
            const params = JSON.parse(args)

            switch (name) {
              case 'searchAttractions':
                toolResult = await amapService.searchAttractions(params.city, params.limit || 10)
                break
              case 'searchHotels':
                toolResult = await amapService.searchHotels(params.city, params.limit || 5)
                break
              case 'searchRestaurants':
                toolResult = await amapService.searchRestaurants(params.city, params.limit || 10)
                break
              default:
                throw new Error(`未知工具: ${name}`)
            }

            console.log(`✅ 工具${name}执行完成，返回${Array.isArray(toolResult) ? toolResult.length : 1}个结果`)
          } catch (error) {
            console.error(`❌ 工具${name}执行失败:`, error)
            toolResult = { error: error instanceof Error ? error.message : '工具执行失败' }
          }

          messages.push({
            role: 'tool',
            content: JSON.stringify(toolResult),
            tool_call_id: id
          })
        }
      } else if (message.content) {
        console.log('📄 AI返回最终响应')
        break
      } else {
        console.log('⚠️ AI响应不完整，继续对话')
      }
    }

    const finalMessage = messages[messages.length - 1]
    if (!finalMessage.content) {
      throw new Error('AI未生成最终响应')
    }

    const response = finalMessage.content
    console.log('AI最终响应内容长度:', response.length)
    console.log('AI最终响应内容预览:', response.substring(0, 200) + '...')

    try {
      const parsedResponse = JSON.parse(response)
      if (!parsedResponse.routes || !Array.isArray(parsedResponse.routes)) {
        throw new Error('AI响应格式不正确')
      }

      return parsedResponse.routes.map((route: any, index: number) => ({
        id: route.id || `route-${index + 1}`,
        title: route.title || '未命名路线',
        description: route.description || '暂无描述',
        totalCost: typeof route.totalCost === 'number' ? route.totalCost : 0,
        duration: route.duration || params.duration,
        theme: route.theme || '通用路线',
        highlights: Array.isArray(route.highlights) ? route.highlights : [],
        coverImageUrl: route.coverImageUrl || (route.coverImageQuery ? generateImageUrl(route.coverImageQuery) : generateImageUrl('travel destination')),
        itinerary: Array.isArray(route.itinerary) ? route.itinerary.map((day: any) => ({
          day: day.day || 1,
          activities: Array.isArray(day.activities) ? day.activities : [],
          meals: Array.isArray(day.meals) ? day.meals : [],
          accommodation: day.accommodation,
          imageUrl: day.imageUrl || (day.imageQuery ? generateImageUrl(day.imageQuery, 600, 400) : generateImageUrl('travel activity', 600, 400))
        })) : []
      }))
    } catch (parseError) {
      console.error('AI响应解析失败:', parseError)
      throw new Error('AI响应格式错误，无法解析')
    }
  } catch (apiError) {
    console.error('AI API调用失败:', apiError)

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
    console.error('AI路线生成失败:', error)

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