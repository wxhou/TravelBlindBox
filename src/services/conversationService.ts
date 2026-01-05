import type { TravelRoute } from '../types'
import { generateTravelRoutes } from './travelService'
import { RealTimeInfoManager } from './realTimeInfoManager'
import type { RealTimeInfoData } from './realTimeInfoManager'
import type { WeatherData } from './weatherService'
import type { TrafficData } from './trafficService'
import type { POIStatus } from './poiService'
import type { EmergencyAlert } from './emergencyService'

export interface ConversationContext {
  currentRoute?: TravelRoute
  userPreferences?: Record<string, any>
  conversationHistory: ConversationMessage[]
  lastIntent?: string
  lastEntities?: Record<string, any>
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  intent?: string
  entities?: Record<string, any>
}

export interface IntentRecognition {
  intent: string
  confidence: number
  entities: Record<string, any>
  response: string
}

export interface TravelQuery {
  type: 'attraction' | 'restaurant' | 'hotel' | 'transportation' | 'weather' | 'emergency' | 'traffic' | 'realtime_weather' | 'realtime_traffic' | 'poi_status' | 'general'
  query: string
  location?: string
  preferences?: Record<string, any>
}

export class ConversationService {
  private context: ConversationContext
  private isProcessing: boolean = false
  private realTimeInfoManager: RealTimeInfoManager

  constructor() {
    this.context = {
      conversationHistory: [],
      userPreferences: {}
    }
    this.realTimeInfoManager = RealTimeInfoManager.getInstance()
  }

  public async processMessage(
    message: string, 
    currentRoute?: TravelRoute
  ): Promise<string> {
    if (this.isProcessing) {
      throw new Error('对话处理中，请稍候')
    }

    this.isProcessing = true
    
    try {
      // 更新上下文
      this.context.currentRoute = currentRoute
      
      // 意图识别
      const intent = this.recognizeIntent(message)
      this.context.lastIntent = intent.intent
      this.context.lastEntities = intent.entities

      // 添加用户消息到历史
      const userMessage: ConversationMessage = {
        role: 'user',
        content: message,
        timestamp: Date.now(),
        intent: intent.intent,
        entities: intent.entities
      }
      this.context.conversationHistory.push(userMessage)

      // 根据意图生成响应
      const response = await this.generateResponse(intent, message)
      
      // 添加助手响应到历史
      const assistantMessage: ConversationMessage = {
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
        intent: intent.intent,
        entities: intent.entities
      }
      this.context.conversationHistory.push(assistantMessage)

      // 限制历史记录长度
      if (this.context.conversationHistory.length > 20) {
        this.context.conversationHistory = this.context.conversationHistory.slice(-20)
      }

      return response
    } finally {
      this.isProcessing = false
    }
  }

  private recognizeIntent(message: string): IntentRecognition {
    const lowerMessage = message.toLowerCase()
    
    // 旅行规划相关
    if (this.containsKeywords(lowerMessage, ['规划', '计划', '行程', '路线', '旅游'])) {
      return {
        intent: 'travel_planning',
        confidence: 0.9,
        entities: { topic: 'planning' },
        response: '我来帮您规划旅行路线'
      }
    }

    // 景点咨询
    if (this.containsKeywords(lowerMessage, ['景点', '好玩', '推荐', '去哪儿'])) {
      return {
        intent: 'attraction_inquiry',
        confidence: 0.85,
        entities: { type: 'attraction' },
        response: '让我为您推荐一些精彩的景点'
      }
    }

    // 美食咨询
    if (this.containsKeywords(lowerMessage, ['美食', '餐厅', '吃', '特色菜'])) {
      return {
        intent: 'restaurant_inquiry',
        confidence: 0.85,
        entities: { type: 'restaurant' },
        response: '我来为您推荐当地美食'
      }
    }

    // 住宿咨询
    if (this.containsKeywords(lowerMessage, ['酒店', '住宿', '住', '民宿'])) {
      return {
        intent: 'accommodation_inquiry',
        confidence: 0.85,
        entities: { type: 'hotel' },
        response: '为您推荐合适的住宿选择'
      }
    }

    // 天气咨询
    if (this.containsKeywords(lowerMessage, ['天气', '下雨', '晴天', '温度'])) {
      return {
        intent: 'weather_inquiry',
        confidence: 0.9,
        entities: { type: 'weather' },
        response: '我来为您查询天气信息'
      }
    }

    // 交通咨询
    if (this.containsKeywords(lowerMessage, ['交通', '怎么去', '路线', '地铁', '公交'])) {
      return {
        intent: 'transportation_inquiry',
        confidence: 0.85,
        entities: { type: 'transportation' },
        response: '为您提供交通指引'
      }
    }

    // 实时天气咨询
    if (this.containsKeywords(lowerMessage, ['实时天气', '现在天气', '今天天气', '明天天气', '天气怎么样'])) {
      return {
        intent: 'realtime_weather_inquiry',
        confidence: 0.9,
        entities: { type: 'realtime_weather' },
        response: '我来为您查询最新的天气信息'
      }
    }

    // 实时交通咨询
    if (this.containsKeywords(lowerMessage, ['实时交通', '堵车', '路况', '交通状况', '现在路上'])) {
      return {
        intent: 'realtime_traffic_inquiry',
        confidence: 0.9,
        entities: { type: 'realtime_traffic' },
        response: '我来为您查询实时交通状况'
      }
    }

    // 景点状态咨询
    if (this.containsKeywords(lowerMessage, ['景点状态', '景点开放', '哪里好玩', '景点拥挤'])) {
      return {
        intent: 'poi_status_inquiry',
        confidence: 0.85,
        entities: { type: 'poi_status' },
        response: '我来为您查询景点实时状态'
      }
    }

    // 紧急情况咨询
    if (this.containsKeywords(lowerMessage, ['紧急情况', '安全', '警告', '紧急求助'])) {
      return {
        intent: 'emergency_inquiry',
        confidence: 0.9,
        entities: { type: 'emergency' },
        response: '我来为您查询当前安全状况'
      }
    }

    // 路线详情询问
    if (this.containsKeywords(lowerMessage, ['多少钱', '费用', '价格', '花费', '预算'])) {
      return {
        intent: 'cost_inquiry',
        confidence: 0.8,
        entities: { type: 'cost' },
        response: '我来为您介绍路线费用'
      }
    }

    // 行程时间询问
    if (this.containsKeywords(lowerMessage, ['时间', '多久', '几天', '几点'])) {
      return {
        intent: 'duration_inquiry',
        confidence: 0.8,
        entities: { type: 'duration' },
        response: '为您介绍行程时间安排'
      }
    }

    // 默认响应
    return {
      intent: 'general',
      confidence: 0.5,
      entities: {},
      response: '我是您的智能旅行助手，可以帮您规划行程、推荐景点、查询信息等'
    }
  }

  private containsKeywords(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword))
  }

  private async generateResponse(intent: IntentRecognition, originalMessage: string): Promise<string> {
    try {
      switch (intent.intent) {
        case 'travel_planning':
          return this.handleTravelPlanning(originalMessage, intent.entities)
        
        case 'attraction_inquiry':
          return this.handleAttractionInquiry(intent.entities)
        
        case 'restaurant_inquiry':
          return this.handleRestaurantInquiry(intent.entities)
        
        case 'accommodation_inquiry':
          return this.handleAccommodationInquiry(intent.entities)
        
        case 'weather_inquiry':
          return this.handleWeatherInquiry(intent.entities)
        
        case 'transportation_inquiry':
          return this.handleTransportationInquiry(intent.entities)
        
        case 'realtime_weather_inquiry':
          return this.handleRealtimeWeatherInquiry(intent.entities)
        
        case 'realtime_traffic_inquiry':
          return this.handleRealtimeTrafficInquiry(intent.entities)
        
        case 'poi_status_inquiry':
          return this.handlePOIStatusInquiry(intent.entities)
        
        case 'emergency_inquiry':
          return this.handleEmergencyInquiry(intent.entities)
        
        case 'cost_inquiry':
          return this.handleCostInquiry(intent.entities)
        
        case 'duration_inquiry':
          return this.handleDurationInquiry(intent.entities)
        
        default:
          return this.handleGeneralResponse(originalMessage)
      }
    } catch (error) {
      console.error('生成响应时出错:', error)
      return '抱歉，我现在有点困惑，能否换个方式提问呢？'
    }
  }

  private handleTravelPlanning(message: string, entities: Record<string, any>): string {
    if (this.context.currentRoute) {
      return `当前为您规划的路线是"${this.context.currentRoute.title}"，这是一次${this.context.currentRoute.duration}天的${this.context.currentRoute.theme}之旅。主要亮点包括：${this.context.currentRoute.highlights.join('、')}。您想了解更多信息吗？`
    } else {
      return '我很乐意帮您规划旅行路线！请告诉我您的出发地、预算、旅行天数和偏好，我会为您制定个性化的旅行方案。'
    }
  }

  private handleAttractionInquiry(entities: Record<string, any>): string {
    if (this.context.currentRoute?.pois?.attractions) {
      const attractions = this.context.currentRoute.pois.attractions
      if (attractions.length > 0) {
        const attractionNames = attractions.slice(0, 3).map(p => p.name)
        return `推荐几个精彩景点：${attractionNames.join('、')}。这些景点都有很好的评价和独特的体验，是您旅行不容错过的地方。`
      }
    }
    return '根据您的路线，我推荐您探索当地的历史古迹、自然风光和文化体验。每个地方都有独特的魅力等您发现！'
  }

  private handleRestaurantInquiry(entities: Record<string, any>): string {
    if (this.context.currentRoute?.pois?.restaurants) {
      const restaurants = this.context.currentRoute.pois.restaurants
      if (restaurants.length > 0) {
        const restaurantNames = restaurants.slice(0, 3).map(p => p.name)
        return `当地美食推荐：${restaurantNames.join('、')}。这些餐厅提供正宗的地方特色菜，让您的味蕾也能享受旅行的乐趣。`
      }
    }
    return '建议您品尝当地特色美食，无论是街头小吃还是高级餐厅，都能为您带来难忘的味觉体验！'
  }

  private handleAccommodationInquiry(entities: Record<string, any>): string {
    if (this.context.currentRoute?.pois?.hotels) {
      const hotels = this.context.currentRoute.pois.hotels
      if (hotels.length > 0) {
        const hotelNames = hotels.slice(0, 3).map(p => p.name)
        return `推荐住宿选择：${hotelNames.join('、')}。这些酒店位置便利，服务优质，能让您的旅行更加舒适。`
      }
    }
    return '选择住宿时建议考虑位置便利性、设施完善度和性价比，好的住宿环境是愉快旅行的重要保障。'
  }

  private handleWeatherInquiry(entities: Record<string, any>): string {
    return '关于天气，我建议您出行前查看最新的天气预报，并根据天气情况准备合适的衣物。不同的季节有不同的魅力，雨天也有雨天的浪漫。'
  }

  private handleTransportationInquiry(entities: Record<string, any>): string {
    return '交通出行建议：根据距离远近选择合适的交通方式，近距离可以选择步行或公共交通，远距离可考虑租车或包车。提前规划交通路线能让旅行更加顺畅。'
  }

  private handleCostInquiry(entities: Record<string, any>): string {
    if (this.context.currentRoute?.totalCost) {
      return `这条路线预计总花费约${this.context.currentRoute.totalCost}元，包括交通、住宿、餐饮和景点门票等。建议您预留10-20%的额外费用以应对意外支出。`
    }
    return '旅行预算建议根据个人经济情况合理规划，包含交通、住宿、餐饮、门票和购物等费用。建议预留一些弹性预算。'
  }

  private handleDurationInquiry(entities: Record<string, any>): string {
    if (this.context.currentRoute?.duration) {
      return `这条路线建议安排${this.context.currentRoute.duration}天时间，这样既能充分体验当地风情，又不会过于匆忙。每天的行程都经过精心安排。`
    }
    return '建议根据目的地大小和个人兴趣安排旅行天数，一般3-7天比较合适，既有充足时间体验，又保持旅行的新鲜感。'
  }

  private handleGeneralResponse(message: string): string {
    const responses = [
      '我是您的智能旅行助手，随时为您提供旅行规划和建议。',
      '有什么关于旅行的问题尽管问我，我会尽力帮助您！',
      '您可以询问景点推荐、美食介绍、住宿建议或者行程规划等。',
      '希望我的建议对您的旅行有帮助，还有其他问题吗？'
    ]
    
    return responses[Math.floor(Math.random() * responses.length)]
  }

  public getContext(): ConversationContext {
    return { ...this.context }
  }

  public clearHistory(): void {
    this.context.conversationHistory = []
    this.context.lastIntent = undefined
    this.context.lastEntities = undefined
  }

  public setUserPreferences(preferences: Record<string, any>): void {
    this.context.userPreferences = { ...this.context.userPreferences, ...preferences }
  }

  public getConversationHistory(): ConversationMessage[] {
    return [...this.context.conversationHistory]
  }

  public debug(): void {
    console.log('Conversation Service Debug Info:')
    console.log('- Current intent:', this.context.lastIntent)
    console.log('- Current entities:', this.context.lastEntities)
    console.log('- Conversation history length:', this.context.conversationHistory.length)
    console.log('- User preferences:', this.context.userPreferences)
    console.log('- Is processing:', this.isProcessing)
    
    if (this.context.currentRoute) {
      console.log('- Current route:', this.context.currentRoute.title)
    }
  }

  private async handleRealtimeWeatherInquiry(entities: Record<string, any>): Promise<string> {
    try {
      const data = await this.realTimeInfoManager.getCurrentData()
      const weather = data.weather.data
      
      if (weather) {
        const alerts = weather.alerts.length > 0 ? `，注意有${weather.alerts.length}条天气预警` : ''
        return `当前天气：${weather.current.temperature}°C，${weather.current.condition}，湿度${weather.current.humidity}%${alerts}。建议您根据天气情况安排出行。`
      } else {
        return '正在获取实时天气信息，请稍候...'
      }
    } catch (error) {
      console.error('获取实时天气信息失败:', error)
      return '抱歉，暂时无法获取实时天气信息，请稍后重试。'
    }
  }

  private async handleRealtimeTrafficInquiry(entities: Record<string, any>): Promise<string> {
    try {
      const data = await this.realTimeInfoManager.getCurrentData()
      const traffic = data.traffic.data
      
      if (traffic) {
        const extraTime = traffic.route.durationInTraffic - traffic.route.duration
        const trafficLevel = traffic.route.trafficLevel === 'low' ? '畅通' : 
                           traffic.route.trafficLevel === 'medium' ? '缓慢' : 
                           traffic.route.trafficLevel === 'high' ? '拥堵' : '严重拥堵'
        
        const timeInfo = extraTime > 0 ? `，预计比平时多花${Math.round(extraTime / 60)}分钟` : ''
        
        return `当前路况：${trafficLevel}，距离目的地${traffic.route.distance}公里，预计${Math.round(traffic.route.durationInTraffic / 60)}分钟${timeInfo}。`
      } else {
        return '正在获取实时交通信息，请稍候...'
      }
    } catch (error) {
      console.error('获取实时交通信息失败:', error)
      return '抱歉，暂时无法获取实时交通信息，请稍后重试。'
    }
  }

  private async handlePOIStatusInquiry(entities: Record<string, any>): Promise<string> {
    try {
      const data = await this.realTimeInfoManager.getCurrentData()
      const pois = data.pois.data
      
      if (pois && pois.length > 0) {
        const openPOIs = pois.filter(poi => poi.status.isOpen)
        const crowdedPOIs = pois.filter(poi => 
          poi.realTimeInfo.crowdLevel === 'high' || poi.realTimeInfo.crowdLevel === 'very_high'
        )
        
        let response = `找到${pois.length}个附近景点，其中${openPOIs.length}个正在开放。`
        
        if (crowdedPOIs.length > 0) {
          response += ` 注意：${crowdedPOIs.length}个景点当前较为拥挤，建议错峰前往。`
        }
        
        const topPOIs = openPOIs.slice(0, 3).map(poi => poi.basicInfo.name).join('、')
        response += ` 推荐：${topPOIs}。`
        
        return response
      } else {
        return '正在查询附近景点状态，请稍候...'
      }
    } catch (error) {
      console.error('获取景点状态信息失败:', error)
      return '抱歉，暂时无法获取景点状态信息，请稍后重试。'
    }
  }

  private async handleEmergencyInquiry(entities: Record<string, any>): Promise<string> {
    try {
      const data = await this.realTimeInfoManager.getCurrentData()
      const emergency = data.emergency
      
      const activeAlerts = emergency.alerts.filter(alert => alert.active)
      const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical')
      
      if (criticalAlerts.length > 0) {
        const alert = criticalAlerts[0]
        return `⚠️ 紧急提醒：${alert.title} - ${alert.description}。请立即采取相应措施，注意安全。如需帮助请拨打紧急电话。`
      } else if (activeAlerts.length > 0) {
        const alert = activeAlerts[0]
        return `⚠️ 安全提醒：${alert.title} - ${alert.description}。建议您关注相关信息，做好防范准备。`
      } else {
        return `当前所在区域安全状况良好，未发现紧急预警。附近有${emergency.resources.length}个应急设施可用。记住紧急电话：报警110、火警119、急救120。`
      }
    } catch (error) {
      console.error('获取紧急信息失败:', error)
      return '抱歉，暂时无法获取紧急信息。请记住紧急电话：报警110、火警119、急救120。'
    }
  }
}

export const conversationService = new ConversationService()